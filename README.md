# Daybook Journal

A simple, local-first journal for tasks, events, notes, brainstorms, topic collections and personal trackers. Daybook draws influence from **Bullet Journal** and the **Eisenhower Matrix**.

This public repository is the website distribution and feedback space. The development source repository remains private. **[Open Daybook Journal](https://nateprentice.github.io/daybook-journal-web/)**. The compiled website is deployed by GitHub Pages from the reviewed `site.zip` package, with the latest compiled app in `main.dart.js.gz` and sign-in fixes in `google_auth.js`. Creating this repository does not publish your personal journal, Google account data or recordings.

## What the current prototype can do

- Rapid-log tasks, events and notes; gather related entries into topic collections.
- Browse a Bullet Journal Index with topic collections, standalone pages and dated daily logs. Open Monthly Log and Future Log directly; completed and dropped entries remain in historical daily logs. The Index updates automatically and works offline.
- Plan in Today, a minimizable seven-day Heads up panel, and Schedule View, Day, Week, Work week, Month and Year calendars.
- Show overdue items, review unfinished work and intentionally migrate it, cross it out with an optional reason, or keep it for later.
- Brainstorm with ideas and sub-ideas; promote ideas into tasks, events, collections or Someday / Maybe.
- Track daily data with graphs and editable dates and values.
- Optionally sync with Google Tasks, a dedicated Daybook calendar and private Google Drive app data. Display additional selected calendars. Changes queue while offline and retry while the app is open and authorized.
- Record short voice notes in the website version. Queue free English transcription for when connectivity returns; inference runs on the recording device after a model download. Generated text stays separate from manual corrections. Audio does not sync across devices.
- Prepare email drafts and meeting/reference links. Sending email remains your choice.
- Save Word exports to Google Drive in Daybook → Word exports, using filenames such as `26--10-13--19-15-30.docx`. Optional file permission is requested only when saving; downloads still work offline. See [Drive export setup](docs/GOOGLE-DRIVE-EXPORTS.md).
- Export an editable Word document from Settings → Export to Word. Choose dates and include undated entries; the document contains a Bullet Journal key, index, future/daily logs, collections, annotations, brainstorms, tracker readings and saved transcripts. Dropped entries remain crossed out. Audio and graphs are not embedded; Word edits do not sync back.

## The journal and matrix

Bullet Journal inspires rapid logging, topic collections, reviews, migration and intentional crossing out. The Eisenhower Matrix helps assess **urgency** and **importance** using rules inside Daybook, without an outside sorting service:

| Quadrant | Criteria |
|---|---|
| Do first | Urgent and important |
| Schedule | Important, not urgent |
| Delegate | Urgent, not important |
| Don't do / Eliminate | Neither urgent nor important |

Manual assignments take priority over automatic due-date and journal-decision defaults. Assigning a quadrant does not send an email, delete an entry or perform another action. Daybook is inspired by these methods and is not an official Bullet Journal product.

## What still needs work

This is a prototype. Full Google Calendar parity, closed-app background sync, reliable cold opening of the website offline, native mobile verification, cross-device audio, direct Evernote/Notability sync and external document editing are unfinished. Local journal storage is not encrypted. Export important data and download important recordings before clearing browser storage. Do not use the prototype for sensitive clinical records.

Hosted Google sign-in and a two-way Google Tasks update have been verified with the test account. Reconnect targets the linked account; interrupted reads retry safely, large sync recovery copies are compressed locally, and failed incoming sync is shown as needing attention. Each user must authorize their own Google account; the website does not distribute a shared test account. A new website address starts with separate browser storage, so move existing journal data by export/restore when moving to the hosted app.

## Bugs, support and suggestions

Use [Report a bug or suggest an improvement](https://github.com/nateprentice/daybook-journal-web/issues/new/choose). Reports here are public: use invented examples and never include passwords, tokens, recordings, journal backups or private calendar details.

Suggestions do not grant permission to change the app. The maintainer reviews proposed changes before accepting them. See [CONTRIBUTING.md](CONTRIBUTING.md).
