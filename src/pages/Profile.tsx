import { Settings } from "../models/Settings"
import { StorageSettings } from "../models/StorageSettings"
import { TodaySettings } from "../models/TodaySettings"
import { Card } from "../views/Card"
import { icons } from "../views/Icon"
import { ActionLink, Setting, SettingList } from "../views/Settings"
import { Wrapper } from "../views/Wrapper"

interface Props {
    settings: Settings,
    putTodaySettings: (value: TodaySettings) => void,
    putStorageSettings: (value: StorageSettings) => void,
    registerExportHandler: (handler: (evt?: KeyboardEvent) => void) => void,
    registerImportHandler: (handler: (evt?: KeyboardEvent) => void) => void,
    exportData: () => void,
    importData: () => void,
}

export function Profile(props: Props) {

    props.registerExportHandler((evt?: KeyboardEvent) => {
        evt?.preventDefault()
        props.exportData()
    })

    props.registerImportHandler((evt?: KeyboardEvent) => {
        evt?.preventDefault()
        props.importData()
    })

    return (
        <Wrapper layout="col">
            <Card title="Agenda Preferences">
                <SettingList>
                    <Setting
                        label="Evening buffer (hours)"
                        onChange={evt => props.putTodaySettings({
                            ...props.settings.today,
                            eveningBufferHours: parseInt(evt.currentTarget.value),
                        })}
                        type="number"
                        min={0}
                        max={24}
                        value={props.settings.today.eveningBufferHours || 0}
                    />
                    <Setting
                        label="Morning buffer (hours)"
                        onChange={evt => props.putTodaySettings({
                            ...props.settings.today,
                            morningBufferHours: parseInt(evt.currentTarget.value),
                        })}
                        type="number"
                        min={0}
                        max={24}
                        value={props.settings.today.morningBufferHours || 0}
                    />
                </SettingList>
            </Card>
            <Card title="Manage Your Data">
                <SettingList>
                    <ActionLink
                        icon={icons.download}
                        shortcuts={["d"]}
                        onClick={props.exportData}>
                        Export a copy of your data
                    </ActionLink>
                    <ActionLink
                        icon={icons.upload}
                        shortcuts={["u"]}
                        onClick={props.importData}>
                        Import data from a file
                    </ActionLink>
                </SettingList>
            </Card>
        </Wrapper >
    )
}
