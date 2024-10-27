export interface StorageSettings {
    s3Bucket?: string,
    awsAccessKey?: string,
    awsSecretKey?: string,
    awsRegion?: string,
    syncOnLoad?: boolean,
    periodMinutes?: number,
    autoPushItems?: boolean,
    eTag?: string,
    lastSynced?: string,
}
