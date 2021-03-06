import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { AppState, empty, mergeData, purgeDeleted } from "./AppState"
import { StorageSettings } from "./StorageSettings"
import { DATA_PATH } from "./Store"

export class Cloud {

    private notify: (note?: string) => void

    constructor(notify: (note?: string) => void) {
        this.notify = notify
    }

    async pullData(data: AppState, onSuccess: (data: AppState) => void) {
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
                    const updated = purgeDeleted(mergeData(data, empty(JSON.parse(body))))
                    updated.settings.storage.eTag = ETag
                    onSuccess(updated)
                })
                .catch(e => {
                    const { $metadata: { httpStatusCode } } = e
                    this.checkHttpStatusCode(e, httpStatusCode)
                    const updated = purgeDeleted(data)
                    onSuccess(updated)
                })
        }
        this.withS3Client(data.settings.storage,
            client => getData(client).catch((e: any) => this.notify("Sync (get) failed: " + e.desc)),
            () => this.notify("Sync not set up!"))
    }

    async pushData(data: AppState, onSuccess: (data: AppState) => void) {
        const setMeta = (data: AppState, lastSynced: string, eTag?: string) => (
            {
                ...data,
                settings: {
                    ...data.settings,
                    storage: {
                        ...data.settings.storage,
                        eTag: eTag ? eTag : data.settings.storage.eTag,
                        lastSynced,
                    }
                }
            }
        )
        const putData = async (client: S3Client) => {
            const toExport: AppState = {
                ...data,
                settings: {
                    ...data.settings,
                    storage: {},
                }
            } as const
            const put = new PutObjectCommand({
                Bucket: data.settings.storage.s3Bucket,
                Key: DATA_PATH,
                Body: JSON.stringify(toExport),
                ContentType: "application/json",
            })
            await client
                .send(put)
                .then(async res => {
                    const { ETag } = res
                    const updated = setMeta(data, new Date().toISOString(), ETag)
                    onSuccess(updated)
                })
                .then(() => this.notify("Sync completed!"))
                .catch(e => {
                    const { $metadata: { httpStatusCode } } = e
                    this.checkHttpStatusCode(e, httpStatusCode)
                    const updated = setMeta(data, new Date().toISOString())
                    onSuccess(updated)
                    this.notify("Sync completed!")
                })
        }
        this.withS3Client(
            data.settings.storage,
            client => putData(client).catch((e: any) => this.notify("Sync (put) failed: " + e.desc)),
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
}