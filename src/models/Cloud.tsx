import { GetObjectCommand, PutObjectCommand, ListObjectsV2Command, S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { AppState, mergeData, purgeDeleted, toExport } from "./AppState"
import { ContentKind, isSafeId, sanitizeContentItem, sanitizeDisplay, sanitizeRetention, sanitizeState } from "./Sanitize"
import { StorageSettings } from "./StorageSettings"
import { Writable } from "./Item"

export const DELIMITER = "/"
export const REMOTE_DATA_PATH = "data"
export const REMOTE_EVENTS_PATH = "events"
export const REMOTE_EVENTS_PREFIX = REMOTE_EVENTS_PATH + DELIMITER

// Applies a (sanitized) item event to the given state, ignoring invalid events.
const applyItemEvent = (state: AppState, kind: ContentKind, obj: any): AppState => {
    const { id, ...rest } = obj
    const item = sanitizeContentItem(kind, rest)
    if (!isSafeId(id) || !item) {
        return state
    }
    return mergeData(state, { ...state, contents: { ...state.contents, [kind]: { ...state.contents[kind], [id]: item } } })
}

// Called when a cloud operation fails. The failure has already been reported
// to the user (via notify) by the time this is called.
export type OnFailure = (err: any) => void

export class Cloud {

    private notify: (note?: string) => void

    constructor(notify: (note?: string) => void) {
        this.notify = notify
    }

    async pullData(data: AppState, onSuccess: (updated: AppState) => void, onFailure?: OnFailure) {
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
                const updated = mergeData(data, sanitizeState(JSON.parse(body)), true)
                updated.settings.storage.eTag = ETag
                const purged = purgeDeleted(updated)
                onSuccess(purged)
            } catch (e: any) {
                const httpStatusCode = e.$metadata?.httpStatusCode
                try {
                    this.checkHttpStatusCode(e, httpStatusCode)
                } catch (err: any) {
                    this.notify("Sync (get) failed: " + err.desc)
                    onFailure && onFailure(err)
                    return
                }
                onSuccess(purgeDeleted(data))
            }
        }
        this.withS3Client(data.settings.storage,
            client => getData(client),
            () => this.notifyNotSetUp(onFailure))
    }

    async pushData(data: AppState, onSuccess: (updated: AppState) => void, onFailure?: OnFailure) {
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
                onSuccess(withMeta(readyToExport, new Date().toISOString(), ETag))
            } catch (e: any) {
                const httpStatusCode = e.$metadata?.httpStatusCode
                try {
                    this.checkHttpStatusCode(e, httpStatusCode)
                } catch (err: any) {
                    this.notify("Sync (put) failed: " + err.desc)
                    onFailure && onFailure(err)
                    return
                }
                onSuccess(withMeta(toExport(data), new Date().toISOString()))
            }
        }
        this.withS3Client(
            data.settings.storage,
            client => putData(client),
            () => this.notifyNotSetUp(onFailure))
    }

    async listEvents(data: AppState, onSuccess: (keys: string[]) => void, onFailure?: OnFailure) {
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
                    onFailure && onFailure(err)
                    return
                }
                // ignorable status (e.g. 404): there are no events to process
                onSuccess([])
            }
        }
        this.withS3Client(data.settings.storage,
            client => getEventKeys(client),
            () => this.notifyNotSetUp(onFailure))
    }

    async pullEvents(data: AppState, keys: string[], onSuccess: (updated: AppState, processed: string[]) => void, onFailure?: OnFailure) {
        this.withS3Client(data.settings.storage,
            async client => {
                let updated = data
                // Keys of events that have been fully processed (applied, or
                // skipped because they are missing or malformed). Events after
                // a failure are not included, so that they are retried later.
                const processed: string[] = []
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
                            let parsed: any
                            try {
                                parsed = JSON.parse(body)
                            } catch (e) {
                                // malformed event, it will never become valid: skip it
                                processed.push(key)
                                continue
                            }
                            const { path, ...obj } = (typeof parsed === "object" && parsed !== null) ? parsed : {} as any
                            switch (path) {
                                case "settings.retention": {
                                    const retention = sanitizeRetention(obj)
                                    if (retention) {
                                        updated = mergeData(updated, { ...updated, settings: { ...updated.settings, retention } })
                                    }
                                    break
                                }
                                case "settings.display": {
                                    const display = sanitizeDisplay(obj)
                                    if (display) {
                                        updated = mergeData(updated, { ...updated, settings: { ...updated.settings, display } })
                                    }
                                    break
                                }
                                case "contents.tasks": updated = applyItemEvent(updated, "tasks", obj); break
                                case "contents.topics": updated = applyItemEvent(updated, "topics", obj); break
                                case "contents.notes": updated = applyItemEvent(updated, "notes", obj); break
                                case "contents.works": updated = applyItemEvent(updated, "works", obj); break
                            }
                        } catch (e: any) {
                            const httpStatusCode = e.$metadata?.httpStatusCode
                            this.checkHttpStatusCode(e, httpStatusCode)
                        }
                        processed.push(key)
                    }
                } catch (e: any) {
                    this.notify("Sync (get) failed: " + (e.desc || "unexpected error"))
                }
                onSuccess(updated, processed)
            },
            () => this.notifyNotSetUp(onFailure))
    }

    async pushEvents(data: AppState, events: Writable[], onSuccess: (updated: AppState) => void, onFailure?: OnFailure) {
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
                        onFailure && onFailure(err)
                        return
                    }
                }
                onSuccess(data)
            },
            () => this.notifyNotSetUp(onFailure))
    }

    async deleteEvents(data: AppState, keys: string[], onSuccess: (updated: AppState) => void, onFailure?: OnFailure) {
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
            () => this.notifyNotSetUp(onFailure))
    }

    private notifyNotSetUp(onFailure?: OnFailure) {
        this.notify("Sync not set up!")
        onFailure && onFailure({ desc: "sync not set up" })
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
