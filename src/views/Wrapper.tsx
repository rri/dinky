import styles from "../styles/Wrapper.module.css"

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    layout: "row" | "col",
    wrapClassName?: string,
}

export function Wrapper(props: Props) {
    const { className, wrapClassName, layout, children, ...rest } = props
    return (
        <div className={wrapClassName ? wrapClassName : ""}>
            <div className={[
                styles.main,
                className ? className : "",
                layout === "row" ? styles.row : styles.col
            ].join(" ")} {...rest}>
                {children}
            </div>
        </div>
    )
}
