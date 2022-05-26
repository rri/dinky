import React from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { filterByToday, sortByReminder, sortByToday, sortByUpdated } from "../models/Item"
import { fetchTasks, Task } from "../models/Task"
import { Card } from "../views/Card"
import { icons } from "../views/Icon"
import { MsgBox } from "../views/MsgBox"
import { ViewTask } from "../views/ViewTask"
import { Wrapper } from "../views/Wrapper"

interface Props {
    tasks: Record<string, Task>,
    today: {
        eveningBufferHours: number,
        morningBufferHours: number,
    },
    newTask: (template?: string) => string,
    putTask: (id: string, item: Task) => boolean,
    registerNewHandler: (handler: (evt?: KeyboardEvent) => void) => void,
}

export function Today(props: Props) {

    const navigate = useNavigate()

    const newTask = () => {
        props.newTask()
        navigate("/tasks")
    }

    props.registerNewHandler((evt?: KeyboardEvent) => {
        evt?.preventDefault()
        newTask()
    })

    const openTasks = fetchTasks({
        tasks: props.tasks,
        archive: false,
        sortBy: [sortByToday(), sortByReminder()],
        filterMore: filterByToday(props.today.eveningBufferHours, props.today.morningBufferHours),
    })
    const doneTasks = fetchTasks({
        tasks: props.tasks,
        archive: true,
        sortBy: [sortByUpdated(true)],
        filterMore: filterByToday(props.today.eveningBufferHours, props.today.morningBufferHours),
    })

    const action = {
        icon: icons.listadd,
        desc: "Add a new task to the backlog",
        action: newTask
    }

    return (
        <Wrapper layout="col">
            <Wrapper layout="col">
                <Card title="Agenda" action={action}>
                    {
                        openTasks.length
                            ?
                            <React.Fragment>
                                {
                                    openTasks.map(item => <ViewTask
                                        key={item.id}
                                        item={item}
                                        today={props.today}
                                        newTask={props.newTask}
                                        putTask={props.putTask}
                                        readonly={true}
                                    />)
                                }
                            </React.Fragment>
                            : doneTasks.length
                                ? < MsgBox emoji="🍷">All done for today (or find more <NavLink to="/tasks" title="Go to tasks">tasks</NavLink>)! </MsgBox>
                                : < MsgBox emoji="🏄">Pick tasks from your <NavLink to="/tasks" title="Go to tasks">backlog</NavLink> to get done today!</MsgBox>
                    }
                </Card>
                <Card title="Done">
                    {
                        doneTasks.length
                            ?
                            <React.Fragment>
                                {
                                    doneTasks.map(item => <ViewTask
                                        key={item.id}
                                        item={item}
                                        today={props.today}
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
