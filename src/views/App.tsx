import React, { useMemo } from "react"
import { useEffect, useState } from "react"
import moment from "moment"
import { GlobalHotKeys } from "react-hotkeys"
import { Action } from "../models/Action"
import { AppState, empty, mergeData } from "../models/AppState"
import { Item } from "../models/Item"
import { Task } from "../models/Task"
import { Note } from "../models/Note"
import { Tag } from "../models/Tag"
import { LocalStore } from "../models/Store"
import { StorageSettings } from "../models/StorageSettings"
import { Term } from "../models/Term"
import { TodaySettings } from "../models/TodaySettings"
import { Footer } from "./Footer"
import { Header } from "./Header"
import { PageContent } from "./PageContent"
import { PageNav } from "./PageNav"
import { SearchBox } from "./SearchBox"
import { Wrapper } from "./Wrapper"
import { useNavigate } from "react-router-dom"
import { icons } from "./Icon"
import { v4 } from "uuid"
import styles from "../styles/App.module.css"

export function App() {

    const navigate = useNavigate()

    const [term, setTerm] = useState<Term>(new Term(""))
    const [data, setData] = useState<AppState>(empty())

    const store = useMemo(() => new LocalStore(setData), [setData])

    const refs: Record<string, React.RefObject<HTMLInputElement>> = {
        search: React.createRef(),
    }

    const back: Action = {
        icon: icons.back,
        desc: "Go back to the previous page",
        action: () => navigate(-1)
    }

    const clear: Action = {
        icon: icons.clear,
        desc: "Clear search results",
        action: () => setTerm(new Term(""))
    }

    const newTask = (template?: string) => {
        const id = v4()
        const item = { data: template || "" }
        setData(prev => {
            const res = { ...prev }
            res.contents.tasks[id] = item
            return res
        })
    }

    const newTag = (template?: string) => {
        const id = v4()
        const item = { data: template || "" }
        setData(prev => {
            const res = { ...prev }
            res.contents.tags[id] = item
            return res
        })
    }

    const newNote = (template?: string) => {
        const id = v4()
        const item = { data: template || "" }
        setData(prev => {
            const res = { ...prev }
            res.contents.notes[id] = item
            return res
        })
    }

    const enrich = <T extends Item,>(item: T): T => {
        return {
            ...item,
            created: item.created ? item.created : moment().toISOString(),
            updated: moment().toISOString(),
            deleted: item.data ? item.deleted : moment().toISOString(),
            archive: item.archive,
            data: item.data,
            today: item.today,
        }
    }

    const createTags = (text: string) => {
        const exp = /#([^\s]+\w)/g
        while (true) {
            const match = exp.exec(text)
            if (match != null) {
                const newTag = match[0]
                if (Object
                    .values(data.contents.tags)
                    .filter(tag => tag.data === newTag)
                    .length === 0) {
                    putTag(v4(), { data: newTag })
                }
            } else {
                break
            }
        }
    }

    const putTodaySettings = (value: TodaySettings) => {
        store.putTodaySettings(value)
    }

    const putStorageSettings = (value: StorageSettings) => {
        store.putStorageSettings(value)
    }

    const putTask = (id: string, item: Task): boolean => {
        const data = item.data.trim()
        if (!data && !item.created) {
            setData(prev => {
                const res = { ...prev }
                delete res.contents.tasks[id]
                return res
            })
        } else {
            data && createTags(data)
            store.putTask(id, enrich(item))
        }
        return !!data
    }

    const putTag = (id: string, item: Tag): boolean => {
        const data = item.data?.trim()
            .replaceAll(/^[# ]+/g, "")
            .replaceAll(/[^a-zA-Z_-]+/g, "-")
        if (!data && !item.created) {
            setData(prev => {
                const res = { ...prev }
                delete res.contents.tags[id]
                return res
            })
        } else {
            store.putTag(id, { ...enrich(item), data: data ? `#${data}` : "" })
        }
        return !!data
    }

    const putNote = (id: string, item: Note): boolean => {
        const data = item.data.trim()
        if (!data && !item.created) {
            setData(prev => {
                const res = { ...prev }
                delete res.contents.notes[id]
                return res
            })
        } else {
            data && createTags(data)
            store.putNote(id, enrich(item))
        }
        return !!data
    }

    const exportData = () => {
        const toExport: AppState = {
            ...data,
            settings: {
                ...data.settings,
                storage: {
                    type: "Local",
                },
            }
        } as const

        const bytes = new Blob(
            [new TextEncoder().encode(JSON.stringify(toExport))],
            { type: 'application/octet-stream' })
        const href = window.URL.createObjectURL(bytes)
        const anchor = document.createElement("a")
        anchor.download = "dinky.dev.data." + new Date().toISOString() + ".json"
        anchor.href = href

        if (window.confirm("Your data file is ready to be downloaded. Proceed?")) {
            anchor.click()
        }
    }

    const importData = () => {
        const input = document.createElement("input")
        input.type = "file"
        input.onclick = () => input.value = ""
        input.onchange = () => {
            if (input.files && input.files.length > 0) {
                if (input.files[0]) {
                    const reader = new FileReader()
                    reader.onload = (evt) => {
                        if (evt.target && evt.target.result) {
                            try {
                                const toImport = JSON.parse(evt.target.result.toString())
                                setData(prev => mergeData(prev, toImport))
                            } catch (e) {
                                window.alert("Unable to understand the contents of the selected file!")
                            }
                        }
                    }
                    reader.onerror = () => {
                        window.alert("Unable to read the selected file!")
                    }
                    reader.readAsText(input.files[0], "UTF-8")
                }
            }
        }
        input.click()
    }

    useEffect(() => store.pull(), [store])

    const keyMap = {
        SEARCH: "/",
        ESCAPE: "escape",
        LINK_0: ["`"],
        LINK_1: "1",
        LINK_2: "2",
        LINK_3: "3",
        COMMA: ",",
        QUESTION: "shift+?",
        NEW: "n",
        EXPORT: "d",
        IMPORT: "u",
        SYNC: "s",
    }

    const handlers = {
        SEARCH: (evt?: KeyboardEvent) => {
            evt?.preventDefault()
            if (refs.search.current) {
                refs.search.current.focus()
            }
        },
        ESCAPE: (evt?: KeyboardEvent) => {
            evt?.preventDefault()
            setTerm(new Term(""))
        },
        LINK_0: (evt?: KeyboardEvent) => {
            evt?.preventDefault()
            navigate("/")
        },
        LINK_1: (evt?: KeyboardEvent) => {
            evt?.preventDefault()
            navigate("/tasks")
        },
        LINK_2: (evt?: KeyboardEvent) => {
            evt?.preventDefault()
            navigate("/tags")
        },
        LINK_3: (evt?: KeyboardEvent) => {
            evt?.preventDefault()
            navigate("/notes")
        },
        COMMA: (evt?: KeyboardEvent) => {
            evt?.preventDefault()
            navigate("/profile")
        },
        QUESTION: (evt?: KeyboardEvent) => {
            evt?.preventDefault()
            navigate("/help")
        },
        NEW: (evt?: KeyboardEvent) => {
            evt?.preventDefault()
        },
        EXPORT: (evt?: KeyboardEvent) => {
            evt?.preventDefault()
        },
        IMPORT: (evt?: KeyboardEvent) => {
            evt?.preventDefault()
        },
        SYNC: (evt?: KeyboardEvent) => {
            evt?.preventDefault()
            store.sync()
        },
    }

    const registerNewHandler = (h: (evt?: KeyboardEvent) => void) => { handlers.NEW = h }
    const registerExportHandler = (h: (evt?: KeyboardEvent) => void) => { handlers.EXPORT = h }
    const registerImportHandler = (h: (evt?: KeyboardEvent) => void) => { handlers.IMPORT = h }

    return (
        <Wrapper layout="col" className={styles.main} wrapClassName={styles.wrapper}>
            <GlobalHotKeys keyMap={keyMap} handlers={handlers} allowChanges={true} />
            <Header clear={clear} />
            <SearchBox value={term.source()} action={val => setTerm(new Term(val))} refs={refs} />
            <PageNav clear={clear} />
            <PageContent
                settings={data.settings}
                contents={data.contents}
                term={term}
                clear={clear}
                back={back}
                newTask={newTask}
                newTag={newTag}
                newNote={newNote}
                putTodaySettings={putTodaySettings}
                putStorageSettings={putStorageSettings}
                putTask={putTask}
                putTag={putTag}
                putNote={putNote}
                exportData={exportData}
                importData={importData}
                registerNewHandler={registerNewHandler}
                registerExportHandler={registerExportHandler}
                registerImportHandler={registerImportHandler}
            />
            <Footer />
        </Wrapper>
    )
}
