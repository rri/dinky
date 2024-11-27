import { NavLink } from "react-router-dom"
import { Card } from "../views/Card"
import { Shortcut, ShortcutList } from "../views/Shortcuts"
import { Doc } from "../views/Doc"
import { Wrapper } from "../views/Wrapper"

interface Props {
    userguide: string,
}

export function Help(props: Props) {
    return (
        <Wrapper layout="col">
            <Card title="User Guide" id="user-guide">
                <Doc markdown={props.userguide} />
            </Card>
            <Card title="Keyboard Shortcuts" id="keyboard-shortcuts">
                <ShortcutList group="Navigation">
                    <Shortcut codes={["`"]}>Go to <NavLink to="/" title="Go to today's agenda">today's agenda</NavLink></Shortcut>
                    <Shortcut codes={["1"]}>Go to <NavLink to="/topics" title="Go to topics">topics</NavLink></Shortcut>
                    <Shortcut codes={["2"]}>Go to <NavLink to="/tasks" title="Go to tasks">tasks</NavLink></Shortcut>
                    <Shortcut codes={["3"]}>Go to <NavLink to="/notes" title="Go to notes">notes</NavLink></Shortcut>
                    <Shortcut codes={["4"]}>Go to your <NavLink to="/works" title="Go to your library">library</NavLink></Shortcut>
                    <Shortcut codes={["l"]}>Go to your <NavLink to="/works" title="Go to your library">library</NavLink> (alternative)</Shortcut>
                    <Shortcut codes={["?"]}>Get help (this page)</Shortcut>
                    <Shortcut codes={[","]}>View or edit your <NavLink to="/profile" title="Go to your profile">profile</NavLink></Shortcut>
                </ShortcutList>
                <ShortcutList group="Search">
                    <Shortcut codes={["/"]}>Start type-to-search</Shortcut>
                </ShortcutList>
                <ShortcutList group="Content">
                    <Shortcut codes={["n"]}>New topic (on <NavLink to="/topics" title="Go to topics">topics</NavLink> page)</Shortcut>
                    <Shortcut codes={["n"]}>New task (on <NavLink to="/tasks" title="Go to tasks">tasks</NavLink> and <NavLink to="/" title="Go to today's agenda">agenda</NavLink> pages)</Shortcut>
                    <Shortcut codes={["n"]}>New note (on <NavLink to="/notes" title="Go to notes">notes</NavLink> page)</Shortcut>
                    <Shortcut codes={["n"]}>New library item (on <NavLink to="/works" title="Go to library">library</NavLink> page)</Shortcut>
                </ShortcutList>
                <ShortcutList group="Profile Data">
                    <Shortcut codes={["s"]}>Sync (<NavLink to="/profile" title="Configure sync settings">configure</NavLink>)</Shortcut>
                    <Shortcut codes={["S"]}>Sync and compact data (<NavLink to="/profile" title="Configure sync settings">configure</NavLink>)</Shortcut>
                    <Shortcut codes={["d"]}>Download (on <NavLink to="/profile" title="Go to your profile">profile</NavLink> page)</Shortcut>
                    <Shortcut codes={["u"]}>Upload (on <NavLink to="/profile" title="Go to your profile">profile</NavLink> page)</Shortcut>
                </ShortcutList>
            </Card>
        </Wrapper>
    )
}
