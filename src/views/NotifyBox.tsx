import { Wrapper } from "./Wrapper"
import styles from "../styles/NotifyBox.module.css"

interface Props {
    note?: string,
}

export function NotifyBox(props: Props) {
    if (props.note) {
        return (
            <Wrapper layout="row" className={styles.main} wrapClassName={styles.wrap}>
                {props.note || "Please wait while we take care of some housecleaning..."}
            </Wrapper>
        )
    } else {
        return null
    }
}
