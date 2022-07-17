import { useNavigate } from "react-router-dom"
import { Action } from "../models/Action"
import { Note } from "../models/Note"
import { Id, Item } from "../models/Item"
import { Term } from "../models/Term"
import { icons } from "./Icon"
import { ViewItem } from "./ViewItem"

interface Props {
    item: Id & Item,
    hideDetails?: boolean,
    icon?: string,
    oneline?: boolean,
    autoNew?: boolean,
    clear?: Action,
    highlight?: Term,
    readonly?: boolean,
    actionOnDelete?: boolean,
    newNote?: (template?: string) => string,
    putNote?: (id: string, item: Note) => boolean,
}

export function ViewNote(props: Props) {

    const navigate = useNavigate()

    const slug = "notes"

    const actions: Action[] = []

    const details = () => {
        props.clear?.action.apply([])
        navigate("/" + slug + "/" + props.item.id)
    }

    props.hideDetails
        || props.readonly
        || actions.push(
            {
                icon: icons.more,
                desc: "View this note",
                action: details,
            })

    return (
        <ViewItem
            key={props.item.id}
            slug={slug}
            item={props.item}
            strikethru={false}
            icon={props.icon}
            rows={10}
            oneline={props.oneline}
            readonly={props.readonly}
            actions={actions}
            placeholder={"Start typing your note..."}
            highlight={props.highlight}
            actionOnDelete={props.actionOnDelete ? () => navigate("/" + slug) : undefined}
            autoNew={props.autoNew}
            newNote={props.newNote}
            putNote={props.putNote}
            details={props.hideDetails ? undefined : details}
        />
    )
}
