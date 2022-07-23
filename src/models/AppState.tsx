import { Contents } from "./Contents"
import { Note } from "./Note"
import { RetentionSettings } from "./RetentionSettings"
import { Settings } from "./Settings"
import { StorageSettings } from "./StorageSettings"
import { Topic } from "./Topic"
import { Task } from "./Task"
import { TodaySettings } from "./TodaySettings"
import { Work } from "./Work"
import { Deletable } from "./Item"
import moment from "moment"

export interface AppState {
    error?: string,
    settings: Settings,
    contents: Contents,
}

const mergeByUpdated = <T extends { updated?: string }>(oldVal: T, newVal: T) => {
    if (!newVal) {
        return oldVal
    }

    if (!oldVal) {
        return newVal
    }

    if (!oldVal.updated
        || (newVal.updated
            && oldVal.updated < newVal.updated)) {
        return newVal
    }

    return oldVal
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
            today: {
                eveningBufferHours: 7,
                morningBufferHours: 2,
            },
            retention: {
                periodDays: 30,
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

export const mergeTodaySettings = (state: AppState, value: TodaySettings): AppState => {
    return ({
        ...state,
        settings: {
            ...state.settings,
            today: {
                ...state.settings.today,
                ...value,
            },
        }
    })
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

export const mergeData = (curr: AppState, data: AppState): AppState => {

    const mergeRecordsByUpdated = (arr1?: Record<string, any>, arr2?: Record<string, any>) => {
        const res: Record<string, any> = {}
        Object
            .entries(arr1 ? arr1 : {})
            .forEach((val: [id: string, obj: any]) => {
                res[val[0]] = val[1]
            })
        Object
            .entries(arr2 ? arr2 : {})
            .forEach((val: [id: string, obj: any]) => {
                res[val[0]] = mergeByUpdated(res[val[0]], val[1])
            })
        return res
    }

    return {
        settings: {
            ...curr.settings,
            storage: {
                ...curr.settings.storage,
                ...data.settings.storage,
            },
            today: mergeByUpdated(curr.settings.today, data.settings.today),
            retention: mergeByUpdated(curr.settings.retention, data.settings.retention),
        },
        contents: {
            ...curr.contents,
            tasks: mergeRecordsByUpdated(curr.contents.tasks, data.contents.tasks),
            topics: makeUnique(mergeRecordsByUpdated(curr.contents.topics, data.contents.topics)),
            notes: mergeRecordsByUpdated(curr.contents.notes, data.contents.notes),
            works: mergeRecordsByUpdated(curr.contents.works, data.contents.works),
        }
    }
}

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