import { filterByArchive, filterByDeleted, reduceByTerm, Sorter, DataObjFields, CreatableFields, DeletableFields, UpdatableFields, SyncableFields, NamedFields } from "./Item"
import { InferFields } from "./Schema"
import { Term } from "./Term"

export const TopicFields = { ...DataObjFields, ...CreatableFields, ...DeletableFields, ...UpdatableFields, ...SyncableFields, ...NamedFields }
export type Topic = InferFields<typeof TopicFields>

interface Props {
    topics: Record<string, Topic>,
    archive: boolean,
    sortBy: Sorter[],
    term?: Term,
}

export function fetchTopics(props: Props) {
    const res = Object
        .entries(props.topics)
        .map(([id, item]) => ({ id, ...item }))
        .filter(filterByDeleted(false))
        .reduce(reduceByTerm(props.term), [])
        .filter(filterByArchive(props.archive))
    props.sortBy.forEach(s => res.sort(s))
    return res
}
