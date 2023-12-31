import { NavLink } from "react-router-dom"
import { Action } from "../models/Action"
import { Wrapper } from "./Wrapper"
import styles from "../styles/PageNavItem.module.css"

interface Props {
    name: string,
    slug: string,
    icon: string,
    clear: Action,
}

export function PageNavItem(props: Props) {
    return (
        <Wrapper layout="row">
            <NavLink
                className={({ isActive }) =>
                    isActive
                        ? [styles.main, styles.active].join(" ")
                        : styles.main}
                to={props.slug}
                title={props.name}
                onClick={props.clear.action}
            >
                <img className={styles.icon} src={props.icon} alt={props.name} />
                <div className={styles.name}>{props.name}</div>
            </NavLink>
        </Wrapper>
    )
}
