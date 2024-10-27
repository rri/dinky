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
import { Registry } from "../models/Registry"

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
        autoPushItems: boolean,
        registry: Registry) => {
        props.putStorageSettings({
            s3Bucket,
            awsAccessKey,
            awsSecretKey,
            awsRegion,
            syncOnLoad,
            periodMinutes,
            autoPushItems,
            registry,
        })
    }

    const s3Bucket = props.settings.storage.s3Bucket || ""
    const awsAccessKey = props.settings.storage.awsAccessKey || ""
    const awsSecretKey = props.settings.storage.awsSecretKey || ""
    const awsRegion = props.settings.storage.awsRegion || ""
    const syncOnLoad = props.settings.storage.syncOnLoad || false
    const periodMinutes = props.settings.storage.periodMinutes || 0
    const autoPushItems = props.settings.storage.autoPushItems || false
    const registry = props.settings.storage.registry || { enabled: false, events: {} }

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
                        Fast sync
                    </ActionLink>
                    <ActionLink
                        icon={icons.cloud}
                        shortcuts={["S"]}
                        onClick={props.sync}>
                        Sync and compact data
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
                                autoPushItems,
                                registry),
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
                                autoPushItems,
                                registry),
                            checked: !syncOnLoad,
                        },
                    ]}></OptionSetting>
                    <Setting
                        name="periodMinutes"
                        label="Auto sync (minutes)"
                        onChange={evt => updateCloudSync(s3Bucket,
                            awsAccessKey,
                            awsSecretKey,
                            awsRegion,
                            syncOnLoad,
                            parseInt(evt.currentTarget.value),
                            autoPushItems,
                            registry)}
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
                                true,
                                registry),
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
                                false,
                                registry),
                            checked: !autoPushItems,
                        },
                    ]}></OptionSetting>
                    <InfoBox>Provide your AWS settings (<NavLink to="/help" aria-label="Help">help</NavLink>).</InfoBox>
                    <Setting
                        label="S3 Bucket"
                        name="s3Bucket"
                        type="text"
                        value={s3Bucket}
                        onChange={evt => updateCloudSync(evt.currentTarget.value, awsAccessKey, awsSecretKey, awsRegion, syncOnLoad, periodMinutes, autoPushItems, registry)}
                        onBlur={() => updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion, syncOnLoad, periodMinutes, autoPushItems, registry)}
                        onKeyDownCapture={evt => evt.code === "Enter" && updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion, syncOnLoad, periodMinutes, autoPushItems, registry)}
                    />
                    <Setting
                        label="Access Key"
                        name="awsAccessKey"
                        type="text"
                        value={awsAccessKey}
                        onChange={evt => updateCloudSync(s3Bucket, evt.currentTarget.value, awsSecretKey, awsRegion, syncOnLoad, periodMinutes, autoPushItems, registry)}
                        onBlur={() => updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion, syncOnLoad, periodMinutes, autoPushItems, registry)
                        }
                        onKeyDownCapture={evt => evt.code === "Enter" && updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion, syncOnLoad, periodMinutes, autoPushItems, registry)}
                    />
                    <Setting
                        label="Secret Key"
                        name="awsSecretKey"
                        type="password"
                        value={awsSecretKey}
                        onChange={evt => updateCloudSync(s3Bucket, awsAccessKey, evt.currentTarget.value, awsRegion, syncOnLoad, periodMinutes, autoPushItems, registry)}
                        onBlur={() => updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion, syncOnLoad, periodMinutes, autoPushItems, registry)}
                        onKeyDownCapture={evt => evt.code === "Enter" && updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion, syncOnLoad, periodMinutes, autoPushItems, registry)}
                    />
                    <Setting
                        label="Region"
                        name="awsRegion"
                        type="text"
                        placeholder="us-west-2"
                        value={awsRegion}
                        onChange={evt => updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, evt.currentTarget.value, syncOnLoad, periodMinutes, autoPushItems, registry)}
                        onBlur={() => updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion, syncOnLoad, periodMinutes, autoPushItems, registry)}
                        onKeyDownCapture={evt => evt.code === "Enter" && updateCloudSync(s3Bucket, awsAccessKey, awsSecretKey, awsRegion, syncOnLoad, periodMinutes, autoPushItems, registry)}
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
                        name="periodDays"
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
