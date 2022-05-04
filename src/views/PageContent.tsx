import { Route, Routes } from "react-router-dom"
import { Action } from "../models/Action"
import { Task } from "../models/Task"
import { Tag } from "../models/Tag"
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
import { Tags } from "../pages/Tags"
import { TagDetails } from "../pages/TagDetails"
import { Search } from "../pages/Search"
import { Wrapper } from "./Wrapper"
import { NotFound } from "../pages/NotFound"
import styles from "../styles/PageContent.module.css"
import { TodaySettings } from "../models/TodaySettings"
import { StorageSettings } from "../models/StorageSettings"

interface Props {
    settings: Settings,
    contents: Contents,
    term: Term,
    back: Action,
    clear: Action,
    newTask: (template?: string) => string,
    newTag: (template?: string) => string,
    newNote: (template?: string) => string,
    putTodaySettings: (value: TodaySettings) => void,
    putStorageSettings: (value: StorageSettings) => void,
    putTask: (id: string, item: Task) => boolean,
    putTag: (id: string, item: Tag) => boolean,
    putNote: (id: string, item: Note) => boolean,
    exportData: () => void,
    importData: () => void,
    registerNewHandler: (handler: (evt?: KeyboardEvent) => void) => void,
    registerExportHandler: (handler: (evt?: KeyboardEvent) => void) => void,
    registerImportHandler: (handler: (evt?: KeyboardEvent) => void) => void,
}

export function PageContent(props: Props) {

    const search = (
        <Search
            today={props.settings.today}
            tasks={props.contents.tasks}
            notes={props.contents.notes}
            tags={props.contents.tags}
            term={props.term}
            clear={props.clear}
            newNote={props.newNote}
            putTask={props.putTask}
            putTag={props.putTag}
            putNote={props.putNote}
        />
    )

    const routes = (
        <Routes>
            <Route
                path="/"
                element={<Today
                    today={props.settings.today}
                    tasks={props.contents.tasks}
                    newTask={props.newTask}
                    putTask={props.putTask}
                />}
            />
            <Route
                path="/tasks/"
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
                path="/notes/"
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
                path="/tags/"
                element={<Tags
                    tags={props.contents.tags}
                    newNote={props.newNote}
                    newTag={props.newTag}
                    putTag={props.putTag}
                    registerNewHandler={props.registerNewHandler}
                />}
            />
            <Route
                path="/tags/:id"
                element={<TagDetails
                    tags={props.contents.tags}
                    topAction={props.back}
                    newNote={props.newNote}
                    putTag={props.putTag}
                />}
            />
            <Route
                path="/profile/"
                element={<Profile
                    settings={props.settings}
                    putTodaySettings={props.putTodaySettings}
                    putStorageSettings={props.putStorageSettings}
                    registerExportHandler={props.registerExportHandler}
                    registerImportHandler={props.registerImportHandler}
                    exportData={props.exportData}
                    importData={props.importData}
                />}
            />
            <Route
                path="/help/"
                element={<Help />}
            />
            <Route path='*' element={<NotFound />} />
        </Routes>
    )

    return (
        <Wrapper layout="col" className={styles.main}>
            {props.term.source() ? search : routes}
        </Wrapper>
    )
}
