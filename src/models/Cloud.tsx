import { GetObjectCommand, PutObjectCommand, ListObjectsV2Command, S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { AppState, empty, mergeData, purgeDeleted, toExport } from "./AppState"
import { StorageSettings } from "./StorageSettings"
import { Identifiable, Writable } from "./Item"
import { DATA_PATH } from "./Store"
import { EVENTS_PATH } from "./Store"
import { RetentionSettings } from "./RetentionSettings"
import { DisplaySettings } from "./DisplaySettings"
import { Task } from "./Task"
import { Topic } from "./Topic"
import { Note } from "./Note"
import { Work } from "./Work"

export class Cloud {

    private notify: (note?: string) => void

    constructor(notify: (note?: string) => void) {
        this.notify = notify
    }

    async pullData(data: AppState, onSuccess: (updated: AppState) => void) {
        const getData = async (client: S3Client) => {
            const get = new GetObjectCommand({
                Bucket: data.settings.storage.s3Bucket,
                Key: DATA_PATH,
                IfNoneMatch: data.settings.storage.eTag,
            })
            await client
                .send(get)
                .then(async res => {
                    const { Body, ETag } = res
                    const body = await new Response(Body as ReadableStream).text()
                    const updated = mergeData(data, empty(JSON.parse(body)), true)
                    updated.settings.storage.eTag = ETag
                    return updated
                })
                .catch(e => {
                    const { $metadata: { httpStatusCode } } = e
                    this.checkHttpStatusCode(e, httpStatusCode)
                    return data
                })
                .then(purgeDeleted)
                .then(onSuccess)
        }
        this.withS3Client(data.settings.storage,
            client => getData(client).catch((e: any) => this.notify("Sync (get) failed: " + e.desc)),
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
            const readyToExport = toExport(data)
            const put = new PutObjectCommand({
                Bucket: data.settings.storage.s3Bucket,
                Key: DATA_PATH,
                Body: JSON.stringify(readyToExport),
                ContentType: "application/json",
            })
            await client
                .send(put)
                .then(async res => {
                    const { ETag } = res
                    return withMeta(readyToExport, new Date().toISOString(), ETag)
                })
                .catch(e => {
                    const { $metadata: { httpStatusCode } } = e
                    this.checkHttpStatusCode(e, httpStatusCode)
                    return withMeta(readyToExport, new Date().toISOString())
                })
                .then(onSuccess)
                .then(() => this.notify("Sync completed!"))
        }
        this.withS3Client(
            data.settings.storage,
            client => putData(client).catch((e: any) => this.notify("Sync (put) failed: " + e.desc)),
            () => this.notify("Sync not set up!"))
    }

    async listEvents(data: AppState, onSuccess: (keys: string[]) => void) {
        const getEventKeys = async (client: S3Client) => {
            const lst = new ListObjectsV2Command({
                Bucket: data.settings.storage.s3Bucket,
                Delimiter: "/",
                Prefix: EVENTS_PATH + "/",
            })
            await client
                .send(lst)
                .then(res => {
                    const keys: string[] = []
                    const { Contents, IsTruncated } = res
                    if (IsTruncated) {
                        this.notify("Hit max events (you may have to sync again)!")
                    }
                    Contents?.forEach(evt => evt.Key && keys.push(evt.Key))
                    onSuccess(keys)
                })
                .catch(e => {
                    const { $metadata: { httpStatusCode } } = e
                    this.checkHttpStatusCode(e, httpStatusCode)
                })
        }
        this.withS3Client(data.settings.storage,
            client => getEventKeys(client).catch((e: any) => this.notify("Sync (get) failed: " + e.desc)),
            () => this.notify("Sync not set up!"))
    }

    async pullEvents(data: AppState, keys: string[], onSuccess: (updated: AppState) => void) {
        const arr = [...keys]
        const key = arr.pop()
        if (key === undefined) {
            // nothing more to pop from the stack, so we're done
            onSuccess(data)
        } else {
            const getEvent = async (client: S3Client) => {
                const get = new GetObjectCommand({
                    Bucket: data.settings.storage.s3Bucket,
                    Key: key,
                })
                await client
                    .send(get)
                    .then(async res => {
                        const { Body } = res
                        const body = await new Response(Body as ReadableStream).text()
                        const { path, ...obj } = JSON.parse(body)
                        switch (path) {
                            case "settings.retention": {
                                return mergeData(data, { ...data, settings: { ...data.settings, retention: obj as RetentionSettings } })
                            }
                            case "settings.display": {
                                return mergeData(data, { ...data, settings: { ...data.settings, display: obj as DisplaySettings } })
                            }
                            case "contents.tasks": {
                                const { id, ...task } = obj as Identifiable & Task
                                return mergeData(data, { ...data, contents: { ...data.contents, tasks: { ...data.contents.tasks, [id]: task } } })
                            }
                            case "contents.topics": {
                                const { id, ...topic } = obj as Identifiable & Topic
                                return mergeData(data, { ...data, contents: { ...data.contents, topics: { ...data.contents.topics, [id]: topic } } })
                            }
                            case "contents.notes": {
                                const { id, ...note } = obj as Identifiable & Note
                                return mergeData(data, { ...data, contents: { ...data.contents, notes: { ...data.contents.notes, [id]: note } } })
                            }
                            case "contents.works": {
                                const { id, ...work } = obj as Identifiable & Work
                                return mergeData(data, { ...data, contents: { ...data.contents, works: { ...data.contents.works, [id]: work } } })
                            }
                            default:
                                return data
                        }
                    })
                    .catch(e => {
                        const { $metadata: { httpStatusCode } } = e
                        this.checkHttpStatusCode(e, httpStatusCode)
                        return data
                    })
                    .then(updated => this.pullEvents(updated, arr, onSuccess))
            }
            this.withS3Client(data.settings.storage,
                client => getEvent(client).catch((e: any) => this.notify("Sync (get) failed: " + e.desc)),
                () => this.notify("Sync not set up!"))
        }
    }

    async pushEvents(data: AppState, events: Writable[], onSuccess: (updated: AppState) => void) {
        const arr = [...events]
        const event = arr.pop()
        if (event === undefined) {
            // nothing more to pop from the stack, so we're done
            onSuccess(data)
        } else {
            const putEvent = async (client: S3Client) => {
                const { key, unsynced, ...obj } = event
                const put = new PutObjectCommand({
                    Bucket: data.settings.storage.s3Bucket,
                    Key: EVENTS_PATH + "/" + key,
                    Body: JSON.stringify(obj),
                    ContentType: "application/json",
                })
                await client
                    .send(put)
                    .catch(e => {
                        const { $metadata: { httpStatusCode } } = e
                        this.checkHttpStatusCode(e, httpStatusCode)
                    })
                    .then(() => this.pushEvents(data, arr, onSuccess))
            }
            this.withS3Client(
                data.settings.storage,
                client => putEvent(client).catch((e: any) => this.notify("Cloud publishing failed (sync manually later): " + e.desc)))
        }
    }

    async deleteEvents(data: AppState, keys: string[], onSuccess: (updated: AppState) => void) {
        const arr = [...keys]
        const key = arr.pop()
        if (key === undefined) {
            // nothing more to pop from the stack, so we're done
            onSuccess(data)
        } else {
            const deleteEvent = async (client: S3Client) => {
                const del = new DeleteObjectCommand({
                    Bucket: data.settings.storage.s3Bucket,
                    Key: key,
                })
                // delete is best-effort (no action is taken if it fails),
                // with subsequent synchronization attempts expected to
                // take care of garbage collection
                await client
                    .send(del)
                    .catch(e => {
                        const { $metadata: { httpStatusCode } } = e
                        this.checkHttpStatusCode(e, httpStatusCode)
                    })
                    .then(() => this.deleteEvents(data, arr, onSuccess))
            }
            this.withS3Client(
                data.settings.storage,
                client => deleteEvent(client).catch((e: any) => { /* Ignore */ }))
        }
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
}
