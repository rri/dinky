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
        if (idx < max) {
            segments.push(<div
                key={idx}
                className={[styles.segment, styles.progress].join(" ")}
                onClick={() => props.action(val)}
            ></div>)
        } else {
            segments.push(<div
                key={idx}
                className={[styles.segment, styles.none].join(" ")}
                onClick={() => props.action(val)}
            ></div>)
        }
    }
    return (
        <Wrapper layout="row" className={styles.main}>
            <div className={[styles.segment, styles.zero].join(" ")} onClick={() => props.action(false)}>🎬</div>
            {segments}
            <div className={[styles.segment, styles.done].join(" ")} onClick={() => props.action(true)}>💯</div>
        </Wrapper >
    )
}
