import { Action } from "../models/Action"
import styles from "../styles/Button.module.css"

export function Button(props: Action) {
    const img = <img
        className={[styles.icon, props.gray ? styles.gray : ""].join(" ")}
        src={props.icon}
        alt={props.desc}
        title={props.desc}
        onClick={props.action}
    />
    return (
        props.label ?
            <div className={styles.label} title={props.desc} onClick={props.action}>
                {img}
                {props.label}
            </div>
            : img
    )
}
