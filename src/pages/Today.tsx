import React from "react"
import { NavLink } from "react-router-dom"
import { filterByToday, sortByToday, sortByUpdated } from "../models/Item"
import { fetchTasks, Task } from "../models/Task"
import { Card } from "../views/Card"
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
}

export function Today(props: Props) {

    const openTasks = fetchTasks({
        tasks: props.tasks,
        archive: false,
        sortBy: sortByToday(),
        filterMore: filterByToday(props.today.eveningBufferHours, props.today.morningBufferHours),
    })
    const doneTasks = fetchTasks({
        tasks: props.tasks,
        archive: true,
        sortBy: sortByUpdated(true),
        filterMore: filterByToday(props.today.eveningBufferHours, props.today.morningBufferHours),
    })

    return (
        <Wrapper layout="col">
            <Wrapper layout="col">
                <Card title="Agenda">
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
