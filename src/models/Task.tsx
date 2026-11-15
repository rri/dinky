import { filterByArchive, filterByDeleted, reduceByTerm, Sorter, DataObjFields, CreatableFields, DeletableFields, UpdatableFields, SyncableFields, SchedulableFields, CompletableFields } from "./Item"
import { InferFields } from "./Schema"
import { Term } from "./Term"

export const TaskFields = { ...DataObjFields, ...CreatableFields, ...DeletableFields, ...UpdatableFields, ...SyncableFields, ...SchedulableFields, ...CompletableFields }
export type Task = InferFields<typeof TaskFields>

interface Props {
    tasks: Record<string, Task>,
    archive: boolean,
    sortBy: Sorter[],
    term?: Term,
    filterMore?: (item: any) => boolean,
}

export function fetchTasks(props: Props) {
    const res = Object
        .entries(props.tasks)
        .map(([id, item]) => ({ id, ...item }))
        .filter(filterByDeleted(false))
        .reduce(reduceByTerm(props.term), [])
        .filter(filterByArchive(props.archive))
        .filter(props.filterMore ? props.filterMore : () => true)
    props.sortBy.forEach(s => res.sort(s))
    return res
}
