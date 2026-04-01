import React from "react"
import { render, screen } from "@testing-library/react"
import { BrowserRouter, MemoryRouter, Route, Routes } from "react-router-dom"
import { Today } from "./Today"
import { Tasks } from "./Tasks"
import { Notes } from "./Notes"
import { Topics } from "./Topics"
import { Works } from "./Works"
import { Search } from "./Search"
import { NotFound } from "./NotFound"
import { Help } from "./Help"
import { TaskDetails } from "./TaskDetails"
import { NoteDetails } from "./NoteDetails"
import { TopicDetails } from "./TopicDetails"
import { WorkDetails } from "./WorkDetails"
import { Profile } from "./Profile"
import { Task } from "../models/Task"
import { Note } from "../models/Note"
import { Topic } from "../models/Topic"
import { Work } from "../models/Work"
import { Term } from "../models/Term"
import { DisplayTheme } from "../models/DisplaySettings"
import moment from "moment"

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true }

const withRouter = (ui: React.ReactElement) => render(<BrowserRouter future={routerFuture}>{ui}</BrowserRouter>)

const noop = () => { }
const noopBool = () => true
const noopStr = () => "id"
const noopHandler = (h: (evt?: KeyboardEvent) => void) => { }

const makeTasks = (): Record<string, Task> => ({
    "t1": { data: "Buy groceries", created: "2024-01-01T00:00:00Z", updated: "2024-01-01T00:00:00Z" },
    "t2": { data: "Write tests", created: "2024-02-01T00:00:00Z", updated: "2024-02-01T00:00:00Z", archive: true },
    "t3": { data: "Today task", created: "2024-03-01T00:00:00Z", updated: "2024-03-01T00:00:00Z", today: moment().subtract(1, "hour").toISOString() },
})

const makeNotes = (): Record<string, Note> => ({
    "n1": { data: "Meeting notes", created: "2024-01-01T00:00:00Z", updated: "2024-01-01T00:00:00Z" },
    "n2": { data: "Archived note", created: "2024-02-01T00:00:00Z", updated: "2024-02-01T00:00:00Z", archive: true },
})

const makeTopics = (): Record<string, Topic> => ({
    "tp1": { data: "#react", created: "2024-01-01T00:00:00Z", updated: "2024-01-01T00:00:00Z" },
    "tp2": { data: "#typescript", created: "2024-02-01T00:00:00Z", updated: "2024-02-01T00:00:00Z", name: "TypeScript" },
})

const makeWorks = (): Record<string, Work> => ({
    "w1": { data: "Clean Code | Robert Martin", created: "2024-01-01T00:00:00Z", updated: "2024-01-01T00:00:00Z" },
    "w2": { data: "SICP | Abelson", created: "2024-02-01T00:00:00Z", updated: "2024-02-01T00:00:00Z", archive: true },
    "w3": { data: "Design Patterns | GoF", created: "2024-03-01T00:00:00Z", updated: "2024-03-01T00:00:00Z", today: moment().subtract(1, "hour").toISOString() },
})

const killAction = (action: () => void, undo?: boolean) => ({
    icon: "test.svg",
    desc: undo ? "Restore" : "Delete",
    action,
})

const backAction = { icon: "back.svg", desc: "Go back", action: noop }

const defaultSettings = {
    storage: { registry: { enabled: false, events: {} } },
    retention: { periodDays: 30 },
    display: { theme: DisplayTheme.Auto },
}

describe("Today", () => {
    it("renders Today's Tasks card", () => {
        withRouter(
            <Today
                tasks={makeTasks()}
                works={makeWorks()}
                newTask={noopStr}
                newWork={noopStr}
                putTask={noopBool}
                putWork={noopBool}
                registerNewHandler={noopHandler}
            />
        )
        expect(screen.getByText("Today's Tasks")).toBeInTheDocument()
        expect(screen.getByText("Today's Reading")).toBeInTheDocument()
    })

    it("shows tasks scheduled for today", () => {
        withRouter(
            <Today
                tasks={makeTasks()}
                works={makeWorks()}
                newTask={noopStr}
                newWork={noopStr}
                putTask={noopBool}
                putWork={noopBool}
                registerNewHandler={noopHandler}
            />
        )
        expect(screen.getByText("Today task")).toBeInTheDocument()
    })

    it("shows works scheduled for today", () => {
        withRouter(
            <Today
                tasks={makeTasks()}
                works={makeWorks()}
                newTask={noopStr}
                newWork={noopStr}
                putTask={noopBool}
                putWork={noopBool}
                registerNewHandler={noopHandler}
            />
        )
        expect(screen.getByText(/Design Patterns/)).toBeInTheDocument()
    })

    it("shows empty messages when no items for today", () => {
        withRouter(
            <Today
                tasks={{}}
                works={{}}
                newTask={noopStr}
                newWork={noopStr}
                putTask={noopBool}
                putWork={noopBool}
                registerNewHandler={noopHandler}
            />
        )
        expect(screen.getByText(/Add tasks from your/)).toBeInTheDocument()
        expect(screen.getByText(/Find items in your/)).toBeInTheDocument()
    })
})

describe("Tasks", () => {
    it("renders Tasks card with open tasks", () => {
        withRouter(
            <Tasks
                tasks={makeTasks()}
                newTask={noopStr}
                putTask={noopBool}
                killTasks={noop}
                registerNewHandler={noopHandler}
            />
        )
        expect(screen.getByText("Tasks")).toBeInTheDocument()
        expect(screen.getByText("Buy groceries")).toBeInTheDocument()
        expect(screen.getByText("Today task")).toBeInTheDocument()
    })

    it("renders Done card with archived tasks", () => {
        withRouter(
            <Tasks
                tasks={makeTasks()}
                newTask={noopStr}
                putTask={noopBool}
                killTasks={noop}
                registerNewHandler={noopHandler}
            />
        )
        expect(screen.getByText("Done")).toBeInTheDocument()
        expect(screen.getByText("Write tests")).toBeInTheDocument()
    })

    it("shows empty message when no tasks", () => {
        withRouter(
            <Tasks
                tasks={{}}
                newTask={noopStr}
                putTask={noopBool}
                killTasks={noop}
                registerNewHandler={noopHandler}
            />
        )
        expect(screen.getByText("No tasks in your task list!")).toBeInTheDocument()
    })
})

describe("Notes", () => {
    it("renders Notes card with active notes", () => {
        withRouter(
            <Notes
                notes={makeNotes()}
                newNote={noopStr}
                putNote={noopBool}
                registerNewHandler={noopHandler}
            />
        )
        expect(screen.getByText("Notes")).toBeInTheDocument()
        expect(screen.getByText("Meeting notes")).toBeInTheDocument()
    })

    it("renders Archives card (collapsed by default)", () => {
        withRouter(
            <Notes
                notes={makeNotes()}
                newNote={noopStr}
                putNote={noopBool}
                registerNewHandler={noopHandler}
            />
        )
        expect(screen.getByText("Archives")).toBeInTheDocument()
        // Archives collapsed by default, so archived note content not visible
    })

    it("shows empty message when no active notes", () => {
        withRouter(
            <Notes
                notes={{}}
                newNote={noopStr}
                putNote={noopBool}
                registerNewHandler={noopHandler}
            />
        )
        expect(screen.getByText("You don't have any active notes!")).toBeInTheDocument()
    })
})

describe("Topics", () => {
    it("renders Topics card with topics", () => {
        withRouter(
            <Topics
                topics={makeTopics()}
                newNote={noopStr}
                newTopic={noopStr}
                putTopic={noopBool}
                registerNewHandler={noopHandler}
            />
        )
        expect(screen.getByText("Topics")).toBeInTheDocument()
    })

    it("shows topic names", () => {
        withRouter(
            <Topics
                topics={makeTopics()}
                newNote={noopStr}
                newTopic={noopStr}
                putTopic={noopBool}
                registerNewHandler={noopHandler}
            />
        )
        expect(screen.getByText("TypeScript")).toBeInTheDocument()
    })

    it("shows empty message when no topics", () => {
        withRouter(
            <Topics
                topics={{}}
                newNote={noopStr}
                newTopic={noopStr}
                putTopic={noopBool}
                registerNewHandler={noopHandler}
            />
        )
        expect(screen.getByText("No topics in your list!")).toBeInTheDocument()
    })
})

describe("Works", () => {
    it("renders Library card with open works", () => {
        withRouter(
            <Works
                works={makeWorks()}
                newWork={noopStr}
                putWork={noopBool}
                registerNewHandler={noopHandler}
            />
        )
        expect(screen.getByText("Library")).toBeInTheDocument()
        expect(screen.getByText(/Clean Code/)).toBeInTheDocument()
    })

    it("renders Archives card", () => {
        withRouter(
            <Works
                works={makeWorks()}
                newWork={noopStr}
                putWork={noopBool}
                registerNewHandler={noopHandler}
            />
        )
        expect(screen.getByText("Archives")).toBeInTheDocument()
    })

    it("shows empty message when no works", () => {
        withRouter(
            <Works
                works={{}}
                newWork={noopStr}
                putWork={noopBool}
                registerNewHandler={noopHandler}
            />
        )
        expect(screen.getByText("No items in your library!")).toBeInTheDocument()
    })
})

describe("Search", () => {
    it("renders search results matching term", () => {
        withRouter(
            <Search
                tasks={makeTasks()}
                notes={makeNotes()}
                topics={makeTopics()}
                works={makeWorks()}
                term={new Term("groceries")}
                clear={{ icon: "x.svg", desc: "Clear", action: noop }}
                newNote={noopStr}
                putNote={noopBool}
                putTask={noopBool}
                putWork={noopBool}
            />
        )
        expect(screen.getByText("Search Results")).toBeInTheDocument()
        expect(screen.getByText("Buy groceries")).toBeInTheDocument()
    })

    it("shows no results message when nothing matches", () => {
        withRouter(
            <Search
                tasks={makeTasks()}
                notes={makeNotes()}
                topics={makeTopics()}
                works={makeWorks()}
                term={new Term("nonexistent-query-xyz")}
                clear={{ icon: "x.svg", desc: "Clear", action: noop }}
                newNote={noopStr}
                putNote={noopBool}
                putTask={noopBool}
                putWork={noopBool}
            />
        )
        expect(screen.getByText("Nothing found that matches your search term!")).toBeInTheDocument()
    })

    it("finds results across types", () => {
        withRouter(
            <Search
                tasks={makeTasks()}
                notes={makeNotes()}
                topics={makeTopics()}
                works={makeWorks()}
                term={new Term("react")}
                clear={{ icon: "x.svg", desc: "Clear", action: noop }}
                newNote={noopStr}
                putNote={noopBool}
                putTask={noopBool}
                putWork={noopBool}
            />
        )
        // Should find #react topic
        expect(screen.getByText("Search Results")).toBeInTheDocument()
    })
})

describe("NotFound", () => {
    it("renders 404 message", () => {
        withRouter(<NotFound />)
        expect(screen.getByText("Did you take a wrong turn?")).toBeInTheDocument()
    })
})

describe("Help", () => {
    it("renders user guide section", () => {
        withRouter(<Help userguide="# Getting Started" />)
        expect(screen.getByText("User Guide")).toBeInTheDocument()
        expect(screen.getByText("Getting Started")).toBeInTheDocument()
    })

    it("renders keyboard shortcuts section", () => {
        withRouter(<Help userguide="" />)
        expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument()
        expect(screen.getByText("Navigation")).toBeInTheDocument()
    })
})

describe("TaskDetails", () => {
    it("renders task details when task found", () => {
        render(
            <MemoryRouter future={routerFuture} initialEntries={["/tasks/t1"]}>
                <Routes>
                    <Route path="/tasks/:id" element={
                        <TaskDetails
                            tasks={makeTasks()}
                            killAction={killAction}
                            backAction={backAction}
                            putTask={noopBool}
                        />
                    } />
                </Routes>
            </MemoryRouter>
        )
        expect(screen.getByText("Task Details")).toBeInTheDocument()
        expect(screen.getByText("Buy groceries")).toBeInTheDocument()
        expect(screen.getByText("Task Progress")).toBeInTheDocument()
        expect(screen.getByText("Remind Me")).toBeInTheDocument()
    })

    it("shows not found message for missing task", () => {
        render(
            <MemoryRouter future={routerFuture} initialEntries={["/tasks/nonexistent"]}>
                <Routes>
                    <Route path="/tasks/:id" element={
                        <TaskDetails
                            tasks={makeTasks()}
                            killAction={killAction}
                            backAction={backAction}
                            putTask={noopBool}
                        />
                    } />
                </Routes>
            </MemoryRouter>
        )
        expect(screen.getByText("The task you're looking for cannot be found!")).toBeInTheDocument()
    })

    it("shows trash warning for deleted task", () => {
        const tasks: Record<string, Task> = {
            "t-del": { data: "Deleted task", deleted: "2024-01-01T00:00:00Z", updated: "2024-01-01T00:00:00Z", created: "2024-01-01T00:00:00Z" },
        }
        render(
            <MemoryRouter future={routerFuture} initialEntries={["/tasks/t-del"]}>
                <Routes>
                    <Route path="/tasks/:id" element={
                        <TaskDetails
                            tasks={tasks}
                            killAction={killAction}
                            backAction={backAction}
                            putTask={noopBool}
                        />
                    } />
                </Routes>
            </MemoryRouter>
        )
        expect(screen.getByText(/Careful! This item is currently in your trash/)).toBeInTheDocument()
    })
})

describe("NoteDetails", () => {
    it("renders note details when note found", () => {
        render(
            <MemoryRouter future={routerFuture} initialEntries={["/notes/n1"]}>
                <Routes>
                    <Route path="/notes/:id" element={
                        <NoteDetails
                            notes={makeNotes()}
                            killAction={killAction}
                            backAction={backAction}
                            putNote={noopBool}
                        />
                    } />
                </Routes>
            </MemoryRouter>
        )
        expect(screen.getByText("Note Details")).toBeInTheDocument()
    })

    it("shows not found message for missing note", () => {
        render(
            <MemoryRouter future={routerFuture} initialEntries={["/notes/nonexistent"]}>
                <Routes>
                    <Route path="/notes/:id" element={
                        <NoteDetails
                            notes={makeNotes()}
                            killAction={killAction}
                            backAction={backAction}
                            putNote={noopBool}
                        />
                    } />
                </Routes>
            </MemoryRouter>
        )
        expect(screen.getByText("The note you're looking for cannot be found!")).toBeInTheDocument()
    })
})

describe("TopicDetails", () => {
    it("renders topic details when topic found", () => {
        render(
            <MemoryRouter future={routerFuture} initialEntries={["/topics/tp1"]}>
                <Routes>
                    <Route path="/topics/:id" element={
                        <TopicDetails
                            tasks={makeTasks()}
                            notes={makeNotes()}
                            works={makeWorks()}
                            topics={makeTopics()}
                            killAction={killAction}
                            backAction={backAction}
                            clear={{ icon: "x.svg", desc: "Clear", action: noop }}
                            newNote={noopStr}
                            putNote={noopBool}
                            putTopic={noopBool}
                            putTask={noopBool}
                            putWork={noopBool}
                        />
                    } />
                </Routes>
            </MemoryRouter>
        )
        expect(screen.getByText("Topic Details")).toBeInTheDocument()
        expect(screen.getByText("Metadata")).toBeInTheDocument()
        expect(screen.getByText("Related")).toBeInTheDocument()
    })

    it("shows not found message for missing topic", () => {
        render(
            <MemoryRouter future={routerFuture} initialEntries={["/topics/nonexistent"]}>
                <Routes>
                    <Route path="/topics/:id" element={
                        <TopicDetails
                            tasks={{}}
                            notes={{}}
                            works={{}}
                            topics={{}}
                            killAction={killAction}
                            backAction={backAction}
                            clear={{ icon: "x.svg", desc: "Clear", action: noop }}
                            newNote={noopStr}
                            putNote={noopBool}
                            putTopic={noopBool}
                            putTask={noopBool}
                            putWork={noopBool}
                        />
                    } />
                </Routes>
            </MemoryRouter>
        )
        expect(screen.getByText("The topic you're looking for cannot be found!")).toBeInTheDocument()
    })
})

describe("WorkDetails", () => {
    it("renders work details when work found", () => {
        render(
            <MemoryRouter future={routerFuture} initialEntries={["/works/w1"]}>
                <Routes>
                    <Route path="/works/:id" element={
                        <WorkDetails
                            works={makeWorks()}
                            killAction={killAction}
                            backAction={backAction}
                            putWork={noopBool}
                        />
                    } />
                </Routes>
            </MemoryRouter>
        )
        expect(screen.getByText("Item Details")).toBeInTheDocument()
        expect(screen.getByText("Remind Me")).toBeInTheDocument()
    })

    it("shows not found message for missing work", () => {
        render(
            <MemoryRouter future={routerFuture} initialEntries={["/works/nonexistent"]}>
                <Routes>
                    <Route path="/works/:id" element={
                        <WorkDetails
                            works={makeWorks()}
                            killAction={killAction}
                            backAction={backAction}
                            putWork={noopBool}
                        />
                    } />
                </Routes>
            </MemoryRouter>
        )
        expect(screen.getByText("The item you're looking for cannot be found in your library!")).toBeInTheDocument()
    })
})

describe("Profile", () => {
    it("renders Cloud Sync section", () => {
        withRouter(
            <Profile
                settings={defaultSettings}
                putRetentionSettings={noop}
                putDisplaySettings={noop}
                putStorageSettings={noop}
                registerExportHandler={noopHandler}
                registerImportHandler={noopHandler}
                exportData={noop}
                importData={noop}
                sync={noop}
            />
        )
        expect(screen.getByText("Cloud Sync")).toBeInTheDocument()
        expect(screen.getByText("Last sync:")).toBeInTheDocument()
        expect(screen.getByText("Never")).toBeInTheDocument()
    })

    it("renders Display Preferences section", () => {
        withRouter(
            <Profile
                settings={defaultSettings}
                putRetentionSettings={noop}
                putDisplaySettings={noop}
                putStorageSettings={noop}
                registerExportHandler={noopHandler}
                registerImportHandler={noopHandler}
                exportData={noop}
                importData={noop}
                sync={noop}
            />
        )
        expect(screen.getByText("Display Preferences")).toBeInTheDocument()
        expect(screen.getByText("Auto")).toBeInTheDocument()
        expect(screen.getByText("Light")).toBeInTheDocument()
        expect(screen.getByText("Dark")).toBeInTheDocument()
    })

    it("renders Manage Your Data section", () => {
        withRouter(
            <Profile
                settings={defaultSettings}
                putRetentionSettings={noop}
                putDisplaySettings={noop}
                putStorageSettings={noop}
                registerExportHandler={noopHandler}
                registerImportHandler={noopHandler}
                exportData={noop}
                importData={noop}
                sync={noop}
            />
        )
        expect(screen.getByText("Manage Your Data")).toBeInTheDocument()
        expect(screen.getByText("Export a copy of your data")).toBeInTheDocument()
        expect(screen.getByText("Import data from a file")).toBeInTheDocument()
    })

    it("shows last synced datetime when available", () => {
        const settings = {
            ...defaultSettings,
            storage: {
                ...defaultSettings.storage,
                lastSynced: "2024-06-01T10:30:00Z",
            },
        }
        withRouter(
            <Profile
                settings={settings}
                putRetentionSettings={noop}
                putDisplaySettings={noop}
                putStorageSettings={noop}
                registerExportHandler={noopHandler}
                registerImportHandler={noopHandler}
                exportData={noop}
                importData={noop}
                sync={noop}
            />
        )
        expect(screen.queryByText("never")).not.toBeInTheDocument()
    })

    it("displays retention period", () => {
        withRouter(
            <Profile
                settings={defaultSettings}
                putRetentionSettings={noop}
                putDisplaySettings={noop}
                putStorageSettings={noop}
                registerExportHandler={noopHandler}
                registerImportHandler={noopHandler}
                exportData={noop}
                importData={noop}
                sync={noop}
            />
        )
        expect(screen.getByDisplayValue("30")).toBeInTheDocument()
    })
})
