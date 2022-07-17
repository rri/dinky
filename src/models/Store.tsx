import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { AppState, empty, mergeData, mergeNote, mergeStorageSettings, mergeTopic, mergeTask, mergeTodaySettings, mergeTasks, mergeWork } from "./AppState"
import { Note } from "./Note"
import { StorageSettings } from "./StorageSettings"
import { Topic } from "./Topic"
import { Task } from "./Task"
import { TodaySettings } from "./TodaySettings"
import { Work } from "./Work"
import { Writable } from "./Item"
import { v4 } from "uuid"

const putIntoLocalStorage = (key: string, val: string) => {
    localStorage.setItem(key, val)
}

const getFromLocalStorage = (key: string): string | null => {
    return localStorage.getItem(key)
}

const validateStorageSettings = (storageSettings: StorageSettings) => {
    if (!storageSettings.s3Bucket
        || !storageSettings.awsAccessKey
        || !storageSettings.awsSecretKey
        || !storageSettings.awsRegion) {
        return false
    }
    return true
}

const checkHttpStatusCode = (err: any, httpStatusCode?: number) => {
    if (httpStatusCode) {
        if (httpStatusCode < 200 || httpStatusCode >= 500) {
            err.desc = "unexpected server error"
            throw err
        }
        if (httpStatusCode < 400 && httpStatusCode >= 300) {
            if (httpStatusCode !== 304) {
                err.desc = "unexpected redirect"
                throw err
            }
        }
        if (httpStatusCode < 500 && httpStatusCode >= 400) {
            if (httpStatusCode === 401) {
                err.desc = "missing authentication credentials"
                throw err
            }
            if (httpStatusCode === 403) {
                err.desc = "invalid authentication credentials"
                throw err
            }
        }
    } else {
        err.desc = "unexpected error"
        throw err
    }
}

const flush = (storageSettings: StorageSettings) => flushAsync(storageSettings)
    .catch(() => {
        setTimeout(() => flush(storageSettings), 60000)
    })

const flushAsync = async (storageSettings: StorageSettings) => {
    if (!validateStorageSettings(storageSettings)) {
        return
    }

    const client = new S3Client({
        credentials: {
            accessKeyId: storageSettings.awsAccessKey || "",
            secretAccessKey: storageSettings.awsSecretKey || "",
        },
        region: storageSettings.awsRegion,
        maxAttempts: 1,
    })

    const res = getFromLocalStorage("redo")
    let cnt = 0

    if (res) {
        const redo: Writable[] = JSON.parse(res)
        redo
            .sort((a, b): 1 | -1 | 0 => {
                if (!a.updated && !b.updated) {
                    return 0
                }
                if (!a.updated) {
                    return -1
                }
                if (!b.updated) {
                    return 1
                }
                return a.updated > b.updated ? 1 : a.updated < b.updated ? -1 : 0
            })

        for (let i = 0; i < redo.length; i++) {
            try {
                const { evt, ...item } = redo[i]
                const put = new PutObjectCommand({
                    Bucket: storageSettings.s3Bucket,
                    Key: "redo/" + evt,
                    Body: JSON.stringify(item),
                    ContentType: "application/json",
                })

                await client
                    .send(put)
                    .catch(err => {
                        const { $metadata: { httpStatusCode } } = err
                        checkHttpStatusCode(err, httpStatusCode)
                    })

                cnt += 1
            } catch (e) {
                break
            }
        }

        for (let i = 0; i < cnt; i++) {
            redo.shift()
        }

        if (cnt > 0) {
            putIntoLocalStorage("redo", JSON.stringify(redo))
        }
    }
}

const logDeltaToLocalStorage = (storageSettings: StorageSettings, delta: Writable) => {
    if (!validateStorageSettings(storageSettings)) {
        return
    }

    const res = getFromLocalStorage("redo")
    const redo = [] as Writable[]

    if (res) {
        const data: Writable[] = JSON.parse(res)
        data.forEach(i => redo.push(i))
    }
    redo.push(delta)
    putIntoLocalStorage("redo", JSON.stringify(redo))
    flush(storageSettings)
}

export class LocalStore {

    private setData: (value: React.SetStateAction<AppState>) => void

    constructor(setData: (value: React.SetStateAction<AppState>) => void) {
        this.setData = setData
    }

    async sync(notify: (note?: string) => void, data: AppState) {

        if (!validateStorageSettings(data.settings.storage)) {
            notify("Sync not set up!")
            return
        }

        const client = new S3Client({
            credentials: {
                accessKeyId: data.settings.storage.awsAccessKey || "",
                secretAccessKey: data.settings.storage.awsSecretKey || "",
            },
            region: data.settings.storage.awsRegion,
            maxAttempts: 1,
        })

        const readMergeAndUploadData = async (notify: (note?: string) => void, Body: ReadableStream, ETag?: string) => {
            const body = await new Response(Body as ReadableStream).text()
            this.setData(prev => {
                const res = mergeData(prev, JSON.parse(body))
                res.settings.storage.eTag = ETag
                putIntoLocalStorage("data", JSON.stringify(res))
                uploadData(notify, res)
                return res
            })
        }

        const setMetadata = (lastSynced?: string, eTag?: string) => {
            this.setData(prev => {
                const updated = {
                    ...prev,
                    settings: {
                        ...prev.settings,
                        storage: {
                            ...prev.settings.storage,
                            eTag: eTag ? eTag : prev.settings.storage.eTag,
                            lastSynced,
                        }
                    }
                }
                putIntoLocalStorage("data", JSON.stringify(updated))
                return updated
            })
        }

        const get = new GetObjectCommand({
            Bucket: data.settings.storage.s3Bucket,
            Key: "data",
            IfNoneMatch: data.settings.storage.eTag,
        })

        const uploadData = (notify: (note?: string) => void, data: AppState) => {
            const toExport: AppState = {
                ...data,
                settings: {
                    ...data.settings,
                    storage: {},
                }
            } as const

            const put = new PutObjectCommand({
                Bucket: data.settings.storage.s3Bucket,
                Key: "data",
                Body: JSON.stringify(toExport),
                ContentType: "application/json",
            })

            client.send(put).then(res => {
                const { ETag } = res
                setMetadata(new Date().toISOString(), ETag)
            })
                .then(() => notify("Sync completed!"))
                .catch(err => {
                    const { $metadata: { httpStatusCode } } = err
                    checkHttpStatusCode(err, httpStatusCode)
                    setMetadata(new Date().toISOString())
                    notify("Sync completed!")
                })
        }

        await client.send(get).then(res => {
            const { Body, ETag } = res
            readMergeAndUploadData(notify, Body as ReadableStream, ETag)
        }).catch(err => {
            const { $metadata: { httpStatusCode } } = err
            checkHttpStatusCode(err, httpStatusCode)
            uploadData(notify, data)
        })
    }

    putTodaySettings(value: TodaySettings) {
        this.setData(prev => {
            const updated = mergeTodaySettings(prev, value)
            putIntoLocalStorage("data", JSON.stringify(updated))
            return updated
        })

    }

    putStorageSettings(value: StorageSettings) {
        this.setData(prev => {
            const updated = mergeStorageSettings(prev, value)
            putIntoLocalStorage("data", JSON.stringify(updated))
            return updated
        })
    }

    putTask(storageSettings: StorageSettings, id: string, item: Task) {
        logDeltaToLocalStorage(storageSettings, { ...item, id, evt: v4(), type: "task" })
        this.setData(prev => {
            const updated = mergeTask(prev, id, item)
            putIntoLocalStorage("data", JSON.stringify(updated))
            return updated
        })
    }

    putTopic(storageSettings: StorageSettings, id: string, item: Topic) {
        logDeltaToLocalStorage(storageSettings, { ...item, id, evt: v4(), type: "topic" })
        this.setData(prev => {
            const updated = mergeTopic(prev, id, item)
            putIntoLocalStorage("data", JSON.stringify(updated))
            return updated
        })
    }

    putNote(storageSettings: StorageSettings, id: string, item: Note) {
        logDeltaToLocalStorage(storageSettings, { ...item, id, evt: v4(), type: "note" })
        this.setData(prev => {
            const updated = mergeNote(prev, id, item)
            putIntoLocalStorage("data", JSON.stringify(updated))
            return updated
        })
    }

    putWork(storageSettings: StorageSettings, id: string, item: Work) {
        logDeltaToLocalStorage(storageSettings, { ...item, id, evt: v4(), type: "work" })
        this.setData(prev => {
            const updated = mergeWork(prev, id, item)
            putIntoLocalStorage("data", JSON.stringify(updated))
            return updated
        })
    }

    delTasks(idList: string[]) {
        this.setData(prev => {
            const prevTasks = prev.contents.tasks ? prev.contents.tasks : {}
            const items: Record<string, Task> = {}
            idList.forEach(id => {
                items[id] = {
                    ...prevTasks[id],
                    updated: new Date().toISOString(),
                    deleted: new Date().toISOString(),
                }
            })
            const updated = mergeTasks(prev, items)
            putIntoLocalStorage("data", JSON.stringify(updated))
            return updated
        })
    }

    pull() {
        const res = getFromLocalStorage("data")
        if (res) {
            const data: AppState = JSON.parse(res)
            this.setData(prev => mergeData(prev, data))
        } else {
            this.setData(empty())
        }
    }

    push(data: AppState) {
        this.setData(prev => {
            const updated = mergeData(prev, data)
            putIntoLocalStorage("data", JSON.stringify(updated))
            return updated
        })
    }

}
