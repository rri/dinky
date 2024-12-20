import { memo } from "react"
import { useNavigate } from "react-router-dom"
import { Action } from "../models/Action"
import { Work } from "../models/Work"
import { belongsToToday, Identifiable } from "../models/Item"
import { Term } from "../models/Term"
import { icons } from "./Icon"
import { ViewItem } from "./ViewItem"
import moment from "moment"

interface Props {
    item: Identifiable & Work,
    hideDetails?: boolean,
    icon?: string,
    autoNew?: boolean,
    readonly?: boolean,
    clear?: Action,
    highlight?: Term,
    actionOnDelete?: boolean,
    newWork?: (template?: string) => string,
    putWork: (id: string, item: Work, tombstone?: boolean) => boolean,
    returnURL?: string,
}

export const ViewWork = memo(function ViewWork(props: Props) {

    const navigate = useNavigate()

    const slug = "works"

    const { id, archive, ...item } = props.item

    const actions: Action[] = []

    const today = belongsToToday(props.item)
    const reminder =
        props.item.today                                // date is set
        && moment(props.item.today).isAfter(moment())   // date is in the future
        && !today                                       // date is not "today" (considering buffer hours)

    if (!archive) {
        actions.push(
            {
                icon: reminder ? icons.alarm : icons.today,
                desc: today ? "Remove this item from today's reading" : (reminder ? "Remove from schedule." : "Add this item to today's reading"),
                gray: !reminder && !today,
                action: () => props.putWork(id, { ...item, archive, today: today ? undefined : new Date().toISOString() }),
            },
        )
    }

    actions.push(
        {
            icon: icons.tick,
            desc: !props.item.archive ? "Mark this item as done" : "Re-open this item",
            gray: !props.item.archive,
            action: () => props.putWork(id, { ...item, archive: !archive }),
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
            readonly={props.readonly ? props.readonly : archive}
            icon={props.icon}
            oneline={true}
            metadata={true}
            actions={actions}
            strikethru={false}
            placeholder={"Describe your item as <title> | <primary-author>; <secondary-author>; ..."}
            highlight={props.highlight}
            actionOnDelete={props.actionOnDelete ? () => navigate("/" + slug) : undefined}
            autoNew={props.autoNew}
            newWork={props.newWork}
            putWork={props.putWork}
            details={props.hideDetails ? undefined : details}
            returnURL={props.returnURL}
        />
    )
}, (prevProps, nextProps) => {
    return prevProps.item.data === nextProps.item.data &&
        prevProps.item.archive === nextProps.item.archive &&
        prevProps.item.progress === nextProps.item.progress &&
        prevProps.item.today === nextProps.item.today &&
        prevProps.readonly === nextProps.readonly
})
