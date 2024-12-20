import { filterByArchive, filterByDeleted, reduceByTerm, Sorter, Creatable, DataObj, Deletable, Updatable, Syncable, Completable } from "./Item"
import { Term } from "./Term"

export type Note = DataObj & Creatable & Deletable & Updatable & Syncable & Completable

interface Props {
    notes: Record<string, Note>,
    archive: boolean,
    sortBy: Sorter[],
    term?: Term,
    filterMore?: (item: any) => boolean,
}

export function fetchNotes(props: Props) {
    const res = Object
        .entries(props.notes)
        .map(([id, item]) => ({ id, ...item }))
        .filter(filterByDeleted(false))
        .reduce(reduceByTerm(props.term), [])
        .filter(filterByArchive(props.archive))
        .filter(props.filterMore ? props.filterMore : () => true)
    props.sortBy.forEach(s => res.sort(s))
    return res
}
