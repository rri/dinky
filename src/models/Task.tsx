import { Completable, Creatable, DataObj, Deletable, filterByArchive, filterByDeleted, reduceByTerm, Schedulable, Sorter, Syncable, Updatable } from "./Item"
import { Term } from "./Term"

export type Task = DataObj & Creatable & Deletable & Updatable & Syncable & Schedulable & Completable

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
