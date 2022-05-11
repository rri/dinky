import back from "@material-design-icons/svg/two-tone/keyboard_backspace.svg"
import clear from "@material-design-icons/svg/two-tone/backspace.svg"
import download from "@material-design-icons/svg/two-tone/file_download.svg"
import help from "@material-design-icons/svg/two-tone/help.svg"
import listadd from "@material-design-icons/svg/two-tone/playlist_add.svg"
import more from "@material-design-icons/svg/two-tone/more_horiz.svg"
import notes from "@material-design-icons/svg/two-tone/edit_note.svg"
import plus from "@material-design-icons/svg/two-tone/add_box.svg"
import profile from "@material-design-icons/svg/two-tone/manage_accounts.svg"
import topics from "@material-design-icons/svg/two-tone/tag.svg"
import tasks from "@material-design-icons/svg/two-tone/directions_run.svg"
import tick from "@material-design-icons/svg/two-tone/done.svg"
import today from "@material-design-icons/svg/two-tone/wb_sunny.svg"
import upload from "@material-design-icons/svg/two-tone/file_upload.svg"
import styles from "../styles/Icon.module.css"

interface Props {
    icon: string,
    desc?: string,
}

export function Icon(props: Props) {
    return (
        <img
            className={styles.icon}
            src={props.icon}
            alt={props.desc ? props.desc : ""}
            title={props.desc}
        />
    )
}

export const icons = {
    back,
    clear,
    download,
    help,
    listadd,
    more,
    notes,
    plus,
    profile,
    topics,
    tasks,
    tick,
    today,
    upload,
} as const
