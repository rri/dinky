import { useParams } from "react-router-dom"
import { Action } from "../models/Action"
import { Tag } from "../models/Tag"
import { Card } from "../views/Card"
import { MsgBox } from "../views/MsgBox"
import { Wrapper } from "../views/Wrapper"
import { ViewTag } from "../views/ViewTag"

interface Props {
    tags: Record<string, Tag>,
    topAction: Action,
    newNote: (template?: string) => void,
    putTag: (id: string, item: Tag) => boolean,
}

export function TagDetails(props: Props) {

    const { id } = useParams()
    const item = id ? { ...props.tags[id], id } : undefined

    return (
        <Wrapper layout="col">
            <Card title="Tag Details" action={props.topAction}>
                {
                    item?.data
                        ? <ViewTag
                            item={item}
                            newNote={props.newNote}
                            putTag={props.putTag}
                            hideDetails={true}
                            actionOnDelete={true}
                        />
                        : <MsgBox emoji="🚫">The tag you're looking for cannot be found!</MsgBox>
                }
            </Card>
        </Wrapper >
    )
}
