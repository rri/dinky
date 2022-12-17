import { InputHTMLAttributes, PropsWithChildren } from "react"
import { Wrapper } from "./Wrapper"
import { Icon } from "./Icon"
import { Shortcut } from "./Shortcuts"
import styles from "../styles/Settings.module.css"

interface Option {
    label: string,
    checked?: boolean,
    action: () => void,
}

interface GroupProps {
    label?: string,
}

interface SettingProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string,
}

interface OptionProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string,
    values: Option[],
}

interface ActionLinkProps extends InputHTMLAttributes<HTMLAnchorElement> {
    icon: string,
    shortcuts: string[],
}

interface ActionButtonProps extends InputHTMLAttributes<HTMLInputElement> { }

export function SettingList(props: PropsWithChildren<GroupProps>) {
    return (
        <Wrapper layout="col" className={styles.group}>
            {props.label && <div className={styles.label}>{props.label}</div>}
            {props.children}
        </Wrapper>
    )
}

export function Setting(props: SettingProps) {
    const { label, ...rest } = props
    return (
        <Wrapper layout="row" className={styles.main}>
            <div className={styles.label} title={label}>{label}</div>
            <input {...rest} title={label} />
        </Wrapper>
    )
}

export function OptionSetting(props: OptionProps) {
    const { label, ...rest } = props
    return (
        <Wrapper layout="row" className={styles.main}>
            <div className={styles.label} title={label}>{label}</div>
            <div className={styles.optionGroup}>
                {props.values.map(opt => (
                    <label key={opt.label} className={styles.option}>
                        <input
                            name={label}
                            title={label}
                            type="radio"
                            onChange={opt.action}
                            checked={opt.checked}
                            {...rest}
                        /> {opt.label}
                    </label>
                ))}
            </div>
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

export function ActionButton(props: ActionButtonProps) {
    const { ...rest } = props
    return (
        <Wrapper layout="row" className={styles.main}>
            <input {...rest} className={styles.button} type="button">
                {rest.children}
            </input>
        </Wrapper>
    )
}
