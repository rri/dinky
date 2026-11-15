import { Store, DATA_PATH } from "./Store"
import { AppState, empty, mergeTask, mergeTasks } from "./AppState"
import { DisplayTheme } from "./DisplaySettings"
import { v4 } from "uuid"
import { Cloud } from "./Cloud"
import { storage, STORE_NOTES, STORE_SETTINGS, STORE_TASKS, STORE_TOPICS, STORE_WORKS } from "./Storage"

// Mock Cloud
jest.mock("./Cloud")

// Mock uuid
jest.mock("uuid", () => ({
    v4: jest.fn(() => "mock-uuid"),
}))

// Mock Storage
jest.mock("./Storage", () => ({
    storage: {
        get: jest.fn(),
        getAll: jest.fn(),
        set: jest.fn().mockResolvedValue(undefined),
        setMany: jest.fn().mockResolvedValue(undefined),
        getOldData: jest.fn(),
        clearOldData: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
    },
    STORE_SETTINGS: "settings",
    STORE_TASKS: "tasks",
    STORE_TOPICS: "topics",
    STORE_NOTES: "notes",
    STORE_WORKS: "works",
}))

// Suppress timers from Store constructor
jest.useFakeTimers()

const makeStore = (initialState: AppState = empty()) => {
    let state = initialState
    const setData = jest.fn((update) => {
        if (typeof update === "function") {
            state = update(state)
        } else {
            state = update
        }
    })
    const notify = jest.fn()
    
    // Setup Cloud mock before creating Store
    const mockCloud = {
        pullData: jest.fn(async (data, onSuccess) => {
            await onSuccess(data)
        }),
        listEvents: jest.fn(async (data, onSuccess) => {
            await onSuccess([])
        }),
        pullEvents: jest.fn(async (data, keys, onSuccess) => {
            await onSuccess(data, keys)
        }),
        pushData: jest.fn(async (data, onSuccess) => {
            await onSuccess(data)
        }),
        pushEvents: jest.fn(async (data, events, onSuccess) => {
            await onSuccess(data)
        }),
        deleteEvents: jest.fn(async (data, keys, onSuccess) => {
            await onSuccess(data)
        }),
    };
    (Cloud as jest.Mock).mockImplementation(() => mockCloud)

    const store = new Store(setData, notify)
    return { store, setData, notify, getState: () => state, mockCloud }
}

const makeEnabledState = (): AppState => ({
    settings: {
        storage: {
            s3Bucket: "b",
            awsAccessKey: "a",
            awsSecretKey: "s",
            awsRegion: "r",
            registry: {
                enabled: true,
                events: {},
            },
        },
        retention: { periodDays: 30 },
        display: { theme: DisplayTheme.Auto },
    },
    contents: { tasks: {}, topics: {}, notes: {}, works: {} },
})

const makeDisabledState = (): AppState => ({
    settings: {
        storage: {
            registry: {
                enabled: false,
                events: {},
            },
        },
        retention: { periodDays: 30 },
        display: { theme: DisplayTheme.Auto },
    },
    contents: { tasks: {}, topics: {}, notes: {}, works: {} },
})

describe("Store", () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
        (storage.get as jest.Mock).mockReset();
        (storage.getAll as jest.Mock).mockReset();
        (storage.set as jest.Mock).mockReset();
        (storage.setMany as jest.Mock).mockReset();
        (storage.getOldData as jest.Mock).mockReset();
        (storage.clearOldData as jest.Mock).mockReset();
        (storage.delete as jest.Mock).mockReset();
    })

    afterEach(() => {
        jest.clearAllTimers()
    })

    describe("isRegistryEnabled", () => {
        it("returns true when registry is enabled", () => {
            const { store } = makeStore()
            expect(store.isRegistryEnabled(makeEnabledState())).toBe(true)
        })

        it("returns false when registry is disabled", () => {
            const { store } = makeStore()
            expect(store.isRegistryEnabled(makeDisabledState())).toBe(false)
        })

        it("returns false when registry is missing", () => {
            const { store } = makeStore()
            const state = empty()
            delete (state.settings.storage as any).registry
            expect(store.isRegistryEnabled(state)).toBe(false)
        })
    })

    describe("withRefVal", () => {
        it("calls onFound when key exists in registry", () => {
            const { store } = makeStore()
            const state = makeEnabledState()
            state.settings.storage.registry!.events["key1"] = { ref: true }

            const onFound = jest.fn()
            const otherwise = jest.fn()
            store.withRefVal(state, "key1", onFound, otherwise)

            expect(onFound).toHaveBeenCalledWith({ ref: true })
            expect(otherwise).not.toHaveBeenCalled()
        })

        it("calls otherwise when key does not exist", () => {
            const { store } = makeStore()
            const state = makeEnabledState()

            const onFound = jest.fn()
            const otherwise = jest.fn()
            store.withRefVal(state, "missing-key", onFound, otherwise)

            expect(onFound).not.toHaveBeenCalled()
            expect(otherwise).toHaveBeenCalled()
        })

        it("calls otherwise when registry is disabled", () => {
            const { store } = makeStore()
            const state = makeDisabledState()

            const onFound = jest.fn()
            const otherwise = jest.fn()
            store.withRefVal(state, "key1", onFound, otherwise)

            expect(onFound).not.toHaveBeenCalled()
            expect(otherwise).toHaveBeenCalled()
        })

        it("distinguishes ref and val types", () => {
            const { store } = makeStore()
            const state = makeEnabledState()
            const writable = { evt: "e1", path: "contents.tasks" as const, unsynced: false }
            state.settings.storage.registry!.events["ref-key"] = { ref: true }
            state.settings.storage.registry!.events["val-key"] = { ref: false, val: writable }

            const onFoundRef = jest.fn()
            store.withRefVal(state, "ref-key", onFoundRef, jest.fn())
            expect(onFoundRef).toHaveBeenCalledWith({ ref: true })

            const onFoundVal = jest.fn()
            store.withRefVal(state, "val-key", onFoundVal, jest.fn())
            expect(onFoundVal).toHaveBeenCalledWith({ ref: false, val: writable })
        })
    })

    describe("createRefs", () => {
        it("creates ref entries for provided keys", () => {
            const { store } = makeStore()
            const state = makeEnabledState()

            const res = store.createRefs(state, ["k1", "k2"])

            expect(res.settings.storage.registry!.events["k1"]).toEqual({ ref: true })
            expect(res.settings.storage.registry!.events["k2"]).toEqual({ ref: true })
            // the input state is not modified
            expect(state.settings.storage.registry!.events).toEqual({})
        })

        it("does nothing when registry is disabled", () => {
            const { store } = makeStore()
            const state = makeDisabledState()

            const res = store.createRefs(state, ["k1"])

            expect(res.settings.storage.registry!.events["k1"]).toBeUndefined()
        })
    })

    describe("createVals", () => {
        it("creates val entries for writable events", () => {
            const { store } = makeStore()
            const state = makeEnabledState()
            const writable = { evt: "e1", path: "contents.tasks" as const }

            const res = store.createVals(state, [writable])

            expect(res.settings.storage.registry!.events["e1"]).toEqual({
                ref: false,
                val: writable,
            })
            expect(state.settings.storage.registry!.events["e1"]).toBeUndefined()
        })

        it("does nothing when registry is disabled", () => {
            const { store } = makeStore()
            const state = makeDisabledState()
            const writable = { evt: "e1", path: "contents.tasks" as const }

            const res = store.createVals(state, [writable])

            expect(res.settings.storage.registry!.events["e1"]).toBeUndefined()
        })
    })

    describe("deleteRefVals", () => {
        it("deletes specified keys from registry events", () => {
            const { store } = makeStore()
            const state = makeEnabledState()
            state.settings.storage.registry!.events["k1"] = { ref: true }
            state.settings.storage.registry!.events["k2"] = { ref: true }

            const res = store.deleteRefVals(state, ["k1"])

            expect(res.settings.storage.registry!.events["k1"]).toBeUndefined()
            expect(res.settings.storage.registry!.events["k2"]).toEqual({ ref: true })
            expect(state.settings.storage.registry!.events["k1"]).toEqual({ ref: true })
        })

        it("does nothing when registry is disabled", () => {
            const { store } = makeStore()
            const state = makeDisabledState()
            state.settings.storage.registry!.events["k1"] = { ref: true }

            const res = store.deleteRefVals(state, ["k1"])

            // Should not throw, events remain because registry check prevents access
            expect(res.settings.storage.registry!.events["k1"]).toEqual({ ref: true })
        })
    })

    describe("cleanupRefs", () => {
        it("deletes dangling ref entries not in exceptKeys", () => {
            const { store } = makeStore()
            const state = makeEnabledState()
            state.settings.storage.registry!.events["keep"] = { ref: true }
            state.settings.storage.registry!.events["dangling"] = { ref: true }

            const res = store.cleanupRefs(state, ["keep"])

            expect(res.settings.storage.registry!.events["keep"]).toEqual({ ref: true })
            expect(res.settings.storage.registry!.events["dangling"]).toBeUndefined()
            expect(state.settings.storage.registry!.events["dangling"]).toEqual({ ref: true })
        })

        it("does not delete val-type entries", () => {
            const { store } = makeStore()
            const state = makeEnabledState()
            const writable = { evt: "e1", path: "contents.tasks" as const }
            state.settings.storage.registry!.events["val-key"] = { ref: false, val: writable }

            const res = store.cleanupRefs(state, [])

            expect(res.settings.storage.registry!.events["val-key"]).toBeDefined()
        })

        it("does nothing when registry is disabled", () => {
            const { store } = makeStore()
            const state = makeDisabledState()
            state.settings.storage.registry!.events["k1"] = { ref: true }

            const res = store.cleanupRefs(state, [])

            expect(res.settings.storage.registry!.events["k1"]).toEqual({ ref: true })
        })
    })

    describe("loadFromDisk", () => {
        it("calls setData with empty state when disk is empty", async () => {
            (storage.get as jest.Mock).mockResolvedValue(null)
            ;(storage.getOldData as jest.Mock).mockResolvedValue(null)
            const { store, getState } = makeStore()
            await store.loadFromDisk()
            expect(getState()).toEqual(empty())
        })

        it("loads state from granular IndexedDB stores", async () => {
            const savedState = makeEnabledState()
            ;(storage.get as jest.Mock).mockImplementation((store, key) => {
                if (store === STORE_SETTINGS && key === "storage") return Promise.resolve(savedState.settings.storage)
                if (store === STORE_SETTINGS && key === "retention") return Promise.resolve(savedState.settings.retention)
                if (store === STORE_SETTINGS && key === "display") return Promise.resolve(savedState.settings.display)
                return Promise.resolve(null)
            })
            ;(storage.getAll as jest.Mock).mockResolvedValue({})
            
            const { store, getState } = makeStore()
            await store.loadFromDisk()
            
            expect(getState().settings.storage.registry?.enabled).toBe(true)
        })

        it("migrates from 'all' key in STORE_SETTINGS", async () => {
            const savedState = makeEnabledState()
            ;(storage.get as jest.Mock).mockImplementation((store, key) => {
                if (store === STORE_SETTINGS && key === "all") return Promise.resolve(savedState.settings)
                return Promise.resolve(null)
            })
            ;(storage.getAll as jest.Mock).mockResolvedValue({})
            
            const { store, getState } = makeStore()
            await store.loadFromDisk()
            
            expect(getState().settings.storage.registry?.enabled).toBe(true)
            expect(storage.set).toHaveBeenCalledWith(STORE_SETTINGS, "storage", savedState.settings.storage)
            expect(storage.delete).toHaveBeenCalledWith(STORE_SETTINGS, "all")
        })

        it("migrates state from v1 IndexedDB if granular stores are empty", async () => {
            const savedState = makeEnabledState()
            ;(storage.get as jest.Mock).mockResolvedValue(null)
            ;(storage.getOldData as jest.Mock).mockResolvedValue(JSON.stringify(savedState))
            
            const { store, getState } = makeStore()
            await store.loadFromDisk()
            
            expect(getState().settings.storage.registry?.enabled).toBe(true)
            expect(storage.set).toHaveBeenCalledWith(STORE_SETTINGS, "storage", savedState.settings.storage)
            expect(storage.clearOldData).toHaveBeenCalledWith(DATA_PATH)
        })

        it("migrates state from localStorage if all IndexedDB stores are empty", async () => {
            const savedState = makeEnabledState()
            const removeItemSpy = jest.spyOn(Storage.prototype, "removeItem")
            ;(storage.get as jest.Mock).mockResolvedValue(null)
            ;(storage.getOldData as jest.Mock).mockResolvedValue(null)
            localStorage.setItem(DATA_PATH, JSON.stringify(savedState))
            
            const { store, getState } = makeStore()
            await store.loadFromDisk()
            
            expect(getState().settings.storage.registry?.enabled).toBe(true)
            expect(storage.set).toHaveBeenCalledWith(STORE_SETTINGS, "storage", savedState.settings.storage)
            expect(localStorage.getItem(DATA_PATH)).toBeNull()
        })
    })

    describe("loadFromData", () => {
        it("merges provided data and saves to disk", () => {
            const { store, getState } = makeStore()
            const newData = makeEnabledState()
            
            store.loadFromData(newData)
            
            expect(getState().settings.storage.registry?.enabled).toBe(true)
            expect(storage.set).toHaveBeenCalledWith(STORE_SETTINGS, "storage", expect.any(Object))
        })
    })

    describe("putRetentionSettings", () => {
        it("updates retention settings and saves to disk", () => {
            const { store, getState } = makeStore()
            const settings = { periodDays: 60 }
            
            store.putRetentionSettings(settings)
            
            expect(getState().settings.retention.periodDays).toBe(60)
            expect(storage.set).toHaveBeenCalledWith(STORE_SETTINGS, "retention", expect.any(Object))
        })
    })

    describe("putDisplaySettings", () => {
        it("updates display settings and saves to disk", () => {
            const { store, getState } = makeStore()
            const settings = { theme: DisplayTheme.Dark }
            
            store.putDisplaySettings(settings)
            
            expect(getState().settings.display.theme).toBe(DisplayTheme.Dark)
            expect(storage.set).toHaveBeenCalledWith(STORE_SETTINGS, "display", expect.any(Object))
        })
    })

    describe("putStorageSettings", () => {
        it("updates storage settings", () => {
            const { store, getState } = makeStore()
            const settings = { s3Bucket: "my-bucket" }
            
            store.putStorageSettings(settings)
            
            expect(getState().settings.storage.s3Bucket).toBe("my-bucket")
            expect(storage.set).toHaveBeenCalledWith(STORE_SETTINGS, "storage", expect.any(Object))
        })
    })

    describe("putItem", () => {
        it("adds a task to the store", async () => {
            const { store, getState } = makeStore()
            const task = { data: "New Task", updated: new Date().toISOString() }

            store.putItem("t1", task, mergeTask, "contents.tasks")
            
            expect(getState().contents.tasks!["t1"]).toEqual(task)
            expect(storage.set).toHaveBeenCalledWith(STORE_TASKS, "t1", task)
        })
    })

    describe("tombstoneItems", () => {
        it("marks items as deleted", () => {
            const initialState = empty()
            initialState.contents.tasks!["t1"] = { data: "task1", updated: "2023-01-01" }
            const { store, getState } = makeStore(initialState)
            
            store.tombstoneItems(
                () => ["t1"],
                (state) => state.contents.tasks!,
                mergeTasks,
                "contents.tasks"
            )
            
            expect(getState().contents.tasks!["t1"].deleted).toBeDefined()
            expect(getState().contents.tasks!["t1"].updated).toBeDefined()
        })
    })

    describe("cloudSyncData", () => {
        it("triggers cloud sync", async () => {
            const { store, notify } = makeStore()
            const state = makeEnabledState()
            
            await store.cloudSyncData(state)
            
            expect(notify).toHaveBeenCalledWith("Synchronizing your data...")
            expect(notify).toHaveBeenCalledWith("Sync completed!")
        })
    })

})

// Lets pending promise callbacks run (timers are faked in this file).
const flush = async () => {
    for (let i = 0; i < 20; i++) {
        await Promise.resolve()
    }
}

const deepFreeze = <T,>(obj: T): T => {
    if (obj && typeof obj === "object" && !Object.isFrozen(obj)) {
        Object.freeze(obj)
        Object.values(obj as any).forEach(deepFreeze)
    }
    return obj
}

describe("Store sync behaviour", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (storage.set as jest.Mock).mockResolvedValue(undefined);
        (storage.setMany as jest.Mock).mockResolvedValue(undefined);
        (storage.delete as jest.Mock).mockResolvedValue(undefined)
    })

    afterEach(() => {
        jest.clearAllTimers()
    })

    describe("event pull failures", () => {
        it("only marks events that were processed as applied", async () => {
            const { store, mockCloud, getState } = makeStore()
            mockCloud.listEvents.mockImplementation(async (data: any, onSuccess: any) => onSuccess(["e1", "e2", "e3"]))
            // e2 failed: e2 and e3 were not processed
            mockCloud.pullEvents.mockImplementation(async (data: any, keys: any, onSuccess: any) => onSuccess(data, ["e1"]))

            await store.cloudSyncData(makeEnabledState())

            const events = getState().settings.storage.registry!.events
            expect(events["e1"]).toEqual({ ref: true })
            expect(events["e2"]).toBeUndefined()
            expect(events["e3"]).toBeUndefined()
        })

        it("only deletes applied events from the cloud on a full sync", async () => {
            const { store, mockCloud } = makeStore()
            const state = makeEnabledState()
            // "known" was applied by an earlier sync
            state.settings.storage.registry!.events["known"] = { ref: true }
            mockCloud.listEvents.mockImplementation(async (data: any, onSuccess: any) => onSuccess(["known", "e1", "e2"]))
            mockCloud.pullEvents.mockImplementation(async (data: any, keys: any, onSuccess: any) => onSuccess(data, ["e1"]))

            await store.cloudSyncData(state, true)

            expect(mockCloud.deleteEvents).toHaveBeenCalledTimes(1)
            expect(mockCloud.deleteEvents.mock.calls[0][1]).toEqual(["known", "e1"])
        })
    })

    describe("auto-sync throttle", () => {
        it("skips syncs within the configured period, in any time zone", async () => {
            const { store, mockCloud } = makeStore()
            const state = makeEnabledState()

            await store.cloudSyncData(state, false, 5)
            expect(mockCloud.pullData).toHaveBeenCalledTimes(1)

            jest.advanceTimersByTime(4 * 60 * 1000)
            await store.cloudSyncData(state, false, 5)
            expect(mockCloud.pullData).toHaveBeenCalledTimes(1)

            jest.advanceTimersByTime(2 * 60 * 1000)
            await store.cloudSyncData(state, false, 5)
            expect(mockCloud.pullData).toHaveBeenCalledTimes(2)
        })

        it("does not throttle syncs requested without a period", async () => {
            const { store, mockCloud } = makeStore()
            await store.cloudSyncData(makeEnabledState())
            await store.cloudSyncData(makeEnabledState())
            expect(mockCloud.pullData).toHaveBeenCalledTimes(2)
        })
    })

    describe("disk cleanup", () => {
        it("deletes items removed by a sync from disk", async () => {
            const { store, mockCloud } = makeStore()
            const state = makeEnabledState()
            state.contents.tasks = {
                gone: { data: "gone", created: "2024-01-01T00:00:00Z" },
                kept: { data: "kept", created: "2024-01-01T00:00:00Z" },
            }
            mockCloud.pullData.mockImplementation(async (data: any, onSuccess: any) =>
                onSuccess({ ...data, contents: { ...data.contents, tasks: { kept: data.contents.tasks.kept } } }))

            await store.cloudSyncData(state)

            expect(storage.delete).toHaveBeenCalledWith(STORE_TASKS, "gone")
            expect(storage.delete).not.toHaveBeenCalledWith(STORE_TASKS, "kept")
        })

        it("purges expired items from memory and disk on load", async () => {
            const { store, getState } = makeStore()
            const old = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
            const recent = new Date().toISOString();
            (storage.get as jest.Mock).mockImplementation(async (store: string, key: string) =>
                key === "retention" ? { periodDays: 30 } : null);
            (storage.getAll as jest.Mock).mockImplementation(async (name: string) =>
                name === STORE_TASKS
                    ? { old: { data: "old", deleted: old }, recent: { data: "recent", deleted: recent } }
                    : {})

            await store.loadFromDisk()

            expect(getState().contents.tasks!["old"]).toBeUndefined()
            expect(getState().contents.tasks!["recent"]).toBeDefined()
            expect(storage.delete).toHaveBeenCalledWith(STORE_TASKS, "old")
            expect(storage.delete).not.toHaveBeenCalledWith(STORE_TASKS, "recent")
        })
    })

    describe("sync guard", () => {
        it("never runs two syncs at once, and runs one follow-up afterwards", async () => {
            const { store, mockCloud } = makeStore()
            const state = makeEnabledState()
            let release: () => void = () => {}
            mockCloud.pullData.mockImplementationOnce((data: any, onSuccess: any) =>
                new Promise<void>(resolve => { release = () => { onSuccess(data); resolve() } }))

            const first = store.cloudSyncData(state)
            await store.cloudSyncData(state)
            await store.cloudSyncData(state, true)
            expect(mockCloud.pullData).toHaveBeenCalledTimes(1)

            const spy = jest.spyOn(store, "cloudSyncData")
            release()
            await first
            jest.runOnlyPendingTimers()
            await flush()

            // exactly one follow-up, and it is a full sync because one was requested
            expect(mockCloud.pullData).toHaveBeenCalledTimes(2)
            expect(spy).toHaveBeenCalledTimes(1)
            expect(spy.mock.calls[0][1]).toBe(true)
        })

        it("is released when a cloud call fails, without a second error message", async () => {
            const { store, mockCloud, notify } = makeStore()
            ;(mockCloud.pullData as jest.Mock).mockImplementationOnce(async (data: any, onSuccess: any, onFailure: any) =>
                onFailure({ desc: "invalid authentication credentials" }))

            await store.cloudSyncData(makeEnabledState())
            expect(notify).not.toHaveBeenCalledWith(expect.stringMatching(/^Sync failed/))

            await store.cloudSyncData(makeEnabledState())
            expect(mockCloud.pullData).toHaveBeenCalledTimes(2)
            expect(notify).toHaveBeenCalledWith("Sync completed!")
        })
    })

    describe("unsynced flag", () => {
        const T0 = "2024-01-01T00:00:00Z"

        it("is cleared after a push, unless the item changed in the meantime", () => {
            const state = makeEnabledState()
            state.contents.tasks = {
                same: { data: "a", created: T0, updated: "2024-01-02T00:00:00Z", unsynced: true },
                edited: { data: "b2", created: T0, updated: "2024-01-03T00:00:00Z", unsynced: true },
            }
            const { store, getState } = makeStore(state)

            store.handleItemSyncComplete([
                { evt: "e1", path: "contents.tasks", id: "same", updated: "2024-01-02T00:00:00Z" } as any,
                { evt: "e2", path: "contents.tasks", id: "edited", updated: "2024-01-02T00:00:00Z" } as any,
            ])

            expect(getState().contents.tasks!["same"].unsynced).toBeUndefined()
            expect(getState().contents.tasks!["edited"].unsynced).toBe(true)
            expect(getState().settings.storage.registry!.events["e1"]).toEqual({ ref: true })
            expect(storage.set).toHaveBeenCalledWith(STORE_TASKS, "same", { data: "a", created: T0, updated: "2024-01-02T00:00:00Z" })
            expect(storage.set).not.toHaveBeenCalledWith(STORE_TASKS, "edited", expect.anything())
        })

        it("is cleared after an automatic push of an edit", async () => {
            const state = makeEnabledState()
            state.settings.storage.autoPushItems = true
            const { store, mockCloud, getState } = makeStore(state)
            const item = { data: "a", created: T0, updated: "2024-01-02T00:00:00Z", unsynced: true }

            store.putItem("t1", item, mergeTask, "contents.tasks")
            expect(getState().contents.tasks!["t1"].unsynced).toBe(true)

            jest.advanceTimersByTime(3000)
            await flush()

            expect(mockCloud.pushEvents).toHaveBeenCalledTimes(1)
            expect(getState().contents.tasks!["t1"].unsynced).toBeUndefined()
        })
    })

    describe("immutability", () => {
        it("never modifies the previous state", async () => {
            const state = makeEnabledState()
            state.contents.tasks = { t1: { data: "a", created: "2024-01-01T00:00:00Z", unsynced: true } }
            const { store } = makeStore(deepFreeze(state))

            expect(() => {
                store.putItem("t1", { data: "b", created: "2024-01-01T00:00:00Z" }, mergeTask, "contents.tasks")
                store.tombstoneItems(() => ["t1"], s => s.contents.tasks!, mergeTasks, "contents.tasks")
                store.handleItemSyncComplete([{ evt: "e1", path: "contents.tasks", id: "t1" } as any])
            }).not.toThrow()
            await expect(store.cloudSyncData(deepFreeze(makeEnabledState()), true)).resolves.toBeUndefined()
        })
    })
})
