import React from "react"
import { useParams } from "react-router-dom"
import { Action } from "../models/Action"
import { Topic } from "../models/Topic"
import { Card } from "../views/Card"
import { MsgBox } from "../views/MsgBox"
import { Wrapper } from "../views/Wrapper"
import { ViewTopic } from "../views/ViewTopic"
import { fetchTasks, Task } from "../models/Task"
import { fetchNotes, Note } from "../models/Note"
import { fetchWorks, Work } from "../models/Work"
import { sortByReminder, sortByUpdated } from "../models/Item"
import { Term } from "../models/Term"
import { ViewNote } from "../views/ViewNote"
import { ViewTask } from "../views/ViewTask"
import { ViewWork } from "../views/ViewWork"
import { icons } from "../views/Icon"

interface Props {
    tasks: Record<string, Task>,
    notes: Record<string, Note>,
    topics: Record<string, Topic>,
    works: Record<string, Work>,
    topAction: Action,
    clear: Action,
    today: {
        eveningBufferHours: number,
        morningBufferHours: number,
    },
    newNote: (template?: string) => string,
    putTopic: (id: string, item: Topic) => boolean,
    putTask: (id: string, item: Task) => boolean,
    putWork: (id: string, item: Work) => boolean,
}

export function TopicDetails(props: Props) {

    const { id } = useParams()
    const found: boolean = id ? !!props.topics[id] : false
    const item = id ? { ...props.topics[id], id } : undefined
    const term = item ? new Term(item.data) : new Term("")

    const y1 = fetchTasks({
        tasks: props.tasks,
        archive: false,
        sortBy: [sortByUpdated(true), sortByReminder()],
        term,
    })
    const y2 = fetchTasks({
        tasks: props.tasks,
        archive: true,
        sortBy: [sortByUpdated(true)],
        term,
    })
    const w1 = fetchWorks({
        works: props.works,
        archive: false,
        sortBy: [sortByUpdated(true), sortByReminder()],
        term,
    })
    const w2 = fetchWorks({
        works: props.works,
        archive: true,
        sortBy: [sortByUpdated(true)],
        term,
    })
    const z1 = fetchNotes({
        notes: props.notes,
        archive: false,
        sortBy: [sortByUpdated(true)],
        term,
    })
    const z2 = fetchNotes({
        notes: props.notes,
        archive: true,
        sortBy: [sortByUpdated(true)],
        term,
    })

    const results = y1.length + y2.length + w1.length + w2.length + z1.length + z2.length

    return (
        <Wrapper layout="col">
            <Card title="Topic Details" action={props.topAction}>
                {
                    item && found
                        ? <ViewTopic
                            item={item}
                            newNote={props.newNote}
                            putTopic={props.putTopic}
                            hideDetails={true}
                            actionOnDelete={true}
                        />
                        : <MsgBox emoji="🚫">The topic you're looking for cannot be found!</MsgBox>
                }
            </Card>
            {
                item && found
                &&
                <Card title="Related">
                    {
                        results
                            ?
                            <React.Fragment>
                                {
                                    y1.map(item => <ViewTask
                                        key={item.id}
                                        item={item}
                                        readonly={true}
                                        highlight={term}
                                        today={props.today}
                                        icon={icons.tasks}
                                        clear={props.clear}
                                        putTask={props.putTask}
                                    />)
                                }
                                {
                                    w1.map(item => <ViewWork
                                        key={item.id}
                                        item={item}
                                        readonly={true}
                                        highlight={term}
                                        today={props.today}
                                        icon={icons.works}
                                        clear={props.clear}
                                        putWork={props.putWork}
                                    />)
                                }
                                {
                                    z1.map(item => <ViewNote
                                        key={item.id}
                                        item={item}
                                        readonly={true}
                                        oneline={true}
                                        highlight={term}
                                        icon={icons.notes}
                                        clear={props.clear}
                                    />)
                                }
                                {
                                    y2.map(item => <ViewTask
                                        key={item.id}
                                        item={item}
                                        readonly={true}
                                        highlight={term}
                                        today={props.today}
                                        icon={icons.tasks}
                                        clear={props.clear}
                                        putTask={props.putTask}
                                    />)
                                }
                                {
                                    w2.map(item => <ViewWork
                                        key={item.id}
                                        item={item}
                                        readonly={true}
                                        highlight={term}
                                        today={props.today}
                                        icon={icons.works}
                                        clear={props.clear}
                                        putWork={props.putWork}
                                    />)
                                }
                                {
                                    z2.map(item => <ViewNote
                                        key={item.id}
                                        item={item}
                                        readonly={true}
                                        oneline={true}
                                        highlight={term}
                                        icon={icons.notes}
                                        clear={props.clear}
                                    />)
                                }
                            </React.Fragment>
                            : <MsgBox emoji="🔍">No related items found!</MsgBox>

                    }
                </Card>
            }
        </Wrapper >
    )
}
