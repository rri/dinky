import { Completable, filterByArchive, filterByDeleted, reduceByTerm, Schedulable, Sorter, Creatable, Deletable, Updatable, DataObj, Syncable } from "./Item"
import { Term } from "./Term"

export type Work = DataObj & Creatable & Deletable & Updatable & Syncable & Schedulable & Completable

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
