import React from "react"
import { sortByCreated, sortByUpdated } from "../models/Item"
import { fetchTags, Tag } from "../models/Tag"
import { Card } from "../views/Card"
import { MsgBox } from "../views/MsgBox"
import { Wrapper } from "../views/Wrapper"
import { ViewTag } from "../views/ViewTag"
import { icons } from "../views/Icon"

interface Props {
    tags: Record<string, Tag>,
    newNote: (template?: string) => void,
    newTag: (template?: string) => void,
    putTag: (id: string, item: Tag) => boolean,
    registerNewHandler: (handler: (evt?: KeyboardEvent) => void) => void,
}

export function Tags(props: Props) {

    props.registerNewHandler((evt?: KeyboardEvent) => {
        evt?.preventDefault()
        props.newTag()
    })

    const openTags = fetchTags({
        tags: props.tags,
        archive: false,
        sortBy: sortByCreated(),
    })
    const doneTags = fetchTags({
        tags: props.tags,
        archive: true,
        sortBy: sortByUpdated(),
    })

    const results = openTags.concat(doneTags)

    const action = {
        icon: icons.plus,
        desc: "Add a new task",
        action: () => props.newTag()
    }

    return (
        <Wrapper layout="col">
            <Card title="Tags" action={action}>
                {
                    results.length
                        ?
                        <React.Fragment>
                            {
                                results.map(item => <ViewTag
                                    key={item.id}
                                    item={item}
                                    autoNew={true}
                                    newNote={props.newNote}
                                    newTag={props.newTag}
                                    putTag={props.putTag}
                                />)
                            }
                        </React.Fragment>
                        : <MsgBox emoji="🎺">No tags in your list!</MsgBox>
                }
            </Card>
        </Wrapper>
    )
}
