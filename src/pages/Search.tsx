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
    today: {
        eveningBufferHours: number,
        morningBufferHours: number,
    },
    clear: Action,
    newNote: (template?: string) => string,
    putTask: (id: string, item: Task) => boolean,
    putWork: (id: string, item: Work) => boolean,
    notify: (note?: string) => void,
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

    return (
        <Wrapper layout="col">
            <Card title="Search Results" action={props.clear} count={results ? results : undefined}>
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
                                />)
                            }
                            {
                                y1.map(item => <ViewTask
                                    key={item.id}
                                    item={item}
                                    readonly={true}
                                    highlight={props.term}
                                    today={props.today}
                                    icon={icons.tasks}
                                    clear={props.clear}
                                    putTask={props.putTask}
                                    notify={props.notify}
                                />)
                            }
                            {
                                w1.map(item => <ViewWork
                                    key={item.id}
                                    item={item}
                                    readonly={true}
                                    highlight={props.term}
                                    today={props.today}
                                    icon={icons.works}
                                    clear={props.clear}
                                    putWork={props.putWork}
                                    notify={props.notify}
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
                                />)
                            }
                            {
                                y2.map(item => <ViewTask
                                    key={item.id}
                                    item={item}
                                    readonly={true}
                                    highlight={props.term}
                                    today={props.today}
                                    icon={icons.tasks}
                                    clear={props.clear}
                                    putTask={props.putTask}
                                    notify={props.notify}
                                />)
                            }
                            {
                                w2.map(item => <ViewWork
                                    key={item.id}
                                    item={item}
                                    readonly={true}
                                    highlight={props.term}
                                    today={props.today}
                                    icon={icons.works}
                                    clear={props.clear}
                                    putWork={props.putWork}
                                    notify={props.notify}
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
                                />)
                            }
                        </React.Fragment>
                        : <MsgBox emoji="🔍">Nothing found that matches your search term!</MsgBox>
                }
            </Card>
        </Wrapper>
    )
}
