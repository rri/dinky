import { filterByArchive, filterByDeleted, IdItem, Item, reduceByTerm } from "./Item"
import { Term } from "./Term"

export interface Tag extends Item {}

interface Props {
    tags: Record<string, Tag>,
    archive: boolean,
    sortBy: (x: IdItem, y: IdItem) => 1 | -1 | 0,
    term?: Term,
}

export function fetchTags(props: Props) {
    return Object
        .entries(props.tags)
        .map(([id, item]) => ({ id, ...item }))
        .filter(filterByDeleted(false))
        .reduce(reduceByTerm(props.term), [])
        .filter(filterByArchive(props.archive))
        .sort(props.sortBy)
        .reverse()
}
