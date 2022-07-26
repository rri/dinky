import { Updatable } from "./Item";

export enum DisplayTheme {
    Auto = 0,
    Light = 1,
    Dark = 2,
}

export interface DisplaySettings extends Updatable {
    theme: DisplayTheme,
}