import { Wrapper } from "./Wrapper"
import styles from "../styles/ProgressBar.module.css"
import { Progress } from "../models/Item";

interface Props {
    archive?: boolean,
    progress?: Progress,
    action: (val: Progress | boolean) => void,
}

export function ProgressBar(props: Props) {
    const max = props.archive ? 10 : (props.progress !== undefined ? props.progress : 0)
    const segments = [];
    for (let idx = 0; idx < 10; idx++) {
        let val: Progress | boolean = false
        switch (idx) {
            case 0: val = 1; break
            case 1: val = 2; break
            case 2: val = 3; break
            case 3: val = 4; break
            case 4: val = 5; break
            case 5: val = 6; break
            case 6: val = 7; break
            case 7: val = 8; break
            case 8: val = 9; break
            case 9: val = true; break
        }
        const label = idx === 9 ? "Mark as done (100%)" : `Set progress to ${(idx + 1) * 10}%`
        segments.push(<button
            type="button"
            key={idx}
            className={[styles.segment, idx < max ? styles.progress : styles.none].join(" ")}
            title={label}
            aria-label={label}
            onClick={() => props.action(val)}
        ></button>)
    }
    return (
        <Wrapper layout="row" className={styles.main} role="group" aria-label={`Progress: ${max * 10}%`}>
            <button type="button" className={[styles.segment, styles.zero].join(" ")} title="Reset progress" aria-label="Reset progress" onClick={() => props.action(false)}>🎬</button>
            {segments}
            <button type="button" className={[styles.segment, styles.done].join(" ")} title="Mark as done" aria-label="Mark as done" onClick={() => props.action(true)}>💯</button>
        </Wrapper >
    )
}
