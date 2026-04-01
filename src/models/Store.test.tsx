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
        pullData: jest.fn((data, onSuccess) => {
            onSuccess(data)
            return Promise.resolve()
        }),
        pushData: jest.fn((data, onSuccess) => {
            onSuccess(data)
            return Promise.resolve()
        }),
        listEvents: jest.fn((data, onSuccess) => {
            onSuccess([])
            return Promise.resolve()
        }),
        pullEvents: jest.fn((data, keys, onSuccess) => {
            onSuccess(data)
            return Promise.resolve()
        }),
        pushEvents: jest.fn((data, events, onSuccess) => {
            onSuccess(data)
            return Promise.resolve()
        }),
        deleteEvents: jest.fn((data, keys, onSuccess) => {
            onSuccess(data)
            return Promise.resolve()
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
        localStorage.clear()
        jest.clearAllMocks()
        ;(storage.get as jest.Mock).mockReset()
        ;(storage.getAll as jest.Mock).mockReset()
        ;(storage.set as jest.Mock).mockReset()
        ;(storage.setMany as jest.Mock).mockReset()
        ;(storage.getOldData as jest.Mock).mockReset()
        ;(storage.delete as jest.Mock).mockReset()
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

            store.createRefs(state, ["k1", "k2"])

            expect(state.settings.storage.registry!.events["k1"]).toEqual({ ref: true })
            expect(state.settings.storage.registry!.events["k2"]).toEqual({ ref: true })
        })

        it("does nothing when registry is disabled", () => {
            const { store } = makeStore()
            const state = makeDisabledState()

            store.createRefs(state, ["k1"])

            expect(state.settings.storage.registry!.events["k1"]).toBeUndefined()
        })
    })

    describe("createVals", () => {
        it("creates val entries for writable events", () => {
            const { store } = makeStore()
            const state = makeEnabledState()
            const writable = { evt: "e1", path: "contents.tasks" as const }

            store.createVals(state, [writable])

            expect(state.settings.storage.registry!.events["e1"]).toEqual({
                ref: false,
                val: writable,
            })
        })

        it("does nothing when registry is disabled", () => {
            const { store } = makeStore()
            const state = makeDisabledState()
            const writable = { evt: "e1", path: "contents.tasks" as const }

            store.createVals(state, [writable])

            expect(state.settings.storage.registry!.events["e1"]).toBeUndefined()
        })
    })

    describe("deleteRefVals", () => {
        it("deletes specified keys from registry events", () => {
            const { store } = makeStore()
            const state = makeEnabledState()
            state.settings.storage.registry!.events["k1"] = { ref: true }
            state.settings.storage.registry!.events["k2"] = { ref: true }

            store.deleteRefVals(state, ["k1"])

            expect(state.settings.storage.registry!.events["k1"]).toBeUndefined()
            expect(state.settings.storage.registry!.events["k2"]).toEqual({ ref: true })
        })

        it("does nothing when registry is disabled", () => {
            const { store } = makeStore()
            const state = makeDisabledState()
            state.settings.storage.registry!.events["k1"] = { ref: true }

            store.deleteRefVals(state, ["k1"])

            // Should not throw, events remain because registry check prevents access
            expect(state.settings.storage.registry!.events["k1"]).toEqual({ ref: true })
        })
    })

    describe("cleanupRefs", () => {
        it("deletes dangling ref entries not in exceptKeys", () => {
            const { store } = makeStore()
            const state = makeEnabledState()
            state.settings.storage.registry!.events["keep"] = { ref: true }
            state.settings.storage.registry!.events["dangling"] = { ref: true }

            store.cleanupRefs(state, ["keep"])

            expect(state.settings.storage.registry!.events["keep"]).toEqual({ ref: true })
            expect(state.settings.storage.registry!.events["dangling"]).toBeUndefined()
        })

        it("does not delete val-type entries", () => {
            const { store } = makeStore()
            const state = makeEnabledState()
            const writable = { evt: "e1", path: "contents.tasks" as const }
            state.settings.storage.registry!.events["val-key"] = { ref: false, val: writable }

            store.cleanupRefs(state, [])

            expect(state.settings.storage.registry!.events["val-key"]).toBeDefined()
        })

        it("does nothing when registry is disabled", () => {
            const { store } = makeStore()
            const state = makeDisabledState()
            state.settings.storage.registry!.events["k1"] = { ref: true }

            store.cleanupRefs(state, [])

            expect(state.settings.storage.registry!.events["k1"]).toEqual({ ref: true })
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
        })

        it("migrates state from localStorage if all IndexedDB stores are empty", async () => {
            const savedState = makeEnabledState()
            ;(storage.get as jest.Mock).mockResolvedValue(null)
            ;(storage.getOldData as jest.Mock).mockResolvedValue(null)
            localStorage.setItem(DATA_PATH, JSON.stringify(savedState))
            
            const { store, getState } = makeStore()
            await store.loadFromDisk()
            
            expect(getState().settings.storage.registry?.enabled).toBe(true)
            expect(storage.set).toHaveBeenCalledWith(STORE_SETTINGS, "storage", savedState.settings.storage)
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
        it("adds a task to the store", () => {
            const { store, getState } = makeStore()
            const task = { data: "New Task", updated: new Date().toISOString() }
            
            store.putItem("task1", task, mergeTask, "contents.tasks")
            
            expect(getState().contents.tasks["task1"]).toEqual(task)
            expect(storage.set).toHaveBeenCalledWith(STORE_TASKS, "task1", task)
        })
    })

    describe("tombstoneItems", () => {
        it("marks items as deleted", () => {
            const initialState = empty()
            initialState.contents.tasks["t1"] = { data: "task1", updated: "2023-01-01" }
            const { store, getState } = makeStore(initialState)
            
            store.tombstoneItems(
                () => ["t1"],
                (state) => state.contents.tasks,
                mergeTasks,
                "contents.tasks"
            )
            
            expect(getState().contents.tasks["t1"].deleted).toBeDefined()
            expect(getState().contents.tasks["t1"].updated).toBeDefined()
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
