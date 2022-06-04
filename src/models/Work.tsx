import { filterByArchive, filterByDeleted, IdItem, Item, reduceByTerm, Sorter } from "./Item"
import { Term } from "./Term"

export interface Work extends Item {}

interface Props {
    works: Record<string, Work>,
    archive: boolean,
    sortBy: Sorter[],
    term?: Term,
    filterMore?: (item: IdItem) => boolean,
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
