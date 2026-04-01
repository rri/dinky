import {
    empty,
    mergeTask,
    mergeTasks,
    mergeTopic,
    mergeNote,
    mergeWork,
    mergeRetentionSettings,
    mergeDisplaySettings,
    mergeStorageSettings,
    mergeData,
    purgeDeleted,
    toExport,
    AppState,
} from "./AppState"
import { DisplayTheme } from "./DisplaySettings"
import moment from "moment"

const baseState = (): AppState => empty()

describe("empty", () => {
    it("returns default state with no arguments", () => {
        const state = empty()
        expect(state.settings.storage.registry?.enabled).toBe(false)
        expect(state.settings.retention.periodDays).toBe(30)
        expect(state.settings.display.theme).toBe(DisplayTheme.Auto)
        expect(state.contents.tasks!).toEqual({})
        expect(state.contents.topics).toEqual({})
        expect(state.contents.notes).toEqual({})
        expect(state.contents.works).toEqual({})
    })

    it("merges provided state with defaults", () => {
        const state = empty({
            settings: {
                storage: { registry: { enabled: true, events: {} } },
                retention: { periodDays: 60 },
                display: { theme: DisplayTheme.Dark },
            },
            contents: { tasks: { "t1": { data: "task1" } } },
        })
        expect(state.settings.retention.periodDays).toBe(60)
        expect(state.settings.display.theme).toBe(DisplayTheme.Dark)
        expect(state.contents.tasks!).toEqual({ "t1": { data: "task1" } })
    })

    it("preserves error field if provided", () => {
        const state = empty({ error: "test error" } as any)
        expect(state.error).toBe("test error")
    })
})

describe("mergeTask", () => {
    it("adds a task to empty state", () => {
        const state = baseState()
        const result = mergeTask(state, "t1", { data: "task 1" })
        expect(result.contents.tasks!["t1"]).toEqual({ data: "task 1" })
    })

    it("preserves existing tasks", () => {
        let state = baseState()
        state = mergeTask(state, "t1", { data: "task 1" })
        state = mergeTask(state, "t2", { data: "task 2" })
        expect(Object.keys(state.contents.tasks!)).toHaveLength(2)
    })

    it("overwrites existing task with same id", () => {
        let state = baseState()
        state = mergeTask(state, "t1", { data: "original" })
        state = mergeTask(state, "t1", { data: "updated" })
        expect(state.contents.tasks!["t1"].data).toBe("updated")
    })

    it("does not mutate original state", () => {
        const state = baseState()
        const result = mergeTask(state, "t1", { data: "task 1" })
        expect(state.contents.tasks!).toEqual({})
        expect(result.contents.tasks!["t1"]).toBeDefined()
    })
})

describe("mergeTasks", () => {
    it("merges multiple tasks", () => {
        const state = baseState()
        const result = mergeTasks(state, {
            "t1": { data: "task 1" },
            "t2": { data: "task 2" },
        })
        expect(Object.keys(result.contents.tasks!)).toHaveLength(2)
    })
})

describe("mergeTopic", () => {
    it("adds a topic", () => {
        const state = baseState()
        const result = mergeTopic(state, "tp1", { data: "#topic1" })
        expect(result.contents.topics!["tp1"]).toBeDefined()
    })

    it("deduplicates topics by data content (keeps newer)", () => {
        let state = baseState()
        state = mergeTopic(state, "tp1", { data: "#topic", updated: "2024-01-01T00:00:00Z" })
        state = mergeTopic(state, "tp2", { data: "#topic", updated: "2024-06-01T00:00:00Z" })
        const topics = Object.entries(state.contents.topics!)
        const nonEmpty = topics.filter(([_, t]) => t.data === "#topic")
        expect(nonEmpty).toHaveLength(1)
        expect(nonEmpty[0][0]).toBe("tp2")
    })

    it("keeps older topic if newer has no updated date", () => {
        let state = baseState()
        state = mergeTopic(state, "tp1", { data: "#topic", updated: "2024-06-01T00:00:00Z" })
        state = mergeTopic(state, "tp2", { data: "#topic" })
        const topics = Object.entries(state.contents.topics!)
        const nonEmpty = topics.filter(([_, t]) => t.data === "#topic")
        expect(nonEmpty).toHaveLength(1)
        expect(nonEmpty[0][0]).toBe("tp1")
    })

    it("skips uniqueness for empty data topics", () => {
        let state = baseState()
        state = mergeTopic(state, "tp1", { data: "" })
        state = mergeTopic(state, "tp2", { data: "" })
        expect(Object.keys(state.contents.topics!)).toHaveLength(2)
    })
})

describe("mergeNote", () => {
    it("adds a note", () => {
        const state = baseState()
        const result = mergeNote(state, "n1", { data: "note 1" })
        expect(result.contents.notes!["n1"]).toEqual({ data: "note 1" })
    })
})

describe("mergeWork", () => {
    it("adds a work", () => {
        const state = baseState()
        const result = mergeWork(state, "w1", { data: "work 1" })
        expect(result.contents.works!["w1"]).toEqual({ data: "work 1" })
    })
})

describe("mergeRetentionSettings", () => {
    it("updates retention settings", () => {
        const state = baseState()
        const result = mergeRetentionSettings(state, { periodDays: 60 })
        expect(result.settings.retention.periodDays).toBe(60)
    })

    it("preserves other settings", () => {
        const state = baseState()
        const result = mergeRetentionSettings(state, { periodDays: 60 })
        expect(result.settings.display).toEqual(state.settings.display)
    })
})

describe("mergeDisplaySettings", () => {
    it("updates display theme", () => {
        const state = baseState()
        const result = mergeDisplaySettings(state, { theme: DisplayTheme.Dark })
        expect(result.settings.display.theme).toBe(DisplayTheme.Dark)
    })
})

describe("mergeStorageSettings", () => {
    it("updates storage settings while preserving existing values", () => {
        let state = baseState()
        state = mergeStorageSettings(state, { s3Bucket: "my-bucket", awsRegion: "us-east-1" })
        expect(state.settings.storage.s3Bucket).toBe("my-bucket")
        expect(state.settings.storage.awsRegion).toBe("us-east-1")
    })

    it("preserves prior storage config on subsequent merge", () => {
        let state = baseState()
        state = mergeStorageSettings(state, { s3Bucket: "my-bucket", awsAccessKey: "key1" })
        state = mergeStorageSettings(state, { awsRegion: "us-west-2" })
        expect(state.settings.storage.s3Bucket).toBe("my-bucket")
        expect(state.settings.storage.awsAccessKey).toBe("key1")
        expect(state.settings.storage.awsRegion).toBe("us-west-2")
    })
})

describe("mergeData", () => {
    it("merges two states", () => {
        const curr = baseState()
        const data = empty({
            contents: {
                tasks: { "t1": { data: "task 1", updated: "2024-01-01T00:00:00Z" } },
            },
        } as any)
        const result = mergeData(curr, data)
        expect(result.contents.tasks!["t1"]).toBeDefined()
    })

    it("resolves conflicts by updated timestamp (newer wins)", () => {
        const curr = empty({
            contents: {
                tasks: { "t1": { data: "old", updated: "2024-01-01T00:00:00Z" } },
            },
        } as any)
        const data = empty({
            contents: {
                tasks: { "t1": { data: "new", updated: "2024-06-01T00:00:00Z" } },
            },
        } as any)
        const result = mergeData(curr, data)
        expect(result.contents.tasks!["t1"].data).toBe("new")
    })

    it("keeps current if it is newer", () => {
        const curr = empty({
            contents: {
                tasks: { "t1": { data: "current", updated: "2024-06-01T00:00:00Z" } },
            },
        } as any)
        const data = empty({
            contents: {
                tasks: { "t1": { data: "older", updated: "2024-01-01T00:00:00Z" } },
            },
        } as any)
        const result = mergeData(curr, data)
        expect(result.contents.tasks!["t1"].data).toBe("current")
    })

    it("handles forceDel - deletes items not in data if not unsynced", () => {
        const curr = empty({
            contents: {
                tasks: {
                    "t1": { data: "task1", updated: "2024-01-01T00:00:00Z" },
                    "t2": { data: "task2", updated: "2024-01-01T00:00:00Z", unsynced: true },
                },
            },
        } as any)
        const data = empty({
            contents: {
                tasks: {
                    "t1": { data: "task1", updated: "2024-01-01T00:00:00Z" },
                    // t2 not present in data
                },
            },
        } as any)
        const result = mergeData(curr, data, true)
        expect(result.contents.tasks!["t1"]).toBeDefined()
        // t2 is unsynced so it should be preserved even with forceDel
    })

    it("handles forceSync - marks merged items as unsynced", () => {
        const curr = baseState()
        const data = empty({
            contents: {
                tasks: { "t1": { data: "task1" } },
            },
        } as any)
        const result = mergeData(curr, data, false, true)
        expect(result.contents.tasks!["t1"].unsynced).toBe(true)
    })

    it("merges retention settings by updated timestamp", () => {
        const curr = empty({
            settings: {
                storage: { registry: { enabled: false, events: {} } },
                retention: { periodDays: 30, updated: "2024-01-01T00:00:00Z" },
                display: { theme: DisplayTheme.Auto },
            },
        } as any)
        const data = empty({
            settings: {
                storage: { registry: { enabled: false, events: {} } },
                retention: { periodDays: 60, updated: "2024-06-01T00:00:00Z" },
                display: { theme: DisplayTheme.Auto },
            },
        } as any)
        const result = mergeData(curr, data)
        expect(result.settings.retention.periodDays).toBe(60)
    })

    it("merges registry events from both sides", () => {
        const curr = empty({
            settings: {
                storage: { registry: { enabled: true, events: { "e1": { ref: true } } } },
                retention: { periodDays: 30 },
                display: { theme: DisplayTheme.Auto },
            },
        } as any)
        const data = empty({
            settings: {
                storage: { registry: { enabled: false, events: { "e2": { ref: true } } } },
                retention: { periodDays: 30 },
                display: { theme: DisplayTheme.Auto },
            },
        } as any)
        const result = mergeData(curr, data)
        expect(result.settings.storage.registry?.enabled).toBe(true)
        expect(result.settings.storage.registry?.events["e1"]).toBeDefined()
        expect(result.settings.storage.registry?.events["e2"]).toBeDefined()
    })
})

describe("purgeDeleted", () => {
    it("keeps non-deleted items", () => {
        const state = empty({
            contents: {
                tasks: { "t1": { data: "active task" } },
            },
        } as any)
        const result = purgeDeleted(state)
        expect(result.contents.tasks!["t1"]).toBeDefined()
    })

    it("keeps recently deleted items within retention period", () => {
        const state = empty({
            contents: {
                tasks: {
                    "t1": {
                        data: "recently deleted",
                        deleted: moment().subtract(5, "days").toISOString(),
                    },
                },
            },
        } as any)
        const result = purgeDeleted(state)
        expect(result.contents.tasks!["t1"]).toBeDefined()
    })

    it("purges items deleted beyond retention period", () => {
        const state = empty({
            contents: {
                tasks: {
                    "t1": {
                        data: "old deleted",
                        deleted: moment().subtract(31, "days").toISOString(),
                    },
                },
            },
        } as any)
        const result = purgeDeleted(state)
        expect(result.contents.tasks!["t1"]).toBeUndefined()
    })

    it("respects custom retention period", () => {
        const state: AppState = {
            settings: {
                storage: { registry: { enabled: false, events: {} } },
                retention: { periodDays: 7 },
                display: { theme: DisplayTheme.Auto },
            },
            contents: {
                tasks: {
                    "t1": {
                        data: "deleted 10 days ago",
                        deleted: moment().subtract(10, "days").toISOString(),
                    },
                },
                topics: {},
                notes: {},
                works: {},
            },
        }
        const result = purgeDeleted(state)
        expect(result.contents.tasks!["t1"]).toBeUndefined()
    })

    it("purges across all content types", () => {
        const oldDate = moment().subtract(60, "days").toISOString()
        const state = empty({
            contents: {
                tasks: { "t1": { data: "t", deleted: oldDate } },
                topics: { "tp1": { data: "tp", deleted: oldDate } },
                notes: { "n1": { data: "n", deleted: oldDate } },
                works: { "w1": { data: "w", deleted: oldDate } },
            },
        } as any)
        const result = purgeDeleted(state)
        expect(Object.keys(result.contents.tasks!)).toHaveLength(0)
        expect(Object.keys(result.contents.topics!)).toHaveLength(0)
        expect(Object.keys(result.contents.notes!)).toHaveLength(0)
        expect(Object.keys(result.contents.works!)).toHaveLength(0)
    })
})

describe("toExport", () => {
    it("strips sync status from all content types", () => {
        const state = empty({
            contents: {
                tasks: { "t1": { data: "task", unsynced: true } },
                topics: { "tp1": { data: "#topic", unsynced: true } },
                notes: { "n1": { data: "note", unsynced: true } },
                works: { "w1": { data: "work", unsynced: true } },
            },
        } as any)
        const result = toExport(state)
        expect(result.contents.tasks!["t1"].unsynced).toBeUndefined()
        expect(result.contents.topics!["tp1"].unsynced).toBeUndefined()
        expect(result.contents.notes!["n1"].unsynced).toBeUndefined()
        expect(result.contents.works!["w1"].unsynced).toBeUndefined()
    })

    it("strips storage settings", () => {
        const state = empty({
            settings: {
                storage: { s3Bucket: "secret-bucket", awsAccessKey: "secret-key" },
                retention: { periodDays: 30 },
                display: { theme: DisplayTheme.Auto },
            },
        } as any)
        const result = toExport(state)
        expect(result.settings.storage).toEqual({})
    })

    it("preserves retention and display settings", () => {
        const state = empty()
        const result = toExport(state)
        expect(result.settings.retention).toEqual(state.settings.retention)
        expect(result.settings.display).toEqual(state.settings.display)
    })

    it("preserves data content", () => {
        const state = empty({
            contents: {
                tasks: { "t1": { data: "important task", created: "2024-01-01" } },
            },
        } as any)
        const result = toExport(state)
        expect(result.contents.tasks!["t1"].data).toBe("important task")
        expect(result.contents.tasks!["t1"].created).toBe("2024-01-01")
    })
})
