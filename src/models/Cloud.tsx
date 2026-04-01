import { GetObjectCommand, PutObjectCommand, ListObjectsV2Command, S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { AppState, empty, mergeData, purgeDeleted, toExport } from "./AppState"
import { StorageSettings } from "./StorageSettings"
import { Identifiable, Writable } from "./Item"
import { RetentionSettings } from "./RetentionSettings"
import { DisplaySettings } from "./DisplaySettings"
import { Task } from "./Task"
import { Topic } from "./Topic"
import { Note } from "./Note"
import { Work } from "./Work"

export const DELIMITER = "/"
export const REMOTE_DATA_PATH = "data"
export const REMOTE_EVENTS_PATH = "events"
export const REMOTE_EVENTS_PREFIX = REMOTE_EVENTS_PATH + DELIMITER

export class Cloud {

    private notify: (note?: string) => void

    constructor(notify: (note?: string) => void) {
        this.notify = notify
    }

    async pullData(data: AppState, onSuccess: (updated: AppState) => void) {
        const getData = async (client: S3Client) => {
            try {
                const get = new GetObjectCommand({
                    Bucket: data.settings.storage.s3Bucket,
                    Key: REMOTE_DATA_PATH,
                    IfNoneMatch: data.settings.storage.eTag,
                })
                const res = await client.send(get)
                const { Body, ETag } = res
                const body = await new Response(Body as ReadableStream).text()
                const updated = mergeData(data, empty(JSON.parse(body)), true)
                updated.settings.storage.eTag = ETag
                const purged = purgeDeleted(updated)
                onSuccess(purged)
            } catch (e: any) {
                const httpStatusCode = e.$metadata?.httpStatusCode
                try {
                    this.checkHttpStatusCode(e, httpStatusCode)
                } catch (err: any) {
                    this.notify("Sync (get) failed: " + err.desc)
                    return
                }
                onSuccess(purgeDeleted(data))
            }
        }
        this.withS3Client(data.settings.storage,
            client => getData(client),
            () => this.notify("Sync not set up!"))
    }

    async pushData(data: AppState, onSuccess: (updated: AppState) => void) {
        const withMeta = (exported: AppState, lastSynced: string, eTag?: string) => (
            {
                ...exported,
                settings: {
                    ...exported.settings,
                    storage: {
                        ...data.settings.storage,
                        eTag: eTag ? eTag : data.settings.storage.eTag,
                        lastSynced,
                    }
                }
            }
        )
        const putData = async (client: S3Client) => {
            try {
                const readyToExport = toExport(data)
                const put = new PutObjectCommand({
                    Bucket: data.settings.storage.s3Bucket,
                    Key: REMOTE_DATA_PATH,
                    Body: JSON.stringify(readyToExport),
                    ContentType: "application/json",
                })
                const res = await client.send(put)
                const { ETag } = res
                onSuccess(withMeta(readyToExport, moment().toISOString(), ETag))
            } catch (e: any) {
                const httpStatusCode = e.$metadata?.httpStatusCode
                try {
                    this.checkHttpStatusCode(e, httpStatusCode)
                } catch (err: any) {
                    this.notify("Sync (put) failed: " + err.desc)
                    return
                }
                onSuccess(withMeta(toExport(data), moment().toISOString()))
            }
        }
        this.withS3Client(
            data.settings.storage,
            client => putData(client),
            () => this.notify("Sync not set up!"))
    }

    async listEvents(data: AppState, onSuccess: (keys: string[]) => void) {
        const getEventKeys = async (client: S3Client) => {
            try {
                const lst = new ListObjectsV2Command({
                    Bucket: data.settings.storage.s3Bucket,
                    Delimiter: DELIMITER,
                    Prefix: REMOTE_EVENTS_PREFIX,
                })
                const res = await client.send(lst)
                const keys: string[] = []
                const { Contents, IsTruncated } = res
                if (IsTruncated) {
                    this.notify("Hit max events (you may have to sync again)!")
                }
                Contents?.forEach(evt => evt.Key && keys.push(this.stripPrefixPath(evt.Key)))
                onSuccess(keys)
            } catch (e: any) {
                const httpStatusCode = e.$metadata?.httpStatusCode
                try {
                    this.checkHttpStatusCode(e, httpStatusCode)
                } catch (err: any) {
                    this.notify("Sync (get) failed: " + err.desc)
                }
            }
        }
        this.withS3Client(data.settings.storage,
            client => getEventKeys(client),
            () => this.notify("Sync not set up!"))
    }

    async pullEvents(data: AppState, keys: string[], onSuccess: (updated: AppState) => void) {
        this.withS3Client(data.settings.storage,
            async client => {
                let updated = data
                try {
                    for (const key of keys) {
                        const get = new GetObjectCommand({
                            Bucket: data.settings.storage.s3Bucket,
                            Key: REMOTE_EVENTS_PREFIX + key,
                        })
                        try {
                            const res = await client.send(get)
                            const { Body } = res
                            const body = await new Response(Body as ReadableStream).text()
                            const { path, ...obj } = JSON.parse(body)
                            switch (path) {
                                case "settings.retention": {
                                    updated = mergeData(updated, { ...updated, settings: { ...updated.settings, retention: obj as RetentionSettings } })
                                    break
                                }
                                case "settings.display": {
                                    updated = mergeData(updated, { ...updated, settings: { ...updated.settings, display: obj as DisplaySettings } })
                                    break
                                }
                                case "contents.tasks": {
                                    const { id, ...task } = obj as Identifiable & Task
                                    updated = mergeData(updated, { ...updated, contents: { ...updated.contents, tasks: { ...updated.contents.tasks, [id]: task } } })
                                    break
                                }
                                case "contents.topics": {
                                    const { id, ...topic } = obj as Identifiable & Topic
                                    updated = mergeData(updated, { ...updated, contents: { ...updated.contents, topics: { ...updated.contents.topics, [id]: topic } } })
                                    break
                                }
                                case "contents.notes": {
                                    const { id, ...note } = obj as Identifiable & Note
                                    updated = mergeData(updated, { ...updated, contents: { ...updated.contents, notes: { ...updated.contents.notes, [id]: note } } })
                                    break
                                }
                                case "contents.works": {
                                    const { id, ...work } = obj as Identifiable & Work
                                    updated = mergeData(updated, { ...updated, contents: { ...updated.contents, works: { ...updated.contents.works, [id]: work } } })
                                    break
                                }
                            }
                        } catch (e: any) {
                            const httpStatusCode = e.$metadata?.httpStatusCode
                            this.checkHttpStatusCode(e, httpStatusCode)
                        }
                    }
                } catch (e: any) {
                    this.notify("Sync (get) failed: " + (e.desc || "unexpected error"))
                }
                onSuccess(updated)
            },
            () => this.notify("Sync not set up!"))
    }

    async pushEvents(data: AppState, events: Writable[], onSuccess: (updated: AppState) => void) {
        this.withS3Client(
            data.settings.storage,
            async client => {
                try {
                    for (const event of events) {
                        const { evt, unsynced, ...obj } = event
                        const put = new PutObjectCommand({
                            Bucket: data.settings.storage.s3Bucket,
                            Key: REMOTE_EVENTS_PREFIX + evt,
                            Body: JSON.stringify(obj),
                            ContentType: "application/json",
                        })
                        await client.send(put)
                    }
                } catch (e: any) {
                    const httpStatusCode = e.$metadata?.httpStatusCode
                    try {
                        this.checkHttpStatusCode(e, httpStatusCode)
                    } catch (err: any) {
                        this.notify("Cloud publishing failed (sync manually later): " + err.desc)
                        return
                    }
                }
                onSuccess(data)
            },
            () => this.notify("Sync not set up!"))
    }

    async deleteEvents(data: AppState, keys: string[], onSuccess: (updated: AppState) => void) {
        this.withS3Client(
            data.settings.storage,
            async client => {
                for (const key of keys) {
                    const del = new DeleteObjectCommand({
                        Bucket: data.settings.storage.s3Bucket,
                        Key: REMOTE_EVENTS_PREFIX + key,
                    })
                    try {
                        await client.send(del)
                    } catch (e: any) {
                        const httpStatusCode = e.$metadata?.httpStatusCode
                        try {
                            this.checkHttpStatusCode(e, httpStatusCode)
                        } catch (err: any) {
                            // ignore best-effort deletion errors
                        }
                    }
                }
                onSuccess(data)
            },
            () => this.notify("Sync not set up!"))
    }

    private withS3Client(cfg: StorageSettings, action: (s3Client: S3Client) => void, otherwise?: () => void) {
        if (!cfg.s3Bucket
            || !cfg.awsAccessKey
            || !cfg.awsSecretKey
            || !cfg.awsRegion) {
            otherwise && otherwise()
            return
        }
        action(new S3Client({
            credentials: {
                accessKeyId: cfg.awsAccessKey || "",
                secretAccessKey: cfg.awsSecretKey || "",
            },
            region: cfg.awsRegion,
            maxAttempts: 1,
        }))
    }

    private checkHttpStatusCode(err: any, httpStatusCode?: number) {
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
            if (httpStatusCode < 500 && httpStatusCode >= 400 && httpStatusCode !== 404) {
                // we ignore 404 errors altogether
                if (httpStatusCode === 401) {
                    err.desc = "missing authentication credentials"
                    throw err
                }
                if (httpStatusCode === 403) {
                    err.desc = "invalid authentication credentials"
                    throw err
                }
                err.desc = "unexpected error (http status code = " + httpStatusCode + ")"
                throw err
            }
        } else {
            err.desc = "unexpected error"
            throw err
        }
    }

    private stripPrefixPath(val: string): string {
        return val.startsWith(REMOTE_EVENTS_PREFIX) ? val.slice(REMOTE_EVENTS_PREFIX.length) : val
    }
}
