# Introduction

[dinky.dev](/) helps you organize your life.

Its core concepts are simple, and built to take advantage of the natural ways in which you acquire and manage information. Daily activities boil down to a few simple abstractions: topics, tasks, and notes. **dinky.dev** also features a library where you can track your books and papers.

# Topics

First, identify your goal, project or problem area of interest and associate it with a [topic](/topics). A topic is a short hyphenated phrases prefixed with a "`#`" (example: `#my-topic`) that can be added inline to tasks and notes.

Some ideas to ponder on:

- Given notes captured during the day, what new tasks do you want to create?
- Given a large or ambiguous task, how can you break it down into smaller ones?
- Do the current tasks help you make progress towards your most important goals?

# Tasks

A [task](/tasks) represents a concrete, time-bound action you need to take. Each task ideally requires no more than 20 minutes to complete, and larger tasks are meant to be broken down into smaller ones. Knowing what needs to be done next makes it easy to focus on the task at hand and get it done.

# Notes

A [note](/notes) helps you write down short blurbs of information (ideas, suggestions, meeting summaries, action items). You can maximize recall and learning by adding your thoughts and takeaways. Notes make it easy to record raw information meant to be synthesized later.

# Library

You can use your personalized [library](/works)) to manage references to books, papers, articles, journals, blog posts, and other reading material. When you add items to your library you can use the following special format to capture the title and authors separately. Authors are optional, and you can add as many as you like.

```
<title> | <primary-author>; <secondary-author>; ...
```

Here are some real examples of items you might add to your library:

```
Blog post about [dinky.dev](https://optimix.dev/2022/05/07/dinky-dev/)
An Equal Music | Vikram Seth
Calculus | Ron Larson; Bruce H Edwards
```

# Agenda

Any number of tasks in your backlog or items in your library may be added to your daily agenda. When you add something to your agenda, the task or item stays there until it is removed or marked as done. Your agenda is always the first thing you see on the homepage.

# Reminders

If you go to the details of a task or an item in your library, you can set a reminder for it on any future date (today inclusive). When you set a reminder for a task or item, it will automatically appear on your [agenda](/) view on that date. **Note that you will not get any email or popup notifications.**

# Search

You can quickly search for text by pressing the "`/`" (forward slash) shortcut at any time. Search text may include regular expressions, in case you're savvy with those. Additional [keyboard shortcuts](#keyboard-shortcuts) are available for easy navigation.

# Storage & Security

Your data is stored locally within the browser's [local storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage), and is synchronized to the cloud on demand, *only* if you've set up a personal S3 bucket on AWS with the necessary credentials and roles. This configuration needs to be set up and saved only once, after which you may initiate a sync from the [profile](/profile/#cloud-sync) page, or by using the `s` keyboard shortcut, at any time. Using the `S` (i.e., capitalized) shortcut forces a slower synchronization process where your data files on the server are consolidated into a single one.

*Replace $bucket, $region, $policy, $usergroup and $user with arbitrary fresh values.*

To set up your sync configuration:

1. Create an [AWS account](https://aws.amazon.com) and sign in to your AWS Console.
2. Navigate to the [S3 console](https://s3.console.aws.amazon.com).
3. Create a new empty private S3 bucket called `$bucket` to store your data, in a region `$region` of your choice, **blocking public access**.
4. Go to the **permissions** tab for your bucket.
5. Add the Cross-Origin Resource Sharing (CORS) policy listed below.

```
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "https://dinky.dev"
        ],
        "ExposeHeaders": [
            "Content-Length",
            "Content-Type",
            "Date",
            "ETag"
        ]
    }
]
```

6. Search for `IAM` within the AWS Console and switch to it.
7. Create a new **policy** called `$policy` with the following content:

* Service: `S3`
* Actions: `ListBucket`, `GetObject`, `PutObject`, `DeleteObject`
* Resources:
    - Bucket resource:
        - Bucket name: `$bucket`
    - Object resource:
        - Bucket name: `$bucket`, Object name: `*`

8. Create a new **user group** called `$usergroup`.
9. Attach the `$policy` policy to the `$usergroup` group.
10. Create a new **user** called `$user`, and add this user to `$usergroup`.
11. Create a new access key and copy the **Access key ID** and **Secret access key** values.

Finally, enter the information collected above into your sync settings on the [profile](/profile/#cloud-sync) page.

# Sync on Page Load

You may configure the app to synchronize automatically whenever the page loads (or reloads), on the [profile](/profile/#cloud-sync) page. Please note that synchronization may incur charges on your AWS account.

# Auto Sync

You may configure the app to synchronize automatically on a periodic basis. You can set this on the [profile](/profile/#cloud-sync) page, with the periodic value defined in minutes. Declaring the value to be zero (0) turns off periodic synchronization. Please note that synchronization may incur charges on your AWS account.

# Auto Push Items

It is easy to forget to synchronize manually after adding or updating items. To make your life easier, you can turn on this setting on the [profile](/profile/#cloud-sync) page. When this setting is turned on, updates are individually posted to the cloud as *events*, and these events are automatically merged during manual or automatic synchronization on any device. Of course, updates will not be posted if the device is offline or the Internet is otherwise unavailable, but in such cases, you can still fall back to full synchronization at a later point.

# Retention Period

You may specify a retention period (default: 30 days) on the [profile](/profile/#manage-your-data) page. Deleted items are retained in storage (but not directly visible to the user) for the period configured here, after which they are automatically purged on a best-effort basis. Currently, unfortunately, you cannot restore deleted-but-not-yet-purged items without hacking into your data files.

# Exporting & Importing Data

You may export all of your data from the [profile](/profile/#manage-your-data) page. You'll be prompted for the download of a [JSON](https://www.json.org) file with your data. Sensitive settings (such as credentials) are **not** exported. You may import previously exported data from the same page. Any data you import is merged into the existing data based on individual item timestamps, overwriting older entries (where they exist) with newer ones.

For topics, tasks and library items, there's another way to bulk-import items. You may create a new item, and copy-and-paste a newline-separated *list* of items into the input text area. This automatically creates individual items, one per line. As an example, if you copy-and-paste the following list into the input text area for creating a new topic, you end up with three individual topics: `#home-improvement`, `#reading`, and `#action-item`. Note that this method of bulk import does **not** apply to notes, as a single note may itself consist of multiple lines.

```
home-improvement
reading
action-item
```

# Color Themes

The web application allows for two color themes, *light* and *dark*, automatically switching between these themes based on the user's operating system settings. You can also customize this behavior to permanently set the theme to either *light* or *dark* in your [theme preferences](/profile/#theme-preferences).

# Getting in Touch

Source code for [dinky.dev](/) is distributed as open-source software under the Apache 2.0 license. You can find more details (including the source code itself) on its [GitHub page](https://github.com/rri/dinky). Please feel free to report bugs or request features using the [issue tracker](https://github.com/rri/dinky/issues). If you're interested in contributing or would like to chat, my email address is **riyer** at **optimix.dev**.
