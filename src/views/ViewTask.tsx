import { memo } from "react"
import { useNavigate } from "react-router-dom"
import { Action } from "../models/Action"
import { Task } from "../models/Task"
import { belongsToToday, Identifiable } from "../models/Item"
import { Term } from "../models/Term"
import { icons } from "./Icon"
import { ViewItem } from "./ViewItem"
import moment from "moment"
import { Tag } from "../models/Tag"

interface Props {
    item: Identifiable & Task,
    hideDetails?: boolean,
    icon?: string,
    autoNew?: boolean,
    readonly?: boolean,
    clear?: Action,
    highlight?: Term,
    actionOnDelete?: boolean,
    newTask?: (template?: string) => string,
    putTask: (id: string, item: Task, tombstone?: boolean) => boolean,
    returnURL?: string,
}

export const ViewTask = memo(function ViewTask(props: Props) {

    const navigate = useNavigate()

    const slug = "tasks"

    const { id, archive, ...item } = props.item

    const tags: Tag[] = []
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
                desc: today ? "Remove this task from today's agenda" : (reminder ? "Remove from schedule." : "Add this task to today's agenda"),
                gray: !reminder && !today,
                action: () => props.putTask(id, { ...item, today: today ? undefined : new Date().toISOString() }),
            },
        )
        if (item.progress !== undefined) {
            const tag = { name: "%", data: "N/A", desc: "% progress so far" };
            switch (item.progress) {
                // Ignore 0
                case 1: tag.data = "10%"; break
                case 2: tag.data = "20%"; break
                case 3: tag.data = "30%"; break
                case 4: tag.data = "40%"; break
                case 5: tag.data = "50%"; break
                case 6: tag.data = "60%"; break
                case 7: tag.data = "70%"; break
                case 8: tag.data = "80%"; break
                case 9: tag.data = "90%"; break
            }
            tags.push(tag)
        }
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
            tags={tags}
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
}, (prevProps, nextProps) => {
    return prevProps.item.data === nextProps.item.data &&
        prevProps.item.archive === nextProps.item.archive &&
        prevProps.item.progress === nextProps.item.progress &&
        prevProps.item.today === nextProps.item.today &&
        prevProps.readonly === nextProps.readonly
})