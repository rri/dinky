import {
    filterByCreated,
    filterByUpdated,
    filterByDeleted,
    filterByArchive,
    filterByToday,
    sortByCreated,
    sortByUpdated,
    sortByDeleted,
    sortByToday,
    sortByData,
    reduceByTerm,
    belongsToToday,
} from "./Item"
import { Term } from "./Term"
import moment from "moment"

describe("filterByDeleted", () => {
    it("returns non-deleted items when status is false", () => {
        const filter = filterByDeleted(false)
        expect(filter({ deleted: undefined })).toBe(true)
        expect(filter({ deleted: "2024-01-01" })).toBe(false)
    })

    it("returns deleted items when status is true", () => {
        const filter = filterByDeleted(true)
        expect(filter({ deleted: "2024-01-01" })).toBe(true)
        expect(filter({ deleted: undefined })).toBe(false)
    })
})

describe("filterByArchive", () => {
    it("returns non-archived items when status is false", () => {
        const filter = filterByArchive(false)
        expect(filter({ archive: undefined })).toBe(true)
        expect(filter({ archive: false })).toBe(true)
        expect(filter({ archive: true })).toBe(false)
    })

    it("returns archived items when status is true", () => {
        const filter = filterByArchive(true)
        expect(filter({ archive: true })).toBe(true)
        expect(filter({ archive: undefined })).toBe(false)
    })
})

describe("filterByCreated", () => {
    it("returns created items when status is true", () => {
        const filter = filterByCreated(true)
        expect(filter({ created: "2024-01-01" })).toBe(true)
        expect(filter({ created: undefined })).toBe(false)
    })

    it("returns non-created items when status is false", () => {
        const filter = filterByCreated(false)
        expect(filter({ created: undefined })).toBe(true)
        expect(filter({ created: "2024-01-01" })).toBe(false)
    })
})

describe("filterByUpdated", () => {
    it("returns updated items when status is true", () => {
        const filter = filterByUpdated(true)
        expect(filter({ updated: "2024-01-01" })).toBe(true)
        expect(filter({ updated: undefined })).toBe(false)
    })

    it("returns non-updated items when status is false", () => {
        const filter = filterByUpdated(false)
        expect(filter({ updated: undefined })).toBe(true)
        expect(filter({ updated: "2024-01-01" })).toBe(false)
    })
})

describe("filterByToday", () => {
    it("returns items scheduled for today or earlier", () => {
        const filter = filterByToday()
        const pastDate = moment().subtract(1, "day").toISOString()
        const futureDate = moment().add(1, "day").toISOString()
        const now = moment().toISOString()

        expect(filter({ today: pastDate })).toBe(true)
        expect(filter({ today: now })).toBe(true)
        expect(filter({ today: futureDate })).toBe(false)
    })

    it("returns false for items without a today date", () => {
        const filter = filterByToday()
        expect(filter({ today: undefined })).toBe(false)
    })
})

describe("belongsToToday", () => {
    it("returns true for items with past today date", () => {
        const item = { today: moment().subtract(1, "hour").toISOString() }
        expect(belongsToToday(item)).toBe(true)
    })

    it("returns false for items without today date", () => {
        expect(belongsToToday({ today: undefined })).toBe(false)
    })

    it("returns false for items with future today date", () => {
        const item = { today: moment().add(2, "days").toISOString() }
        expect(belongsToToday(item)).toBe(false)
    })
})

describe("sortByCreated", () => {
    const older = { created: "2024-01-01T00:00:00Z" }
    const newer = { created: "2024-06-01T00:00:00Z" }

    it("sorts ascending by default", () => {
        const sort = sortByCreated()
        expect(sort(older, newer)).toBeLessThan(0)
        expect(sort(newer, older)).toBeGreaterThan(0)
    })

    it("sorts descending when reverse is true", () => {
        const sort = sortByCreated(true)
        expect(sort(older, newer)).toBeGreaterThan(0)
        expect(sort(newer, older)).toBeLessThan(0)
    })

    it("returns 0 for equal dates", () => {
        const sort = sortByCreated()
        expect(sort(older, { ...older })).toBe(0)
    })
})

describe("sortByUpdated", () => {
    it("sorts ascending by default", () => {
        const sort = sortByUpdated()
        const a = { updated: "2024-01-01T00:00:00Z" }
        const b = { updated: "2024-06-01T00:00:00Z" }
        expect(sort(a, b)).toBeLessThan(0)
    })

    it("sorts descending when reversed", () => {
        const sort = sortByUpdated(true)
        const a = { updated: "2024-01-01T00:00:00Z" }
        const b = { updated: "2024-06-01T00:00:00Z" }
        expect(sort(a, b)).toBeGreaterThan(0)
    })
})

describe("sortByDeleted", () => {
    it("sorts by deleted date", () => {
        const sort = sortByDeleted()
        const a = { deleted: "2024-01-01T00:00:00Z" }
        const b = { deleted: "2024-06-01T00:00:00Z" }
        expect(sort(a, b)).toBeLessThan(0)
    })
})

describe("sortByToday", () => {
    it("sorts by today date", () => {
        const sort = sortByToday()
        const a = { today: "2024-01-01T00:00:00Z" }
        const b = { today: "2024-06-01T00:00:00Z" }
        expect(sort(a, b)).toBeLessThan(0)
    })
})

describe("sortByData", () => {
    it("sorts alphabetically ascending by default", () => {
        const sort = sortByData()
        expect(sort({ data: "apple" }, { data: "banana" })).toBeLessThan(0)
        expect(sort({ data: "banana" }, { data: "apple" })).toBeGreaterThan(0)
    })

    it("sorts alphabetically descending when reversed", () => {
        const sort = sortByData(true)
        expect(sort({ data: "apple" }, { data: "banana" })).toBeGreaterThan(0)
        expect(sort({ data: "banana" }, { data: "apple" })).toBeLessThan(0)
    })

    it("handles empty data strings", () => {
        const sort = sortByData()
        expect(sort({ data: "" }, { data: "banana" })).toBe(-1)
        expect(sort({ data: "apple" }, { data: "" })).toBe(1)
        expect(sort({ data: "" }, { data: "" })).toBe(0)
    })
})

describe("reduceByTerm", () => {
    it("returns all items when term has no source", () => {
        const term = new Term("")
        const reducer = reduceByTerm(term)
        const items = [{ data: "hello" }, { data: "world" }]
        const result = items.reduce(reducer, [])
        expect(result).toHaveLength(2)
    })

    it("filters items matching the term", () => {
        const term = new Term("hello")
        const reducer = reduceByTerm(term)
        const items = [{ data: "hello world" }, { data: "goodbye" }]
        const result = items.reduce(reducer, [])
        expect(result).toHaveLength(1)
        expect(result[0].data).toBe("hello world")
    })

    it("returns all items when term is undefined", () => {
        const reducer = reduceByTerm(undefined)
        const items = [{ data: "hello" }, { data: "world" }]
        const result = items.reduce(reducer, [])
        expect(result).toHaveLength(2)
    })

    it("supports regex matching", () => {
        const term = new Term("hel+o")
        const reducer = reduceByTerm(term)
        const items = [{ data: "hello" }, { data: "helo" }, { data: "world" }]
        const result = items.reduce(reducer, [])
        expect(result).toHaveLength(2)
    })

    it("is case-insensitive", () => {
        const term = new Term("HELLO")
        const reducer = reduceByTerm(term)
        const items = [{ data: "Hello World" }, { data: "goodbye" }]
        const result = items.reduce(reducer, [])
        expect(result).toHaveLength(1)
    })
})
