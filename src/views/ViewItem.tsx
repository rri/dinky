import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useState } from "react"
import { Action } from '../models/Action'
import { Note } from '../models/Note'
import { Tag } from '../models/Tag'
import { Task } from '../models/Task'
import { IdItem } from "../models/Item"
import { Term } from '../models/Term'
import { Button } from './Button'
import { Icon } from './Icon'
import { Wrapper } from "./Wrapper"
import { v4 } from 'uuid'
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
    newTask?: (template?: string) => void,
    newTag?: (template?: string) => void,
    newNote?: (template?: string) => void,
    putTask?: (id: string, item: Task) => boolean,
    putTag?: (id: string, item: Tag) => boolean,
    putNote?: (id: string, item: Note) => boolean,
}

export function ViewItem(props: Props) {

    let dirty = !props.item.created // Guard that ensures the update only fires once

    const [edit, setEdit] = useState(!props.item.created)

    const updateItem = (update: string, more: boolean) => {
        const drafting = !props.item.created
        if (dirty && (!update || (update !== props.item.data))) {
            const { id, ...item } = props.item
            switch (props.slug) {
                case "tasks":
                    if (props.putTask) {
                        const putTask = props.putTask
                        const [first, ...rest] = update.split(/\r?\n/).filter(val => !!val)
                        const exists = putTask(id, { ...item, data: first })

                        if (rest) {
                            rest.forEach(val => putTask(v4(), { ...item, data: val }))
                        }

                        !exists && props.actionOnDelete && props.actionOnDelete()
                    }
                    if (more
                        && props.autoNew
                        && drafting
                        && update
                        && props.newTask) {
                        props.newTask()
                    }
                    break
                case "tags":
                    if (props.putTag) {
                        const putTag = props.putTag
                        const [first, ...rest] = update.split(/\r?\n/).filter(val => !!val)
                        const exists = putTag(id, { ...item, data: first })

                        if (rest) {
                            rest.forEach(val => putTag(v4(), { ...item, data: val }))
                        }

                        !exists && props.actionOnDelete && props.actionOnDelete()
                    }
                    if (more
                        && props.autoNew
                        && drafting
                        && update
                        && props.newTag) {
                        props.newTag()
                    }
                    break
                case "notes":
                    if (props.putNote) {
                        const exists = props.putNote(id, { ...item, data: update })
                        !exists && props.actionOnDelete && props.actionOnDelete()
                    }
                    if (more
                        && props.autoNew
                        && drafting
                        && update
                        && props.newNote) {
                        props.newNote()
                    }
                    break
            }
        }
        dirty = false
        setEdit(false)
    }

    const enrich = (source: string) => source.replaceAll(/#([^\s]+\w)/g, "**`#$1`**")

    const item = edit && !props.readonly
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
            ].join(" ")}
            onClick={() => { (props.readonly && props.details) ? props.details() : setEdit(true) }}>
            <ReactMarkdown
                children={enrich(props.item.data)}
                remarkPlugins={[remarkGfm]}
            />
        </div>

    return (
        <Wrapper layout="row" className={[styles.main, props.strikethru ? styles.strikethru : ""].join(" ")}>
            {props.icon && <Icon icon={props.icon} />}
            {item}
            {props.actions.map(action => <Button key={action.icon} {...action} />)}
        </Wrapper >
    )
}
