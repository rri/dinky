import { Contents } from "./Contents"
import { Note } from "./Note"
import { Settings } from "./Settings"
import { StorageSettings } from "./StorageSettings"
import { Topic } from "./Topic"
import { Task } from "./Task"
import { TodaySettings } from "./TodaySettings"
import { Item } from "./Item"

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
        })
    return res
}

export const empty = (): AppState => ({
    settings: {
        storage: {},
        today: {
            eveningBufferHours: 7,
            morningBufferHours: 2,
        },
    },
    contents: {
        tasks: {},
        topics: {},
        notes: {},
    },
})

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

export const mergeStorageSettings = (state: AppState, value: StorageSettings): AppState => {
    return ({
        ...state,
        settings: {
            ...state.settings,
            storage: {
                ...state.settings.storage,
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

export const mergeData = (curr: AppState, data: AppState): AppState => {

    const mergeRecordsByUpdated = <T extends Item>(arr1: Record<string, T>, arr2: Record<string, T>) => {
        const res: Record<string, T> = {}
        Object
            .entries(arr1)
            .forEach((val: [id: string, obj: T]) => {
                res[val[0]] = val[1]
            })
        Object
            .entries(arr2)
            .forEach((val: [id: string, obj: T]) => {
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
        },
        contents: {
            ...curr.contents,
            tasks: mergeRecordsByUpdated(curr.contents.tasks, data.contents.tasks),
            topics: makeUnique(mergeRecordsByUpdated(curr.contents.topics, data.contents.topics)),
            notes: mergeRecordsByUpdated(curr.contents.notes, data.contents.notes),
        }
    }
}
