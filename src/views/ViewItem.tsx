import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import moment from 'moment'
import React, { useState } from "react"
import { Action } from '../models/Action'
import { Note } from '../models/Note'
import { Topic } from '../models/Topic'
import { Task } from '../models/Task'
import { Work } from '../models/Work'
import { IdItem, Item } from "../models/Item"
import { Term } from '../models/Term'
import { Button } from './Button'
import { Icon } from './Icon'
import { Wrapper } from "./Wrapper"
import { v4 } from 'uuid'
import { Enriched } from './Enriched'
import { Link } from './Link'
import styles from "../styles/ViewItem.module.css"

interface Props {
    slug: string,
    item: IdItem,
    placeholder: string,
    strikethru?: boolean,
    readonly?: boolean,
    icon?: string,
    rows?: number,
    oneline?: boolean,
    actions: Action[],
    highlight?: Term,
    autoNew?: boolean,
    actionOnDelete?: () => void,
    details?: () => void,
    newTask?: (template?: string) => string,
    newTopic?: (template?: string) => string,
    newNote?: (template?: string) => string,
    newWork?: (template?: string) => string,
    putTask?: (id: string, item: Task) => boolean,
    putTopic?: (id: string, item: Topic) => boolean,
    putNote?: (id: string, item: Note) => boolean,
    putWork?: (id: string, item: Work) => boolean,
}

export function ViewItem(props: Props) {

    let dirty = !props.item.created // Guard that ensures the update only fires once

    const [edit, setEdit] = useState(false)

    const putItem = (id: string, item: Item, update: string, slug: string, more?: boolean, autoNew?: boolean, drafting?: boolean, bulkAdd?: boolean, actionOnDelete?: () => void) => {
        const putAction = {
            "tasks": props.putTask,
            "topics": props.putTopic,
            "notes": props.putNote,
            "works": props.putWork,
        }[slug]
        const newAction = {
            "tasks": props.newTask,
            "topics": props.newTopic,
            "notes": props.newNote,
            "works": props.newWork,
        }[slug]

        if (putAction) {
            let exists = false
            if (bulkAdd) {
                const [first, ...rest] = update.split(/\r?\n/).filter(val => !!val)
                exists = putAction(id, { ...item, data: first })
                if (rest) {
                    rest.forEach(val => putAction(v4(), { ...item, data: val }))
                }
            } else {
                exists = putAction(id, { ...item, data: update })
            }
            !exists && actionOnDelete && actionOnDelete()
        }
        if (more
            && autoNew
            && drafting
            && update
            && newAction) {
            newAction()
        }
    }

    const formatData = (data: string): [string, string[]] => {
        const [main, xtra] = data.split(/\s*\|\s*/, 2)
        if (xtra) {
            const [...bits] = xtra.split(/\s*;\s*/)
            return [main, bits]
        } else {
            return [main, []]
        }
    }

    const updateItem = (update: string, more: boolean) => {
        const drafting = !props.item.created
        if (dirty && (!update || (update !== props.item.data))) {
            const { id, ...item } = props.item
            putItem(id,
                item,
                update,
                props.slug,
                more,
                props.autoNew,
                drafting,
                props.oneline,
                props.actionOnDelete
            )
        }
        dirty = false
        setEdit(false)
    }

    const [main, bits] = formatData(props.item.data)

    const item = edit || !props.item.created
        ? <textarea
            autoFocus
            className={[styles.data, styles.edit, props.oneline && (!props.rows || props.rows === 1) ? styles.oneline : ""].join(" ")}
            rows={props.rows ? props.rows : 1}
            spellCheck={false}
            defaultValue={props.item.data}
            placeholder={props.placeholder}
            onBlur={evt => {
                evt.preventDefault()
                updateItem(evt.currentTarget.value, false)
            }}
            onKeyDownCapture={evt => {
                if (evt.key === "Enter" && (!props.rows || props.rows === 1)) {
                    evt.preventDefault()
                    updateItem(evt.currentTarget.value, true)
                    return
                }
                if (evt.key === "Escape") {
                    evt.preventDefault()
                    updateItem(evt.currentTarget.value, false)
                    return
                }
                dirty = true
            }}
        />
        : <div
            className={[
                styles.data,
                props.readonly ? styles.readonly : "",
                props.oneline ? styles.oneline : "",
                props.details ? styles.link : "",
                props.item.today && moment(props.item.today).isAfter(moment()) ? styles.reminder : ""
            ].join(" ")}
            onClick={() => { (props.readonly && props.details) ? props.details() : setEdit(true) }}>
            <ReactMarkdown
                children={main}
                remarkPlugins={[remarkGfm]}
                disallowedElements={props.oneline ? ["hr"] : []}
                components={{
                    a: Link,
                    p: Enriched,
                }}
            />
        </div>

    return (
        <React.Fragment>
            <Wrapper layout="col"
                className={[styles.main, props.strikethru ? styles.strikethru : ""].join(" ")}>
                <Wrapper layout="row">
                    {props.icon && <Icon icon={props.icon} />}
                    {item}
                    {props.actions.map(action => <Button key={action.icon} {...action} />)}
                </Wrapper>
                {
                    !(edit || !props.item.created) &&
                    bits &&
                    bits.length > 0 &&
                    <Wrapper layout="row" className={[
                        styles.bits,
                        styles.data,
                        props.readonly ? styles.readonly : "",
                        props.oneline ? styles.oneline : "",
                        props.details ? styles.link : "",
                    ].join(" ")}
                        onClick={() => { (props.readonly && props.details) ? props.details() : setEdit(true) }}
                    >{bits.map((bit, i) => bit ? <div key={bit + i} className={styles.bit}>{bit}</div> : null)}</Wrapper>
                }
            </Wrapper>
        </React.Fragment>
    )
}
