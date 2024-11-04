export interface Action {
    icon: string,
    desc: string,
    label?: string,
    gray?: boolean,
    action: () => void,
}
