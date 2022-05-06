import { NavLink } from "react-router-dom"

export function renderLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
    const alink = () => <a
        href={props.href}
        title={props.children?.toString()}
        onClick={e => e.stopPropagation()}
    >{props.children}</a>

    const nlink = () => <NavLink
        to={props.href ? props.href : ""}
        onClick={e => e.stopPropagation()}
    >{props.children}</NavLink>

    return props.href && props.href.startsWith("/") ? nlink() : alink()
}
