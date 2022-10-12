export interface StorageSettings {
    s3Bucket?: string,
    awsAccessKey?: string,
    awsSecretKey?: string,
    awsRegion?: string,
    syncOnLoad?: boolean,
    periodMinutes?: number,
    eTag?: string,
    lastSynced?: string,
}
