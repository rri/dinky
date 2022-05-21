import { PropsWithChildren } from "react"
import { Wrapper } from "./Wrapper"
import styles from "../styles/Info.module.css"

interface Props {
    emoji?: string,
}

export function Info(props: PropsWithChildren<Props>) {
    return (
        <Wrapper layout="row" className={styles.main}>
            {props.emoji && <span className={styles.emoji}>{props.emoji}</span>}<p>{props.children}</p>
        </Wrapper>
    )
}
