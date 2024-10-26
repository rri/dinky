import React from "react"
import { sortByUpdated } from "../models/Item"
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
    putNote: (id: string, item: Note, tombstone?: boolean) => boolean,
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
        sortBy: [sortByUpdated(true)],
    })
    const doneNotes = fetchNotes({
        notes: props.notes,
        archive: true,
        sortBy: [sortByUpdated(true)],
    })

    const action = {
        icon: icons.plus,
        desc: "Add a new note",
        action: newNote,
    }

    return (
        <Wrapper layout="col">
            <Card title="Notes" actions={[action]} count={openNotes.length ? openNotes.length : undefined}>
                {
                    openNotes.length
                        ?
                        <React.Fragment>
                            {
                                openNotes.map(item => <ViewNote
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
                        : <MsgBox emoji="📓">You don't have any active notes!</MsgBox>
                }
            </Card>
            <Card title="Archives" collapsible={true} defaultCollapsed={true} count={doneNotes.length ? doneNotes.length : undefined}>
                {
                    doneNotes.length
                        ?
                        <React.Fragment>
                            {
                                doneNotes.map(item => <ViewNote
                                    key={item.id}
                                    item={item}
                                    oneline={true}
                                    putNote={props.putNote}
                                    readonly={true}
                                />)
                            }
                        </React.Fragment>
                        : <MsgBox emoji="🗃️">You don't have any archived notes!</MsgBox>

                }
            </Card>
        </Wrapper>
    )
}
