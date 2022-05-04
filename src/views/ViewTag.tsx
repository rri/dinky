import { useNavigate } from "react-router-dom"
import { Action } from "../models/Action"
import { IdItem } from "../models/Item"
import { Tag } from "../models/Tag"
import { Term } from "../models/Term"
import { icons } from "./Icon"
import { ViewItem } from "./ViewItem"

interface Props {
    item: IdItem,
    hideDetails?: boolean,
    autoNew?: boolean,
    clear?: Action,
    highlight?: Term,
    readonly?: boolean,
    actionOnDelete?: boolean,
    newNote: (template?: string) => string,
    newTag?: (template?: string) => string,
    putTag: (id: string, item: Tag) => boolean,
}

export function ViewTag(props: Props) {

    const navigate = useNavigate()

    const slug = "tags"

    const actions: Action[] = [
        {
            icon: icons.notes,
            desc: "Create a note associated with this tag",
            action: () => {
                const id = props.newNote(`\n\n${props.item.data}`)
                navigate(`/notes/${id}`)
            },
        },
    ]

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
                desc: "Go to tag details",
                action: details,
            })

    return (
        <ViewItem
            key={props.item.id}
            slug={slug}
            item={props.item}
            oneline={true}
            actions={actions}
            strikethru={props.item.archive}
            placeholder={"Describe your tag..."}
            highlight={props.highlight}
            actionOnDelete={props.actionOnDelete ? () => navigate("/" + slug) : undefined}
            autoNew={props.autoNew}
            newTag={props.newTag}
            putTag={props.putTag}
            details={props.hideDetails ? undefined : details}
        />
    )
}
