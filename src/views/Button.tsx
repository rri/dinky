import { Action } from "../models/Action"
import styles from "../styles/Button.module.css"

export function Button(props: Action) {
    const img = <img
        className={[styles.icon, props.gray ? styles.gray : ""].join(" ")}
        src={props.icon}
        alt={props.desc}
    />
    return (
        <button
            type="button"
            className={[styles.button, props.label ? styles.label : ""].join(" ")}
            title={props.desc}
            aria-expanded={props.expanded}
            onClick={props.action}
        >
            {img}
            {props.label}
        </button>
    )
}
