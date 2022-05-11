import { Task } from "./Task"
import { Note } from "./Note"
import { Topic } from "./Topic"

export interface Contents {
    tasks: Record<string, Task>,
    topics: Record<string, Topic>,
    notes: Record<string, Note>,
}
