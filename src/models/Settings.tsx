import { DisplaySettings } from "./DisplaySettings"
import { RetentionSettings } from "./RetentionSettings"
import { StorageSettings } from "./StorageSettings"
import { TodaySettings } from "./TodaySettings"

export interface Settings {
    storage: StorageSettings,
    today: TodaySettings,
    retention: RetentionSettings,
    display: DisplaySettings,
}
