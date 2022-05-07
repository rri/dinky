import { useParams } from "react-router-dom"
import { Action } from "../models/Action"
import { Tag } from "../models/Tag"
import { Card } from "../views/Card"
import { MsgBox } from "../views/MsgBox"
import { Wrapper } from "../views/Wrapper"
import { ViewTag } from "../views/ViewTag"
import { fetchTasks, Task } from "../models/Task"
import { fetchNotes, Note } from "../models/Note"
import { sortByUpdated } from "../models/Item"
import { Term } from "../models/Term"
import React from "react"
import { ViewTask } from "../views/ViewTask"
import { icons } from "../views/Icon"
import { ViewNote } from "../views/ViewNote"

interface Props {
    tasks: Record<string, Task>,
    notes: Record<string, Note>,
    tags: Record<string, Tag>,
    topAction: Action,
    clear: Action,
    today: {
        eveningBufferHours: number,
        morningBufferHours: number,
    },
    newNote: (template?: string) => string,
    putTask: (id: string, item: Task) => boolean,
}

export function TagDetails(props: Props) {

    const { id } = useParams()
    const found: boolean = id ? !!props.tags[id] : false
    const item = id ? { ...props.tags[id], id } : undefined
    const term = item ? new Term(item.data) : new Term("")

    const y1 = fetchTasks({
        tasks: props.tasks,
        archive: false,
        sortBy: sortByUpdated(true),
        term,
    })
    const y2 = fetchTasks({
        tasks: props.tasks,
        archive: true,
        sortBy: sortByUpdated(true),
        term,
    })
    const z1 = fetchNotes({
        notes: props.notes,
        archive: false,
        sortBy: sortByUpdated(true),
        term,
    })
    const z2 = fetchNotes({
        notes: props.notes,
        archive: true,
        sortBy: sortByUpdated(true),
        term,
    })

    const results = y1.length + y2.length + z1.length + z2.length

    return (
        <Wrapper layout="col">
            <Card title="Tag Details" action={props.topAction}>
                {
                    item && found
                        ? <ViewTag
                            item={item}
                            newNote={props.newNote}
                            hideDetails={true}
                            actionOnDelete={true}
                        />
                        : <MsgBox emoji="🚫">The tag you're looking for cannot be found!</MsgBox>
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
