import { Tag } from "../models/Tag"
import styles from "../styles/Tag.module.css"

export function TagLabel(tag: Tag) {
    return (
        <div className={styles.label} title={tag.desc}>
            {tag.data}
        </div>
    )
}
