import { filterByArchive, filterByDeleted, Item, reduceByTerm, Sorter } from "./Item"
import { Term } from "./Term"

export interface Topic extends Item {}

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
