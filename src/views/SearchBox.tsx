import { Wrapper } from "./Wrapper"
import styles from "../styles/SearchBox.module.css"

interface Props {
    value: string,
    refs: Record<string, React.RefObject<HTMLInputElement>>,
    action: (term: string) => void,
}

export function SearchBox(props: Props) {
    return (
        <Wrapper layout="row" className={styles.main} wrapClassName={styles.wrap}>
            <input
                className={styles.search}
                name="search"
                type="search"
                value={props.value}
                onChange={evt => props.action(evt.currentTarget.value)}
                onKeyDownCapture={
                    evt => evt.key === "Escape"
                        && !evt.currentTarget.value
                        && evt.currentTarget.blur()
                }
                placeholder="Enter text to search..."
                ref={props.refs.search}
            />
        </Wrapper>
    )
}
