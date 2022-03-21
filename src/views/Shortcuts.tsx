import { PropsWithChildren } from "react"
import { Wrapper } from "./Wrapper"
import styles from "../styles/Shortcuts.module.css"

interface GroupProps {
    group: string,
}

interface ShortcutProps {
    codes: string[],
}

export function Shortcut(props: PropsWithChildren<ShortcutProps>) {
    return (
        <Wrapper layout="row" className={styles.main}>
            <div className={styles.codes}>{
                props.codes.length > 0
                    ? props.codes
                        .map(s => <kbd>{s}</kbd>)
                        .reduce((res, code) => <>{res}{" or "}{code}</>)
                    : []
            }</div>
            {props.children && <div className={styles.label}>{props.children}</div>}
        </Wrapper>
    )
}

export function ShortcutList(props: PropsWithChildren<GroupProps>) {
    return (
        <Wrapper layout="col" className={styles.group}>
            <div className={styles.groupname}>{props.group}</div>
            {props.children}
        </Wrapper>
    )
}
