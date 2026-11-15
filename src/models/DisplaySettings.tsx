import { UpdatableFields } from "./Item"
import { InferFields, isOneOf, required } from "./Schema"

export enum DisplayTheme {
    Auto = 0,
    Light = 1,
    Dark = 2,
}

export const DisplaySettingsFields = {
    ...UpdatableFields,
    theme: required(isOneOf([DisplayTheme.Auto, DisplayTheme.Light, DisplayTheme.Dark])),
}

export type DisplaySettings = InferFields<typeof DisplaySettingsFields>
