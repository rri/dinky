# Introduction

[dinky.dev](https://dinky.dev) helps you organize your life. Its core concepts are simple, and built to take advantage of your *daily rhythms*, the natural ways in which someone acquires and manages information. Here's what you need to know:

* Create [notes](https://dinky.dev/notes) to write down short blurbs of information (ideas, suggestions, meeting outcomes, action items). Notes make it easy to quickly collect *raw* information, to be synthesized later.
* Create [tasks](https://dinky.dev/tasks) representing concrete actions you need to take. Each task ideally requires no more than 20 minutes to complete, and large tasks are broken down into smaller ones.
* Create [tags](https://dinky.dev/tags) associated with either tasks or notes, by including them inline as part of the text. Tags are hyphenated phrases introduced with a "`#`" in front of the phrase (example: `#my-topic`).

You can quickly search for text by pressing the "`/`" (forward slash) shortcut at any time. Search text may include regular expressions, in case you're savvy with those. Additional [keyboard shortcuts](https://dinky.dev/help#keyboard-shortcuts) are available for easy navigation.

Each day, you would pick tasks in your backlog to be completed, and add them to your [agenda](https://dinky.dev/) on the start page. Tasks added to your agenda disappear (from your agenda) at the end of the day, but you can always visit the backlog and re-add them, in case you want to pick them up again.

# Customization

The way you manage your agenda can be customized in a couple of ways. Firstly, you can set your *morning buffer*, which keeps tasks on your agenda for a bit longer — as many hours as you specify — beyond midnight. Secondly, you can set your *evening buffer*, which helps when you want to set the next day's agenda on the previous evening itself (for instance, as you make plans for the following day). Both these settings are available on the [profile](https://dinky.dev/profile) page.

# Storage & Security

Your data is stored locally within the browser's "local storage", and none of it is currently sent to (or stored in) the cloud. While this eliminates the need for authentication and has certain benefits in terms of simplicity and security, it also has some disadvantages:

1. Any individual with authorized access to your computer can view your data.
2. If your browser or computer is compromised, malicious software may access your data.
3. Your browser's private mode cannot be used (data is discarded at the end of the session).
4. Synchronization across devices or browsers is unavailable.
5. Centralized backups are unavailable.
6. Local storage doesn't allow a lot of data to be stored (typically less than 5MB).

*Future versions of this software may enable synchronization across devices and browsers, along with centralized backups, but users will always be in control of where their data is transmitted, and who is permitted to access it.*

# Exporting & Importing Data

You can export all of your data from the [profile](https://dinky.dev/profile) page. You'll be prompted for the download of a [JSON](https://www.json.org) file that includes all your data, **except** for any sensitive settings (such as credentials). You can import previously exported data from the same page. Any data you import will be merged into the existing data, overwriting existing entries (where they exist).

For tasks and tags (but **not** notes), there's another way to bulk-import items. If you create a new task or tag, and copy-and-paste a newline-separated *list* of items into the input text area, it'll automatically create individual items, one per line. As an example, if you copy-and-paste the following list into the input text area for creating a new tag, you'll end up with three individual tags: `#home-improvement`, `#reading`, and `#action-item`.

```
home-improvement
reading
action-item
```

# Getting in Touch

This application's source code is distributed as open-source software under the Apache 2.0 license. You can find more details (including the source code) on its [GitHub page](https://github.com/rri/dinky). Please feel free to report bugs or request features using the [issue tracker](https://github.com/rri/dinky/issues). If you're interested in contributing or would like to chat, my email address is **riyer** at **optimix.dev**.
