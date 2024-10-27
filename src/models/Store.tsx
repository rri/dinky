import { AppState, empty, mergeData, mergeDisplaySettings, mergeRetentionSettings, mergeStorageSettings } from "./AppState"
import { Cloud } from "./Cloud"
import { DisplaySettings } from "./DisplaySettings"
import { RetentionSettings } from "./RetentionSettings"
import { StorageSettings } from "./StorageSettings"
import { v4 } from "uuid"
import moment from "moment"
import { Deletable, ItemPath, Updatable, Writable } from "./Item"
import { RefVal } from "./Registry"

export const DATA_PATH = "data"

export class Store {

    private setData: (value: React.SetStateAction<AppState>) => void
    private notify: (note?: string) => void
    private cloud: Cloud
    private lastSyncStart?: string

    constructor(setData: (value: React.SetStateAction<AppState>) => void, notify: (note?: string) => void) {
        this.setData = setData
        this.notify = notify
        this.cloud = new Cloud(this.notify)

        // Sync on page load
        const syncOnLoad = () => {
            this.setData(prev => {
                if (prev.settings.storage.syncOnLoad) {
                    const cfg = prev.settings.storage
                    if (!cfg.s3Bucket
                        || !cfg.awsAccessKey
                        || !cfg.awsSecretKey
                        || !cfg.awsRegion) {
                        // not set up for cloud sync, return silently
                    } else {
                        this.cloudSyncData(prev)
                    }
                }
                return prev
            })
        }

        setTimeout(syncOnLoad, 1000)

        // Auto sync
        const autoSyncAction = () => {
            this.setData(prev => {
                const periodMinutes = prev.settings.storage.periodMinutes || 0
                if (periodMinutes > 0) {
                    this.cloudSyncData(prev, false, periodMinutes)
                }
                setTimeout(autoSyncAction, 60000)
                return prev
            })
        }

        autoSyncAction()

    }

    loadFromData(data: AppState) {
        this.setData(prev => {
            const updated = mergeData(prev, data, false, true)
            this.saveToDisk(updated)
            return updated
        })
    }

    loadFromDisk() {
        this.setData(prev => {
            const res = localStorage.getItem(DATA_PATH)
            if (res) {
                const data: AppState = empty(JSON.parse(res))
                return mergeData(prev, data)
            } else {
                return empty()
            }
        })
    }

    isRegistryEnabled(data: AppState): boolean {
        return data.settings.storage.registry?.enabled || false
    }

    withRefVal(data: AppState, key: string, onFound: (res: RefVal) => void, otherwise: () => void) {
        if (data.settings.storage.registry?.enabled) {
            const res = data.settings.storage.registry?.events[key]
            if (res !== undefined) {
                onFound(res)
            } else {
                otherwise()
            }
        } else {
            otherwise()
        }
    }

    createRefs(mutData: AppState, keys: string[]) {
        if (mutData.settings.storage.registry?.enabled) {
            const evts = mutData.settings.storage.registry?.events
            keys.forEach(key => evts[key] = { ref: true })
        }
    }

    createVals(mutData: AppState, events: Writable[]) {
        if (mutData.settings.storage.registry?.enabled) {
            const evts = mutData.settings.storage.registry?.events
            events.forEach(obj => evts[obj.evt] = { ref: false, val: obj })
        }
    }

    deleteRefVals(mutData: AppState, keys: string[]) {
        if (mutData.settings.storage.registry?.enabled) {
            const evts = mutData.settings.storage.registry?.events
            keys.forEach(key => delete evts[key])
        }
    }

    cleanupRefs(mutData: AppState, exceptKeys: string[]) {
        if (mutData.settings.storage.registry?.enabled) {
            const evts = mutData.settings.storage.registry?.events
            const recs = { ...evts }
            exceptKeys.forEach(key => delete recs[key])
            for (const [key, { ref }] of Object.entries(recs)) {
                if (ref) {
                    // Likely a dangling reference, delete it.

                    // NOTE: Having a reference recorded is an optimization,
                    // and so it is always safe to delete a reference (at
                    // the cost of possibly having to recreate it later).
                    delete evts[key]
                }
            }
        }
    }

    cloudSyncData(data: AppState, fullSync?: boolean, minDelayMinutes?: number) {

        if (this.lastSyncStart &&
            minDelayMinutes &&
            moment().subtract(minDelayMinutes, "minutes").isBefore(moment(this.lastSyncStart))) {
            // too soon, return immediately without doing anything
            return
        }

        this.lastSyncStart = moment().format("YYYY-MM-DD HH:mm")
        this.notify("Synchronizing your data...")
        this.cloud
            .pullData(data, (mergedData: AppState) => {
                this.cloud
                    .listEvents(mergedData, keys => {

                        const refKeys: string[] = []
                        const valKeys: string[] = []
                        const newKeys: string[] = []

                        keys.forEach(key => {
                            this.withRefVal(mergedData, key, (res: RefVal) => {
                                switch (res.ref) {
                                    case true:
                                        refKeys.push(key)
                                        break
                                    case false:
                                        valKeys.push(key)
                                        break
                                }
                            }, () => {
                                newKeys.push(key)
                            })
                        })

                        const mergedDataWithCleanup = empty(mergedData)

                        // Create ref-type keys for all val-type keys that are already
                        // synced to the cloud. The reason these exist is because a prior
                        // sync process did not successfully convert them,
                        this.createRefs(mergedDataWithCleanup, valKeys)

                        this.cloud.pullEvents(mergedDataWithCleanup, newKeys, (mergedDataWithEvents: AppState) => {

                            const mergedDataWithEventsAndRefs = empty(mergedDataWithEvents)

                            // Create ref-type keys as an optimization to prevent the same
                            // events from getting downloaded and applied again.
                            this.createRefs(mergedDataWithEventsAndRefs, newKeys)

                            this.saveToDisk(mergedDataWithEventsAndRefs)
                            this.setData(mergedDataWithEventsAndRefs)

                            const unsynced: Writable[] = []
                            Object
                                .values(mergedDataWithEventsAndRefs.settings.storage.registry?.events || {})
                                .forEach(elem => {
                                    if (!elem.ref) {
                                        unsynced.push(elem.val)
                                    }
                                })

                            const pushFull = !this.isRegistryEnabled(mergedDataWithEventsAndRefs) || ((unsynced.length > 0 || keys.length > 0) && !!fullSync)
                            const pushPart = this.isRegistryEnabled(mergedDataWithEventsAndRefs) && (unsynced.length > 0 && !fullSync)

                            if (!pushFull && !pushPart) {
                                // no data that needs to be pushed
                                this.notify("Sync completed!")
                                return
                            }

                            if (pushFull) {
                                this.cloud
                                    .pushData(mergedDataWithEventsAndRefs, (pushedData: AppState) => {

                                        this.notify("Sync completed, cleaning up...")

                                        // After a successful full sync, enable the registry if it isn't already.
                                        const pushedDataWithRegistryEnabled = empty(pushedData)
                                        pushedDataWithRegistryEnabled.settings.storage.registry = {
                                            enabled: true,
                                            events: pushedData.settings.storage.registry?.events || {},
                                        }

                                        // Delete all events pulled, just before they're to be be deleted from the cloud.
                                        this.deleteRefVals(pushedDataWithRegistryEnabled, keys)
                                        // Delete all events pushed, after the data object has been saved to the cloud.
                                        this.deleteRefVals(pushedDataWithRegistryEnabled, unsynced.map(obj => obj.evt))
                                        // Clean up dangling references.
                                        this.cleanupRefs(pushedDataWithRegistryEnabled, keys)

                                        this.saveToDisk(pushedDataWithRegistryEnabled)
                                        this.setData(pushedDataWithRegistryEnabled)

                                        // Delete all events that have been merged and re-uploaded with the full blob.
                                        this.cloud.deleteEvents(pushedDataWithRegistryEnabled, keys, () => {
                                            this.notify("Sync completed!")
                                        })
                                    })
                                    .catch(e => this.notify("Sync (put) failed: " + e.desc))
                            }

                            if (pushPart) {
                                this.cloud
                                    .pushEvents(mergedDataWithEventsAndRefs,
                                        unsynced,
                                        (pushedData: AppState) => this.handleItemSyncComplete(pushedData, unsynced, true))
                                    .catch(e => this.notify("Sync (put) failed: " + e.desc))
                            }
                        })
                    })
            })
            .catch(e => this.notify("Sync (get) failed: " + e.desc))
    }

    handleItemSync(events: Writable[], dataProvider: () => AppState): AppState {
        const updated = dataProvider()

        // Register val-type keys to ensure that no updates are ever lost.
        this.createVals(updated, events)

        this.saveToDisk(updated)

        updated.settings.storage.autoPushItems &&
            this.cloud.pushEvents(updated,
                events,
                (pushedData: AppState) => this.handleItemSyncComplete(pushedData, events))

        return updated
    }

    handleItemSyncComplete(data: AppState, events: Writable[], notifications?: boolean) {
        if (notifications) {
            this.notify("Sync completed, cleaning up...")
        }

        const pushedDataWithRefs = empty(data)

        // Create ref-type keys as an optimization to prevent the same
        // events from getting downloaded and applied again.
        this.createRefs(pushedDataWithRefs, events.map(obj => obj.evt))

        this.saveToDisk(pushedDataWithRefs)
        this.setData(pushedDataWithRefs)

        if (notifications) {
            this.notify("Sync completed!")
        }
    }

    putStorageSettings(item: StorageSettings) {
        this.setData(prev => {
            const updated = mergeStorageSettings(prev, item)
            // Bypass potential cloud sync, as storage settings are local
            this.saveToDisk(updated)
            return updated
        })
    }

    putRetentionSettings(item: RetentionSettings) {
        this.setData(prev => {
            const events: Writable[] = [{ ...item, evt: v4(), path: "settings.retention" }]
            return this.handleItemSync(events, () => mergeRetentionSettings(prev, item))
        })
    }

    putDisplaySettings(item: DisplaySettings) {
        this.setData(prev => {
            const events: Writable[] = [{ ...item, evt: v4(), path: "settings.display" }]
            return this.handleItemSync(events, () => mergeDisplaySettings(prev, item))
        })
    }

    putItem<T>(id: string, item: T, mergeItem: (state: AppState, id: string, item: T) => AppState, path: ItemPath) {
        this.setData(prev => {
            const events = [{ ...item, evt: v4(), path, id }]
            return this.handleItemSync(events, () => mergeItem(prev, id, item))
        })
    }

    tombstoneItems<T extends Updatable & Deletable>(makeIdList: () => string[],
        contents: (prev: AppState) => Record<string, T>,
        mergeItems: (state: AppState, items: Record<string, T>) => AppState,
        path: ItemPath) {

        this.setData(prev => {
            const idList = makeIdList()
            const prevItems = contents(prev)
            const currItems: Record<string, T> = {}
            const events: Writable[] = []

            idList.forEach(id => {
                const item = {
                    ...prevItems[id],
                    updated: new Date().toISOString(),
                    deleted: new Date().toISOString(),
                }
                events.push({ ...item, evt: v4(), path, id })
                currItems[id] = item
            })

            return this.handleItemSync(events, () => mergeItems(prev, currItems))
        })
    }

    private saveToDisk(data: AppState) {
        localStorage.setItem(DATA_PATH, JSON.stringify(data))
    }

}
