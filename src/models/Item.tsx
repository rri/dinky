import moment from "moment"
import { Term } from "./Term"

export interface Id {
    id: string,
}

export interface Updatable {
    updated?: string,
}

export interface Item extends Updatable {
    data: string,
    created?: string,
    deleted?: string,
    today?: string,
}

export interface Archivable {
    archive?: boolean,
}

export type Sorter = <T extends Item>(x: T, y: T) => 1 | -1 | 0

function filterByStatus(extractor: (obj: any) => any, status: boolean) {
    return (obj: any) => extractor(obj) ? status : !status
}

function sortByChronology<T extends Item>(extractor: (item: T) => Date, reverse?: boolean) {
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

export function filterByToday<T extends Item>(eveningBufferHours: number, morningBufferHours: number) {
    return (item: T) => {
        const referencePoint = Number.parseInt(moment().format("H")) >= morningBufferHours
            ? moment()
            : moment().subtract(1, "days")
        return item.today
            ? moment(item.today) <= moment()
            && referencePoint
                .startOf("day")
                .subtract(eveningBufferHours, "hours")
                .isBefore(moment(item.today))
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
    return sortByChronology(item => withDefaultDate(item.created, new Date()), reverse)
}

export function sortByUpdated(reverse?: boolean) {
    return sortByChronology(item => withDefaultDate(item.updated, new Date()), reverse)
}

export function sortByDeleted(reverse?: boolean) {
    return sortByChronology(item => withDefaultDate(item.deleted, new Date()), reverse)
}

export function sortByToday(reverse?: boolean) {
    return sortByChronology(item => withDefaultDate(item.today, new Date()), reverse)
}

export function belongsToToday<T extends Item>(item: T, eveningBufferHours: number, morningBufferHours: number) {
    return filterByToday(eveningBufferHours, morningBufferHours)(item)
}

export function sortByReminder<T extends Item>() {
    return (x: T, y: T) => {
        const a = x.today
        const b = y.today
        if (a && moment().isBefore(moment(a))) {
            // X's today is in the future
            if (b && moment().isBefore(moment(b))) {
                // Y's today is in the future
                return 0
            } else {
                // X in the future, Y in the past
                return 1
            }
        } else {
            // X's today is not in the future
            if (b && moment().isBefore(moment(b))) {
                // Y in the future, X in the past
                return -1
            } else {
                // Both in the past
                return 0
            }
        }
    }
}
