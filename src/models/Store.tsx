import { AppState, empty, mergeData, purgeDeleted, mergeDisplaySettings, mergeRetentionSettings, mergeStorageSettings } from "./AppState"
import { Cloud } from "./Cloud"
import { DisplaySettings } from "./DisplaySettings"
import { RetentionSettings } from "./RetentionSettings"
import { StorageSettings } from "./StorageSettings"
import { Settings } from "./Settings"
import { v4 } from "uuid"
import { Deletable, ItemPath, Updatable, Writable } from "./Item"
import { RefVal } from "./Registry"
import { storage, STORE_NOTES, STORE_SETTINGS, STORE_TASKS, STORE_TOPICS, STORE_WORKS } from "./Storage"

export const DATA_PATH = "data"

// Wraps a failure that the Cloud layer has already reported to the user.
interface ReportedFailure {
    reported: true,
    err: any,
}

const reported = (reject: (reason: ReportedFailure) => void) =>
    (err: any) => reject({ reported: true, err })

// Returns a copy of the state with the registry events replaced by the result
// of `update` (applied to a copy of the current events). The state passed in
// is never modified. Does nothing if the registry is disabled.
const withRegistryEvents = (data: AppState, update: (events: Record<string, RefVal>) => void): AppState => {
    const registry = data.settings.storage.registry
    if (!registry?.enabled) {
        return data
    }
    const events = { ...registry.events }
    update(events)
    return {
        ...data,
        settings: {
            ...data.settings,
            storage: {
                ...data.settings.storage,
                registry: { ...registry, events },
            },
        },
    }
}

const CONTENT_PATHS: Partial<Record<ItemPath, "tasks" | "topics" | "notes" | "works">> = {
    "contents.tasks": "tasks",
    "contents.topics": "topics",
    "contents.notes": "notes",
    "contents.works": "works",
}

export class Store {

    private setData: (value: React.SetStateAction<AppState>) => void
    private notify: (note?: string) => void
    private cloud: Cloud
    private lastSyncStart?: number
    private syncTimeout?: NodeJS.Timeout

    // Only one sync (or auto-push) runs at a time; requests made while one is
    // running are collapsed into a single follow-up sync.
    private syncing = false
    private pendingSync?: { fullSync: boolean }

    constructor(setData: (value: React.SetStateAction<AppState>) => void, notify: (note?: string) => void) {
        this.setData = setData
        this.notify = notify
        this.cloud = new Cloud(this.notify)
    }

    // Starts the background sync timers (sync on load, periodic auto-sync).
    // Returns a function that stops them, for use as a React effect cleanup.
    start(): () => void {
        const timers: { load?: NodeJS.Timeout, auto?: NodeJS.Timeout } = {}

        // Sync on page load
        const syncOnLoad = () => {
            this.withLatestState(latest => {
                const cfg = latest.settings.storage
                if (cfg && cfg.syncOnLoad
                    && cfg.s3Bucket
                    && cfg.awsAccessKey
                    && cfg.awsSecretKey
                    && cfg.awsRegion) {
                    this.cloudSyncData(latest)
                }
                // otherwise not set up for cloud sync, return silently
            })
        }

        timers.load = setTimeout(syncOnLoad, 1000)

        // Auto sync
        const autoSyncAction = () => {
            this.withLatestState(latest => {
                const periodMinutes = (latest.settings.storage && latest.settings.storage.periodMinutes) || 0
                if (periodMinutes > 0) {
                    this.cloudSyncData(latest, false, periodMinutes)
                }
            })
            timers.auto = setTimeout(autoSyncAction, 60000)
        }

        autoSyncAction()

        return () => {
            timers.load && clearTimeout(timers.load)
            timers.auto && clearTimeout(timers.auto)
        }
    }

    // Calls `action` with the latest state. The state is read via a state
    // updater, and the action is deferred so that it runs outside of it.
    private withLatestState(action: (latest: AppState) => void) {
        this.setData(prev => {
            setTimeout(() => action(prev), 0)
            return prev
        })
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
            const loaded = empty(data)
            const purged = purgeDeleted(loaded)
            this.setData(() => purged)

            // Remove items whose retention period has expired from disk,
            // otherwise they would be resurrected on every page load.
            await this.deleteMissingFromDisk(loaded, purged)

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

    // The registry helpers below return a new state and never modify the one
    // passed in (which may be shared with React state or an in-flight sync).

    createRefs(data: AppState, keys: string[]): AppState {
        return withRegistryEvents(data, evts => keys.forEach(key => evts[key] = { ref: true }))
    }

    createVals(data: AppState, events: Writable[]): AppState {
        return withRegistryEvents(data, evts => events.forEach(obj => evts[obj.evt] = { ref: false, val: obj }))
    }

    deleteRefVals(data: AppState, keys: string[]): AppState {
        return withRegistryEvents(data, evts => keys.forEach(key => delete evts[key]))
    }

    cleanupRefs(data: AppState, exceptKeys: string[]): AppState {
        const except = new Set(exceptKeys)
        return withRegistryEvents(data, evts => {
            for (const [key, { ref }] of Object.entries(evts)) {
                if (ref && !except.has(key)) {
                    // Likely a dangling reference, delete it.

                    // NOTE: Having a reference recorded is an optimization,
                    // and so it is always safe to delete a reference (at
                    // the cost of possibly having to recreate it later).
                    delete evts[key]
                }
            }
        })
    }

    // Runs `task` unless another sync task is running, in which case `onBusy`
    // is called instead.
    private async runExclusive(task: () => Promise<void>, onBusy: () => void) {
        if (this.syncing) {
            onBusy()
            return
        }
        this.syncing = true
        try {
            await task()
        } finally {
            this.syncing = false
            const pending = this.pendingSync
            this.pendingSync = undefined
            if (pending) {
                this.withLatestState(latest => this.cloudSyncData(latest, pending.fullSync))
            }
        }
    }

    private requestFollowUpSync(fullSync?: boolean) {
        this.pendingSync = { fullSync: !!fullSync || !!this.pendingSync?.fullSync }
    }

    async cloudSyncData(data: AppState, fullSync?: boolean, minDelayMinutes?: number) {

        if (this.lastSyncStart !== undefined && minDelayMinutes) {
            if (Date.now() - this.lastSyncStart < minDelayMinutes * 60 * 1000) {
                // too soon, return immediately without doing anything
                return
            }
        }

        await this.runExclusive(
            () => this.runSync(data, fullSync),
            () => this.requestFollowUpSync(fullSync))
    }

    private async runSync(data: AppState, fullSync?: boolean) {

        this.lastSyncStart = Date.now()
        this.notify("Synchronizing your data...")

        try {
            // 1. Pull full state from cloud
            const mergedData = await new Promise<AppState>((resolve, reject) => {
                this.cloud.pullData(data, resolve, reported(reject))
            })

            // 2. List all events in the cloud
            const keys = await new Promise<string[]>((resolve, reject) => {
                this.cloud.listEvents(mergedData, resolve, reported(reject))
            })

            const valKeys: string[] = []
            const newKeys: string[] = []

            keys.forEach(key => {
                this.withRefVal(mergedData, key, (res: RefVal) => {
                    if (res.ref === false) {
                        valKeys.push(key)
                    }
                }, () => {
                    newKeys.push(key)
                })
            })

            // Create ref-type keys for all val-type keys that are already
            // synced to the cloud. The reason these exist is because a prior
            // sync process did not successfully convert them,
            const mergedDataWithCleanup = this.createRefs(empty(mergedData), valKeys)

            // 3. Pull missing events and apply them
            const [mergedDataWithEvents, processedKeys] = await new Promise<[AppState, string[]]>((resolve, reject) => {
                this.cloud.pullEvents(mergedDataWithCleanup, newKeys,
                    (updated, processed) => resolve([updated, processed]),
                    reported(reject))
            })

            // Create ref-type keys as an optimization to prevent the same
            // events from getting downloaded and applied again. Only events
            // that were actually processed are marked, so that events skipped
            // due to an error are retried on the next sync.
            const mergedDataWithEventsAndRefs = this.createRefs(empty(mergedDataWithEvents), processedKeys)

            // Cloud events whose effects are now reflected in local state:
            // either known before this sync, or processed just now.
            const appliedKeys = keys.filter(key => !newKeys.includes(key) || processedKeys.includes(key))

            await this.saveToDisk(mergedDataWithEventsAndRefs)
            // Items removed by this sync (deleted from the authoritative copy,
            // or purged) must also be removed from disk. Only items present
            // when the sync started are considered, so items created while
            // the sync was running are never affected.
            await this.deleteMissingFromDisk(data, mergedDataWithEventsAndRefs)
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
                const pushedData = await new Promise<AppState>((resolve, reject) => {
                    this.cloud.pushData(mergedDataWithEventsAndRefs, resolve, reported(reject))
                })

                this.notify("Sync completed, cleaning up...")

                // After a successful full sync, enable the registry if it isn't
                // already, and reset the forceSync flag in case it had been set.
                const pushed = empty(pushedData)
                const registry = {
                    enabled: true,
                    events: pushed.settings.storage.registry?.events || {},
                }
                let pushedDataWithRegistryEnabled: AppState = {
                    ...pushed,
                    settings: {
                        ...pushed.settings,
                        storage: { ...pushed.settings.storage, registry },
                    },
                }

                // Delete all events pulled, just before they're to be be deleted from the cloud.
                pushedDataWithRegistryEnabled = this.deleteRefVals(pushedDataWithRegistryEnabled, appliedKeys)
                // Delete all events pushed, after the data object has been saved to the cloud.
                pushedDataWithRegistryEnabled = this.deleteRefVals(pushedDataWithRegistryEnabled, unsynced.map(obj => obj.evt))
                // Clean up dangling references.
                pushedDataWithRegistryEnabled = this.cleanupRefs(pushedDataWithRegistryEnabled, appliedKeys)

                await this.saveToDisk(pushedDataWithRegistryEnabled)
                this.setData(pushedDataWithRegistryEnabled)

                // 4. Delete processed events from cloud
                await new Promise<void>((resolve, reject) => {
                    this.cloud.deleteEvents(pushedDataWithRegistryEnabled, appliedKeys, () => resolve(), reported(reject))
                })
                this.notify("Sync completed!")
            } else if (pushPart) {
                // 5. Push individual events
                await new Promise<void>((resolve, reject) => {
                    this.cloud.pushEvents(mergedDataWithEventsAndRefs, unsynced, () => {
                        this.handleItemSyncComplete(unsynced, true)
                        resolve()
                    }, reported(reject))
                })
            }
        } catch (e: any) {
            if (!e?.reported) {
                this.notify("Sync failed: " + (e?.desc || "unexpected error"))
            }
        }
    }

    handleItemSync(events: Writable[], dataProvider: () => AppState, saveAction?: (data: AppState) => void): AppState {
        let updated = dataProvider()

        if (events.length > 0) {
            // Register val-type keys to ensure that no updates are ever lost.
            updated = this.createVals(updated, events)
            // Persist them, so that they survive a page reload before the
            // next sync (otherwise the update would never be pushed).
            if (this.isRegistryEnabled(updated)) {
                this.saveSettingsPartToDisk("storage", updated.settings.storage)
            }

            // Clear existing timeout
            if (this.syncTimeout) {
                clearTimeout(this.syncTimeout)
            }

            // Set new timeout to sync after 3 seconds of no updates
            const snapshot = updated
            this.syncTimeout = setTimeout(() => {
                if (!snapshot.settings.storage.autoPushItems) {
                    return
                }
                this.runExclusive(
                    () => new Promise<void>(resolve => {
                        this.cloud.pushEvents(snapshot,
                            events,
                            () => {
                                this.handleItemSyncComplete(events)
                                resolve()
                            },
                            () => resolve())
                    }),
                    // A sync is running: the events are registered, so a
                    // follow-up sync will push them.
                    () => this.requestFollowUpSync())
            }, 3000)
        }

        if (saveAction) {
            saveAction(updated)
        } else {
            this.saveToDisk(updated)
        }
        return updated
    }

    // Called after events have been pushed to the cloud. Applied to the latest
    // state (not a snapshot), so that changes made in the meantime are kept.
    handleItemSyncComplete(events: Writable[], notifications?: boolean) {
        if (notifications) {
            this.notify("Sync completed, cleaning up...")
        }

        this.setData(prev => {
            // Create ref-type keys as an optimization to prevent the same
            // events from getting downloaded and applied again.
            let next = this.createRefs(prev, events.map(obj => obj.evt))
            if (this.isRegistryEnabled(next)) {
                this.saveSettingsPartToDisk("storage", next.settings.storage)
            }

            // Items whose pushed version is still the current one are now in
            // the cloud, so they are no longer unsynced. Items that changed
            // while the push was in flight stay unsynced.
            const changed = this.clearUnsynced(next, events)
            changed.forEach(([path, id, item]) => {
                const kind = CONTENT_PATHS[path]!
                next = {
                    ...next,
                    contents: { ...next.contents, [kind]: { ...next.contents[kind], [id]: item } },
                }
                this.saveItemToDisk(path, id, item)
            })

            return next
        })

        if (notifications) {
            this.notify("Sync completed!")
        }
    }

    private clearUnsynced(data: AppState, events: Writable[]): [ItemPath, string, any][] {
        const res: [ItemPath, string, any][] = []
        events.forEach(event => {
            const kind = CONTENT_PATHS[event.path]
            const id = (event as any).id
            if (!kind || typeof id !== "string") {
                return
            }
            const item: any = data.contents[kind]?.[id]
            if (item && item.unsynced && item.updated === event.updated) {
                const { unsynced, ...rest } = item
                res.push([event.path, id, rest])
            }
        })
        return res
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

    private async deleteMissingFromDisk(before: AppState, after: AppState) {
        const stores: [string, Record<string, any> | undefined, Record<string, any> | undefined][] = [
            [STORE_TASKS, before.contents.tasks, after.contents.tasks],
            [STORE_TOPICS, before.contents.topics, after.contents.topics],
            [STORE_NOTES, before.contents.notes, after.contents.notes],
            [STORE_WORKS, before.contents.works, after.contents.works],
        ]
        for (const [store, prev, next] of stores) {
            for (const id of Object.keys(prev || {})) {
                if (!next || !Object.prototype.hasOwnProperty.call(next, id)) {
                    await storage.delete(store, id)
                }
            }
        }
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
