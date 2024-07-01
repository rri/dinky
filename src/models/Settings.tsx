import { DisplaySettings } from "./DisplaySettings"
import { RetentionSettings } from "./RetentionSettings"
import { StorageSettings } from "./StorageSettings"

export interface Settings {
    storage: StorageSettings,
    retention: RetentionSettings,
    display: DisplaySettings,
}
