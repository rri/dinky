import { Term } from "./Term"

describe("Term", () => {
    describe("constructor with valid regex", () => {
        it("creates a RegExp value", () => {
            const term = new Term("hello")
            expect(term.value()).toBeInstanceOf(RegExp)
        })

        it("preserves the source string", () => {
            const term = new Term("hello")
            expect(term.source()).toBe("hello")
        })

        it("creates case-insensitive global regex", () => {
            const term = new Term("hello")
            const val = term.value() as RegExp
            expect(val.flags).toContain("i")
            expect(val.flags).toContain("g")
        })
    })

    describe("constructor with invalid regex", () => {
        it("falls back to string value for invalid regex", () => {
            const term = new Term("[invalid")
            expect(typeof term.value()).toBe("string")
            expect(term.value()).toBe("[invalid")
        })

        it("preserves the source string for invalid regex", () => {
            const term = new Term("[invalid")
            expect(term.source()).toBe("[invalid")
        })
    })

    describe("constructor with empty string", () => {
        it("creates a RegExp for empty string", () => {
            const term = new Term("")
            expect(term.value()).toBeInstanceOf(RegExp)
        })

        it("returns empty source", () => {
            const term = new Term("")
            expect(term.source()).toBe("")
        })
    })

    describe("regex patterns", () => {
        it("supports regex special characters", () => {
            const term = new Term("hello.*world")
            const val = term.value() as RegExp
            expect(val.test("hello beautiful world")).toBe(true)
            expect(val.test("goodbye")).toBe(false)
        })

        it("supports character classes", () => {
            const term = new Term("[abc]")
            const val = term.value() as RegExp
            expect(val.test("a")).toBe(true)
            expect(val.test("d")).toBe(false)
        })
    })
})
