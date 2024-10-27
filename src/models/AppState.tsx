import { Contents } from "./Contents"
import { Note } from "./Note"
import { DisplaySettings, DisplayTheme } from "./DisplaySettings"
import { RetentionSettings } from "./RetentionSettings"
import { Settings } from "./Settings"
import { StorageSettings } from "./StorageSettings"
import { Topic } from "./Topic"
import { Task } from "./Task"
import { Work } from "./Work"
import { Deletable, Syncable, Updatable } from "./Item"
import moment from "moment"

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

const mergeRecords = <T extends Syncable>(currRec?: Record<string, T>, nextRec?: Record<string, T>, forceDel?: boolean, forceSync?: boolean) => {
    const res: Record<string, T> = {}
    Object
        .entries(nextRec ? nextRec : {})
        .forEach((val: [id: string, obj: any]) => {
            const currVal = currRec ? currRec[val[0]] : undefined
            const nextVal = val[1]

            if (currVal && nextVal) {
                res[val[0]] = mergeByUpdated(currVal, nextVal)
                const unsynced = forceSync || (currVal.unsynced && nextVal.unsynced)
                if (unsynced) {
                    res[val[0]].unsynced = unsynced
                }
            } else if (forceDel && !nextVal && (!currVal || !currVal.unsynced)) {
                // Delete the value by simply not setting it.
            } else {
                res[val[0]] = currVal ? currVal : nextVal
                if (forceSync) {
                    res[val[0]].unsynced = true
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
    const def = {
        settings: {
            storage: {},
            retention: {
                periodDays: 30,
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
    return { ...def, ...state }
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
            ...curr.settings.storage,
            ...data.settings.storage,
            registry: {
                enabled: curr.settings.storage.registry?.enabled || data.settings.storage.registry?.enabled || false,
                events: {
                    ...curr.settings.storage.registry?.events,
                    ...data.settings.storage.registry?.events
                }
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

export const purgeDeleted = (data: AppState): AppState => {
    const purge = <T extends Deletable>(arr1?: Record<string, T>) => {
        const res: Record<string, T> = {}
        Object
            .entries(arr1 ? arr1 : {})
            .forEach((val: [id: string, obj: T]) => {
                if (val[1].deleted) {
                    const retentionPeriodDays = data.settings.retention.periodDays
                    if (moment().subtract(retentionPeriodDays, "days").isBefore(moment(val[1].deleted))) {
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
