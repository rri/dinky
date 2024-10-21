import { PropsWithChildren, useState } from "react"
import { Action } from "../models/Action"
import { Button } from "./Button"
import { Wrapper } from "./Wrapper"
import styles from "../styles/Card.module.css"
import { icons } from "./Icon"
import pluralize from "pluralize"

interface Props {
    title?: string,
    actions?: Action[],
    count?: number,
    id?: string,
    defaultCollapsed?: boolean,
    collapsible?: boolean,
}

export function Card(props: PropsWithChildren<Props>) {

    const [collapsed, setCollapsed] = useState(props.collapsible && props.defaultCollapsed ? true : false)

    const toggleCollapseAction = {
        icon: collapsed ? icons.arrowLeft : icons.arrowDown,
        desc: collapsed ? "Click to open" : "Click to close",
        action: () => collapsed ? setCollapsed(false) : setCollapsed(true),
    }

    const useToggleAction = !props.actions && props.collapsible

    return (
        <Wrapper layout="col" className={styles.main}>
            {props.title &&
                <div className={[styles.titlebar, useToggleAction ? styles.link : ""].join(" ")} id={props.id} onClick={useToggleAction ? toggleCollapseAction.action : undefined}>
                    <div className={styles.title}>{props.title}</div>
                    {props.count
                        && <div className={styles.info}>({pluralize("items", props.count, true)})</div>}
                    {props.actions
                        && props.actions.map((action, index) => <div key={index} className={styles.button}><Button {...action} /></div>)}
                    {useToggleAction
                        && <div className={styles.button}><Button {...toggleCollapseAction} /></div>}
                </div>}
            {
                collapsed
                    ? <div className={styles.empty}></div>
                    : <div className={styles.content}>{props.children}</div>
            }
        </Wrapper >
    )
}
