import { useNavigate } from "react-router-dom"
import { Action } from "../models/Action"
import { Note } from "../models/Note"
import { IdItem } from "../models/Item"
import { Term } from "../models/Term"
import { icons } from "./Icon"
import { ViewItem } from "./ViewItem"

interface Props {
    item: IdItem,
    hideDetails?: boolean,
    icon?: string,
    autoNew?: boolean,
    clear?: Action,
    highlight?: Term,
    actionOnDelete?: boolean,
    newNote?: (template?: string) => void,
    putNote: (id: string, item: Note) => boolean,
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
            strikethru={props.item.archive}
            icon={props.icon}
            rows={3}
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
