import { filterByArchive, filterByDeleted, IdItem, Item, reduceByTerm } from "./Item"
import { Term } from "./Term"

export interface Task extends Item {}

interface Props {
    tasks: Record<string, Task>,
    archive: boolean,
    sortBy: (x: IdItem, y: IdItem) => 1 | -1 | 0
    term?: Term,
    filterMore?: (item: IdItem) => boolean,
}

export function fetchTasks(props: Props) {
    return Object
        .entries(props.tasks)
        .map(([id, item]) => ({ id, ...item }))
        .filter(filterByDeleted(false))
        .reduce(reduceByTerm(props.term), [])
        .filter(filterByArchive(props.archive))
        .filter(props.filterMore ? props.filterMore : () => true)
        .sort(props.sortBy)
}
