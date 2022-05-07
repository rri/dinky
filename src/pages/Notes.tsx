import React from "react"
import { sortByCreated, sortByUpdated } from "../models/Item"
import { fetchNotes, Note } from "../models/Note"
import { Card } from "../views/Card"
import { MsgBox } from "../views/MsgBox"
import { Wrapper } from "../views/Wrapper"
import { ViewNote } from "../views/ViewNote"
import { icons } from "../views/Icon"
import { useNavigate } from "react-router-dom"

interface Props {
    notes: Record<string, Note>,
    newNote: (template?: string) => string,
    putNote?: (id: string, item: Note) => boolean,
    registerNewHandler: (handler: (evt?: KeyboardEvent) => void) => void,
}

export function Notes(props: Props) {

    const navigate = useNavigate()

    const newNote = () => {
        const id = props.newNote()
        navigate(id)
    }

    props.registerNewHandler((evt?: KeyboardEvent) => {
        evt?.preventDefault()
        newNote()
    })

    const openNotes = fetchNotes({
        notes: props.notes,
        archive: false,
        sortBy: sortByCreated(),
    })
    const doneNotes = fetchNotes({
        notes: props.notes,
        archive: true,
        sortBy: sortByUpdated(),
    })

    const results = openNotes.concat(doneNotes)

    const action = {
        icon: icons.plus,
        desc: "Add a new note",
        action: newNote,
    }

    return (
        <Wrapper layout="col">
            <Card title="Notes" action={action}>
                {
                    results.length
                        ?
                        <React.Fragment>
                            {
                                results.map(item => <ViewNote
                                    key={item.id}
                                    item={item}
                                    oneline={true}
                                    readonly={true}
                                    autoNew={true}
                                    newNote={props.newNote}
                                    putNote={props.putNote}
                                />)
                            }
                        </React.Fragment>
                        : <MsgBox emoji="📓">No notes in your list!</MsgBox>
                }
            </Card>
        </Wrapper>
    )
}
