import React from "react"
import { sortByCreated, sortByUpdated } from "../models/Item"
import { fetchTasks, Task } from "../models/Task"
import { Card } from "../views/Card"
import { MsgBox } from "../views/MsgBox"
import { Wrapper } from "../views/Wrapper"
import { ViewTask } from "../views/ViewTask"
import { icons } from "../views/Icon"

interface Props {
    tasks: Record<string, Task>,
    newTask: (template?: string) => string,
    putTask: (id: string, item: Task, tombstone?: boolean) => boolean,
    killTasks: (makeIdList: () => string[]) => void,
    registerNewHandler: (handler: (evt?: KeyboardEvent) => void) => void,
}

export function Tasks(props: Props) {

    props.registerNewHandler((evt?: KeyboardEvent) => {
        evt?.preventDefault()
        props.newTask()
    })

    const openTasks = fetchTasks({
        tasks: props.tasks,
        archive: false,
        sortBy: [sortByCreated(true)],
    })
    const doneTasks = fetchTasks({
        tasks: props.tasks,
        archive: true,
        sortBy: [sortByUpdated(true)],
    })

    const newAction = {
        icon: icons.plus,
        desc: "Add a new task",
        action: () => props.newTask()
    }

    const delAction = {
        icon: icons.trash,
        desc: "Delete all completed tasks listed below",
        action: () => props.killTasks(() => doneTasks.map(item => item.id))
    }

    return (
        <Wrapper layout="col">
            <Wrapper layout="col">
                <Card title="Backlog" actions={[newAction]} count={openTasks.length ? openTasks.length : undefined}>
                    {
                        openTasks.length
                            ?
                            <React.Fragment>
                                {
                                    openTasks.map(item => <ViewTask
                                        key={item.id}
                                        item={item}
                                        autoNew={true}
                                        newTask={props.newTask}
                                        putTask={props.putTask}
                                        readonly={true}
                                    />)
                                }
                            </React.Fragment>
                            : <MsgBox emoji="🔨">No tasks in your backlog!</MsgBox>
                    }
                </Card>
                <Card title="Done" actions={[delAction]} count={doneTasks.length ? doneTasks.length : undefined}>
                    {
                        doneTasks.length
                            ?
                            <React.Fragment>
                                {
                                    doneTasks.map(item => <ViewTask
                                        key={item.id}
                                        item={item}
                                        putTask={props.putTask}
                                        readonly={true}
                                    />)
                                }
                            </React.Fragment>
                            : <MsgBox emoji="🤷">Waiting for you to get something done!</MsgBox>

                    }
                </Card>
            </Wrapper>
        </Wrapper >
    )
}
