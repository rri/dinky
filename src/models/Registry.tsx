import { Writable } from "./Item";

export interface Ref { ref: true }
export interface Val { ref: false, val: Writable }
export type RefVal = Ref | Val
export interface Registry {
    enabled: boolean,
    events: Record<string, RefVal>,
    forceSync?: boolean,
}
