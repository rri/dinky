import { Contents } from "./Contents"
import { Note } from "./Note"
import { DisplaySettings, DisplayTheme } from "./DisplaySettings"
import { RetentionSettings } from "./RetentionSettings"
import { Settings } from "./Settings"
import { StorageSettings } from "./StorageSettings"
import { Topic } from "./Topic"
import { Task } from "./Task"
import { Work } from "./Work"
import { Creatable, Deletable, Syncable, Updatable } from "./Item"

export const DEFAULT_RETENTION_DAYS = 30

export interface AppState {
    error?: string,
    settings: Settings,
    contents: Contents,
}

const stripSyncStatus = <T extends Syncable>(rec?: Record<string, T>) => {
    if (rec) {
        const res: Record<string, T> = {}
        Object
            .entries(rec)
            .forEach((val: [string, T]) => {
                res[val[0]] = {
                    ...val[1],
                    unsynced: undefined,
                }
            })
        return res
    }
    return rec
}

const mergeByUpdated = <T extends Updatable>(currVal: T, nextVal: T) => {
    if (!nextVal) {
        return currVal
    }

    if (!currVal) {
        return nextVal
    }

    if (!currVal.updated
        || (nextVal.updated
            && currVal.updated < nextVal.updated)) {
        return nextVal
    }

    return currVal
}

const mergeRecords = <T extends Syncable & Updatable & Creatable>(currRec?: Record<string, T>, nextRec?: Record<string, T>, forceDel?: boolean, forceSync?: boolean) => {
    const curr = currRec || {}
    const next = nextRec || {}
    const res: Record<string, T> = {}
    const ids = new Set([...Object.keys(curr), ...Object.keys(next)])
    ids.forEach(id => {
        const currVal = Object.prototype.hasOwnProperty.call(curr, id) ? curr[id] : undefined
        const nextVal = Object.prototype.hasOwnProperty.call(next, id) ? next[id] : undefined

        if (currVal && nextVal) {
            res[id] = { ...mergeByUpdated(currVal, nextVal) }
            const unsynced = forceSync || (currVal.unsynced && nextVal.unsynced)
            if (unsynced) {
                res[id].unsynced = unsynced
            }
        } else if (forceDel && !nextVal && currVal && currVal.created && !currVal.unsynced) {
            // The authoritative copy no longer has this (synced) item, so
            // delete it by simply not setting it. Unsynced items are kept,
            // as they have never made it to the authoritative copy, and so
            // are drafts (items not yet created), which are local only.
        } else {
            const val = currVal || nextVal
            if (val) {
                res[id] = forceSync ? { ...val, unsynced: true } : val
            }
        }
    })
    return res
}

const makeUnique = (topics: Record<string, Topic>) => {
    const res: Record<string, Topic> = {}   // <id, Topic>
    const chk: Record<string, string> = {}  // <[topic], id>
    Object
        .entries(topics)
        .forEach((value: [string, Topic]) => {
            const newId = value[0]
            const newTopic = value[1]
            const oldId = chk[newTopic.data]

            if (newTopic.data) {
                if (oldId) {
                    const oldTopic = res[oldId]
                    if (!oldTopic.updated
                        || (newTopic.updated
                            && oldTopic.updated < newTopic.updated)) {
                        delete res[oldId]
                        res[newId] = newTopic
                        chk[newTopic.data] = newId
                    }
                } else {
                    chk[newTopic.data] = newId
                    res[newId] = newTopic
                }
            } else {
                // Skip uniqueness checking altogether, as
                // this is an empty(that is, deleted) item.
                res[newId] = newTopic
            }
        })
    return res
}

export const empty = (state?: AppState): AppState => {
    const def: AppState = {
        settings: {
            storage: {
                registry: {
                    enabled: false,
                    events: {}
                }
            },
            retention: {
                periodDays: DEFAULT_RETENTION_DAYS,
            },
            display: {
                theme: DisplayTheme.Auto,
            },
        },
        contents: {
            tasks: {},
            topics: {},
            notes: {},
            works: {},
        },
    }

    if (!state) {
        return def
    }

    return {
        ...def,
        ...state,
        settings: {
            ...def.settings,
            ...state.settings,
            storage: {
                ...def.settings.storage,
                ...(state.settings ? state.settings.storage : {}),
            },
            retention: {
                ...def.settings.retention,
                ...(state.settings ? state.settings.retention : {}),
            },
            display: {
                ...def.settings.display,
                ...(state.settings ? state.settings.display : {}),
            },
        }
    }
}

export const mergeRetentionSettings = (state: AppState, value: RetentionSettings): AppState => {
    return ({
        ...state,
        settings: {
            ...state.settings,
            retention: {
                ...state.settings.retention,
                ...value,
            },
        }
    })
}

export const mergeDisplaySettings = (state: AppState, value: DisplaySettings): AppState => {
    return ({
        ...state,
        settings: {
            ...state.settings,
            display: {
                ...state.settings.display,
                ...value,
            },
        }
    })
}

export const mergeStorageSettings = (state: AppState, value: StorageSettings): AppState => {
    return ({
        ...state,
        settings: {
            ...state.settings,
            storage: {
                s3Bucket: state.settings.storage.s3Bucket,
                awsAccessKey: state.settings.storage.awsAccessKey,
                awsSecretKey: state.settings.storage.awsSecretKey,
                awsRegion: state.settings.storage.awsRegion,
                syncOnLoad: state.settings.storage.syncOnLoad,
                periodMinutes: state.settings.storage.periodMinutes,
                ...value,
            },
        }
    })
}

export const mergeTask = (state: AppState, id: string, item: Task): AppState => {
    return ({
        ...state,
        contents: {
            ...state.contents,
            tasks: {
                ...state.contents.tasks,
                [id]: item,
            },
        }
    })
}

export const mergeTasks = (state: AppState, items: Record<string, Task>): AppState => {
    return ({
        ...state,
        contents: {
            ...state.contents,
            tasks: {
                ...state.contents.tasks,
                ...items,
            },
        }
    })
}

export const mergeTopic = (state: AppState, id: string, item: Topic): AppState => {
    const topics = { ...state.contents.topics, [id]: item }
    return ({
        ...state,
        contents: {
            ...state.contents,
            topics: makeUnique(topics),
        }
    })
}

export const mergeNote = (state: AppState, id: string, item: Note): AppState => {
    return ({
        ...state,
        contents: {
            ...state.contents,
            notes: {
                ...state.contents.notes,
                [id]: item,
            },
        }
    })
}

export const mergeWork = (state: AppState, id: string, item: Work): AppState => {
    return ({
        ...state,
        contents: {
            ...state.contents,
            works: {
                ...state.contents.works,
                [id]: item,
            },
        }
    })
}

export const mergeData = (curr: AppState, data: AppState, forceDel?: boolean, forceSync?: boolean): AppState => ({
    settings: {
        storage: {
            // Storage settings hold the bucket and credentials and are
            // device-local: they are never taken from incoming data (imports,
            // cloud data and events), which may be untrusted.
            ...curr.settings.storage,
            registry: {
                enabled: curr.settings.storage.registry?.enabled || data.settings.storage.registry?.enabled || false,
                events: {
                    ...curr.settings.storage.registry?.events,
                    ...data.settings.storage.registry?.events
                },
                forceSync,
            },
        },
        retention: mergeByUpdated(curr.settings.retention, data.settings.retention),
        display: mergeByUpdated(curr.settings.display, data.settings.display),
    },
    contents: {
        tasks: mergeRecords(curr.contents.tasks, data.contents.tasks, forceDel, forceSync),
        topics: makeUnique(mergeRecords(curr.contents.topics, data.contents.topics, forceDel, forceSync)),
        notes: mergeRecords(curr.contents.notes, data.contents.notes, forceDel, forceSync),
        works: mergeRecords(curr.contents.works, data.contents.works, forceDel, forceSync),
    }
})

// Guard against invalid retention periods (e.g. NaN from an empty input box),
// which would otherwise cause every deleted item to be purged immediately.
export const validRetentionDays = (days: any): number =>
    typeof days === "number" && Number.isFinite(days) && days >= 0 ? days : DEFAULT_RETENTION_DAYS

export const purgeDeleted = (data: AppState): AppState => {
    const purge = <T extends Deletable>(arr1?: Record<string, T>) => {
        const res: Record<string, T> = {}
        Object
            .entries(arr1 ? arr1 : {})
            .forEach((val: [id: string, obj: T]) => {
                if (val[1].deleted) {
                    const retentionPeriodDays = validRetentionDays(data.settings.retention?.periodDays)
                    const deletedTime = new Date(val[1].deleted).getTime()
                    const cutoff = new Date().getTime() - (retentionPeriodDays * 24 * 60 * 60 * 1000)
                    if (deletedTime > cutoff) {
                        res[val[0]] = val[1]
                    }
                } else {
                    res[val[0]] = val[1]
                }
            })
        return res
    }

    const res = {
        ...data,
        contents: {
            ...data.contents,
            tasks: purge(data.contents.tasks),
            topics: purge(data.contents.topics),
            notes: purge(data.contents.notes),
            works: purge(data.contents.works),
        },
    }

    return res
}

export const toExport = (data: AppState) => ({
    ...data,
    contents: {
        tasks: stripSyncStatus(data.contents.tasks),
        topics: stripSyncStatus(data.contents.topics),
        notes: stripSyncStatus(data.contents.notes),
        works: stripSyncStatus(data.contents.works),
    },
    settings: {
        ...data.settings,
        storage: {},
    }
})

type ContentKey = keyof Contents

// Adds (or replaces) an item without modifying the state passed in.
export const putContentItem = (state: AppState, kind: ContentKey, id: string, item: any): AppState => ({
    ...state,
    contents: { ...state.contents, [kind]: { ...state.contents[kind], [id]: item } },
})

// Removes an item without modifying the state passed in.
export const removeContentItem = (state: AppState, kind: ContentKey, id: string): AppState => {
    const items: Record<string, any> = { ...state.contents[kind] }
    delete items[id]
    return { ...state, contents: { ...state.contents, [kind]: items } }
}
