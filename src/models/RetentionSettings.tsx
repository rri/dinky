import { Updatable } from "./Item";

export interface RetentionSettings extends Updatable {
    periodDays: number,
}