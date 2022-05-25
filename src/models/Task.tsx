import { filterByArchive, filterByDeleted, IdItem, Item, reduceByTerm, Sorter } from "./Item"
import { Term } from "./Term"

export interface Task extends Item {}

interface Props {
    tasks: Record<string, Task>,
    archive: boolean,
    sortBy: Sorter[],
    term?: Term,
    filterMore?: (item: IdItem) => boolean,
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
