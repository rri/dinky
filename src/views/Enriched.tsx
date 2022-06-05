import React, { Children, DetailedHTMLProps, HTMLAttributes } from "react"
import reactStringReplace from "react-string-replace"
import styles from "../styles/Enriched.module.css"

export function Enriched(props: DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>) {
    const children = Children.toArray(props.children)

    const enrich = (source: string) => reactStringReplace(source, /#([a-zA-Z][a-zA-Z0-9-]*\w)/g, match => {
        return <span className={styles.topic}>#{match}</span>
    })

    return (
        <p>{Children.map(children, c => React.isValidElement(c) ? c : enrich(c.toString()))}</p>
    )
}
