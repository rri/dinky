import React from "react"
import { sortByCreated, sortByUpdated } from "../models/Item"
import { fetchWorks, Work } from "../models/Work"
import { Card } from "../views/Card"
import { MsgBox } from "../views/MsgBox"
import { Wrapper } from "../views/Wrapper"
import { ViewWork } from "../views/ViewWork"
import { icons } from "../views/Icon"

interface Props {
    works: Record<string, Work>,

    newWork: (template?: string) => string,
    putWork: (id: string, item: Work, tombstone?: boolean) => boolean,
    registerNewHandler: (handler: (evt?: KeyboardEvent) => void) => void,
}

export function Works(props: Props) {

    props.registerNewHandler((evt?: KeyboardEvent) => {
        evt?.preventDefault()
        props.newWork()
    })

    const openWorks = fetchWorks({
        works: props.works,
        archive: false,
        sortBy: [sortByCreated(true)],
    })
    const doneWorks = fetchWorks({
        works: props.works,
        archive: true,
        sortBy: [sortByUpdated(true)],
    })

    const newAction = {
        icon: icons.plus,
        desc: "Add a new item to your library",
        action: () => props.newWork()
    }

    return (
        <Wrapper layout="col">
            <Wrapper layout="col">
                <Card title="Library" actions={[newAction]} count={openWorks.length ? openWorks.length : undefined}>
                    {
                        openWorks.length
                            ?
                            <React.Fragment>
                                {
                                    openWorks.map(item => <ViewWork
                                        key={item.id}
                                        item={item}
                                        autoNew={true}
                                        newWork={props.newWork}
                                        putWork={props.putWork}
                                        readonly={true}
                                    />)
                                }
                            </React.Fragment>
                            : <MsgBox emoji="📚">No items in your library!</MsgBox>
                    }
                </Card>
                <Card title="Archives" collapsible={true} defaultCollapsed={true} count={doneWorks.length ? doneWorks.length : undefined}>
                    {
                        doneWorks.length
                            ?
                            <React.Fragment>
                                {
                                    doneWorks.map(item => <ViewWork
                                        key={item.id}
                                        item={item}
                                        putWork={props.putWork}
                                        readonly={true}
                                    />)
                                }
                            </React.Fragment>
                            : <MsgBox emoji="🤷">Waiting for you finish something!</MsgBox>

                    }
                </Card>
            </Wrapper>
        </Wrapper >
    )
}
