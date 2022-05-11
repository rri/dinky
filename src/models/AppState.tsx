import { Contents } from "./Contents"
import { Note } from "./Note"
import { Settings } from "./Settings"
import { StorageSettings } from "./StorageSettings"
import { Topic } from "./Topic"
import { Task } from "./Task"
import { TodaySettings } from "./TodaySettings"

export interface AppState {
    error?: string,
    settings: Settings,
    contents: Contents,
}

export const empty = (): AppState => ({
    settings: {
        storage: {
            type: "Local",
        },
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

    const makeUnique = (topics: Record<string, Topic>) => {
        const res: Record<string, Topic> = {}
        const chk: string[] = []
        Object
            .entries(topics)
            .forEach((value: [string, Topic]) => {
                if (chk.indexOf(value[1].data) < 0) {
                    chk.push(value[1].data)
                    res[value[0]] = value[1]
                }
            })
        return res
    }

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
    return {
        settings: {
            ...curr.settings,
            storage: {
                ...curr.settings.storage,
                ...data.settings.storage,
            },
            today: {
                ...curr.settings.today,
                ...data.settings.today,
            },
        },
        contents: {
            ...curr.contents,
            tasks: {
                ...curr.contents.tasks,
                ...data.contents.tasks,
            },
            topics: {
                ...curr.contents.topics,
                ...data.contents.topics,
            },
            notes: {
                ...curr.contents.notes,
                ...data.contents.notes,
            },
        }
    }
}
