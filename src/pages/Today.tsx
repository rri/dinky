import React from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { filterByToday, sortByReminder, sortByToday } from "../models/Item"
import { fetchTasks, Task } from "../models/Task"
import { fetchWorks, Work } from "../models/Work"
import { Card } from "../views/Card"
import { icons } from "../views/Icon"
import { MsgBox } from "../views/MsgBox"
import { ViewTask } from "../views/ViewTask"
import { ViewWork } from "../views/ViewWork"
import { Wrapper } from "../views/Wrapper"

interface Props {
    tasks: Record<string, Task>,
    works: Record<string, Work>,
    today: {
        eveningBufferHours: number,
        morningBufferHours: number,
    },
    newTask: (template?: string) => string,
    putTask: (id: string, item: Task) => boolean,
    newWork: (template?: string) => string,
    putWork: (id: string, item: Work) => boolean,
    registerNewHandler: (handler: (evt?: KeyboardEvent) => void) => void,
}

export function Today(props: Props) {

    const navigate = useNavigate()

    const newTask = () => {
        props.newTask()
        navigate("/tasks")
    }

    const newWork = () => {
        props.newWork()
        navigate("/works")
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
    const openWorks = fetchWorks({
        works: props.works,
        archive: false,
        sortBy: [sortByToday(), sortByReminder()],
        filterMore: filterByToday(props.today.eveningBufferHours, props.today.morningBufferHours),
    })

    const newTaskAction = {
        icon: icons.listadd,
        desc: "Add a new task to the backlog",
        action: newTask,
    }

    const newWorkAction = {
        icon: icons.listadd,
        desc: "Add a new item to your library",
        action: newWork,
    }

    return (
        <Wrapper layout="col">
            <Wrapper layout="col">
                <Card title="Agenda" action={newTaskAction} count={openTasks.length ? openTasks.length : undefined}>
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
                            : <MsgBox>Add tasks from your <NavLink to="/tasks" title="Go to tasks">backlog</NavLink>!</MsgBox>
                    }
                </Card>
                <Card title="Today's Reading" action={newWorkAction} count={openWorks.length ? openWorks.length : undefined}>
                    {
                        openWorks.length
                            ?
                            <React.Fragment>
                                {
                                    openWorks.map(item => <ViewWork
                                        key={item.id}
                                        item={item}
                                        today={props.today}
                                        newWork={props.newWork}
                                        putWork={props.putWork}
                                        readonly={true}
                                    />)
                                }
                            </React.Fragment>
                            : <MsgBox>Find items in your <NavLink to="/works" title="Go to your library">library</NavLink> to read today!</MsgBox>
                    }
                </Card>
            </Wrapper>
        </Wrapper >
    )
}
