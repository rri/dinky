import { filterByArchive, filterByDeleted, IdItem, Item, reduceByTerm } from "./Item"
import { Term } from "./Term"

interface Props {
    notes: Record<string, Note>,
    archive: boolean,
    sortBy: (x: IdItem, y: IdItem) => 1 | -1 | 0,
    term?: Term,
}

export interface Note extends Item {}

export function fetchNotes(props: Props) {
    return Object
        .entries(props.notes)
        .map(([id, item]) => ({ id, ...item }))
        .filter(filterByDeleted(false))
        .reduce(reduceByTerm(props.term), [])
        .filter(filterByArchive(props.archive))
        .sort(props.sortBy)
        .reverse()
}
