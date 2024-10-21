import { useParams } from "react-router-dom"
import { Action } from "../models/Action"
import { Note } from "../models/Note"
import { Card } from "../views/Card"
import { MsgBox } from "../views/MsgBox"
import { Wrapper } from "../views/Wrapper"
import { ViewNote } from "../views/ViewNote"
import { InfoBox } from "../views/InfoBox"

interface Props {
    notes: Record<string, Note>,
    killAction: (action: () => void, undo?: boolean) => Action,
    backAction: Action,
    putNote: (id: string, item: Note, tombstone?: boolean) => boolean,
}

export function NoteDetails(props: Props) {

    const { id } = useParams()
    const found: boolean = id ? !!props.notes[id] : false
    const item = id ? { ...props.notes[id], id } : undefined

    const killAction = props.killAction(() => id && item && found && props.putNote(id, item, !item?.deleted), !!item?.deleted)

    return (
        <Wrapper layout="col">
            <Card title="Note Details" actions={[killAction, props.backAction]}>
                {
                    item && found && item.deleted
                        ? <InfoBox> Careful! This item is currently in your trash.</InfoBox>
                        : undefined
                }
                {
                    item && found
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
