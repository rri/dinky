import moment from "moment"
import { Term } from "./Term"

export interface Id {
    id: string,
}

export interface Event {
    evt: string,
}

export interface Creatable {
    created?: string,
}

export interface Syncable {
    unsynced?: boolean,
}

export interface Deletable {
    deleted?: string,
}

export interface Updatable {
    updated?: string,
}

export interface DataObj {
    data: string,
}

export interface Schedulable {
    today?: string,
}

export interface Archivable {
    archive?: boolean,
}

export interface Named {
    name?: string,
}

export interface Typed {
    path: ItemPath,
}

export type ItemPath = "settings.storage" | "settings.retention" | "settings.today" | "settings.display" | "contents.tasks" | "contents.topics" | "contents.notes" | "contents.works"

export type Writable = Event & Typed & Syncable & Updatable

export type Sorter = (x: any, y: any) => 1 | -1 | 0

function filterByStatus(extractor: (obj: any) => any, status: boolean) {
    return (obj: any) => extractor(obj) ? status : !status
}

function sortByChronology<T extends Creatable | Deletable | Updatable | Schedulable>(extractor: (item: T) => Date, reverse?: boolean) {
    return (x: T, y: T) => {
        const a = extractor(x)
        const b = extractor(y)
        if (reverse) {
            return a > b ? -1 : a < b ? 1 : 0
        } else {
            return a > b ? 1 : a < b ? -1 : 0
        }
    }
}

function withDefaultDate(obj: any, date: Date) {
    return obj ? new Date(obj) : date
}

export function reduceByTerm<T extends { data: string },>(term?: Term) {
    return (result: T[], value: T) => {
        if (term?.source()) {
            let count = 0
            const updated = value.data.replaceAll(term.value(), (match) => {
                count += 1
                return match
            })
            if (count > 0) {
                result.push({ ...value, data: updated })
            }
        } else {
            result.push(value)
        }
        return result
    }
}

export function filterByCreated(created: boolean) {
    return filterByStatus(item => item.created, created)
}

export function filterByUpdated(updated: boolean) {
    return filterByStatus(item => item.updated, updated)
}

export function filterByDeleted(deleted: boolean) {
    return filterByStatus(item => item.deleted, deleted)
}

export function filterByArchive(archive: boolean) {
    return filterByStatus(item => item.archive, archive)
}

export function filterByToday<T extends Schedulable>() {
    return (item: T) => {
        return item.today
            ? moment(item.today) <= moment()
            : false
    }
}

export function sortByData<T extends { data: string }>(reverse?: boolean) {
    return (x: T, y: T) => {
        const a = x.data
        const b = y.data
        if (!a && b) {
            return -1
        }
        if (a && !b) {
            return 1
        }
        if (!a && !b) {
            return 0
        }
        if (reverse) {
            return a.localeCompare(b) > 0 ? -1 : 1
        } else {
            return a.localeCompare(b) > 0 ? 1 : -1
        }
    }
}

export function sortByCreated(reverse?: boolean) {
    return sortByChronology((item: Creatable) => withDefaultDate(item.created, new Date()), reverse)
}

export function sortByUpdated(reverse?: boolean) {
    return sortByChronology((item: Updatable) => withDefaultDate(item.updated, new Date()), reverse)
}

export function sortByDeleted(reverse?: boolean) {
    return sortByChronology((item: Deletable) => withDefaultDate(item.deleted, new Date()), reverse)
}

export function sortByToday(reverse?: boolean) {
    return sortByChronology((item: Schedulable) => withDefaultDate(item.today, new Date()), reverse)
}

export function belongsToToday<T extends Schedulable>(item: T) {
    return filterByToday()(item)
}
