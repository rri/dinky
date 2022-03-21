import { Wrapper } from "./Wrapper"
import styles from "../styles/Footer.module.css"

export function Footer() {
    return (
        <Wrapper layout="row" className={styles.main}>
            <div className={styles.copyright}>&#169; Ramnath R Iyer</div>
            <div className={styles.dot}>&middot;</div>
            <div className={styles.blog}><a href="https://optimix.dev" title="Optimix Blog">https://optimix.dev</a></div>
        </Wrapper>
    )
}
