import { InputHTMLAttributes, PropsWithChildren } from "react"
import { Wrapper } from "./Wrapper"
import { Icon } from "./Icon"
import styles from "../styles/Settings.module.css"
import { Shortcut } from "./Shortcuts"

interface GroupProps {}

interface SettingProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string,
}

interface ActionLinkProps extends InputHTMLAttributes<HTMLAnchorElement> {
    icon: string,
    shortcuts: string[],
}

export function SettingList(props: PropsWithChildren<GroupProps>) {
    return (
        <Wrapper layout="col" className={styles.group}>
            {props.children}
        </Wrapper>
    )
}

export function Setting(props: SettingProps) {
    const { label, ...rest } = props
    return (
        <Wrapper layout="row" className={styles.main}>
            <div className={styles.label}>{label}</div>
            <input {...rest} />
        </Wrapper>
    )
}

export function ActionLink(props: ActionLinkProps) {
    const { ...rest } = props
    return (
        <Wrapper layout="row" className={styles.main}>
            <a {...rest} className={styles.link}>
                <Icon icon={props.icon} />
                {rest.children}
                <div className={styles.shortcuts}><Shortcut codes={props.shortcuts} /></div>
            </a>
        </Wrapper>
    )
}
