import { Wrapper } from "./Wrapper"
import styles from "../styles/Spacer.module.css"

export function Spacer() {
    return (
        <Wrapper layout="row" wrapClassName={styles.wrap} />
    )
}
