import { filterByArchive, filterByDeleted, reduceByTerm, Sorter, DataObjFields, CreatableFields, DeletableFields, UpdatableFields, SyncableFields, CompletableFields } from "./Item"
import { InferFields } from "./Schema"
import { Term } from "./Term"

export const NoteFields = { ...DataObjFields, ...CreatableFields, ...DeletableFields, ...UpdatableFields, ...SyncableFields, ...CompletableFields }
export type Note = InferFields<typeof NoteFields>

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
