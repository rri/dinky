import { PropsWithChildren } from "react"
import { Action } from "../models/Action"
import { Button } from "./Button"
import { Wrapper } from "./Wrapper"
import styles from "../styles/Card.module.css"

interface Props {
    title?: string,
    action?: Action,
    id?: string,
}

export function Card(props: PropsWithChildren<Props>) {
    return (
        <Wrapper layout="col" className={styles.main}>
            {props.title &&
                <div className={styles.titlebar} id={props.id}>
                    <div className={styles.title}>{props.title}</div>
                    {props.action
                        && <div className={styles.button}><Button {...props.action} /></div>}
                </div>}
            <div className={styles.content}>{props.children}</div>
        </Wrapper >
    )
}
