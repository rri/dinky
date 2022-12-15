import { Action } from "../models/Action"
import styles from "../styles/Button.module.css"

export function Button(props: Action) {
    return (
        <img
            className={[styles.icon, props.gray ? styles.gray : ""].join(" ")}
            src={props.icon}
            alt={props.desc}
            title={props.desc}
            onClick={props.action}
            onMouseOver={props.showTooltip}
            onMouseLeave={props.hideTooltip}
        />
    )
}
