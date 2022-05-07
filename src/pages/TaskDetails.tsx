import { useParams } from "react-router-dom"
import { Action } from "../models/Action"
import { Task } from "../models/Task"
import { Card } from "../views/Card"
import { MsgBox } from "../views/MsgBox"
import { Wrapper } from "../views/Wrapper"
import { ViewTask } from "../views/ViewTask"

interface Props {
    tasks: Record<string, Task>,
    today: {
        eveningBufferHours: number,
        morningBufferHours: number,
    },
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
                            today={props.today}
                            putTask={props.putTask}
                            hideDetails={true}
                            actionOnDelete={true}
                        />
                        : <MsgBox emoji="🚫">The task you're looking for cannot be found!</MsgBox>
                }
            </Card>
        </Wrapper >
    )
}
