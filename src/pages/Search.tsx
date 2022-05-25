import React from "react"
import { Action } from "../models/Action"
import { Contents } from "../models/Contents"
import { sortByUpdated } from "../models/Item"
import { Term } from "../models/Term"
import { fetchTopics } from "../models/Topic"
import { fetchTasks, Task } from "../models/Task"
import { fetchNotes } from "../models/Note"
import { Card } from "../views/Card"
import { MsgBox } from "../views/MsgBox"
import { Wrapper } from "../views/Wrapper"
import { ViewNote } from "../views/ViewNote"
import { ViewTopic } from "../views/ViewTopic"
import { ViewTask } from "../views/ViewTask"
import { icons } from "../views/Icon"

type Props = Contents & {
    term: Term,
    today: {
        eveningBufferHours: number,
        morningBufferHours: number,
    },
    clear: Action,
    newNote: (template?: string) => string,
    putTask: (id: string, item: Task) => boolean,
}

export function Search(props: Props) {

    const x1 = fetchTopics({
        topics: props.topics,
        archive: false,
        sortBy: [sortByUpdated(true)],
        term: props.term,
    })
    const x2 = fetchTopics({
        topics: props.topics,
        archive: true,
        sortBy: [sortByUpdated(true)],
        term: props.term,
    })
    const y1 = fetchTasks({
        tasks: props.tasks,
        archive: false,
        sortBy: [sortByUpdated(true)],
        term: props.term,
    })
    const y2 = fetchTasks({
        tasks: props.tasks,
        archive: true,
        sortBy: [sortByUpdated(true)],
        term: props.term,
    })
    const z1 = fetchNotes({
        notes: props.notes,
        archive: false,
        sortBy: [sortByUpdated(true)],
        term: props.term,
    })
    const z2 = fetchNotes({
        notes: props.notes,
        archive: true,
        sortBy: [sortByUpdated(true)],
        term: props.term,
    })

    const results = x1.length + y1.length + z1.length + x2.length + y2.length + z2.length

    return (
        <Wrapper layout="col">
            <Card title="Search Results" action={props.clear}>
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
