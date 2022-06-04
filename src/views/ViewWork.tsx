import { useNavigate } from "react-router-dom"
import { Action } from "../models/Action"
import { Work } from "../models/Work"
import { belongsToToday, IdItem } from "../models/Item"
import { Term } from "../models/Term"
import { icons } from "./Icon"
import { ViewItem } from "./ViewItem"

interface Props {
    item: IdItem,
    hideDetails?: boolean,
    today: {
        eveningBufferHours: number,
        morningBufferHours: number,
    },
    icon?: string,
    autoNew?: boolean,
    readonly?: boolean,
    clear?: Action,
    highlight?: Term,
    actionOnDelete?: boolean,
    newWork?: (template?: string) => string,
    putWork: (id: string, item: Work) => boolean,
}

export function ViewWork(props: Props) {

    const navigate = useNavigate()

    const slug = "works"

    const { id, ...item } = props.item

    const actions: Action[] = []

    const today = belongsToToday(props.item, props.today.eveningBufferHours, props.today.morningBufferHours)

    actions.push(
        {
            icon: icons.today,
            desc: today ? "Remove this item from today's agenda" : "Add this item to today's agenda",
            gray: !today,
            action: () => props.putWork(id, { ...item, today: today ? undefined : new Date().toISOString() }),
        },
        {
            icon: icons.tick,
            desc: !props.item.archive ? "Mark this item as done" : "Re-open this item",
            gray: !props.item.archive,
            action: () => props.putWork(id, { ...item, archive: !props.item.archive }),
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
                desc: "Go to item details",
                action: details,
            },
        )

    return (
        <ViewItem
            key={id}
            slug={slug}
            item={props.item}
            readonly={props.readonly ? props.readonly : item.archive}
            icon={props.icon}
            oneline={true}
            actions={actions}
            strikethru={false}
            placeholder={"Enter the title of your reading material..."}
            highlight={props.highlight}
            actionOnDelete={props.actionOnDelete ? () => navigate("/" + slug) : undefined}
            autoNew={props.autoNew}
            newWork={props.newWork}
            putWork={props.putWork}
            details={props.hideDetails ? undefined : details}
        />
    )
}
