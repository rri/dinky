// Runtime field schemas.
//
// Each model is described by a schema: a map from field name to a Field that
// says how to validate the field and whether it is optional. The TypeScript
// type of the model is derived from its schema (see InferFields), so the
// schema is the single source of truth: adding a field to a model means
// adding it to the schema, which updates both the type and the validation
// applied to untrusted data (see Sanitize.tsx).

export type Check<T> = (val: unknown) => val is T

export interface Field<T, Optional extends boolean = boolean> {
    check: Check<T>,
    optional: Optional,
    // Device-local fields are never accepted from outside (imports, cloud).
    local?: boolean,
}

export type Schema = Record<string, Field<any, boolean>>

export const required = <T,>(check: Check<T>): Field<T, false> => ({ check, optional: false })

export const optional = <T,>(check: Check<T>): Field<T, true> => ({ check, optional: true })

export const local = <T,>(field: Field<T, true>): Field<T, true> => ({ ...field, local: true })

type FieldType<F> = F extends Field<infer T, boolean> ? T : never

type RequiredKeys<S> = { [K in keyof S]: S[K] extends Field<any, false> ? K : never }[keyof S]

type OptionalKeys<S> = Exclude<keyof S, RequiredKeys<S>>

type Simplify<T> = { [K in keyof T]: T[K] }

export type InferFields<S extends Schema> = Simplify<
    { [K in RequiredKeys<S>]: FieldType<S[K]> } &
    { [K in OptionalKeys<S>]?: FieldType<S[K]> }
>

// Checks

export const isString: Check<string> = (val): val is string => typeof val === "string"

export const isBoolean: Check<boolean> = (val): val is boolean => typeof val === "boolean"

export const isDateString: Check<string> = (val): val is string =>
    typeof val === "string" && !Number.isNaN(Date.parse(val))

export const isNonNegativeNumber: Check<number> = (val): val is number =>
    typeof val === "number" && Number.isFinite(val) && val >= 0

export const isOneOf = <T,>(values: readonly T[]): Check<T> =>
    (val): val is T => values.includes(val as T)
