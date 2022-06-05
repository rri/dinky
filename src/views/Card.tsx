import { PropsWithChildren, useState } from "react"
import { Action } from "../models/Action"
import { Button } from "./Button"
import { Wrapper } from "./Wrapper"
import styles from "../styles/Card.module.css"
import { icons } from "./Icon"

interface Props {
    title?: string,
    action?: Action,
    id?: string,
    defaultCollapsed?: boolean,
    collapsable?: boolean,
}

export function Card(props: PropsWithChildren<Props>) {

    const [collapsed, setCollapsed] = useState(props.collapsable && props.defaultCollapsed ? true : false)

    const toggleCollapseAction: Action = {
        icon: collapsed ? icons.arrowLeft : icons.arrowDown,
        desc: collapsed ? "Click to open" : "Click to close",
        action: () => collapsed ? setCollapsed(false) : setCollapsed(true),
    }

    return (
        <Wrapper layout="col" className={styles.main}>
            {props.title &&
                <div className={styles.titlebar} id={props.id}>
                    <div className={styles.title}>{props.title}</div>
                    {props.action
                        && <div className={styles.button}><Button {...props.action} /></div>}
                    {!props.action && props.collapsable
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
