import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Wrapper } from "./Wrapper"
import { renderLink } from './Link'
import styles from "../styles/Doc.module.css"

interface Props {
    src: string,
}

export function Doc(props: Props) {

    const [markdown, setMarkdown] = useState("")

    useEffect(() => {
        fetch(props.src)
            .then(res => res.text())
            .then(setMarkdown)
    }, [props.src])

    return (
        <Wrapper layout="col" className={styles.main}>
            <ReactMarkdown
                children={markdown}
                remarkPlugins={[remarkGfm]}
                components={{
                    a: renderLink
                }}
            />
        </Wrapper>
    )
}
