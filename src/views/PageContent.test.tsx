import React from "react"
import { render, screen, act } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { PageContent } from "./PageContent"
import { Term } from "../models/Term"
import { DisplayTheme } from "../models/DisplaySettings"

// Mock the userguide markdown import
jest.mock("../docs/UserGuide.md", () => "mocked-userguide-url")

const noop = () => { }
const noopBool = () => true
const noopStr = () => "id"
const noopHandler = (h: (evt?: KeyboardEvent) => void) => { }

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true }

const defaultSettings = {
    storage: { registry: { enabled: false, events: {} } },
    retention: { periodDays: 30 },
    display: { theme: DisplayTheme.Auto },
}

const defaultContents = {
    tasks: { "t1": { data: "Test task", created: "2024-01-01T00:00:00Z", updated: "2024-01-01T00:00:00Z" } },
    topics: {},
    notes: {},
    works: {},
}

const defaultProps = {
    settings: defaultSettings,
    contents: defaultContents,
    term: new Term(""),
    back: { icon: "back.svg", desc: "Back", action: noop },
    clear: { icon: "clear.svg", desc: "Clear", action: noop },
    newTask: noopStr,
    newTopic: noopStr,
    newNote: noopStr,
    newWork: noopStr,
    putRetentionSettings: noop,
    putDisplaySettings: noop,
    putStorageSettings: noop,
    putTask: noopBool,
    putTopic: noopBool,
    putNote: noopBool,
    putWork: noopBool,
    killTasks: noop,
    exportData: noop,
    importData: noop,
    sync: noop,
    registerNewHandler: noopHandler,
    registerExportHandler: noopHandler,
    registerImportHandler: noopHandler,
}

let fetchResolve: (value: string) => void

beforeEach(() => {
    // Mock fetch so we can control when the promise resolves.
    // PageContent's useMemo calls fetch(userguide).then(res => res.text()).then(setUserguideMarkdown)
    // We need to let this resolve inside act() to avoid the act() warning.
    global.fetch = jest.fn(() =>
        Promise.resolve({
            text: () => new Promise<string>((resolve) => { fetchResolve = resolve }),
        })
    ) as jest.Mock
})

afterEach(() => {
    jest.restoreAllMocks()
})

async function renderPageContent(route: string, props = defaultProps) {
    await act(async () => {
        render(
            <MemoryRouter future={routerFuture} initialEntries={[route]}>
                <PageContent {...props} />
            </MemoryRouter>
        )
    })
    // Now let the fetch resolve and flush the state update
    await act(async () => {
        fetchResolve("# User Guide Content")
    })
}

describe("PageContent", () => {
    it("renders Today page at root route", async () => {
        await renderPageContent("/")
        expect(screen.getByText("Today's Tasks")).toBeInTheDocument()
    })

    it("renders Tasks page at /tasks", async () => {
        await renderPageContent("/tasks")
        expect(screen.getByText("Tasks")).toBeInTheDocument()
    })

    it("renders Notes page at /notes", async () => {
        await renderPageContent("/notes")
        expect(screen.getByText("Notes")).toBeInTheDocument()
    })

    it("renders Topics page at /topics", async () => {
        await renderPageContent("/topics")
        expect(screen.getByText("Topics")).toBeInTheDocument()
    })

    it("renders Works page at /works", async () => {
        await renderPageContent("/works")
        expect(screen.getByText("Library")).toBeInTheDocument()
    })

    it("renders Profile page at /profile", async () => {
        await renderPageContent("/profile")
        expect(screen.getByText("Cloud Sync")).toBeInTheDocument()
    })

    it("renders Help page at /help", async () => {
        await renderPageContent("/help")
        expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument()
    })

    it("renders Search results when term has 3+ characters", async () => {
        await renderPageContent("/tasks", { ...defaultProps, term: new Term("Tes") })
        expect(screen.getByText("Search Results")).toBeInTheDocument()
    })

    it("does not render Search when term has < 3 characters", async () => {
        await renderPageContent("/tasks", { ...defaultProps, term: new Term("Te") })
        expect(screen.queryByText("Search Results")).not.toBeInTheDocument()
        expect(screen.getByText("Tasks")).toBeInTheDocument()
    })

    it("renders TaskDetails at /tasks/:id", async () => {
        await renderPageContent("/tasks/t1")
        expect(screen.getByText("Task Details")).toBeInTheDocument()
    })
})
