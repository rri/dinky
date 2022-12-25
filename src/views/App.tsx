import React, { useMemo } from "react"
import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import moment from "moment"
import { GlobalHotKeys } from "react-hotkeys"
import { Action } from "../models/Action"
import { AppState, empty, toExport } from "../models/AppState"
import { Creatable, DataObj, Deletable, Syncable, Updatable } from "../models/Item"
import { Task } from "../models/Task"
import { Note } from "../models/Note"
import { Work } from "../models/Work"
import { Topic } from "../models/Topic"
import { Store } from "../models/Store"
import { DisplaySettings, DisplayTheme } from "../models/DisplaySettings"
import { RetentionSettings } from "../models/RetentionSettings"
import { StorageSettings } from "../models/StorageSettings"
import { Term } from "../models/Term"
import { TodaySettings } from "../models/TodaySettings"
import { NotifyBox } from "./NotifyBox"
import { Footer } from "./Footer"
import { Header } from "./Header"
import { PageContent } from "./PageContent"
import { PageNav } from "./PageNav"
import { SearchBox } from "./SearchBox"
import { Wrapper } from "./Wrapper"
import { useNavigate } from "react-router-dom"
import { icons } from "./Icon"
import { v4 } from "uuid"
import { remark } from "remark"
import remarkTextr from "remark-textr"
import styles from "../styles/App.module.css"

export function App() {

    const navigate = useNavigate()

    const { hash } = useLocation()

    const [term, setTerm] = useState<Term>(new Term(""))
    const [data, setData] = useState<AppState>(empty())
    const [note, setNotify] = useState<string>("")

    const notify = (note?: string) => {
        setNotify(note || "")
        setTimeout(setNotify, 10000)
    }

    const store = useMemo(() => new Store(setData, notify), [setData])

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

    const newTask = (template?: string): string => {
        const id = v4()
        const item = { data: template || "" }
        setData(prev => {
            const res = { ...prev }
            if (!res.contents.tasks) {
                res.contents.tasks = {}
            }
            res.contents.tasks[id] = item
            return res
        })
        return id
    }

    const newTopic = (template?: string): string => {
        const id = v4()
        const item = { data: template || "" }
        setData(prev => {
            const res = { ...prev }
            if (!res.contents.topics) {
                res.contents.topics = {}
            }
            res.contents.topics[id] = item
            return res
        })
        return id
    }

    const newNote = (template?: string): string => {
        const id = v4()
        const item = { data: template || "" }
        setData(prev => {
            const res = { ...prev }
            if (!res.contents.notes) {
                res.contents.notes = {}
            }
            res.contents.notes[id] = item
            return res
        })
        return id
    }

    const newWork = (template?: string): string => {
        const id = v4()
        const item = { data: template || "" }
        setData(prev => {
            const res = { ...prev }
            if (!res.contents.works) {
                res.contents.works = {}
            }
            res.contents.works[id] = item
            return res
        })
        return id
    }

    const enrich = <T extends DataObj & Creatable & Deletable & Updatable & Syncable,>(item: T): T => {
        const updated = {
            ...item,
            created: item.created ? item.created : moment().toISOString(),
            updated: moment().toISOString(),
            deleted: item.data ? item.deleted : moment().toISOString(),
        }

        if (!item.created) {
            updated.unsynced = true
        }

        return updated
    }

    const createTopics = async (text: string) => {
        const createTopicsNow = (text: string) => {
            const exp = /#([a-zA-Z][a-zA-Z0-9-]*\w)/g
            while (true) {
                const match = exp.exec(text)
                if (match != null) {
                    const newTopic = match[0]
                    const topics = data.contents.topics ? data.contents.topics : {}
                    if (Object
                        .values(topics)
                        .filter(topic => topic.data === newTopic)
                        .length === 0) {
                        putTopic(v4(), { data: newTopic })
                    }
                } else {
                    break
                }
            }
        }
        await remark()
            .use(remarkTextr, { plugins: [createTopicsNow] })
            .process(text)
    }

    const putTodaySettings = (value: TodaySettings) => {
        store.putTodaySettings({
            ...value,
            updated: moment().toISOString(),
        })
    }

    const putRetentionSettings = (value: RetentionSettings) => {
        store.putRetentionSettings({
            ...value,
            updated: moment().toISOString(),
        })
    }

    const putDisplaySettings = (value: DisplaySettings) => {
        store.putDisplaySettings({
            ...value,
            updated: moment().toISOString(),
        })
    }

    const putStorageSettings = (value: StorageSettings) => {
        store.putStorageSettings(value)
    }

    const putTask = (id: string, item: Task): boolean => {
        const itemData = item.data?.trim()
        if (!itemData && !item.created) {
            setData(prev => {
                const res = { ...prev }
                delete res.contents.tasks?.[id]
                return res
            })
        } else {
            itemData && createTopics(itemData)
            store.putTask(id, enrich(item))
        }
        return !!itemData
    }

    const putTopic = (id: string, item: Topic): boolean => {
        const regx = /^([a-zA-Z][a-zA-Z0-9-]*)/g
        const cand = item.data?.trim()
            .replaceAll(/^[# ]+/g, "")
            .replaceAll(/[^a-zA-Z0-9-]+/g, "-")
        const itemData = regx.exec(cand) ? cand : ""
        if (!itemData && !item.created) {
            setData(prev => {
                const res = { ...prev }
                delete res.contents.topics?.[id]
                return res
            })
        } else {
            store.putTopic(id, { ...enrich(item), data: itemData ? `#${itemData}` : "" })
        }
        return !!itemData
    }

    const putNote = (id: string, item: Note): boolean => {
        const itemData = item.data?.trim()
        if (!itemData && !item.created) {
            setData(prev => {
                const res = { ...prev }
                delete res.contents.notes?.[id]
                return res
            })
        } else {
            itemData && createTopics(itemData)
            store.putNote(id, enrich(item))
        }
        return !!itemData
    }

    const putWork = (id: string, item: Work): boolean => {
        const itemData = item.data?.trim()
        if (!itemData && !item.created) {
            setData(prev => {
                const res = { ...prev }
                delete res.contents.works?.[id]
                return res
            })
        } else {
            itemData && createTopics(itemData)
            store.putWork(id, enrich(item))
        }
        return !!itemData
    }

    const delTasks = (makeIdList: () => string[]) => {
        store.delTasks(makeIdList)
    }

    const exportData = () => {
        const bytes = new Blob(
            [new TextEncoder().encode(JSON.stringify(toExport(data)))],
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
                                const toImport = empty(JSON.parse(evt.target.result.toString()))
                                store.loadFromData(toImport)
                            } catch (e) {
                                notify("File contents could not be read!")
                            }
                        }
                    }
                    reader.onerror = () => {
                        notify("File could not be read!")
                    }
                    reader.readAsText(input.files[0], "UTF-8")
                }
            }
        }
        input.click()
    }

    const sync = () => store.cloudSyncData(data)

    useEffect(() => store.loadFromDisk(), [store])

    useEffect(() => {
        const setDisplayTheme = () => {
            let mode = DisplayTheme.Light
            if (data.settings.display.theme === DisplayTheme.Auto) {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    mode = DisplayTheme.Dark
                } else {
                    mode = DisplayTheme.Light
                }
            } else {
                if (data.settings.display.theme === DisplayTheme.Light) {
                    mode = DisplayTheme.Light
                }
                if (data.settings.display.theme === DisplayTheme.Dark) {
                    mode = DisplayTheme.Dark
                }
            }
            if (mode === DisplayTheme.Dark) {
                window.document.documentElement.setAttribute("data-theme", "Dark")
            } else {
                window.document.documentElement.setAttribute("data-theme", "Light")
            }
        }
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => setDisplayTheme())
        setDisplayTheme()
    }, [data.settings.display.theme])

    useEffect(() => {
        const search = encodeURI(term.source())
        if (hash !== search) {
            window.location.hash = search
        }
    }, [hash, term])

    useEffect(() => {
        const search = decodeURI(hash.replace(/^#/, ''))
        if (search) {
            setTerm(new Term(search))
        }
    }, [hash])

    const keyMap = {
        SEARCH: "/",
        ESCAPE: "escape",
        LINK_0: ["`"],
        LINK_1: "1",
        LINK_2: "2",
        LINK_3: "3",
        LINK_L: "l",
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
            navigate("/topics")
        },
        LINK_3: (evt?: KeyboardEvent) => {
            evt?.preventDefault()
            navigate("/notes")
        },
        LINK_L: (evt?: KeyboardEvent) => {
            evt?.preventDefault()
            navigate("/works")
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
            sync()
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
            <NotifyBox note={note} />
            <PageNav clear={clear} />
            <PageContent
                settings={data.settings}
                contents={data.contents}
                term={term}
                clear={clear}
                back={back}
                newTask={newTask}
                newTopic={newTopic}
                newNote={newNote}
                newWork={newWork}
                putTodaySettings={putTodaySettings}
                putRetentionSettings={putRetentionSettings}
                putDisplaySettings={putDisplaySettings}
                putStorageSettings={putStorageSettings}
                putTask={putTask}
                putTopic={putTopic}
                putNote={putNote}
                putWork={putWork}
                delTasks={delTasks}
                exportData={exportData}
                importData={importData}
                sync={sync}
                registerNewHandler={registerNewHandler}
                registerExportHandler={registerExportHandler}
                registerImportHandler={registerImportHandler}
            />
            <Footer />
        </Wrapper>
    )
}
