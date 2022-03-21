import { StorageSettings } from "./StorageSettings"
import { TodaySettings } from "./TodaySettings"

export interface Settings {
    storage: StorageSettings,
    today: TodaySettings,
}
