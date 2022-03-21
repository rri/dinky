import React from "react"
import { Action } from "../models/Action"
import { Contents } from "../models/Contents"
import { sortByUpdated } from "../models/Item"
import { Term } from "../models/Term"
import { fetchTags, Tag } from "../models/Tag"
import { fetchTasks, Task } from "../models/Task"
import { fetchNotes, Note } from "../models/Note"
import { Card } from "../views/Card"
import { MsgBox } from "../views/MsgBox"
import { Wrapper } from "../views/Wrapper"
import { ViewNote } from "../views/ViewNote"
import { ViewTag } from "../views/ViewTag"
import { ViewTask } from "../views/ViewTask"
import { icons } from "../views/Icon"

type Props = Contents & {
    term: Term,
    today: {
        eveningBufferHours: number,
        morningBufferHours: number,
    },
    clear: Action,
    newNote: (template?: string) => void,
    putTask: (id: string, item: Task) => boolean,
    putTag: (id: string, item: Tag) => boolean,
    putNote: (id: string, item: Note) => boolean,
}

export function Search(props: Props) {

    const x1 = fetchTags({
        tags: props.tags,
        archive: false,
        sortBy: sortByUpdated(true),
        term: props.term,
    })
    const x2 = fetchTags({
        tags: props.tags,
        archive: true,
        sortBy: sortByUpdated(true),
        term: props.term,
    })
    const y1 = fetchTasks({
        tasks: props.tasks,
        archive: false,
        sortBy: sortByUpdated(true),
        term: props.term,
    })
    const y2 = fetchTasks({
        tasks: props.tasks,
        archive: true,
        sortBy: sortByUpdated(true),
        term: props.term,
    })
    const z1 = fetchNotes({
        notes: props.notes,
        archive: false,
        sortBy: sortByUpdated(true),
        term: props.term,
    })
    const z2 = fetchNotes({
        notes: props.notes,
        archive: true,
        sortBy: sortByUpdated(true),
        term: props.term,
    })

    const results = x1.length + y1.length + z1.length + x2.length + y2.length + z2.length

    return (
        <Wrapper layout="col">
            <Wrapper layout="col">
                <Card title="Search Results" action={props.clear}>
                    {
                        results
                            ?
                            <React.Fragment>
                                {
                                    x1.map(item => <ViewTag
                                        key={item.id}
                                        item={item}
                                        highlight={props.term}
                                        clear={props.clear}
                                        newNote={props.newNote}
                                        putTag={props.putTag}
                                    />)
                                }
                                {
                                    y1.map(item => <ViewTask
                                        key={item.id}
                                        item={item}
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
                                        highlight={props.term}
                                        icon={icons.notes}
                                        clear={props.clear}
                                        putNote={props.putNote}
                                    />)
                                }
                                {
                                    x2.map(item => <ViewTag
                                        key={item.id}
                                        item={item}
                                        highlight={props.term}
                                        clear={props.clear}
                                        newNote={props.newNote}
                                        putTag={props.putTag}
                                    />)
                                }
                                {
                                    y2.map(item => <ViewTask
                                        key={item.id}
                                        item={item}
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
                                        highlight={props.term}
                                        icon={icons.notes}
                                        clear={props.clear}
                                        putNote={props.putNote}
                                    />)
                                }
                            </React.Fragment>
                            : <MsgBox emoji="🔍">Nothing found that matches your search term!</MsgBox>
                    }
                </Card>
            </Wrapper>
        </Wrapper>
    )
}
