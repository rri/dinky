import { PropsWithChildren } from "react"
import { Wrapper } from "./Wrapper"
import styles from "../styles/MsgBox.module.css"

interface Props {
    emoji?: string,
}

export function MsgBox(props: PropsWithChildren<Props>) {
    return (
        <Wrapper layout="col" className={styles.main}>
            <p>{props.children}</p>
            {
                props.emoji
                && <div className={styles.emoji}>{props.emoji}</div>
            }
        </Wrapper>
    )
}
