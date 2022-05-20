import { useMemo, useState } from "react"
import { Route, Routes } from "react-router-dom"
import { Action } from "../models/Action"
import { Task } from "../models/Task"
import { Topic } from "../models/Topic"
import { Note } from "../models/Note"
import { Term } from "../models/Term"
import { Contents } from "../models/Contents"
import { Settings } from "../models/Settings"
import { Help } from "../pages/Help"
import { Notes } from "../pages/Notes"
import { NoteDetails } from "../pages/NoteDetails"
import { Profile } from "../pages/Profile"
import { TaskDetails } from "../pages/TaskDetails"
import { Tasks } from "../pages/Tasks"
import { Today } from "../pages/Today"
import { Topics } from "../pages/Topics"
import { TopicDetails } from "../pages/TopicDetails"
import { Search } from "../pages/Search"
import { Wrapper } from "./Wrapper"
import { NotFound } from "../pages/NotFound"
import { TodaySettings } from "../models/TodaySettings"
import { StorageSettings } from "../models/StorageSettings"
import userguide from "../docs/UserGuide.md"
import styles from "../styles/PageContent.module.css"

interface Props {
    settings: Settings,
    contents: Contents,
    term: Term,
    back: Action,
    clear: Action,
    newTask: (template?: string) => string,
    newTopic: (template?: string) => string,
    newNote: (template?: string) => string,
    putTodaySettings: (value: TodaySettings) => void,
    putStorageSettings: (value: StorageSettings) => void,
    putTask: (id: string, item: Task) => boolean,
    putTopic: (id: string, item: Topic) => boolean,
    putNote: (id: string, item: Note) => boolean,
    exportData: () => void,
    importData: () => void,
    sync: () => void,
    registerNewHandler: (handler: (evt?: KeyboardEvent) => void) => void,
    registerExportHandler: (handler: (evt?: KeyboardEvent) => void) => void,
    registerImportHandler: (handler: (evt?: KeyboardEvent) => void) => void,
}

export function PageContent(props: Props) {

    const [userguideMarkdown, setUserguideMarkdown] = useState("")

    useMemo(() => {
        fetch(userguide)
            .then(res => res.text())
            .then(setUserguideMarkdown)
    }, [])

    const search = (
        <Search
            today={props.settings.today}
            tasks={props.contents.tasks}
            notes={props.contents.notes}
            topics={props.contents.topics}
            term={props.term}
            clear={props.clear}
            newNote={props.newNote}
            putTask={props.putTask}
        />
    )

    const routes = (
        <Routes>
            <Route
                path="/*"
                element={<Today
                    today={props.settings.today}
                    tasks={props.contents.tasks}
                    newTask={props.newTask}
                    putTask={props.putTask}
                    registerNewHandler={props.registerNewHandler}
                />}
            />
            <Route
                path="/tasks/*"
                element={<Tasks
                    today={props.settings.today}
                    tasks={props.contents.tasks}
                    newTask={props.newTask}
                    putTask={props.putTask}
                    registerNewHandler={props.registerNewHandler}
                />}
            />
            <Route
                path="/tasks/:id"
                element={<TaskDetails
                    today={props.settings.today}
                    tasks={props.contents.tasks}
                    topAction={props.back}
                    putTask={props.putTask}
                />}
            />
            <Route
                path="/notes/*"
                element={<Notes
                    notes={props.contents.notes}
                    newNote={props.newNote}
                    putNote={props.putNote}
                    registerNewHandler={props.registerNewHandler}
                />}
            />
            <Route
                path="/notes/:id"
                element={<NoteDetails
                    notes={props.contents.notes}
                    topAction={props.back}
                    putNote={props.putNote}
                />}
            />
            <Route
                path="/topics/*"
                element={<Topics
                    topics={props.contents.topics}
                    newNote={props.newNote}
                    newTopic={props.newTopic}
                    putTopic={props.putTopic}
                    registerNewHandler={props.registerNewHandler}
                />}
            />
            <Route
                path="/topics/:id"
                element={<TopicDetails
                    today={props.settings.today}
                    tasks={props.contents.tasks}
                    notes={props.contents.notes}
                    topics={props.contents.topics}
                    topAction={props.back}
                    clear={props.clear}
                    newNote={props.newNote}
                    putTopic={props.putTopic}
                    putTask={props.putTask}
                />}
            />
            <Route
                path="/profile/*"
                element={<Profile
                    settings={props.settings}
                    putTodaySettings={props.putTodaySettings}
                    putStorageSettings={props.putStorageSettings}
                    registerExportHandler={props.registerExportHandler}
                    registerImportHandler={props.registerImportHandler}
                    exportData={props.exportData}
                    importData={props.importData}
                    sync={props.sync}
                />}
            />
            <Route
                path="/help/*"
                element={<Help userguide={userguideMarkdown} />}
            />
            <Route
                path="*"
                element={<NotFound />}
            />
        </Routes>
    )

    return (
        <Wrapper layout="col" className={styles.main}>
            {props.term.source() ? search : routes}
        </Wrapper>
    )
}
