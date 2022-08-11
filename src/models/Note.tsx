import { filterByArchive, filterByDeleted, reduceByTerm, Sorter, Creatable, DataObj, Deletable, Updatable, Syncable } from "./Item"
import { Term } from "./Term"

export type Note = DataObj & Creatable & Deletable & Updatable & Syncable

interface Props {
    notes: Record<string, Note>,
    archive: boolean,
    sortBy: Sorter[],
    term?: Term,
}

export function fetchNotes(props: Props) {
    const res = Object
        .entries(props.notes)
        .map(([id, item]) => ({ id, ...item }))
        .filter(filterByDeleted(false))
        .reduce(reduceByTerm(props.term), [])
        .filter(filterByArchive(props.archive))
    props.sortBy.forEach(s => res.sort(s))
    return res
}
