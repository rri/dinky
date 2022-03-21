import { NavLink } from "react-router-dom"
import { Action } from "../models/Action"
import { Banner } from "./Banner"
import { Logo } from "./Logo"
import { Wrapper } from "./Wrapper"
import styles from "../styles/Header.module.css"

interface Props {
    clear: Action,
}

export function Header(props: Props) {
    return (
        <NavLink to="/" title="Go home" aria-label="dinky.dev home" onClick={props.clear.action}>
            <Wrapper layout="row" className={styles.main}>
                <Logo />
                <Banner />
            </Wrapper>
        </NavLink>
    )
}
