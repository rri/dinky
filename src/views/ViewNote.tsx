import { memo } from "react"
import { useNavigate } from "react-router-dom"
import { Action } from "../models/Action"
import { Note } from "../models/Note"
import { Identifiable } from "../models/Item"
import { Term } from "../models/Term"
import { icons } from "./Icon"
import { ViewItem } from "./ViewItem"

interface Props {
    item: Identifiable & Note,
    hideDetails?: boolean,
    icon?: string,
    oneline?: boolean,
    autoNew?: boolean,
    clear?: Action,
    highlight?: Term,
    readonly?: boolean,
    actionOnDelete?: boolean,
    newNote?: (template?: string) => string,
    putNote: (id: string, item: Note) => boolean,
    returnURL?: string,
}

export const ViewNote = memo(function ViewNote(props: Props) {

    const navigate = useNavigate()

    const slug = "notes"

    const { id, archive, ...item } = props.item

    const actions: Action[] = []

    !props.oneline
        || actions.push(
            {
                icon: !props.item.archive ? icons.archive : icons.unarchive,
                desc: !props.item.archive ? "Archive this note" : "Make this note active again",
                gray: !props.item.archive,
                action: () => props.putNote(id, { ...item, archive: !archive }),
            },
        )

    const details = () => {
        props.clear?.action.apply([])
        navigate("/" + slug + "/" + props.item.id)
    }

    props.hideDetails
        || props.readonly
        || props.item.archive
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
            returnURL={props.returnURL}
        />
    )
}, (prevProps, nextProps) => {
    return prevProps.item.data === nextProps.item.data &&
        prevProps.item.archive === nextProps.item.archive &&
        prevProps.item.progress === nextProps.item.progress &&
        prevProps.readonly === nextProps.readonly
})
