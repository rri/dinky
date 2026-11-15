import { CONTENT_FIELDS, isSafeId, sanitizeContentItem, sanitizeState, sanitizeWith } from "./Sanitize"
import { Task, TaskFields } from "./Task"
import { Topic } from "./Topic"
import { DisplayTheme } from "./DisplaySettings"

describe("sanitizeState", () => {
    it("drops storage settings from untrusted data", () => {
        const res = sanitizeState({
            settings: { storage: { s3Bucket: "attacker", awsAccessKey: "X", awsSecretKey: "Y", awsRegion: "us-east-1" } },
        })
        expect(res.settings.storage.s3Bucket).toBeUndefined()
        expect(res.settings.storage.awsAccessKey).toBeUndefined()
    })

    it("keeps valid items and drops invalid ones", () => {
        // JSON.parse (unlike an object literal) creates an own "__proto__" key
        const res = sanitizeState(JSON.parse(`{
            "contents": {
                "tasks": {
                    "t1": { "data": "ok", "created": "2024-01-01T00:00:00Z", "archive": true, "progress": 3, "unsynced": true },
                    "t2": { "data": 42 },
                    "t3": null,
                    "__proto__": { "data": "evil" }
                }
            }
        }`))
        expect(res.contents.tasks!["t1"]).toEqual({ data: "ok", created: "2024-01-01T00:00:00Z", archive: true, progress: 3 })
        expect(Object.keys(res.contents.tasks!)).toEqual(["t1"])
        expect(({} as any).data).toBeUndefined()
    })

    it("validates retention and display settings", () => {
        const bad = sanitizeState({ settings: { retention: { periodDays: "x" }, display: { theme: 99 } } })
        expect(bad.settings.retention.periodDays).toBe(30)
        expect(bad.settings.display.theme).toBe(DisplayTheme.Auto)
        const good = sanitizeState({ settings: { retention: { periodDays: 7 }, display: { theme: DisplayTheme.Dark } } })
        expect(good.settings.retention.periodDays).toBe(7)
        expect(good.settings.display.theme).toBe(DisplayTheme.Dark)
    })

    it("rejects non-object input", () => {
        expect(() => sanitizeState(null)).toThrow()
        expect(() => sanitizeState([])).toThrow()
    })
})

describe("sanitizeContentItem", () => {
    it("drops invalid dates and progress values", () => {
        expect(sanitizeContentItem("tasks", { data: "x", today: "not a date", progress: 12 })).toEqual({ data: "x" })
    })

    it("only accepts the fields of each content type's own schema", () => {
        // "name" belongs to topics only; "today" belongs to tasks and works only
        expect(sanitizeContentItem("tasks", { data: "x", name: "n" })).toEqual({ data: "x" })
        expect(sanitizeContentItem("topics", { data: "#x", name: "n" })).toEqual({ data: "#x", name: "n" })
        expect(sanitizeContentItem("notes", { data: "x", today: "2024-01-01T00:00:00Z" })).toEqual({ data: "x" })
        expect(sanitizeContentItem("works", { data: "x", today: "2024-01-01T00:00:00Z" })).toEqual({ data: "x", today: "2024-01-01T00:00:00Z" })
    })

    it("never accepts device-local fields", () => {
        expect(sanitizeContentItem("tasks", { data: "x", unsynced: true })).toEqual({ data: "x" })
    })

    it("rejects items missing required fields", () => {
        expect(sanitizeContentItem("tasks", { created: "2024-01-01T00:00:00Z" })).toBeUndefined()
    })
})

describe("schemas", () => {
    it("cover every content type", () => {
        expect(Object.keys(CONTENT_FIELDS).sort()).toEqual(["notes", "tasks", "topics", "works"])
    })

    it("keep every non-local field of a fully populated item", () => {
        const task: Task = {
            data: "x",
            created: "2024-01-01T00:00:00Z",
            updated: "2024-01-02T00:00:00Z",
            deleted: "2024-01-03T00:00:00Z",
            today: "2024-01-04T00:00:00Z",
            archive: false,
            progress: 5,
        }
        expect(sanitizeWith(TaskFields, task)).toEqual(task)
    })

    it("derive TypeScript types from the schemas", () => {
        // Compile-time checks (run `npx tsc --noEmit`): types follow the schemas.
        const topic: Topic = { data: "#x", name: "n" }
        // @ts-expect-error -- "data" is required by the schema
        const missing: Task = { created: "2024-01-01T00:00:00Z" }
        // @ts-expect-error -- "name" is not part of the task schema
        const extra: Task = { data: "x", name: "n" }
        expect([topic, missing, extra]).toHaveLength(3)
    })
})

describe("isSafeId", () => {
    it("rejects prototype keys", () => {
        expect(isSafeId("__proto__")).toBe(false)
        expect(isSafeId("constructor")).toBe(false)
        expect(isSafeId("")).toBe(false)
        expect(isSafeId("6b3c1f0e-1d2a-4c55-9a43-7f0f3a6b0c11")).toBe(true)
    })
})
