import moment from "moment"
import { useParams } from "react-router-dom"
import { Action } from "../models/Action"
import { Work } from "../models/Work"
import { Card } from "../views/Card"
import { MsgBox } from "../views/MsgBox"
import { Wrapper } from "../views/Wrapper"
import { ViewWork } from "../views/ViewWork"
import { Setting, SettingList } from "../views/Settings"

interface Props {
    works: Record<string, Work>,
    today: {
        eveningBufferHours: number,
        morningBufferHours: number,
    },
    topAction: Action,
    putWork: (id: string, item: Work) => boolean,
}

export function WorkDetails(props: Props) {

    const { id } = useParams()
    const found: boolean = id ? !!props.works[id] : false
    const item = id ? { ...props.works[id], id } : undefined

    return (
        <Wrapper layout="col">
            <Card title="Item Details" action={props.topAction}>
                {
                    item && found
                        ? <ViewWork
                            item={item}
                            today={props.today}
                            putWork={props.putWork}
                            hideDetails={true}
                            actionOnDelete={true}
                        />
                        : <MsgBox emoji="🚫">The item you're looking for cannot be found in your library!</MsgBox>
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
                            props.putWork(id, { ...rest, today: today })
                        }}
                    ></Setting>
                </SettingList>
            </Card>}
        </Wrapper >
    )
}
