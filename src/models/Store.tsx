import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { AppState, empty, mergeData, mergeNote, mergeStorageSettings, mergeTopic, mergeTask, mergeTodaySettings } from "./AppState"
import { Note } from "./Note"
import { StorageSettings } from "./StorageSettings"
import { Topic } from "./Topic"
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

        const readAndMergeData = async (Body: ReadableStream, ETag?: string) => {
            const body = await new Response(Body as ReadableStream).text()
            this.setData(prev => {
                const res = mergeData(prev, JSON.parse(body))
                res.settings.storage.eTag = ETag
                updateLocalStorage("data", JSON.stringify(res))
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
            }
        }

        const get = new GetObjectCommand({
            Bucket: data.settings.storage.s3Bucket,
            Key: "data",
            IfNoneMatch: data.settings.storage.eTag,
        })

        await client.send(get).then(res => {
            const { Body, ETag } = res
            readAndMergeData(Body as ReadableStream, ETag)
        }).catch(err => {
            const { $metadata: { httpStatusCode } } = err
            checkHttpStatusCode(err, httpStatusCode)
        })

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

        await client.send(put).then(res => {
            const { ETag } = res
            this.setData(prev => {
                const updated = {
                    ...prev,
                    settings: {
                        ...prev.settings,
                        storage: {
                            ...prev.settings.storage,
                            eTag: ETag,
                        }
                    }
                }
                updateLocalStorage("data", JSON.stringify(updated))
                return updated
            })
        }).catch(err => {
            const { $metadata: { httpStatusCode } } = err
            checkHttpStatusCode(err, httpStatusCode)
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
