import { AppState, empty, mergeData, mergeNote, mergeStorageSettings, mergeTag, mergeTask, mergeTodaySettings } from "./AppState"
import { Note } from "./Note"
import { StorageSettings } from "./StorageSettings"
import { Tag } from "./Tag"
import { Task } from "./Task"
import { TodaySettings } from "./TodaySettings"

const updateLocalStorage = (key: string, val: string) => {
    localStorage.setItem(key, val)
}

const reloadLocalStorage = (key: string): string | null => {
    return localStorage.getItem(key)
}

export class LocalStore {

    private setData: (value: React.SetStateAction<AppState>) => void

    constructor(setData: (value: React.SetStateAction<AppState>) => void) {
        this.setData = setData
    }

    sync() {
        // T1: Retrieve etag from local store
        // T2: Fetch data from S3 conditional on etag
        // T3: If new data has been retrieved, merge it into local store
        // T5: Write local store to S3
        // T6: Save returned etag in local store
    }

    putTodaySettings(value: TodaySettings) {
        this.setData(prev => {
            const updated = mergeTodaySettings(prev, value)
            updateLocalStorage("data", JSON.stringify(updated))
            return updated
        })

    }

    putStorageSettings(value: StorageSettings) {
        this.setData(prev => {
            const updated = mergeStorageSettings(prev, value)
            updateLocalStorage("data", JSON.stringify(updated))
            return updated
        })
    }

    putTask(id: string, item: Task) {
        this.setData(prev => {
            const updated = mergeTask(prev, id, item)
            updateLocalStorage("data", JSON.stringify(updated))
            return updated
        })
    }

    putTag(id: string, item: Tag) {
        this.setData(prev => {
            const updated = mergeTag(prev, id, item)
            updateLocalStorage("data", JSON.stringify(updated))
            return updated
        })
    }

    putNote(id: string, item: Note) {
        this.setData(prev => {
            const updated = mergeNote(prev, id, item)
            updateLocalStorage("data", JSON.stringify(updated))
            return updated
        })
    }

    pull() {
        const res = reloadLocalStorage("data")
        if (res) {
            const data: AppState = JSON.parse(res)
            this.setData(prev => mergeData(prev, data))
        } else {
            this.setData(empty())
        }
    }
}
