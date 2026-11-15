import { filterByArchive, filterByDeleted, reduceByTerm, Sorter, DataObjFields, CreatableFields, DeletableFields, UpdatableFields, SyncableFields, SchedulableFields, CompletableFields } from "./Item"
import { InferFields } from "./Schema"
import { Term } from "./Term"

export const WorkFields = { ...DataObjFields, ...CreatableFields, ...DeletableFields, ...UpdatableFields, ...SyncableFields, ...SchedulableFields, ...CompletableFields }
export type Work = InferFields<typeof WorkFields>

interface Props {
    works: Record<string, Work>,
    archive: boolean,
    sortBy: Sorter[],
    term?: Term,
    filterMore?: (item: any) => boolean,
}

export function fetchWorks(props: Props) {
    const res = Object
        .entries(props.works)
        .map(([id, item]) => ({ id, ...item }))
        .filter(filterByDeleted(false))
        .reduce(reduceByTerm(props.term), [])
        .filter(filterByArchive(props.archive))
        .filter(props.filterMore ? props.filterMore : () => true)
    props.sortBy.forEach(s => res.sort(s))
    return res
}
