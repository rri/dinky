import { useParams } from "react-router-dom"
import { Action } from "../models/Action"
import { Note } from "../models/Note"
import { Card } from "../views/Card"
import { MsgBox } from "../views/MsgBox"
import { Wrapper } from "../views/Wrapper"
import { ViewNote } from "../views/ViewNote"

interface Props {
    notes: Record<string, Note>,
    topAction: Action,
    putNote: (id: string, item: Note) => boolean,
}

export function NoteDetails(props: Props) {

    const { id } = useParams()
    const item = id ? { ...props.notes[id], id } : undefined

    return (
        <Wrapper layout="col">
            <Card title="Note Details" action={props.topAction}>
                {
                    item?.id
                        ? <ViewNote
                            item={item}
                            putNote={props.putNote}
                            hideDetails={true}
                            actionOnDelete={true}
                        />
                        : <MsgBox emoji="🚫">The note you're looking for cannot be found!</MsgBox>
                }
            </Card>
        </Wrapper >
    )
}
