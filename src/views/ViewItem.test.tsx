import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { ViewItem } from "./ViewItem"

// Mock uuid
jest.mock("uuid", () => ({
    v4: jest.fn(() => "mock-uuid"),
}))

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true }

const mockItem = {
    id: "item-1",
    data: "Test Item Content",
    created: "2024-01-01T00:00:00Z",
}

const mockActions = [
    { icon: "delete.svg", desc: "Delete", action: jest.fn() }
]

describe("ViewItem", () => {
    it("renders item content in read mode", () => {
        render(
            <MemoryRouter future={routerFuture}>
                <ViewItem
                    slug="tasks"
                    item={mockItem as any}
                    placeholder="Enter task"
                    actions={mockActions}
                />
            </MemoryRouter>
        )
        expect(screen.getByText("Test Item Content")).toBeInTheDocument()
    })

    it("switches to edit mode on click", () => {
        render(
            <MemoryRouter future={routerFuture}>
                <ViewItem
                    slug="tasks"
                    item={mockItem as any}
                    placeholder="Enter task"
                    actions={mockActions}
                />
            </MemoryRouter>
        )
        fireEvent.click(screen.getByText("Test Item Content"))
        expect(screen.getByRole("textbox")).toBeInTheDocument()
        expect(screen.getByDisplayValue("Test Item Content")).toBeInTheDocument()
    })

    it("calls putTask on blur with new content", () => {
        const putTask = jest.fn(() => true)
        render(
            <MemoryRouter future={routerFuture}>
                <ViewItem
                    slug="tasks"
                    item={mockItem as any}
                    placeholder="Enter task"
                    actions={mockActions}
                    putTask={putTask}
                />
            </MemoryRouter>
        )
        fireEvent.click(screen.getByText("Test Item Content"))
        const input = screen.getByRole("textbox")
        fireEvent.keyDown(input, { key: "a" }) 
        fireEvent.change(input, { target: { value: "Updated Content" } })
        fireEvent.blur(input)
        expect(putTask).toHaveBeenCalledWith("item-1", expect.objectContaining({ data: "Updated Content" }))
    })

    it("handles enter key to save in oneline mode", () => {
        const putTask = jest.fn(() => true)
        render(
            <MemoryRouter future={routerFuture}>
                <ViewItem
                    slug="tasks"
                    item={mockItem as any}
                    placeholder="Enter task"
                    actions={mockActions}
                    putTask={putTask}
                    oneline={true}
                />
            </MemoryRouter>
        )
        fireEvent.click(screen.getByText("Test Item Content"))
        const input = screen.getByRole("textbox")
        fireEvent.keyDown(input, { key: "a" })
        fireEvent.change(input, { target: { value: "New Line Content" } })
        fireEvent.keyDown(input, { key: "Enter", code: "Enter" })
        expect(putTask).toHaveBeenCalledWith("item-1", expect.objectContaining({ data: "New Line Content" }))
    })

    it("handles escape key to cancel/save", () => {
        const putTask = jest.fn(() => true)
        render(
            <MemoryRouter future={routerFuture}>
                <ViewItem
                    slug="tasks"
                    item={mockItem as any}
                    placeholder="Enter task"
                    actions={mockActions}
                    putTask={putTask}
                />
            </MemoryRouter>
        )
        fireEvent.click(screen.getByText("Test Item Content"))
        const input = screen.getByRole("textbox")
        fireEvent.keyDown(input, { key: "a" })
        fireEvent.change(input, { target: { value: "Changed" } })
        fireEvent.keyDown(input, { key: "Escape", code: "Escape" })
        expect(putTask).toHaveBeenCalledWith("item-1", expect.objectContaining({ data: "Changed" }))
    })

    it("renders metadata bits when enabled", () => {
        const itemWithMetadata = {
            ...mockItem,
            data: "Title | Bit 1 ; Bit 2",
        }
        render(
            <MemoryRouter future={routerFuture}>
                <ViewItem
                    slug="works"
                    item={itemWithMetadata as any}
                    placeholder="Enter work"
                    actions={[]}
                    metadata={true}
                    oneline={true}
                    readonly={true}
                />
            </MemoryRouter>
        )
        expect(screen.getByText("Title")).toBeInTheDocument()
        expect(screen.getByText("Bit 1")).toBeInTheDocument()
        expect(screen.getByText("Bit 2")).toBeInTheDocument()
    })

    it("calls details callback on click when readonly", () => {
        const details = jest.fn()
        render(
            <MemoryRouter future={routerFuture}>
                <ViewItem
                    slug="tasks"
                    item={mockItem as any}
                    placeholder="Enter task"
                    actions={[]}
                    readonly={true}
                    details={details}
                />
            </MemoryRouter>
        )
        fireEvent.click(screen.getByText("Test Item Content"))
        expect(details).toHaveBeenCalled()
    })
})
