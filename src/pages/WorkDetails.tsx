import { useParams } from "react-router-dom"
import { Action } from "../models/Action"
import { Work } from "../models/Work"
import { Card } from "../views/Card"
import { MsgBox } from "../views/MsgBox"
import { Wrapper } from "../views/Wrapper"
import { ViewWork } from "../views/ViewWork"
import { Setting, SettingList } from "../views/Settings"
import { InfoBox } from "../views/InfoBox"

interface Props {
    works: Record<string, Work>,
    killAction: (action: () => void, undo?: boolean) => Action,
    backAction: Action,
    putWork: (id: string, item: Work, tombstone?: boolean) => boolean,
}

export function WorkDetails(props: Props) {

    const { id } = useParams()
    const found: boolean = id ? !!props.works[id] : false
    const item = id ? { ...props.works[id], id } : undefined

    const killAction = props.killAction(() => id && item && found && props.putWork(id, item, !item?.deleted), !!item?.deleted)

    return (
        <Wrapper layout="col">
            <Card title="Item Details" actions={[killAction, props.backAction]}>
                {
                    item && found && item.deleted
                        ? <InfoBox> Careful! This item is currently in your trash.</InfoBox>
                        : undefined
                }
                {
                    item && found
                        ? <ViewWork
                            item={item}
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
                        label="Read this item on"
                        type="date"
                        value={(() => {
                            if (!item.today) return ""
                            const date = new Date(item.today)
                            const now = new Date()
                            now.setHours(0, 0, 0, 0)
                            if (date.getTime() < now.getTime()) return ""
                            return date.toISOString().split('T')[0]
                        })()}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={evt => {
                            const { id, ...rest } = item
                            const val = evt.currentTarget.value
                            if (!val) {
                                props.putWork(id, { ...rest, today: undefined })
                                return
                            }
                            const selected = new Date(val)
                            const now = new Date()
                            const isToday = selected.getUTCFullYear() === now.getFullYear() &&
                                            selected.getUTCMonth() === now.getMonth() &&
                                            selected.getUTCDate() === now.getDate()

                            const today = isToday ? new Date().toISOString() : selected.toISOString()
                            props.putWork(id, { ...rest, today: today })
                        }}
                    ></Setting>
                </SettingList>
            </Card>}
        </Wrapper >
    )
}
