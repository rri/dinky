import { filterByArchive, filterByDeleted, reduceByTerm, Sorter, Creatable, Deletable, Updatable, DataObj, Syncable, Named } from "./Item"
import { Term } from "./Term"

export type Topic = DataObj & Creatable & Deletable & Updatable & Syncable & Named

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
