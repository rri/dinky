import { useNavigate } from "react-router-dom"
import { Action } from "../models/Action"
import { IdItem } from "../models/Item"
import { Topic } from "../models/Topic"
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
    newTopic?: (template?: string) => string,
    putTopic?: (id: string, item: Topic) => boolean,
}

export function ViewTopic(props: Props) {

    const navigate = useNavigate()

    const slug = "topics"

    const actions: Action[] = [
        {
            icon: icons.notes,
            desc: "Create a note associated with this topic",
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
                desc: "Go to topic details",
                action: details,
            })

    return (
        <ViewItem
            key={props.item.id}
            slug={slug}
            item={props.item}
            oneline={true}
            readonly={props.readonly}
            actions={actions}
            strikethru={props.item.archive}
            placeholder={"Describe your topic..."}
            highlight={props.highlight}
            actionOnDelete={props.actionOnDelete ? () => navigate("/" + slug) : undefined}
            autoNew={props.autoNew}
            newTopic={props.newTopic}
            putTopic={props.putTopic}
            details={props.hideDetails ? undefined : details}
        />
    )
}
