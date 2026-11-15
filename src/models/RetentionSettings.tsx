import { UpdatableFields } from "./Item"
import { InferFields, isNonNegativeNumber, required } from "./Schema"

export const RetentionSettingsFields = {
    ...UpdatableFields,
    periodDays: required(isNonNegativeNumber),
}

export type RetentionSettings = InferFields<typeof RetentionSettingsFields>
