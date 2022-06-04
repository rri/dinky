# Introduction

[dinky.dev](/) helps you organize your life. Its core concepts are simple, and built to take advantage of the natural ways in which a person acquires and manages information. Planned daily activities are boiled down to three simple abstractions: "note-taking", "task-execution", and "synthesis".

* **Note-Taking.** Create [notes](/notes) to write down short blurbs of information (ideas, suggestions, meeting summaries, action items). Recall and learning are maximized when you *write down* your thoughts and takeaways. Notes make it easy to record *raw* information that's meant to be synthesized later.

* **Task-Execution.** Create [tasks](/tasks) representing concrete actions you need to take. Each task ideally requires no more than 20 minutes to complete, and large tasks are meant to be broken down into smaller ones. Knowing what needs to be done *next* makes it easy to focus on the task at hand and getting it done.

* **Synthesis.** Prioritize tasks and notes, and associate them with [topics](/topics). Topics are hyphenated phrases prefixed with a "`#`" (example: `#my-topic`), which are added inline to tasks and notes. This process which we call *synthesis*, is a form of deep thinking and planning that bridges the gap between information consumption and action determination. Synthesis takes a few forms: (a) given notes captured during the day, what new tasks should you create? (b) given a large or ambiguous task, what smaller tasks should you break it down into? (c) do the current set of tasks continue to help you make progress towards your larger objectives?

Everyday, you can pick tasks in your backlog to be completed, by adding them to your [agenda](/) on the start page. Tasks added to your agenda disappear (from your agenda, not the backlog) at the end of the day. You can always visit the backlog and re-add them, if you want to pick them up again.

# Library

You can use your personalized [library](/library) to manage information about your books, papers, articles, journals, blog posts, and other reading material. You can track metadata such as title, author, number of pages, number of chapters and progress towards completion.

# Reminders

If you go to the details of a task or an item in your library, you can set a reminder for it on any future date (today inclusive). When you set a reminder for a task or item, it will automatically appear on your [agenda](/) view on that date. *Note that you won't get any email or popup notifications.*

# Search

You can quickly search for text by pressing the "`/`" (forward slash) shortcut at any time. Search text may include regular expressions, in case you're savvy with those. Additional [keyboard shortcuts](#keyboard-shortcuts) are available for easy navigation.

# Customization

The way you manage your agenda can be customized in a couple of ways. Firstly, you can set your *morning buffer*, which keeps tasks on your agenda for a bit longer — as many hours as you specify — beyond midnight. Secondly, you can set your *evening buffer*, which helps when you want to set the following day's agenda on the previous evening itself (for instance, as you make plans for the following day). Both these settings are available on the [profile](/profile/#agenda-preferences) page.

# Storage & Security

Your data is stored locally within the browser's [local storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage), and is synchronized to the cloud on demand, *only* if you've set up a personal S3 bucket on AWS with the necessary credentials and roles. This configuration needs to be set up and saved only once, after which you may initiate a sync from the [profile](/profile/#cloud-sync) page, or by using the `s` keyboard shortcut, at any time.

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

# Exporting & Importing Data

You may export all of your data from the [profile](/profile/#manage-your-data) page. You'll be prompted for the download of a [JSON](https://www.json.org) file with your data. Sensitive settings (such as credentials) are **not** exported. You may import previously exported data from the same page. Any data you import is merged into the existing data based on individual item timestamps, overwriting older entries (where they exist) with newer ones.

For tasks and topics, there's another way to bulk-import items. You may create a new task or topic, and copy-and-paste a newline-separated *list* of items into the input text area. This automatically creates individual items, one per line. As an example, if you copy-and-paste the following list into the input text area for creating a new topic, you end up with three individual topics: `#home-improvement`, `#reading`, and `#action-item`. Note that this method of bulk import does **not** apply to notes, as a single note may itself consist of multiple lines.

```
home-improvement
reading
action-item
```

# Getting in Touch

This application's source code is distributed as open-source software under the Apache 2.0 license. You can find more details (including the source code) on its [GitHub page](https://github.com/rri/dinky). Please feel free to report bugs or request features using the [issue tracker](https://github.com/rri/dinky/issues). If you're interested in contributing or would like to chat, my email address is **riyer** at **optimix.dev**.
