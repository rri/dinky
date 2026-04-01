import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { BrowserRouter } from "react-router-dom"
import { Wrapper } from "./Wrapper"
import { Button } from "./Button"
import { SearchBox } from "./SearchBox"
import { NotifyBox } from "./NotifyBox"
import { MsgBox } from "./MsgBox"
import { InfoBox } from "./InfoBox"
import { Card } from "./Card"
import { Footer } from "./Footer"
import { Icon } from "./Icon"
import { Link } from "./Link"
import { TagLabel } from "./TagLabel"
import { ProgressBar } from "./ProgressBar"
import { Enriched } from "./Enriched"
import { LastSynced, LastSyncedDateTime } from "./LastSynced"
import { Setting, SettingList, OptionSetting } from "./Settings"

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true }

const withRouter = (ui: React.ReactElement) => render(<BrowserRouter future={routerFuture}>{ui}</BrowserRouter>)

describe("Wrapper", () => {
    it("renders children with row layout", () => {
        render(<Wrapper layout="row"><span>child</span></Wrapper>)
        expect(screen.getByText("child")).toBeInTheDocument()
    })

    it("renders children with col layout", () => {
        render(<Wrapper layout="col"><span>child</span></Wrapper>)
        expect(screen.getByText("child")).toBeInTheDocument()
    })

    it("applies wrapClassName to outer div", () => {
        const { container } = render(<Wrapper layout="row" wrapClassName="outer"><span>x</span></Wrapper>)
        expect(container.querySelector(".outer")).toBeInTheDocument()
    })
})

describe("Button", () => {
    it("renders an image with alt text", () => {
        const action = jest.fn()
        render(<Button icon="test.svg" desc="Test button" action={action} />)
        const img = screen.getByAltText("Test button")
        expect(img).toBeInTheDocument()
    })

    it("calls action on click", () => {
        const action = jest.fn()
        render(<Button icon="test.svg" desc="Click me" action={action} />)
        fireEvent.click(screen.getByAltText("Click me"))
        expect(action).toHaveBeenCalledTimes(1)
    })

    it("renders label when provided", () => {
        const action = jest.fn()
        render(<Button icon="test.svg" desc="Desc" label="Sync" action={action} />)
        expect(screen.getByText("Sync")).toBeInTheDocument()
    })

    it("does not render label when not provided", () => {
        const action = jest.fn()
        render(<Button icon="test.svg" desc="Desc" action={action} />)
        expect(screen.queryByText("Sync")).not.toBeInTheDocument()
    })

    it("applies gray style when gray prop is true", () => {
        const action = jest.fn()
        render(<Button icon="test.svg" desc="Gray" action={action} gray={true} />)
        const img = screen.getByAltText("Gray")
        expect(img.className).toContain("gray")
    })
})

describe("SearchBox", () => {
    it("renders a search input", () => {
        const action = jest.fn()
        const refs = { search: React.createRef<HTMLInputElement>() }
        render(<SearchBox value="" action={action} refs={refs} />)
        expect(screen.getByPlaceholderText("Enter text to search...")).toBeInTheDocument()
    })

    it("displays current value", () => {
        const action = jest.fn()
        const refs = { search: React.createRef<HTMLInputElement>() }
        render(<SearchBox value="hello" action={action} refs={refs} />)
        expect(screen.getByDisplayValue("hello")).toBeInTheDocument()
    })

    it("calls action on input change", () => {
        const action = jest.fn()
        const refs = { search: React.createRef<HTMLInputElement>() }
        render(<SearchBox value="" action={action} refs={refs} />)
        fireEvent.change(screen.getByPlaceholderText("Enter text to search..."), { target: { value: "test" } })
        expect(action).toHaveBeenCalledWith("test")
    })
})

describe("NotifyBox", () => {
    it("renders notification text when provided", () => {
        render(<NotifyBox note="Syncing..." />)
        expect(screen.getByText("Syncing...")).toBeInTheDocument()
    })

    it("renders nothing when note is empty", () => {
        const { container } = render(<NotifyBox note="" />)
        expect(container.firstChild).toBeNull()
    })

    it("renders nothing when note is undefined", () => {
        const { container } = render(<NotifyBox />)
        expect(container.firstChild).toBeNull()
    })
})

describe("MsgBox", () => {
    it("renders children text", () => {
        render(<MsgBox>Hello World</MsgBox>)
        expect(screen.getByText("Hello World")).toBeInTheDocument()
    })

    it("renders emoji when provided", () => {
        render(<MsgBox emoji="🔨">Message</MsgBox>)
        expect(screen.getByText("🔨")).toBeInTheDocument()
    })

    it("does not render emoji div when not provided", () => {
        const { container } = render(<MsgBox>No emoji</MsgBox>)
        const divs = container.querySelectorAll("div")
        // Should not have emoji div
        expect(screen.queryByText("🔨")).not.toBeInTheDocument()
    })
})

describe("InfoBox", () => {
    it("renders children", () => {
        render(<InfoBox>Important info</InfoBox>)
        expect(screen.getByText("Important info")).toBeInTheDocument()
    })
})

describe("Card", () => {
    it("renders title when provided", () => {
        render(<Card title="My Card">Content</Card>)
        expect(screen.getByText("My Card")).toBeInTheDocument()
        expect(screen.getByText("Content")).toBeInTheDocument()
    })

    it("renders without title", () => {
        render(<Card>Content only</Card>)
        expect(screen.getByText("Content only")).toBeInTheDocument()
    })

    it("renders item count with pluralization", () => {
        render(<Card title="Tasks" count={3}>Content</Card>)
        expect(screen.getByText("(3 items)")).toBeInTheDocument()
    })

    it("renders singular count", () => {
        render(<Card title="Tasks" count={1}>Content</Card>)
        expect(screen.getByText("(1 item)")).toBeInTheDocument()
    })

    it("does not render count when zero or undefined", () => {
        render(<Card title="Tasks">Content</Card>)
        expect(screen.queryByText(/items?/)).not.toBeInTheDocument()
    })

    it("renders collapsed initially when defaultCollapsed and collapsible", () => {
        render(<Card title="Collapsible" collapsible={true} defaultCollapsed={true}>Hidden content</Card>)
        // Content should not be visible (rendered in empty div)
        expect(screen.queryByText("Hidden content")).not.toBeInTheDocument()
    })

    it("toggles collapse on click when collapsible without actions", () => {
        render(<Card title="Collapsible" collapsible={true} defaultCollapsed={true}>Toggle content</Card>)
        // Initially collapsed
        expect(screen.queryByText("Toggle content")).not.toBeInTheDocument()

        // Click to expand
        fireEvent.click(screen.getByText("Collapsible"))
        expect(screen.getByText("Toggle content")).toBeInTheDocument()

        // Click to collapse
        fireEvent.click(screen.getByText("Collapsible"))
        expect(screen.queryByText("Toggle content")).not.toBeInTheDocument()
    })

    it("renders actions buttons", () => {
        const action = jest.fn()
        render(<Card title="With Actions" actions={[{ icon: "test.svg", desc: "Action", action }]}>Content</Card>)
        expect(screen.getByAltText("Action")).toBeInTheDocument()
    })
})

describe("Footer", () => {
    it("renders copyright text", () => {
        withRouter(<Footer />)
        expect(screen.getByText("Ramnath R Iyer")).toBeInTheDocument()
    })
})

describe("Icon", () => {
    it("renders an image", () => {
        render(<Icon icon="test.svg" desc="Test icon" />)
        expect(screen.getByAltText("Test icon")).toBeInTheDocument()
    })

    it("uses empty alt when desc not provided", () => {
        render(<Icon icon="test.svg" />)
        const img = screen.getByRole("img")
        expect(img.getAttribute("alt")).toBe("")
    })
})

describe("Link", () => {
    it("renders external links as anchor tags", () => {
        withRouter(<Link href="https://example.com">External</Link>)
        const link = screen.getByText("External")
        expect(link.tagName).toBe("A")
        expect(link.getAttribute("href")).toBe("https://example.com")
    })

    it("renders internal links as NavLink", () => {
        withRouter(<Link href="/tasks">Internal</Link>)
        const link = screen.getByText("Internal")
        expect(link.getAttribute("href")).toBe("/tasks")
    })

    it("stops propagation on click", () => {
        const parentClick = jest.fn()
        withRouter(
            <div onClick={parentClick}>
                <Link href="https://example.com">Click me</Link>
            </div>
        )
        fireEvent.click(screen.getByText("Click me"))
        expect(parentClick).not.toHaveBeenCalled()
    })
})

describe("TagLabel", () => {
    it("renders tag data and title", () => {
        render(<TagLabel name="progress" data="50%" desc="progress description" />)
        expect(screen.getByText("50%")).toBeInTheDocument()
        expect(screen.getByTitle("progress description")).toBeInTheDocument()
    })
})

describe("ProgressBar", () => {
    it("renders 10 progress segments plus start and end markers", () => {
        const action = jest.fn()
        render(<ProgressBar action={action} />)
        expect(screen.getByText("🎬")).toBeInTheDocument()
        expect(screen.getByText("💯")).toBeInTheDocument()
    })

    it("calls action with false when reset clicked", () => {
        const action = jest.fn()
        render(<ProgressBar action={action} progress={5} />)
        fireEvent.click(screen.getByText("🎬"))
        expect(action).toHaveBeenCalledWith(false)
    })

    it("calls action with true when done clicked", () => {
        const action = jest.fn()
        render(<ProgressBar action={action} progress={5} />)
        fireEvent.click(screen.getByText("💯"))
        expect(action).toHaveBeenCalledWith(true)
    })

    it("shows filled segments based on progress value", () => {
        const action = jest.fn()
        const { container } = render(<ProgressBar action={action} progress={3} />)
        const progressSegments = container.querySelectorAll(".progress")
        expect(progressSegments).toHaveLength(3)
    })

    it("fills all segments when archived", () => {
        const action = jest.fn()
        const { container } = render(<ProgressBar action={action} archive={true} />)
        const progressSegments = container.querySelectorAll(".progress")
        expect(progressSegments).toHaveLength(10)
    })
})

describe("Enriched", () => {
    it("renders plain text", () => {
        render(<Enriched>Hello world</Enriched>)
        expect(screen.getByText("Hello world")).toBeInTheDocument()
    })

    it("highlights hashtag topics", () => {
        const { container } = render(<Enriched>Check out #react-hooks today</Enriched>)
        const topicSpan = container.querySelector(".topic")
        expect(topicSpan).toBeInTheDocument()
        expect(topicSpan?.textContent).toBe("#react-hooks")
    })

    it("renders React elements as-is", () => {
        render(<Enriched><strong>bold</strong></Enriched>)
        expect(screen.getByText("bold")).toBeInTheDocument()
    })
})

describe("LastSynced", () => {
    it("renders children", () => {
        render(<LastSynced>Last sync: </LastSynced>)
        expect(screen.getByText("Last sync:")).toBeInTheDocument()
    })
})

describe("LastSyncedDateTime", () => {
    it("renders date time text", () => {
        render(<LastSyncedDateTime>2024-06-01 10:30</LastSyncedDateTime>)
        expect(screen.getByText("2024-06-01 10:30")).toBeInTheDocument()
    })
})

describe("Setting", () => {
    it("renders label and input", () => {
        render(<Setting label="My Setting" type="text" value="hello" onChange={jest.fn()} />)
        expect(screen.getByText("My Setting")).toBeInTheDocument()
        expect(screen.getByDisplayValue("hello")).toBeInTheDocument()
    })
})

describe("SettingList", () => {
    it("renders with label and children", () => {
        render(
            <SettingList label="Group">
                <span>Setting 1</span>
            </SettingList>
        )
        expect(screen.getByText("Group")).toBeInTheDocument()
        expect(screen.getByText("Setting 1")).toBeInTheDocument()
    })

    it("renders without label", () => {
        render(
            <SettingList>
                <span>Setting 1</span>
            </SettingList>
        )
        expect(screen.getByText("Setting 1")).toBeInTheDocument()
    })
})

describe("OptionSetting", () => {
    it("renders radio buttons with labels", () => {
        const action1 = jest.fn()
        const action2 = jest.fn()
        render(
            <OptionSetting label="Theme" values={[
                { label: "Light", action: action1, checked: true },
                { label: "Dark", action: action2, checked: false },
            ]} />
        )
        expect(screen.getByText("Theme")).toBeInTheDocument()
        expect(screen.getByText("Light")).toBeInTheDocument()
        expect(screen.getByText("Dark")).toBeInTheDocument()
    })

    it("calls action when radio button clicked", () => {
        const action1 = jest.fn()
        const action2 = jest.fn()
        render(
            <OptionSetting label="Theme" values={[
                { label: "Light", action: action1, checked: true },
                { label: "Dark", action: action2, checked: false },
            ]} />
        )
        const darkRadio = screen.getAllByRole("radio")[1]
        fireEvent.click(darkRadio)
        expect(action2).toHaveBeenCalled()
    })
})
