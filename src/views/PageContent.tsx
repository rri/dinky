import { useMemo, useState } from "react"
import { Route, Routes } from "react-router-dom"
import { Action } from "../models/Action"
import { Task } from "../models/Task"
import { Topic } from "../models/Topic"
import { Note } from "../models/Note"
import { Work } from "../models/Work"
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
import { Works } from "../pages/Works"
import { WorkDetails } from "../pages/WorkDetails"
import { Search } from "../pages/Search"
import { Wrapper } from "./Wrapper"
import { NotFound } from "../pages/NotFound"
import { TodaySettings } from "../models/TodaySettings"
import { DisplaySettings } from "../models/DisplaySettings"
import { RetentionSettings } from "../models/RetentionSettings"
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
    newWork: (template?: string) => string,

    putTodaySettings: (value: TodaySettings) => void,
    putRetentionSettings: (value: RetentionSettings) => void,
    putDisplaySettings: (value: DisplaySettings) => void,
    putStorageSettings: (value: StorageSettings) => void,
    putTask: (id: string, item: Task) => boolean,
    putTopic: (id: string, item: Topic) => boolean,
    putNote: (id: string, item: Note) => boolean,
    putWork: (id: string, item: Work) => boolean,
    delTasks: (makeIdList: () => string[]) => void,
    exportData: () => void,
    importData: () => void,
    sync: () => void,
    registerNewHandler: (handler: (evt?: KeyboardEvent) => void) => void,
    registerExportHandler: (handler: (evt?: KeyboardEvent) => void) => void,
    registerImportHandler: (handler: (evt?: KeyboardEvent) => void) => void,
    notify: (note?: string) => void,
}

export function PageContent(props: Props) {

    const [userguideMarkdown, setUserguideMarkdown] = useState("")

    useMemo(() => {
        fetch(userguide)
            .then(res => res.text())
            .then(setUserguideMarkdown)
    }, [])

    const tasks = props.contents.tasks || {}
    const notes = props.contents.notes || {}
    const topics = props.contents.topics || {}
    const works = props.contents.works || {}

    const search = (
        <Search
            today={props.settings.today}
            tasks={tasks}
            notes={notes}
            topics={topics}
            works={works}
            term={props.term}
            clear={props.clear}
            newNote={props.newNote}
            putTask={props.putTask}
            putWork={props.putWork}
            notify={props.notify}
        />
    )

    const routes = (
        <Routes>
            <Route
                path="/*"
                element={<Today
                    today={props.settings.today}
                    tasks={tasks}
                    works={works}
                    newTask={props.newTask}
                    newWork={props.newWork}
                    putTask={props.putTask}
                    putWork={props.putWork}
                    registerNewHandler={props.registerNewHandler}
                    notify={props.notify}
                />}
            />
            <Route
                path="/tasks/*"
                element={<Tasks
                    today={props.settings.today}
                    tasks={tasks}
                    newTask={props.newTask}
                    putTask={props.putTask}
                    delTasks={props.delTasks}
                    registerNewHandler={props.registerNewHandler}
                    notify={props.notify}
                />}
            />
            <Route
                path="/tasks/:id"
                element={<TaskDetails
                    today={props.settings.today}
                    tasks={tasks}
                    topAction={props.back}
                    putTask={props.putTask}
                    notify={props.notify}
                />}
            />
            <Route
                path="/notes/*"
                element={<Notes
                    notes={notes}
                    newNote={props.newNote}
                    putNote={props.putNote}
                    registerNewHandler={props.registerNewHandler}
                />}
            />
            <Route
                path="/notes/:id"
                element={<NoteDetails
                    notes={notes}
                    topAction={props.back}
                    putNote={props.putNote}
                />}
            />
            <Route
                path="/topics/*"
                element={<Topics
                    topics={topics}
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
                    tasks={tasks}
                    notes={notes}
                    works={works}
                    topics={topics}
                    topAction={props.back}
                    clear={props.clear}
                    newNote={props.newNote}
                    putTopic={props.putTopic}
                    putTask={props.putTask}
                    putWork={props.putWork}
                    notify={props.notify}
                />}
            />
            <Route
                path="/works/*"
                element={<Works
                    today={props.settings.today}
                    works={works}
                    newWork={props.newWork}
                    putWork={props.putWork}
                    registerNewHandler={props.registerNewHandler}
                    notify={props.notify}
                />}
            />
            <Route
                path="/works/:id"
                element={<WorkDetails
                    today={props.settings.today}
                    works={works}
                    topAction={props.back}
                    putWork={props.putWork}
                    notify={props.notify}
                />}
            />
            <Route
                path="/profile/*"
                element={<Profile
                    settings={props.settings}
                    putTodaySettings={props.putTodaySettings}
                    putRetentionSettings={props.putRetentionSettings}
                    putDisplaySettings={props.putDisplaySettings}
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
            {props.term.source().length >= 3 ? search : routes}
        </Wrapper>
    )
}
