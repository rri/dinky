import { AppState, empty, mergeData, mergeDisplaySettings, mergeNote, mergeRetentionSettings, mergeStorageSettings, mergeTask, mergeTasks, mergeTodaySettings, mergeTopic, mergeWork } from "./AppState"
import { Cloud } from "./Cloud"
import { Note } from "./Note"
import { DisplaySettings } from "./DisplaySettings"
import { RetentionSettings } from "./RetentionSettings"
import { StorageSettings } from "./StorageSettings"
import { Task } from "./Task"
import { TodaySettings } from "./TodaySettings"
import { Topic } from "./Topic"
import { Work } from "./Work"
import moment from "moment"

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
                this.saveToDisk(mergedData)
                this.setData(mergedData)
                this.cloud
                    .pushData(mergedData, (updated: AppState) => {
                        this.saveToDisk(updated)
                        this.setData(updated)
                    })
                    .catch(e => this.notify("Sync (put) failed: " + e.desc))
            })
            .catch(e => this.notify("Sync (get) failed: " + e.desc))
    }

    putStorageSettings(item: StorageSettings) {
        this.setData(prev => {
            const updated = mergeStorageSettings(prev, item)
            this.saveToDisk(updated)
            // Bypass potential cloud sync, as storage settings are local
            return updated
        })
    }

    putTodaySettings(item: TodaySettings) {
        this.setData(prev => {
            const updated = mergeTodaySettings(prev, item)
            this.saveToDisk(updated)
            return updated
        })
    }

    putRetentionSettings(item: RetentionSettings) {
        this.setData(prev => {
            const updated = mergeRetentionSettings(prev, item)
            this.saveToDisk(updated)
            return updated
        })
    }

    putDisplaySettings(item: DisplaySettings) {
        this.setData(prev => {
            const updated = mergeDisplaySettings(prev, item)
            this.saveToDisk(updated)
            return updated
        })
    }

    putTask(id: string, item: Task) {
        this.setData(prev => {
            const updated = mergeTask(prev, id, item)
            this.saveToDisk(updated)
            return updated
        })
    }

    putTopic(id: string, item: Topic) {
        this.setData(prev => {
            const updated = mergeTopic(prev, id, item)
            this.saveToDisk(updated)
            return updated
        })
    }

    putNote(id: string, item: Note) {
        this.setData(prev => {
            const updated = mergeNote(prev, id, item)
            this.saveToDisk(updated)
            return updated
        })
    }

    putWork(id: string, item: Work) {
        this.setData(prev => {
            const updated = mergeWork(prev, id, item)
            this.saveToDisk(updated)
            return updated
        })
    }

    delTasks(makeIdList: () => string[]) {
        this.setData(prev => {
            const idList = makeIdList()
            const prevTasks = prev.contents.tasks ? prev.contents.tasks : {}
            const items: Record<string, Task> = {}
            idList.forEach(id => {
                const item = {
                    ...prevTasks[id],
                    updated: new Date().toISOString(),
                    deleted: new Date().toISOString(),
                }
                items[id] = item
            })
            const updated = mergeTasks(prev, items)
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
