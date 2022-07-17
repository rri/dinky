import { Updatable } from "./Item";

export interface TodaySettings extends Updatable {
    eveningBufferHours: number,
    morningBufferHours: number,
}
