import { AnchorHTMLAttributes } from "react"
import { NavLink } from "react-router-dom"

export function Link(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
    const alink = () => <a
        href={props.href}
        rel="noopener noreferrer"
        title={props.children?.toString()}
        onClick={e => e.stopPropagation()}
    >{props.children}</a>

    const nlink = () => <NavLink
        to={props.href ? props.href : ""}
        onClick={e => e.stopPropagation()}
    >{props.children}</NavLink>

    // Only same-origin paths are routed internally; protocol-relative URLs
    // (e.g. "//example.com") point to other sites.
    const internal = !!props.href && props.href.startsWith("/") && !props.href.startsWith("//") && !props.href.startsWith("/\\")

    return internal ? nlink() : alink()
}
