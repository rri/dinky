import { Task } from "./Task"
import { Note } from "./Note"
import { Tag } from "./Tag"

export interface Contents {
    tasks: Record<string, Task>,
    tags: Record<string, Tag>,
    notes: Record<string, Note>,
}
