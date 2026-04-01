import { AppState, empty, mergeData, mergeDisplaySettings, mergeRetentionSettings, mergeStorageSettings } from "./AppState"
import { Cloud } from "./Cloud"
import { DisplaySettings } from "./DisplaySettings"
import { RetentionSettings } from "./RetentionSettings"
import { StorageSettings } from "./StorageSettings"
import { Settings } from "./Settings"
import { v4 } from "uuid"
import moment from "moment"
import { Deletable, ItemPath, Updatable, Writable } from "./Item"
import { RefVal } from "./Registry"
import { storage, STORE_NOTES, STORE_SETTINGS, STORE_TASKS, STORE_TOPICS, STORE_WORKS } from "./Storage"

export const DATA_PATH = "data"

export class Store {

    private setData: (value: React.SetStateAction<AppState>) => void
    private notify: (note?: string) => void
    private cloud: Cloud
    private lastSyncStart?: string
    private syncTimeout?: NodeJS.Timeout

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
                        // async call
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
                    // async call
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

    async loadFromDisk() {
        // 1. Try to load from new granular stores
        const storageSettings = await storage.get(STORE_SETTINGS, "storage")
        const retentionSettings = await storage.get(STORE_SETTINGS, "retention")
        const displaySettings = await storage.get(STORE_SETTINGS, "display")
        
        // Backward compatibility for "all" key in STORE_SETTINGS
        const allSettings = await storage.get(STORE_SETTINGS, "all")

        if (storageSettings || retentionSettings || displaySettings || allSettings) {
            const tasks = await storage.getAll(STORE_TASKS)
            const topics = await storage.getAll(STORE_TOPICS)
            const notes = await storage.getAll(STORE_NOTES)
            const works = await storage.getAll(STORE_WORKS)

            const data: AppState = {
                settings: (allSettings || {
                    storage: storageSettings,
                    retention: retentionSettings,
                    display: displaySettings,
                }) as any,
                contents: {
                    tasks: tasks as any,
                    topics: topics as any,
                    notes: notes as any,
                    works: works as any,
                }
            }
            this.setData(() => empty(data))

            // Migration: if we loaded from "all", split it now
            if (allSettings) {
                this.saveSettingsToDisk(allSettings)
                storage.delete(STORE_SETTINGS, "all")
            }
            return
        }

        // 2. Try to migrate from IndexedDB v1 "kv" store
        const v1Data = await storage.getOldData(DATA_PATH)
        if (v1Data) {
            const data: AppState = empty(JSON.parse(v1Data))
            await this.saveToDisk(data)
            await storage.clearOldData(DATA_PATH)
            this.setData(() => data)
            return
        }

        // 3. Try to migrate from localStorage
        const oldRes = localStorage.getItem(DATA_PATH)
        if (oldRes) {
            const data: AppState = empty(JSON.parse(oldRes))
            await this.saveToDisk(data)
            localStorage.removeItem(DATA_PATH)
            this.setData(() => data)
            return
        }

        // 4. Fallback to empty state
        this.setData(() => empty())
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

    async cloudSyncData(data: AppState, fullSync?: boolean, minDelayMinutes?: number) {

        if (this.lastSyncStart &&
            minDelayMinutes &&
            moment().subtract(minDelayMinutes, "minutes").isBefore(moment(this.lastSyncStart))) {
            // too soon, return immediately without doing anything
            return
        }

        this.lastSyncStart = moment().format("YYYY-MM-DD HH:mm")
        this.notify("Synchronizing your data...")
        await this.cloud
            .pullData(data, async (mergedData: AppState) => {
                await this.cloud
                    .listEvents(mergedData, async keys => {

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

                        await this.cloud.pullEvents(mergedDataWithCleanup, newKeys, async (mergedDataWithEvents: AppState) => {

                            const mergedDataWithEventsAndRefs = empty(mergedDataWithEvents)

                            // Create ref-type keys as an optimization to prevent the same
                            // events from getting downloaded and applied again.
                            this.createRefs(mergedDataWithEventsAndRefs, newKeys)

                            await this.saveToDisk(mergedDataWithEventsAndRefs)
                            this.setData(mergedDataWithEventsAndRefs)

                            const forceSync = mergedDataWithEventsAndRefs.settings.storage.registry?.forceSync
                            const unsynced: Writable[] = []
                            Object
                                .values(mergedDataWithEventsAndRefs.settings.storage.registry?.events || {})
                                .forEach(elem => {
                                    if (!elem.ref) {
                                        unsynced.push(elem.val)
                                    }
                                })

                            const pushFull = !this.isRegistryEnabled(mergedDataWithEventsAndRefs) || (!!fullSync && (unsynced.length > 0 || keys.length > 0 || !!forceSync))
                            const pushPart = this.isRegistryEnabled(mergedDataWithEventsAndRefs) && ((!fullSync && unsynced.length > 0))

                            if (!pushFull && !pushPart) {
                                // no data that needs to be pushed
                                this.notify("Sync completed!")
                                return
                            }

                            if (pushFull) {
                                await this.cloud
                                    .pushData(mergedDataWithEventsAndRefs, async (pushedData: AppState) => {

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

                                        // Reset the forceSync flag in case it had been set.
                                        delete (pushedDataWithRegistryEnabled.settings.storage.registry as any).forceSync

                                        await this.saveToDisk(pushedDataWithRegistryEnabled)
                                        this.setData(pushedDataWithRegistryEnabled)


                                        // Delete all events that have been merged and re-uploaded with the full blob.
                                        await this.cloud.deleteEvents(pushedDataWithRegistryEnabled, keys, () => {
                                            this.notify("Sync completed!")
                                        })
                                    })
                                    .catch(e => this.notify("Sync (put) failed: " + e.desc))
                            }

                            if (pushPart) {
                                await this.cloud
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

    handleItemSync(events: Writable[], dataProvider: () => AppState, saveAction?: (data: AppState) => void): AppState {
        const updated = dataProvider()

        if (events.length > 0) {
            // Register val-type keys to ensure that no updates are ever lost.
            this.createVals(updated, events)

            // Clear existing timeout
            if (this.syncTimeout) {
                clearTimeout(this.syncTimeout)
            }

            // Set new timeout to sync after 3 seconds of no updates
            this.syncTimeout = setTimeout(() => {
                updated.settings.storage.autoPushItems &&
                    this.cloud.pushEvents(updated,
                        events,
                        (pushedData: AppState) => this.handleItemSyncComplete(pushedData, events))
            }, 3000)
        }

        if (saveAction) {
            saveAction(updated)
        } else {
            this.saveToDisk(updated)
        }
        return updated
    }

    async handleItemSyncComplete(data: AppState, events: Writable[], notifications?: boolean) {
        if (notifications) {
            this.notify("Sync completed, cleaning up...")
        }

        const pushedDataWithRefs = empty(data)

        // Create ref-type keys as an optimization to prevent the same
        // events from getting downloaded and applied again.
        this.createRefs(pushedDataWithRefs, events.map(obj => obj.evt))

        await this.saveToDisk(pushedDataWithRefs)
        this.setData(pushedDataWithRefs)

        if (notifications) {
            this.notify("Sync completed!")
        }
    }

    putStorageSettings(item: StorageSettings) {
        this.setData(prev => {
            const events: Writable[] = []
            return this.handleItemSync(events,
                () => mergeStorageSettings(prev, item),
                (data) => this.saveSettingsPartToDisk("storage", data.settings.storage))
        })
    }

    putRetentionSettings(item: RetentionSettings) {
        this.setData(prev => {
            const events: Writable[] = [{ ...item, evt: v4(), path: "settings.retention" }]
            return this.handleItemSync(events,
                () => mergeRetentionSettings(prev, item),
                (data) => this.saveSettingsPartToDisk("retention", data.settings.retention))
        })
    }

    putDisplaySettings(item: DisplaySettings) {
        this.setData(prev => {
            const events: Writable[] = [{ ...item, evt: v4(), path: "settings.display" }]
            return this.handleItemSync(events,
                () => mergeDisplaySettings(prev, item),
                (data) => this.saveSettingsPartToDisk("display", data.settings.display))
        })
    }

    putItem<T>(id: string, item: T, mergeItem: (state: AppState, id: string, item: T) => AppState, path: ItemPath) {
        this.setData(prev => {
            const events = [{ ...item, evt: v4(), path, id }]
            return this.handleItemSync(events,
                () => mergeItem(prev, id, item),
                () => this.saveItemToDisk(path, id, item))
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

            return this.handleItemSync(events,
                () => mergeItems(prev, currItems),
                () => this.saveItemsToDisk(path, currItems))
        })
    }

    private async saveToDisk(data: AppState) {
        await this.saveSettingsToDisk(data.settings)
        await storage.setMany(STORE_TASKS, data.contents.tasks || {})
        await storage.setMany(STORE_TOPICS, data.contents.topics || {})
        await storage.setMany(STORE_NOTES, data.contents.notes || {})
        await storage.setMany(STORE_WORKS, data.contents.works || {})
    }

    private async saveSettingsToDisk(settings: Settings) {
        await storage.set(STORE_SETTINGS, "storage", settings.storage)
        await storage.set(STORE_SETTINGS, "retention", settings.retention)
        await storage.set(STORE_SETTINGS, "display", settings.display)
    }

    private async saveSettingsPartToDisk(part: "storage" | "retention" | "display", value: any) {
        await storage.set(STORE_SETTINGS, part, value)
    }

    private async saveItemToDisk(path: ItemPath, id: string, item: any) {
        const store = this.pathToStore(path)
        if (store) {
            await storage.set(store, id, item)
        }
    }

    private async saveItemsToDisk(path: ItemPath, items: Record<string, any>) {
        const store = this.pathToStore(path)
        if (store) {
            await storage.setMany(store, items)
        }
    }

    private pathToStore(path: ItemPath): string | undefined {
        switch (path) {
            case "contents.tasks": return STORE_TASKS
            case "contents.topics": return STORE_TOPICS
            case "contents.notes": return STORE_NOTES
            case "contents.works": return STORE_WORKS
            default: return undefined
        }
    }
}
