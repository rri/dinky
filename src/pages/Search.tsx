import React from "react"
import { Action } from "../models/Action"
import { Contents } from "../models/Contents"
import { sortByUpdated } from "../models/Item"
import { Term } from "../models/Term"
import { fetchTopics } from "../models/Topic"
import { fetchTasks, Task } from "../models/Task"
import { fetchNotes } from "../models/Note"
import { fetchWorks, Work } from "../models/Work"
import { Card } from "../views/Card"
import { MsgBox } from "../views/MsgBox"
import { Wrapper } from "../views/Wrapper"
import { ViewNote } from "../views/ViewNote"
import { ViewTopic } from "../views/ViewTopic"
import { ViewTask } from "../views/ViewTask"
import { icons } from "../views/Icon"
import { ViewWork } from "../views/ViewWork"

type Props = Contents & {
    term: Term,
    clear: Action,
    newNote: (template?: string) => string,
    putTask: (id: string, item: Task, tombstone?: boolean) => boolean,
    putWork: (id: string, item: Work, tombstone?: boolean) => boolean,
}

export function Search(props: Props) {

    const x1 = fetchTopics({
        topics: props.topics ? props.topics : {},
        archive: false,
        sortBy: [sortByUpdated(true)],
        term: props.term,
    })
    const x2 = fetchTopics({
        topics: props.topics ? props.topics : {},
        archive: true,
        sortBy: [sortByUpdated(true)],
        term: props.term,
    })
    const y1 = fetchTasks({
        tasks: props.tasks ? props.tasks : {},
        archive: false,
        sortBy: [sortByUpdated(true)],
        term: props.term,
    })
    const y2 = fetchTasks({
        tasks: props.tasks ? props.tasks : {},
        archive: true,
        sortBy: [sortByUpdated(true)],
        term: props.term,
    })
    const w1 = fetchWorks({
        works: props.works ? props.works : {},
        archive: false,
        sortBy: [sortByUpdated(true)],
        term: props.term,
    })
    const w2 = fetchWorks({
        works: props.works ? props.works : {},
        archive: true,
        sortBy: [sortByUpdated(true)],
        term: props.term,
    })
    const z1 = fetchNotes({
        notes: props.notes ? props.notes : {},
        archive: false,
        sortBy: [sortByUpdated(true)],
        term: props.term,
    })
    const z2 = fetchNotes({
        notes: props.notes ? props.notes : {},
        archive: true,
        sortBy: [sortByUpdated(true)],
        term: props.term,
    })

    const results = x1.length + y1.length + w1.length + z1.length + x2.length + y2.length + w2.length + z2.length

    const getReturnURL = () => {
        return window.location.toString().replace(/([^#]*).*/, "$1#" + props.term.source())
    }

    return (
        <Wrapper layout="col">
            <Card title="Search Results" actions={[props.clear]} count={results ? results : undefined}>
                {
                    results
                        ?
                        <React.Fragment>
                            {
                                x1.map(item => <ViewTopic
                                    key={item.id}
                                    item={item}
                                    readonly={true}
                                    highlight={props.term}
                                    clear={props.clear}
                                    newNote={props.newNote}
                                    returnURL={getReturnURL()}
                                />)
                            }
                            {
                                y1.map(item => <ViewTask
                                    key={item.id}
                                    item={item}
                                    readonly={true}
                                    highlight={props.term}
                                    icon={icons.tasks}
                                    clear={props.clear}
                                    putTask={props.putTask}
                                    returnURL={getReturnURL()}
                                />)
                            }
                            {
                                w1.map(item => <ViewWork
                                    key={item.id}
                                    item={item}
                                    readonly={true}
                                    highlight={props.term}
                                    icon={icons.works}
                                    clear={props.clear}
                                    putWork={props.putWork}
                                    returnURL={getReturnURL()}
                                />)
                            }
                            {
                                z1.map(item => <ViewNote
                                    key={item.id}
                                    item={item}
                                    readonly={true}
                                    oneline={true}
                                    highlight={props.term}
                                    icon={icons.notes}
                                    clear={props.clear}
                                    returnURL={getReturnURL()}
                                />)
                            }
                            {
                                x2.map(item => <ViewTopic
                                    key={item.id}
                                    item={item}
                                    readonly={true}
                                    highlight={props.term}
                                    clear={props.clear}
                                    newNote={props.newNote}
                                    returnURL={getReturnURL()}
                                />)
                            }
                            {
                                y2.map(item => <ViewTask
                                    key={item.id}
                                    item={item}
                                    readonly={true}
                                    highlight={props.term}
                                    icon={icons.tasks}
                                    clear={props.clear}
                                    putTask={props.putTask}
                                    returnURL={getReturnURL()}
                                />)
                            }
                            {
                                w2.map(item => <ViewWork
                                    key={item.id}
                                    item={item}
                                    readonly={true}
                                    highlight={props.term}
                                    icon={icons.works}
                                    clear={props.clear}
                                    putWork={props.putWork}
                                    returnURL={getReturnURL()}
                                />)
                            }
                            {
                                z2.map(item => <ViewNote
                                    key={item.id}
                                    item={item}
                                    readonly={true}
                                    oneline={true}
                                    highlight={props.term}
                                    icon={icons.notes}
                                    clear={props.clear}
                                    returnURL={getReturnURL()}
                                />)
                            }
                        </React.Fragment>
                        : <MsgBox emoji="🔍">Nothing found that matches your search term!</MsgBox>
                }
            </Card>
        </Wrapper>
    )
}
