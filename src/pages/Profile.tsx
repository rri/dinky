import moment from "moment"
import { NavLink } from "react-router-dom"
import { DisplaySettings, DisplayTheme } from "../models/DisplaySettings"
import { RetentionSettings } from "../models/RetentionSettings"
import { Settings } from "../models/Settings"
import { StorageSettings } from "../models/StorageSettings"
import { Card } from "../views/Card"
import { icons } from "../views/Icon"
import { InfoBox } from "../views/InfoBox"
import { LastSynced, LastSyncedDateTime } from "../views/LastSynced"
import { ActionLink, OptionSetting, Setting, SettingList } from "../views/Settings"
import { Wrapper } from "../views/Wrapper"

interface Props {
    settings: Settings,
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

    const updateCloudSync = (s3Bucket: string,
        awsAccessKey: string,
        awsSecretKey: string,
        awsRegion: string,
        syncOnLoad: boolean,
        periodMinutes: number,
        autoPushItems: boolean) => {
        props.putStorageSettings({
            s3Bucket,
            awsAccessKey,
            awsSecretKey,
            awsRegion,
            syncOnLoad,
            periodMinutes,
            autoPushItems,
        })
    }

    const s3Bucket = props.settings.storage.s3Bucket || ""
    const awsAccessKey = props.settings.storage.awsAccessKey || ""
    const awsSecretKey = props.settings.storage.awsSecretKey || ""
    const awsRegion = props.settings.storage.awsRegion || ""
    const syncOnLoad = props.settings.storage.syncOnLoad || false
    const periodMinutes = props.settings.storage.periodMinutes || 0
    const autoPushItems = props.settings.storage.autoPushItems || false

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
                    <OptionSetting label="Sync on page load?" values={[
                        {
                            label: "Yes",
                            action: () => updateCloudSync(s3Bucket,
                                awsAccessKey,
                                awsSecretKey,
                                awsRegion,
                                true,
                                periodMinutes,
                                autoPushItems),
                            checked: syncOnLoad,
                        },
                        {
                            label: "No",
                            action: () => updateCloudSync(s3Bucket,
                                awsAccessKey,
                                awsSecretKey,
                                awsRegion,
                                false,
                                periodMinutes,
                                autoPushItems),
                            checked: !syncOnLoad,
                        },
                    ]}></OptionSetting>
                    <Setting
                        label="Auto sync (minutes)"
                        onChange={evt => updateCloudSync(s3Bucket,
                            awsAccessKey,
                            awsSecretKey,
                            awsRegion,
                            syncOnLoad,
                            parseInt(evt.currentTarget.value),
                            autoPushItems)}
                        type="number"
                        min={0}
                        value={periodMinutes || 0}
                    />
                    <OptionSetting label="Auto push items?" values={[
                        {
                            label: "Yes",
                            action: () => updateCloudSync(s3Bucket,
                                awsAccessKey,
                                awsSecretKey,
                                awsRegion,
                                syncOnLoad,
                                periodMinutes,
                                true),
                            checked: autoPushItems,
                        },
                        {
                            label: "No",
                            action: () => updateCloudSync(s3Bucket,
                                awsAccessKey,
                                awsSecretKey,
                                awsRegion,
                                syncOnLoad,
                                periodMinutes,
                                false),
                            checked: !autoPushItems,
                        },
                    ]}></OptionSetting>
                    <InfoBox>Provide your AWS settings (<NavLink to="/help" aria-label="Help">help</NavLink>).</InfoBox>
                    <Setting
                        label="S3 Bucket"
                        type="text"
                        value={s3Bucket}
                        onChange={evt => updateCloudSync(evt.currentTarget.value, awsAccessKey, awsSecretKey, awsRegion, syncOnLoad, periodMinutes, autoPushItems)}
                        onBlur={() => updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion, syncOnLoad, periodMinutes, autoPushItems)}
                        onKeyDownCapture={evt => evt.code === "Enter" && updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion, syncOnLoad, periodMinutes, autoPushItems)}
                    />
                    <Setting
                        label="Access Key"
                        type="text"
                        value={awsAccessKey}
                        onChange={evt => updateCloudSync(s3Bucket, evt.currentTarget.value, awsSecretKey, awsRegion, syncOnLoad, periodMinutes, autoPushItems)}
                        onBlur={() => updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion, syncOnLoad, periodMinutes, autoPushItems)
                        }
                        onKeyDownCapture={evt => evt.code === "Enter" && updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion, syncOnLoad, periodMinutes, autoPushItems)}
                    />
                    <Setting
                        label="Secret Key"
                        type="password"
                        value={awsSecretKey}
                        onChange={evt => updateCloudSync(s3Bucket, awsAccessKey, evt.currentTarget.value, awsRegion, syncOnLoad, periodMinutes, autoPushItems)}
                        onBlur={() => updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion, syncOnLoad, periodMinutes, autoPushItems)}
                        onKeyDownCapture={evt => evt.code === "Enter" && updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion, syncOnLoad, periodMinutes, autoPushItems)}
                    />
                    <Setting
                        label="Region"
                        type="text"
                        placeholder="us-west-2"
                        value={awsRegion}
                        onChange={evt => updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, evt.currentTarget.value, syncOnLoad, periodMinutes, autoPushItems)}
                        onBlur={() => updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion, syncOnLoad, periodMinutes, autoPushItems)}
                        onKeyDownCapture={evt => evt.code === "Enter" && updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion, syncOnLoad, periodMinutes, autoPushItems)}
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
