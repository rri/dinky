import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Wrapper } from "./Wrapper"
import { renderLink } from './Link'
import styles from "../styles/Doc.module.css"

interface Props {
    markdown: string,
}

export function Doc(props: Props) {

    return (
        <Wrapper layout="col" className={styles.main}>
            <ReactMarkdown
                children={props.markdown}
                remarkPlugins={[remarkGfm]}
                components={{
                    a: renderLink
                }}
            />
        </Wrapper>
    )
}
