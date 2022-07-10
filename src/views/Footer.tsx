import { Wrapper } from "./Wrapper"
import styles from "../styles/Footer.module.css"

export function Footer() {
    return (
        <Wrapper layout="row" className={styles.main}>
            <div className={styles.copyright}>&#169; <a href="https://optimix.dev" title="Optimix Blog">Ramnath R Iyer</a></div>
            <div className={styles.dot}>&middot;</div>
            <div className={styles.reload} title="Reload the application" onClick={() => window.location.replace(window.location.href)}>⥯</div>
        </Wrapper>
    )
}
