import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { ViewTask } from "./ViewTask"
import { ViewNote } from "./ViewNote"
import { ViewTopic } from "./ViewTopic"
import { ViewWork } from "./ViewWork"
import { PageNav } from "./PageNav"
import { Shortcut, ShortcutList } from "./Shortcuts"
import { Doc } from "./Doc"
import moment from "moment"

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true }

const withRouter = (ui: React.ReactElement) => render(<BrowserRouter future={routerFuture}>{ui}</BrowserRouter>)

const noop = () => { }
const noopBool = () => true
const noopStr = () => "id"

describe("ViewTask", () => {
    const baseTask = {
        id: "t1",
        data: "Buy groceries",
        created: "2024-01-01T00:00:00Z",
        updated: "2024-01-01T00:00:00Z",
    }

    it("renders task data in readonly mode", () => {
        withRouter(
            <ViewTask
                item={baseTask}
                putTask={noopBool}
                readonly={true}
            />
        )
        expect(screen.getByText("Buy groceries")).toBeInTheDocument()
    })

    it("shows done action button", () => {
        withRouter(
            <ViewTask
                item={baseTask}
                putTask={noopBool}
            />
        )
        expect(screen.getByAltText("Mark this task as done")).toBeInTheDocument()
    })

    it("shows re-open action for archived tasks", () => {
        const archivedTask = { ...baseTask, archive: true }
        withRouter(
            <ViewTask
                item={archivedTask}
                putTask={noopBool}
            />
        )
        expect(screen.getByAltText("Re-open this task")).toBeInTheDocument()
    })

    it("shows today action for non-archived tasks", () => {
        withRouter(
            <ViewTask
                item={baseTask}
                putTask={noopBool}
            />
        )
        expect(screen.getByAltText("Add this task to today's agenda")).toBeInTheDocument()
    })

    it("shows remove from today for tasks already on today", () => {
        const todayTask = { ...baseTask, today: moment().subtract(1, "hour").toISOString() }
        withRouter(
            <ViewTask
                item={todayTask}
                putTask={noopBool}
            />
        )
        expect(screen.getByAltText("Remove this task from today's agenda")).toBeInTheDocument()
    })

    it("shows progress tag when progress is set", () => {
        const taskWithProgress = { ...baseTask, progress: 5 as const }
        withRouter(
            <ViewTask
                item={taskWithProgress}
                putTask={noopBool}
            />
        )
        expect(screen.getByText("50%")).toBeInTheDocument()
    })

    it("shows details action when not hidden and not archived", () => {
        withRouter(
            <ViewTask
                item={baseTask}
                putTask={noopBool}
            />
        )
        expect(screen.getByAltText("Go to task details")).toBeInTheDocument()
    })

    it("hides details action when hideDetails is true", () => {
        withRouter(
            <ViewTask
                item={baseTask}
                putTask={noopBool}
                hideDetails={true}
            />
        )
        expect(screen.queryByAltText("Go to task details")).not.toBeInTheDocument()
    })

    it("shows reminder icon for future-scheduled tasks", () => {
        const futureTask = { ...baseTask, today: moment().add(5, "days").toISOString() }
        withRouter(
            <ViewTask
                item={futureTask}
                putTask={noopBool}
            />
        )
        expect(screen.getByAltText("Remove from schedule.")).toBeInTheDocument()
    })
})

describe("ViewNote", () => {
    const baseNote = {
        id: "n1",
        data: "Meeting notes",
        created: "2024-01-01T00:00:00Z",
        updated: "2024-01-01T00:00:00Z",
    }

    it("renders note data", () => {
        withRouter(
            <ViewNote
                item={baseNote}
                putNote={noopBool}
                oneline={true}
            />
        )
        expect(screen.getByText("Meeting notes")).toBeInTheDocument()
    })

    it("shows archive action in oneline mode", () => {
        withRouter(
            <ViewNote
                item={baseNote}
                putNote={noopBool}
                oneline={true}
            />
        )
        expect(screen.getByAltText("Archive this note")).toBeInTheDocument()
    })

    it("shows unarchive for archived notes in oneline mode", () => {
        const archivedNote = { ...baseNote, archive: true }
        withRouter(
            <ViewNote
                item={archivedNote}
                putNote={noopBool}
                oneline={true}
            />
        )
        expect(screen.getByAltText("Make this note active again")).toBeInTheDocument()
    })

    it("shows details action when not hidden and not archived", () => {
        withRouter(
            <ViewNote
                item={baseNote}
                putNote={noopBool}
                oneline={true}
            />
        )
        expect(screen.getByAltText("View this note")).toBeInTheDocument()
    })

    it("hides details action for archived notes", () => {
        const archivedNote = { ...baseNote, archive: true }
        withRouter(
            <ViewNote
                item={archivedNote}
                putNote={noopBool}
                oneline={true}
            />
        )
        expect(screen.queryByAltText("View this note")).not.toBeInTheDocument()
    })
})

describe("ViewTopic", () => {
    const baseTopic = {
        id: "tp1",
        data: "#react",
        created: "2024-01-01T00:00:00Z",
        updated: "2024-01-01T00:00:00Z",
    }

    it("renders topic data", () => {
        withRouter(
            <ViewTopic
                item={baseTopic}
                newNote={noopStr}
            />
        )
        // The #react is rendered through markdown/enriched
        expect(screen.getByText("#react")).toBeInTheDocument()
    })

    it("shows create note action", () => {
        withRouter(
            <ViewTopic
                item={baseTopic}
                newNote={noopStr}
            />
        )
        expect(screen.getByAltText("Create a note associated with this topic")).toBeInTheDocument()
    })

    it("shows details action when not hidden", () => {
        withRouter(
            <ViewTopic
                item={baseTopic}
                newNote={noopStr}
            />
        )
        expect(screen.getByAltText("Go to topic details")).toBeInTheDocument()
    })

    it("displays name when provided", () => {
        withRouter(
            <ViewTopic
                item={baseTopic}
                name="React Framework"
                newNote={noopStr}
            />
        )
        expect(screen.getByText("React Framework")).toBeInTheDocument()
    })
})

describe("ViewWork", () => {
    const baseWork = {
        id: "w1",
        data: "Clean Code | Robert Martin",
        created: "2024-01-01T00:00:00Z",
        updated: "2024-01-01T00:00:00Z",
    }

    it("renders work data with metadata split", () => {
        withRouter(
            <ViewWork
                item={baseWork}
                putWork={noopBool}
            />
        )
        expect(screen.getByText("Clean Code")).toBeInTheDocument()
        expect(screen.getByText("Robert Martin")).toBeInTheDocument()
    })

    it("shows done action", () => {
        withRouter(
            <ViewWork
                item={baseWork}
                putWork={noopBool}
            />
        )
        expect(screen.getByAltText("Mark this item as done")).toBeInTheDocument()
    })

    it("shows re-open for archived works", () => {
        const archivedWork = { ...baseWork, archive: true }
        withRouter(
            <ViewWork
                item={archivedWork}
                putWork={noopBool}
            />
        )
        expect(screen.getByAltText("Re-open this item")).toBeInTheDocument()
    })

    it("shows today action for non-archived works", () => {
        withRouter(
            <ViewWork
                item={baseWork}
                putWork={noopBool}
            />
        )
        expect(screen.getByAltText("Add this item to today's reading")).toBeInTheDocument()
    })

    it("hides today action for archived works", () => {
        const archivedWork = { ...baseWork, archive: true }
        withRouter(
            <ViewWork
                item={archivedWork}
                putWork={noopBool}
            />
        )
        expect(screen.queryByAltText("Add this item to today's reading")).not.toBeInTheDocument()
    })

    it("shows details action when not hidden and not archived", () => {
        withRouter(
            <ViewWork
                item={baseWork}
                putWork={noopBool}
            />
        )
        expect(screen.getByAltText("Go to item details")).toBeInTheDocument()
    })
})

describe("PageNav", () => {
    const clear = { icon: "clear.svg", desc: "Clear", action: noop }
    const sync = { icon: "sync.svg", desc: "Sync", label: "Sync", action: noop }

    it("renders all navigation items", () => {
        withRouter(<PageNav clear={clear} sync={sync} />)
        expect(screen.getByText("Today")).toBeInTheDocument()
        expect(screen.getByText("Topics")).toBeInTheDocument()
        expect(screen.getByText("Tasks")).toBeInTheDocument()
        expect(screen.getByText("Notes")).toBeInTheDocument()
        expect(screen.getByText("Library")).toBeInTheDocument()
        expect(screen.getByText("Profile")).toBeInTheDocument()
        expect(screen.getByText("Help")).toBeInTheDocument()
    })

    it("renders sync button", () => {
        withRouter(<PageNav clear={clear} sync={sync} />)
        expect(screen.getByAltText("Sync")).toBeInTheDocument()
    })
})

describe("Shortcut", () => {
    it("renders keyboard code", () => {
        render(<Shortcut codes={["s"]}>Sync</Shortcut>)
        expect(screen.getByText("s")).toBeInTheDocument()
        expect(screen.getByText("Sync")).toBeInTheDocument()
    })

    it("renders multiple codes with 'or' separator", () => {
        render(<Shortcut codes={["1", "2"]}>Navigate</Shortcut>)
        expect(screen.getByText("1")).toBeInTheDocument()
        expect(screen.getByText("2")).toBeInTheDocument()
        expect(screen.getByText(/or/)).toBeInTheDocument()
    })
})

describe("ShortcutList", () => {
    it("renders group name and children", () => {
        render(
            <ShortcutList group="Navigation">
                <span>Shortcut 1</span>
            </ShortcutList>
        )
        expect(screen.getByText("Navigation")).toBeInTheDocument()
        expect(screen.getByText("Shortcut 1")).toBeInTheDocument()
    })
})

describe("Doc", () => {
    it("renders markdown content", () => {
        withRouter(<Doc markdown="# Hello World" />)
        expect(screen.getByText("Hello World")).toBeInTheDocument()
    })

    it("renders empty when no markdown", () => {
        withRouter(<Doc markdown="" />)
    })

    it("renders links within markdown", () => {
        withRouter(<Doc markdown="[Click here](https://example.com)" />)
        expect(screen.getByText("Click here")).toBeInTheDocument()
    })
})
