export interface Action {
    icon: string,
    desc: string,
    label?: string,
    gray?: boolean,
    // For disclosure toggles: whether the controlled section is open.
    expanded?: boolean,
    action: () => void,
}
