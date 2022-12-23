import { GetObjectCommand, PutObjectCommand, ListObjectsV2Command, S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { AppState, empty, mergeData, purgeDeleted, toExport } from "./AppState"
import { StorageSettings } from "./StorageSettings"
import { Id, Writable } from "./Item"
import { DATA_PATH } from "./Store"
import { EVENTS_PATH } from "./Store"
import { TodaySettings } from "./TodaySettings"
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

    async pullData(data: AppState, onSuccess: (mergedData: AppState) => void) {
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

    async pushData(data: AppState, onSuccess: (data: AppState) => void) {
        const setMeta = (exported: AppState, lastSynced: string, eTag?: string) => (
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
                    return setMeta(readyToExport, new Date().toISOString(), ETag)
                })
                .catch(e => {
                    const { $metadata: { httpStatusCode } } = e
                    this.checkHttpStatusCode(e, httpStatusCode)
                    return setMeta(readyToExport, new Date().toISOString())
                })
                .then(onSuccess)
                .then(() => this.notify("Sync completed!"))
        }
        this.withS3Client(
            data.settings.storage,
            client => putData(client).catch((e: any) => this.notify("Sync (put) failed: " + e.desc)),
            () => this.notify("Sync not set up!"))
    }

    async listKeys(data: AppState, onSuccess: (keys: string[]) => void) {
        const getKeys = async (client: S3Client) => {
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
                    Contents?.forEach(item => item.Key && keys.push(item.Key))
                    onSuccess(keys)
                })
                .catch(e => {
                    const { $metadata: { httpStatusCode } } = e
                    this.checkHttpStatusCode(e, httpStatusCode)
                })
        }
        this.withS3Client(data.settings.storage,
            client => getKeys(client).catch((e: any) => this.notify("Sync (get) failed: " + e.desc)),
            () => this.notify("Sync not set up!"))
    }

    async pullItems(data: AppState, keys: string[], onSuccess: (updated: AppState) => void) {
        const arr = [...keys]
        if (arr.length === 0) {
            onSuccess(data)
        } else {
            const key = arr.pop()
            const getItem = async (client: S3Client) => {
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
                            case "settings.today": {
                                return mergeData(data, { ...data, settings: { ...data.settings, today: obj as TodaySettings } })
                            }
                            case "settings.retention": {
                                return mergeData(data, { ...data, settings: { ...data.settings, retention: obj as RetentionSettings } })
                            }
                            case "settings.display": {
                                return mergeData(data, { ...data, settings: { ...data.settings, display: obj as DisplaySettings } })
                            }
                            case "contents.tasks": {
                                const { id, ...task } = obj as Id & Task
                                return mergeData(data, { ...data, contents: { ...data.contents, tasks: { ...data.contents.tasks, [id]: task } } })
                            }
                            case "contents.topics": {
                                const { id, ...topic } = obj as Id & Topic
                                return mergeData(data, { ...data, contents: { ...data.contents, topics: { ...data.contents.topics, [id]: topic } } })
                            }
                            case "contents.notes": {
                                const { id, ...note } = obj as Id & Note
                                return mergeData(data, { ...data, contents: { ...data.contents, notes: { ...data.contents.notes, [id]: note } } })
                            }
                            case "contents.works": {
                                const { id, ...work } = obj as Id & Work
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
                    .then(updated => this.pullItems(updated, arr, onSuccess))
            }
            this.withS3Client(data.settings.storage,
                client => getItem(client).catch((e: any) => this.notify("Sync (get) failed: " + e.desc)),
                () => this.notify("Sync not set up!"))
        }
    }

    async pushItem<T extends Writable>(data: AppState, item: T) {
        const putItem = async (client: S3Client) => {
            const { evt, unsynced, ...obj } = item
            const put = new PutObjectCommand({
                Bucket: data.settings.storage.s3Bucket,
                Key: EVENTS_PATH + "/" + evt,
                Body: JSON.stringify(obj),
                ContentType: "application/json",
            })
            await client
                .send(put)
                .catch(e => {
                    const { $metadata: { httpStatusCode } } = e
                    this.checkHttpStatusCode(e, httpStatusCode)
                })
        }
        this.withS3Client(
            data.settings.storage,
            client => putItem(client).catch((e: any) => this.notify("Cloud publishing failed (sync manually later): " + e.desc)))
    }

    async delItems(data: AppState, keys: string[]) {
        keys.forEach(key => {
            const delObj = async (client: S3Client) => {
                const del = new DeleteObjectCommand({
                    Bucket: data.settings.storage.s3Bucket,
                    Key: key,
                })
                // delete is best-effort (no action is taken if it fails).
                await client
                    .send(del)
                    .catch(e => {
                        const { $metadata: { httpStatusCode } } = e
                        this.checkHttpStatusCode(e, httpStatusCode)
                    })
            }
            this.withS3Client(
                data.settings.storage,
                client => delObj(client).catch((e: any) => { /* Ignore */ }))
        })
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
