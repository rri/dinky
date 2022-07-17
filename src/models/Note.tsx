import { filterByArchive, filterByDeleted, reduceByTerm, Item, Sorter } from "./Item"
import { Term } from "./Term"

interface Props {
    notes: Record<string, Note>,
    archive: boolean,
    sortBy: Sorter[],
    term?: Term,
}

export interface Note extends Item {}

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
