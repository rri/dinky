import moment from "moment"
import { NavLink } from "react-router-dom"
import { DisplaySettings, DisplayTheme } from "../models/DisplaySettings"
import { RetentionSettings } from "../models/RetentionSettings"
import { Settings } from "../models/Settings"
import { StorageSettings } from "../models/StorageSettings"
import { TodaySettings } from "../models/TodaySettings"
import { Card } from "../views/Card"
import { icons } from "../views/Icon"
import { InfoBox } from "../views/InfoBox"
import { LastSynced, LastSyncedDateTime } from "../views/LastSynced"
import { ActionLink, OptionSetting, Setting, SettingList } from "../views/Settings"
import { Wrapper } from "../views/Wrapper"

interface Props {
    settings: Settings,
    putTodaySettings: (value: TodaySettings) => void,
    putRetentionSettings: (value: RetentionSettings) => void,
    putDisplaySettings: (value: DisplaySettings) => void,
    putStorageSettings: (value: StorageSettings) => void,
    registerExportHandler: (handler: (evt?: KeyboardEvent) => void) => void,
    registerImportHandler: (handler: (evt?: KeyboardEvent) => void) => void,
    exportData: () => void,
    importData: () => void,
    sync: () => void,
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

    const updateCloudSync = (s3Bucket?: string, awsAccessKey?: string, awsSecretKey?: string, awsRegion?: string) => {
        props.putStorageSettings({
            s3Bucket,
            awsAccessKey,
            awsSecretKey,
            awsRegion,
        })
    }

    const s3Bucket = props.settings.storage.s3Bucket || ""
    const awsAccessKey = props.settings.storage.awsAccessKey || ""
    const awsSecretKey = props.settings.storage.awsSecretKey || ""
    const awsRegion = props.settings.storage.awsRegion || ""

    const lastSynced = props.settings.storage.lastSynced
        ? moment(props.settings.storage.lastSynced).format("YYYY-MM-DD HH:mm")
        : "never"

    return (
        <Wrapper layout="col">
            <Card title="Cloud Sync" id="cloud-sync" collapsible={true}>
                <SettingList>
                    <LastSynced>Last sync: <LastSyncedDateTime>{lastSynced}</LastSyncedDateTime></LastSynced>
                    <ActionLink
                        icon={icons.cloud}
                        shortcuts={["s"]}
                        onClick={props.sync}>
                        Sync your data now
                    </ActionLink>
                    <InfoBox>Provide your AWS settings below (<NavLink to="/help" aria-label="More Info">more info</NavLink>).</InfoBox>
                    <Setting
                        label="S3 Bucket"
                        type="text"
                        value={s3Bucket}
                        onChange={evt => updateCloudSync(evt.currentTarget.value, awsAccessKey, awsSecretKey, awsRegion)}
                        onBlur={() => updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion)}
                        onKeyDownCapture={evt => evt.code === "Enter" && updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion)}
                    />
                    <Setting
                        label="Access Key"
                        type="text"
                        value={awsAccessKey}
                        onChange={evt => updateCloudSync(s3Bucket, evt.currentTarget.value, awsSecretKey, awsRegion)}
                        onBlur={() => updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion)
                        }
                        onKeyDownCapture={evt => evt.code === "Enter" && updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion)}
                    />
                    <Setting
                        label="Secret Key"
                        type="password"
                        value={awsSecretKey}
                        onChange={evt => updateCloudSync(s3Bucket, awsAccessKey, evt.currentTarget.value, awsRegion)}
                        onBlur={() => updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion)}
                        onKeyDownCapture={evt => evt.code === "Enter" && updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion)}
                    />
                    <Setting
                        label="Region"
                        type="text"
                        placeholder="us-west-2"
                        value={awsRegion}
                        onChange={evt => updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, evt.currentTarget.value)}
                        onBlur={() => updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion)}
                        onKeyDownCapture={evt => evt.code === "Enter" && updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion)}
                    />
                </SettingList>
            </Card>
            <Card title="Display Preferences" id="theme-preferences" collapsible={true}>
                <SettingList>
                    <OptionSetting label="Theme" values={[
                        {
                            label: "Auto",
                            action: () => props.putDisplaySettings({
                                ...props.settings.display,
                                theme: DisplayTheme.Auto,
                            }),
                            checked: props.settings.display.theme === DisplayTheme.Auto,
                        },
                        {
                            label: "Light",
                            action: () => props.putDisplaySettings({
                                ...props.settings.display,
                                theme: DisplayTheme.Light,
                            }),
                            checked: props.settings.display.theme === DisplayTheme.Light,
                        },
                        {
                            label: "Dark",
                            action: () => props.putDisplaySettings({
                                ...props.settings.display,
                                theme: DisplayTheme.Dark,
                            }),
                            checked: props.settings.display.theme === DisplayTheme.Dark,
                        },
                    ]}></OptionSetting>
                </SettingList>
            </Card>
            <Card title="Agenda Preferences" id="agenda-preferences" collapsible={true}>
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
            <Card title="Manage Your Data" id="manage-your-data" collapsible={true}>
                <SettingList>
                    <Setting
                        label="Retention period (days)"
                        onChange={evt => props.putRetentionSettings({
                            ...props.settings.retention,
                            periodDays: parseInt(evt.currentTarget.value),
                        })}
                        type="number"
                        min={0}
                        value={props.settings.retention.periodDays || 0}
                    />
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
