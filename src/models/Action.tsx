export interface Action {
    icon: string,
    desc: string,
    gray?: boolean,
    action: () => void,
}
