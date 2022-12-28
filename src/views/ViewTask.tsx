import { useNavigate } from "react-router-dom"
import { Action } from "../models/Action"
import { Task } from "../models/Task"
import { belongsToToday, Id } from "../models/Item"
import { Term } from "../models/Term"
import { icons } from "./Icon"
import { ViewItem } from "./ViewItem"
import moment from "moment"

interface Props {
    item: Id & Task,
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
    newTask?: (template?: string) => string,
    putTask: (id: string, item: Task) => boolean,
    returnURL?: string,
}

export function ViewTask(props: Props) {

    const navigate = useNavigate()

    const slug = "tasks"

    const { id, archive, ...item } = props.item

    const actions: Action[] = []

    const today = belongsToToday(props.item, props.today.eveningBufferHours, props.today.morningBufferHours)
    const reminder =
        props.item.today                                // date is set
        && moment(props.item.today).isAfter(moment())   // date is in the future
        && !today                                       // date is not "today" (considering buffer hours)

    if (!archive) {
        actions.push(
            {
                icon: reminder ? icons.alarm : icons.today,
                desc: today ? "Remove this task from today's agenda" : (reminder ? "Remove from schedule." : "Add this task to today's agenda"),
                gray: !reminder && !today,
                action: () => props.putTask(id, { ...item, today: today ? undefined : new Date().toISOString() }),
            },
        )
    }
    actions.push(
        {
            icon: icons.tick,
            desc: !props.item.archive ? "Mark this task as done" : "Re-open this task",
            gray: !props.item.archive,
            action: () => props.putTask(id, { ...item, archive: !props.item.archive }),
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
                desc: "Go to task details",
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
            actions={actions}
            strikethru={archive}
            placeholder={"Describe your task..."}
            highlight={props.highlight}
            actionOnDelete={props.actionOnDelete ? () => navigate("/" + slug) : undefined}
            autoNew={props.autoNew}
            newTask={props.newTask}
            putTask={props.putTask}
            details={props.hideDetails ? undefined : details}
            returnURL={props.returnURL}
        />
    )
}
