import React from "react"
import { sortByData, sortByUpdated } from "../models/Item"
import { fetchTopics, Topic } from "../models/Topic"
import { Card } from "../views/Card"
import { MsgBox } from "../views/MsgBox"
import { Wrapper } from "../views/Wrapper"
import { ViewTopic } from "../views/ViewTopic"
import { icons } from "../views/Icon"

interface Props {
    topics: Record<string, Topic>,
    newNote: (template?: string) => string,
    newTopic: (template?: string) => string,
    putTopic: (id: string, item: Topic) => boolean,
    registerNewHandler: (handler: (evt?: KeyboardEvent) => void) => void,
}

export function Topics(props: Props) {

    props.registerNewHandler((evt?: KeyboardEvent) => {
        evt?.preventDefault()
        props.newTopic()
    })

    const openTopics = fetchTopics({
        topics: props.topics,
        archive: false,
        sortBy: [sortByData()],
    })
    const doneTopics = fetchTopics({
        topics: props.topics,
        archive: true,
        sortBy: [sortByUpdated(true)],
    })

    const results = openTopics.concat(doneTopics)

    const action = {
        icon: icons.plus,
        desc: "Add a new task",
        action: () => props.newTopic()
    }

    return (
        <Wrapper layout="col">
            <Card title="Topics" action={action}>
                {
                    results.length
                        ?
                        <React.Fragment>
                            {
                                results.map(item => <ViewTopic
                                    key={item.id}
                                    item={item}
                                    readonly={true}
                                    autoNew={true}
                                    newNote={props.newNote}
                                    newTopic={props.newTopic}
                                    putTopic={props.putTopic}
                                />)
                            }
                        </React.Fragment>
                        : <MsgBox emoji="🎺">No topics in your list!</MsgBox>
                }
            </Card>
        </Wrapper>
    )
}
