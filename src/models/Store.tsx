import { AppState, empty, mergeData, mergeDisplaySettings, mergeRetentionSettings, mergeStorageSettings } from "./AppState"
import { Cloud } from "./Cloud"
import { DisplaySettings } from "./DisplaySettings"
import { RetentionSettings } from "./RetentionSettings"
import { StorageSettings } from "./StorageSettings"
import { v4 } from "uuid"
import moment from "moment"
import { DataObj, Deletable, ItemPath, Updatable } from "./Item"

export const DATA_PATH = "data"
export const EVENTS_PATH = "events"

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
                    this.cloudSyncData(prev, periodMinutes)
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

    cloudSyncData(localData: AppState, minDelayMinutes?: number) {

        if (this.lastSyncStart &&
            minDelayMinutes &&
            moment().subtract(minDelayMinutes, "minutes").isBefore(moment(this.lastSyncStart))) {
            // too soon, return immediately without doing anything
            return
        }

        this.lastSyncStart = moment().format("YYYY-MM-DD HH:mm")
        this.notify("Sync starting...")
        this.cloud
            .pullData(localData, (mergedData: AppState) => {
                this.cloud
                    .listKeys(mergedData, keys => {
                        this.cloud.pullItems(mergedData, keys, mergedDataWithItems => {
                            this.saveToDisk(mergedDataWithItems)
                            this.setData(mergedDataWithItems)
                            this.cloud
                                .pushData(mergedDataWithItems, (pushedData: AppState) => {
                                    this.saveToDisk(pushedData)
                                    this.setData(pushedData)
                                    this.cloud.delItems(pushedData, keys)
                                })
                                .catch(e => this.notify("Sync (put) failed: " + e.desc))
                        })
                    })
            })
            .catch(e => this.notify("Sync (get) failed: " + e.desc))
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
            const updated = mergeRetentionSettings(prev, item)
            updated.settings.storage.autoPushItems && this.cloud.pushItem(updated, { evt: v4(), path: "settings.retention", ...item })
            this.saveToDisk(updated)
            return updated
        })
    }

    putDisplaySettings(item: DisplaySettings) {
        this.setData(prev => {
            const updated = mergeDisplaySettings(prev, item)
            updated.settings.storage.autoPushItems && this.cloud.pushItem(updated, { evt: v4(), path: "settings.display", ...item })
            this.saveToDisk(updated)
            return updated
        })
    }

    putItem<T>(id: string, item: T, mergeItem: (state: AppState, id: string, item: T) => AppState, path: ItemPath) {
        this.setData(prev => {
            const updated = mergeItem(prev, id, item)
            updated.settings.storage.autoPushItems && this.cloud.pushItem(updated, { evt: v4(), path, id, ...item })
            this.saveToDisk(updated)
            return updated
        })
    }

    killItems<T extends DataObj & Updatable & Deletable>(makeIdList: () => string[], contents: (prev: AppState) => Record<string, T>, mergeItems: (state: AppState, items: Record<string, T>) => AppState, path: ItemPath) {
        this.setData(prev => {
            const idList = makeIdList()
            const prevItems = contents(prev)
            const items: Record<string, T> = {}
            idList.forEach(id => {
                const item = {
                    ...prevItems[id],
                    updated: new Date().toISOString(),
                    deleted: new Date().toISOString(),
                }
                prev.settings.storage.autoPushItems && this.cloud.pushItem(prev, { evt: v4(), path, id, ...item })
                items[id] = item
            })
            const updated = mergeItems(prev, items)
            this.saveToDisk(updated)
            return updated
        })
    }

    private saveToDisk(data: AppState) {
        let next = data
        const res = localStorage.getItem(DATA_PATH)
        if (res) {
            const prev: AppState = empty(JSON.parse(res))
            next = mergeData(prev, data)
        }
        localStorage.setItem(DATA_PATH, JSON.stringify(next))
    }

}
