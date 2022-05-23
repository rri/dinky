import { PropsWithChildren } from "react"
import { Wrapper } from "./Wrapper"
import styles from "../styles/InfoBox.module.css"

interface Props {}

export function InfoBox(props: PropsWithChildren<Props>) {

    return (
        <Wrapper layout="row" className={styles.main}>
            <p>{props.children}</p>
        </Wrapper>
    )
}
