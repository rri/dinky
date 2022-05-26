import { PropsWithChildren } from "react"
import styles from "../styles/LastSynced.module.css"

interface LastSyncedProps {}
interface LastSyncedDateTimeProps {}

export function LastSynced(props: PropsWithChildren<LastSyncedProps>) {
    return (
        <span className={styles.main}>{props.children}</span>
    )
}

export function LastSyncedDateTime(props: PropsWithChildren<LastSyncedDateTimeProps>) {
    return (
        <span className={styles.when}>{props.children}</span>
    )
}
