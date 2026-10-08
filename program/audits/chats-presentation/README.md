# Chats presentation flow

Open `/presentation` in the Chats app started by `pnpm demo chats`. The route is available in development or a build with `NEXT_PUBLIC_DEMO_PANEL=1`; ordinary production builds return 404. It is separate from the existing authenticated routes.

The shared shell, rail, dialog, fields, buttons, states, language and theme controls remain the suite components. The regular Chats navigation includes the walkthrough link only in demo/development mode.

## Walkthrough

1. Review `launch-review`. Save a message, set its tomorrow reminder and create its mock task.
2. Send an update with the bold option and a packaged file reference. Reload: the tab retains the conversation.
3. Schedule an update, inspect Scheduled messages, then send it now or cancel it.
4. Create a channel. Open another channel to clear its unread count.
5. Start the mock call, toggle its mock microphone and end the call.
6. Select another persona/workspace from Demo controls. This route uses that persona for new messages and opens a separate fixture dataset. Reset conversation affects only that selected fixture workspace.

## Behavior and limits

New fixtures live in `sessionStorage` under `orgtik:presentation:chats:<workspace>` and last for the browser tab. No account, journal, invoice, real workspace or shared clock is changed. Six presentation states come from the already accepted shared Demo Panel. Selecting New workspace and restoring normal shows the empty fixture workspace, where a channel can be created.

Messages, channels, read state, saved flags, reminders, scheduled queues, task IDs and file names are working client presentation behavior. Bold applies to the whole message. Reminder delivery, task provisioning in Tasks, file-record authorization, call media and scheduled automatic delivery remain backend/provider pending. The call requests no media permission. The file picker contains sample names; it does not upload or download binaries. Existing authorized Files references and real Chats flows remain independently available in authenticated routes.

Mock shape: `ChatScene { channels: string[], read: string[], messages: { id, channel, author, body, bold?, file?, saved?, reminder?, task?, scheduled? }[] }`. Real implementation must resolve membership and workspace-scoped file/task references, persist messages/read state, and process schedules and notifications independently of this browser.

## Acceptance evidence

The staged app used the tracked current `@orgtik/ui` package rather than this checkout's stale installed file-package copy. Next production build completed, including the `/presentation` route; TypeScript and five-language catalog/extractor checks passed (1,275 keys). One bounded UI walkthrough passed 28 checks, with eight English/Arabic × light/dark × desktop/mobile captures. All eight had zero axe critical findings and zero page-width overflow. The screenshots include the clearly marked simulated call stage. No backend/security test suite or deployment was added.

`report.json` lists each UI check and capture. This increment is not completion of the full Chats register: existing flows are reused and deeper rich-text editing, real delivery/media and cross-app provisioning remain separately tracked.
