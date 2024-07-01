import moment from "moment"
import { useParams } from "react-router-dom"
import { Action } from "../models/Action"
import { Task } from "../models/Task"
import { Card } from "../views/Card"
import { MsgBox } from "../views/MsgBox"
import { Wrapper } from "../views/Wrapper"
import { ViewTask } from "../views/ViewTask"
import { Setting, SettingList } from "../views/Settings"

interface Props {
    tasks: Record<string, Task>,
    topAction: Action,
    putTask: (id: string, item: Task) => boolean,
}

export function TaskDetails(props: Props) {

    const { id } = useParams()
    const found: boolean = id ? !!props.tasks[id] : false
    const item = id ? { ...props.tasks[id], id } : undefined

    return (
        <Wrapper layout="col">
            <Card title="Task Details" action={props.topAction}>
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
            {item && found && <Card title="Remind Me">
                <SettingList>
                    <Setting
                        label="Add to agenda on"
                        type="date"
                        value={item.today && moment(item.today).isAfter(moment().startOf("day")) ? moment(item.today).format("YYYY-MM-DD") : ""}
                        min={moment().format("YYYY-MM-DD")}
                        onChange={evt => {
                            const { id, ...rest } = item
                            const selected = moment(evt.currentTarget.value)
                            const today = selected.isSame(new Date(), "day")
                                ? moment().toISOString()
                                : selected.toISOString()
                            props.putTask(id, { ...rest, today: today })
                        }}
                    ></Setting>
                </SettingList>
            </Card>}
        </Wrapper >
    )
}
