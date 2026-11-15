import { InputHTMLAttributes, PropsWithChildren, useEffect, useRef } from "react"
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

interface NumberSettingProps {
    name: string,
    label: string,
    value: number,
    onSave: (value: number) => void,
}

// A whole-number setting that is saved only when editing is done (on blur or
// Enter), rather than on every keystroke. Escape restores the saved value, and
// so does leaving the field empty or with an invalid value: an intermediate
// state such as an empty field is never saved.
export function NumberSetting(props: NumberSettingProps) {
    const ref = useRef<HTMLInputElement>(null)

    // Reflect changes to the saved value (e.g. from a sync), unless editing.
    useEffect(() => {
        const input = ref.current
        if (input && document.activeElement !== input) {
            input.value = String(props.value)
        }
    }, [props.value])

    const revert = (input: HTMLInputElement) => {
        input.value = String(props.value)
    }

    const commit = (input: HTMLInputElement) => {
        const text = input.value.trim()
        if (!/^\d+$/.test(text)) {
            revert(input)
            return
        }
        const value = parseInt(text, 10)
        input.value = String(value)
        if (value !== props.value) {
            props.onSave(value)
        }
    }

    return (
        <Wrapper layout="row" className={styles.main}>
            <div className={styles.label} title={props.label}>{props.label}</div>
            <input
                ref={ref}
                name={props.name}
                title={props.label}
                type="text"
                inputMode="numeric"
                defaultValue={String(props.value)}
                onBlur={evt => commit(evt.currentTarget)}
                onKeyDown={evt => {
                    if (evt.key === "Enter") {
                        evt.preventDefault()
                        commit(evt.currentTarget)
                    } else if (evt.key === "Escape") {
                        evt.preventDefault()
                        revert(evt.currentTarget)
                        evt.currentTarget.blur()
                    }
                }}
            />
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
