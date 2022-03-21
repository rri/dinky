export interface StorageSettings {
    type: "Local" | "Cloud",
    s3Bucket?: string,
    s3AccessKey?: string,
    s3SecretKey?: string,
}
