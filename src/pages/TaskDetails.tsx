import { useParams } from "react-router-dom"
import { Action } from "../models/Action"
import { Task } from "../models/Task"
import { Card } from "../views/Card"
import { MsgBox } from "../views/MsgBox"
import { Wrapper } from "../views/Wrapper"
import { ViewTask } from "../views/ViewTask"
import { Setting, SettingList } from "../views/Settings"
import { InfoBox } from "../views/InfoBox"
import { ProgressBar } from "../views/ProgressBar"
import { Progress } from "../models/Item"

interface Props {
    tasks: Record<string, Task>,
    killAction: (action: () => void, undo?: boolean) => Action,
    backAction: Action,
    putTask: (id: string, item: Task, tombstone?: boolean) => boolean,
}

export function TaskDetails(props: Props) {

    const { id } = useParams()
    const found: boolean = id ? !!props.tasks[id] : false
    const item = id ? { ...props.tasks[id], id } : undefined

    const killAction = props.killAction(() => id && item && found && props.putTask(id, item, !item?.deleted), !!item?.deleted)

    const progressAction = (val: Progress | boolean) => {
        if (item && found) {
            if (val === true) {
                props.putTask(item.id, { ...item, progress: undefined, archive: true })
                return
            }
            if (val === false) {
                props.putTask(item.id, { ...item, progress: undefined, archive: false })
                return
            }
            props.putTask(item.id, { ...item, progress: val, archive: false })
            return
        }
    }

    return (
        <Wrapper layout="col">
            <Card title="Task Details" actions={[killAction, props.backAction]}>
                {
                    item && found && item.deleted
                        ? <InfoBox> Careful! This item is currently in your trash.</InfoBox>
                        : undefined
                }
                {
                    item && found
                        ? <ViewTask
                            item={item}
                            putTask={props.putTask}
                            hideDetails={true}
                            actionOnDelete={true}
                        />
                        : <MsgBox emoji="🚫">The task you're looking for cannot be found!</MsgBox>
                }
            </Card>
            {item && found && <Card title="Task Progress">
                <ProgressBar
                    archive={item.archive}
                    progress={item.progress}
                    action={progressAction}
                ></ProgressBar>
            </Card>}
            {item && found && <Card title="Remind Me">
                <SettingList>
                    <Setting
                        label="Add to agenda on"
                        type="date"
                        value={(() => {
                            if (!item.today) return ""
                            const date = new Date(item.today)
                            const now = new Date()
                            now.setHours(0, 0, 0, 0)
                            if (date.getTime() < now.getTime()) return ""
                            return date.toISOString().split('T')[0]
                        })()}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={evt => {
                            const { id, ...rest } = item
                            const val = evt.currentTarget.value
                            if (!val) {
                                props.putTask(id, { ...rest, today: undefined })
                                return
                            }
                            const selected = new Date(val)
                            const now = new Date()
                            const isToday = selected.getUTCFullYear() === now.getFullYear() &&
                                            selected.getUTCMonth() === now.getMonth() &&
                                            selected.getUTCDate() === now.getDate()
                            
                            const today = isToday ? new Date().toISOString() : selected.toISOString()
                            props.putTask(id, { ...rest, today: today })
                        }}
                    ></Setting>
                </SettingList>
            </Card>}
        </Wrapper >
    )
}
