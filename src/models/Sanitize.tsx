import { AppState, empty } from "./AppState"
import { DisplaySettings, DisplaySettingsFields } from "./DisplaySettings"
import { NoteFields } from "./Note"
import { RetentionSettings, RetentionSettingsFields } from "./RetentionSettings"
import { InferFields, Schema } from "./Schema"
import { TaskFields } from "./Task"
import { TopicFields } from "./Topic"
import { WorkFields } from "./Work"

// Data that crosses a trust boundary (imported files, the cloud data object
// and cloud events) is validated here before it is merged into local state.
//
// Validation is driven by the model schemas (see Schema.tsx), so it follows
// the models automatically as they change. In particular:
// - storage settings (bucket, credentials) are never accepted from outside,
//   so a crafted file cannot redirect sync to a third-party bucket;
// - device-local fields (such as "unsynced") are never accepted from outside;
// - record keys that would interfere with object prototypes are dropped;
// - each content type only accepts the fields of its own schema, with the
//   expected types, so malformed values cannot crash rendering or sorting.

export const CONTENT_FIELDS = {
    tasks: TaskFields,
    topics: TopicFields,
    notes: NoteFields,
    works: WorkFields,
}

export type ContentKind = keyof typeof CONTENT_FIELDS

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"])
const MAX_ID_LENGTH = 128

const isObj = (val: any): val is Record<string, any> =>
    typeof val === "object" && val !== null && !Array.isArray(val)

export const isSafeId = (id: any): id is string =>
    typeof id === "string" && id.length > 0 && id.length <= MAX_ID_LENGTH && !UNSAFE_KEYS.has(id)

// Validates a value against a schema. Returns undefined if the value is not an
// object or a required field is missing or invalid; invalid optional fields,
// local fields and unknown fields are dropped.
export const sanitizeWith = <S extends Schema>(schema: S, val: unknown): InferFields<S> | undefined => {
    if (!isObj(val)) {
        return undefined
    }
    const res: Record<string, unknown> = {}
    for (const [key, field] of Object.entries(schema)) {
        if (field.local) {
            continue
        }
        const fieldVal = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined
        if (fieldVal !== undefined && field.check(fieldVal)) {
            res[key] = fieldVal
        } else if (!field.optional) {
            return undefined
        }
    }
    return res as InferFields<S>
}

export const sanitizeRecords = <S extends Schema>(schema: S, rec: unknown): Record<string, InferFields<S>> => {
    const res: Record<string, InferFields<S>> = {}
    if (!isObj(rec)) {
        return res
    }
    Object.entries(rec).forEach(([id, val]) => {
        if (isSafeId(id)) {
            const item = sanitizeWith(schema, val)
            if (item) {
                res[id] = item
            }
        }
    })
    return res
}

export const sanitizeContentItem = (kind: ContentKind, val: unknown) =>
    sanitizeWith<Schema>(CONTENT_FIELDS[kind], val)

export const sanitizeRetention = (val: unknown): RetentionSettings | undefined =>
    sanitizeWith(RetentionSettingsFields, val)

export const sanitizeDisplay = (val: unknown): DisplaySettings | undefined =>
    sanitizeWith(DisplaySettingsFields, val)

export const sanitizeState = (raw: unknown): AppState => {
    if (!isObj(raw)) {
        throw new Error("invalid data")
    }
    const settings = isObj(raw.settings) ? raw.settings : {}
    const contents = isObj(raw.contents) ? raw.contents : {}
    const retention = sanitizeRetention(settings.retention)
    const display = sanitizeDisplay(settings.display)
    return empty({
        settings: {
            storage: {},
            ...(retention ? { retention } : {}),
            ...(display ? { display } : {}),
        },
        contents: {
            tasks: sanitizeRecords(TaskFields, contents.tasks),
            topics: sanitizeRecords(TopicFields, contents.topics),
            notes: sanitizeRecords(NoteFields, contents.notes),
            works: sanitizeRecords(WorkFields, contents.works),
        },
    } as AppState)
}
