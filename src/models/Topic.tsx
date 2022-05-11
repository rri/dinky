import { filterByArchive, filterByDeleted, IdItem, Item, reduceByTerm } from "./Item"
import { Term } from "./Term"

export interface Topic extends Item {}

interface Props {
    topics: Record<string, Topic>,
    archive: boolean,
    sortBy: (x: IdItem, y: IdItem) => 1 | -1 | 0,
    term?: Term,
}

export function fetchTopics(props: Props) {
    return Object
        .entries(props.topics)
        .map(([id, item]) => ({ id, ...item }))
        .filter(filterByDeleted(false))
        .reduce(reduceByTerm(props.term), [])
        .filter(filterByArchive(props.archive))
        .sort(props.sortBy)
        .reverse()
}
