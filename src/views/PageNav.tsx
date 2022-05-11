import { icons } from "./Icon"
import { Action } from "../models/Action"
import { PageNavItem } from "./PageNavItem"
import { Spacer } from "./Spacer"
import { Wrapper } from "./Wrapper"
import styles from "../styles/PageNav.module.css"

interface Props {
    clear: Action,
}

export function PageNav(props: Props) {
    return (
        <Wrapper layout="row" className={styles.main}>
            <PageNavItem name="Today" slug="" icon={icons.today} hideName={true} clear={props.clear} />
            <PageNavItem name="Tasks" slug="tasks" icon={icons.tasks} clear={props.clear} />
            <PageNavItem name="Topics" slug="topics" icon={icons.topics} clear={props.clear} />
            <PageNavItem name="Notes" slug="notes" icon={icons.notes} clear={props.clear} />
            <Spacer />
            <PageNavItem name="Profile" slug="profile" icon={icons.profile} hideName={true} clear={props.clear} />
            <PageNavItem name="Help" slug="help" icon={icons.help} hideName={true} clear={props.clear} />
        </Wrapper>
    )
}
