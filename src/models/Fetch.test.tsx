import { fetchTasks, Task } from "./Task"
import { fetchNotes, Note } from "./Note"
import { fetchTopics, Topic } from "./Topic"
import { fetchWorks, Work } from "./Work"
import { sortByCreated, sortByData, sortByUpdated } from "./Item"
import { Term } from "./Term"

const makeTasks = (): Record<string, Task> => ({
    "t1": { data: "Buy groceries", created: "2024-01-01T00:00:00Z", updated: "2024-01-01T00:00:00Z" },
    "t2": { data: "Write tests", created: "2024-02-01T00:00:00Z", updated: "2024-02-01T00:00:00Z", archive: true },
    "t3": { data: "Fix bug", created: "2024-03-01T00:00:00Z", updated: "2024-03-01T00:00:00Z" },
    "t4": { data: "Deleted task", created: "2024-04-01T00:00:00Z", deleted: "2024-04-15T00:00:00Z", updated: "2024-04-15T00:00:00Z" },
    "t5": { data: "Review PR", created: "2024-05-01T00:00:00Z", updated: "2024-05-01T00:00:00Z", progress: 5 },
})

describe("fetchTasks", () => {
    it("returns active (non-deleted, non-archived) tasks", () => {
        const result = fetchTasks({
            tasks: makeTasks(),
            archive: false,
            sortBy: [],
        })
        expect(result).toHaveLength(3)
        expect(result.map(t => t.id)).toContain("t1")
        expect(result.map(t => t.id)).toContain("t3")
        expect(result.map(t => t.id)).toContain("t5")
    })

    it("returns archived tasks", () => {
        const result = fetchTasks({
            tasks: makeTasks(),
            archive: true,
            sortBy: [],
        })
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe("t2")
    })

    it("excludes deleted tasks", () => {
        const result = fetchTasks({
            tasks: makeTasks(),
            archive: false,
            sortBy: [],
        })
        expect(result.map(t => t.id)).not.toContain("t4")
    })

    it("sorts by created date descending", () => {
        const result = fetchTasks({
            tasks: makeTasks(),
            archive: false,
            sortBy: [sortByCreated(true)],
        })
        expect(result[0].id).toBe("t5")
        expect(result[result.length - 1].id).toBe("t1")
    })

    it("filters by search term", () => {
        const result = fetchTasks({
            tasks: makeTasks(),
            archive: false,
            sortBy: [],
            term: new Term("bug"),
        })
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe("t3")
    })

    it("applies additional filterMore", () => {
        const result = fetchTasks({
            tasks: makeTasks(),
            archive: false,
            sortBy: [],
            filterMore: (item) => item.progress !== undefined,
        })
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe("t5")
    })

    it("includes id in returned items", () => {
        const result = fetchTasks({
            tasks: makeTasks(),
            archive: false,
            sortBy: [],
        })
        result.forEach(item => {
            expect(item.id).toBeDefined()
            expect(typeof item.id).toBe("string")
        })
    })

    it("returns empty for empty tasks", () => {
        const result = fetchTasks({
            tasks: {},
            archive: false,
            sortBy: [],
        })
        expect(result).toHaveLength(0)
    })
})

const makeNotes = (): Record<string, Note> => ({
    "n1": { data: "Meeting notes", created: "2024-01-01T00:00:00Z", updated: "2024-01-01T00:00:00Z" },
    "n2": { data: "Archived note", created: "2024-02-01T00:00:00Z", updated: "2024-02-01T00:00:00Z", archive: true },
    "n3": { data: "Project ideas", created: "2024-03-01T00:00:00Z", updated: "2024-03-01T00:00:00Z" },
    "n4": { data: "Deleted note", deleted: "2024-04-01T00:00:00Z", updated: "2024-04-01T00:00:00Z" },
})

describe("fetchNotes", () => {
    it("returns active notes", () => {
        const result = fetchNotes({
            notes: makeNotes(),
            archive: false,
            sortBy: [],
        })
        expect(result).toHaveLength(2)
    })

    it("returns archived notes", () => {
        const result = fetchNotes({
            notes: makeNotes(),
            archive: true,
            sortBy: [],
        })
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe("n2")
    })

    it("filters by term", () => {
        const result = fetchNotes({
            notes: makeNotes(),
            archive: false,
            sortBy: [],
            term: new Term("meeting"),
        })
        expect(result).toHaveLength(1)
        expect(result[0].data).toBe("Meeting notes")
    })

    it("sorts by updated descending", () => {
        const result = fetchNotes({
            notes: makeNotes(),
            archive: false,
            sortBy: [sortByUpdated(true)],
        })
        expect(result[0].id).toBe("n3")
    })
})

const makeTopics = (): Record<string, Topic> => ({
    "tp1": { data: "#react", created: "2024-01-01T00:00:00Z", updated: "2024-01-01T00:00:00Z" },
    "tp2": { data: "#typescript", created: "2024-02-01T00:00:00Z", updated: "2024-02-01T00:00:00Z" },
    "tp3": { data: "#deleted-topic", deleted: "2024-03-01T00:00:00Z", updated: "2024-03-01T00:00:00Z" },
})

describe("fetchTopics", () => {
    it("returns non-deleted topics", () => {
        const result = fetchTopics({
            topics: makeTopics(),
            archive: false,
            sortBy: [],
        })
        expect(result).toHaveLength(2)
    })

    it("sorts alphabetically by data", () => {
        const result = fetchTopics({
            topics: makeTopics(),
            archive: false,
            sortBy: [sortByData()],
        })
        expect(result[0].data).toBe("#react")
        expect(result[1].data).toBe("#typescript")
    })

    it("filters by term", () => {
        const result = fetchTopics({
            topics: makeTopics(),
            archive: false,
            sortBy: [],
            term: new Term("type"),
        })
        expect(result).toHaveLength(1)
        expect(result[0].data).toBe("#typescript")
    })
})

const makeWorks = (): Record<string, Work> => ({
    "w1": { data: "Clean Code | Robert Martin", created: "2024-01-01T00:00:00Z", updated: "2024-01-01T00:00:00Z" },
    "w2": { data: "SICP | Abelson; Sussman", created: "2024-02-01T00:00:00Z", updated: "2024-02-01T00:00:00Z", archive: true },
    "w3": { data: "Deleted work", deleted: "2024-03-01T00:00:00Z", updated: "2024-03-01T00:00:00Z" },
    "w4": { data: "Design Patterns | GoF", created: "2024-04-01T00:00:00Z", updated: "2024-04-01T00:00:00Z", today: "2024-01-01T00:00:00Z" },
})

describe("fetchWorks", () => {
    it("returns active works", () => {
        const result = fetchWorks({
            works: makeWorks(),
            archive: false,
            sortBy: [],
        })
        expect(result).toHaveLength(2)
    })

    it("returns archived works", () => {
        const result = fetchWorks({
            works: makeWorks(),
            archive: true,
            sortBy: [],
        })
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe("w2")
    })

    it("filters by term", () => {
        const result = fetchWorks({
            works: makeWorks(),
            archive: false,
            sortBy: [],
            term: new Term("Clean"),
        })
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe("w1")
    })

    it("applies filterMore", () => {
        const result = fetchWorks({
            works: makeWorks(),
            archive: false,
            sortBy: [],
            filterMore: (item) => !!item.today,
        })
        expect(result).toHaveLength(1)
        expect(result[0].id).toBe("w4")
    })
})
