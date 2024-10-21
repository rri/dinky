import alarm from "@material-design-icons/svg/two-tone/alarm_on.svg"
import arrowDown from "@material-design-icons/svg/two-tone/expand_more.svg"
import arrowLeft from "@material-design-icons/svg/two-tone/chevron_left.svg"
import back from "@material-design-icons/svg/two-tone/keyboard_backspace.svg"
import clear from "@material-design-icons/svg/two-tone/backspace.svg"
import cloud from "@material-design-icons/svg/two-tone/cloud.svg"
import download from "@material-design-icons/svg/two-tone/file_download.svg"
import help from "@material-design-icons/svg/two-tone/help.svg"
import listadd from "@material-design-icons/svg/two-tone/playlist_add.svg"
import more from "@material-design-icons/svg/two-tone/more_horiz.svg"
import notes from "@material-design-icons/svg/two-tone/edit_note.svg"
import plus from "@material-design-icons/svg/two-tone/add_box.svg"
import profile from "@material-design-icons/svg/two-tone/manage_accounts.svg"
import restore from "@material-design-icons/svg/two-tone/restore.svg"
import topics from "@material-design-icons/svg/two-tone/tag.svg"
import tasks from "@material-design-icons/svg/two-tone/directions_run.svg"
import tick from "@material-design-icons/svg/two-tone/done.svg"
import today from "@material-design-icons/svg/two-tone/wb_sunny.svg"
import trash from "@material-design-icons/svg/two-tone/delete.svg"
import upload from "@material-design-icons/svg/two-tone/file_upload.svg"
import works from "@material-design-icons/svg/two-tone/menu_book.svg"
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
    alarm,
    arrowDown,
    arrowLeft,
    back,
    clear,
    cloud,
    download,
    help,
    listadd,
    more,
    notes,
    plus,
    profile,
    restore,
    topics,
    tasks,
    tick,
    today,
    trash,
    upload,
    works,
} as const
