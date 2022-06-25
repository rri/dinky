import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { AppState, empty, mergeData, mergeNote, mergeStorageSettings, mergeTopic, mergeTask, mergeTodaySettings, mergeTasks, mergeWork } from "./AppState"
import { Note } from "./Note"
import { StorageSettings } from "./StorageSettings"
import { Topic } from "./Topic"
import { Task } from "./Task"
import { TodaySettings } from "./TodaySettings"
import { Work } from "./Work"

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

    async sync(data: AppState): Promise<boolean> {

        if (!data.settings.storage.s3Bucket
            || !data.settings.storage.awsAccessKey
            || !data.settings.storage.awsSecretKey
            || !data.settings.storage.awsRegion) {
            return false
        }

        const client = new S3Client({
            credentials: {
                accessKeyId: data.settings.storage.awsAccessKey || "",
                secretAccessKey: data.settings.storage.awsSecretKey || "",
            },
            region: data.settings.storage.awsRegion,
            maxAttempts: 1,
        })

        const readMergeAndUploadData = async (Body: ReadableStream, ETag?: string) => {
            const body = await new Response(Body as ReadableStream).text()
            this.setData(prev => {
                const res = mergeData(prev, JSON.parse(body))
                res.settings.storage.eTag = ETag
                updateLocalStorage("data", JSON.stringify(res))
                uploadData(res)
                return res
            })
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
                updateLocalStorage("data", JSON.stringify(updated))
                return updated
            })
        }

        const get = new GetObjectCommand({
            Bucket: data.settings.storage.s3Bucket,
            Key: "data",
            IfNoneMatch: data.settings.storage.eTag,
        })

        const uploadData = (data: AppState) => {
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
            }).catch(err => {
                const { $metadata: { httpStatusCode } } = err
                checkHttpStatusCode(err, httpStatusCode)
                setMetadata(new Date().toISOString())
            })
        }

        await client.send(get).then(res => {
            const { Body, ETag } = res
            readMergeAndUploadData(Body as ReadableStream, ETag)
        }).catch(err => {
            const { $metadata: { httpStatusCode } } = err
            checkHttpStatusCode(err, httpStatusCode)
            uploadData(data)
        })

        return true
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

    putTopic(id: string, item: Topic) {
        this.setData(prev => {
            const updated = mergeTopic(prev, id, item)
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

    putWork(id: string, item: Work) {
        this.setData(prev => {
            const updated = mergeWork(prev, id, item)
            updateLocalStorage("data", JSON.stringify(updated))
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

    push(data: AppState) {
        this.setData(prev => {
            const updated = mergeData(prev, data)
            updateLocalStorage("data", JSON.stringify(updated))
            return updated
        })
    }
}
