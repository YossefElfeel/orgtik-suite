# Chats: feature benchmark (vs Slack, Microsoft Teams)

Read from the code on 2026-10-07: `apps/chats`, plus the records in `program/audits/chats/`. Nothing was run.

Chats is the Somion HQ prototype. All its data lives in one in-memory zustand store (`store/index.ts`), filled from `mock/seed.ts` and `mock/simulator.ts`. `mock/apps/chats.js` only declares the launcher tile and the grants; it has no API. In the evidence column, paths are relative to `apps/chats`.

**Summary**
- **Expected and missing: 7.** Browsing and joining channels, rich text, desktop/email notifications, "save for later", scheduled messages and reminders, typing and read state, and stored history.
- **Expected and partial: 10.** Reactions, mentions, file sharing through Files, link previews, quiet hours, calls and screen share, calendar sync, drafts, the people directory, and history export.
- **Differentiators worth doing: 4.** Message → task, context cards inside the other apps, voice messages, and client guests in channels.

Ratings:
- **Expected:** people coming from Slack or Teams will miss it.
- **Differentiator:** sets a product apart. Marked ★ where it's worth doing for OrgTik.
- **Not for us:** doesn't fit an SMB suite prototype.

| Feature | Area | Rating | OrgTik today | Evidence | Gap & size |
|---|---|---|---|---|---|
| Public and private channels, create | Core objects | Expected | Have | `features/chat/ChannelDialogs.tsx` (create) → `createChannel({isPrivate})` in `store/index.ts` | — |
| Browse and join public channels | Core objects | Expected | Missing | The create dialog says anyone can "find and join" a public channel, but there is no channel browser or join action | A "Browse channels" list with Join. **S** |
| Direct messages and group DMs | Core objects | Expected | Have | `openOrCreateDm`, `createGroupDm` in `store/index.ts` | — |
| Threads | Core objects | Expected | Have | `features/chat/ThreadPanel.tsx` (with "also send to channel") | — |
| Emoji reactions | Collaboration | Expected | Partial | `QUICK_REACTIONS` in `features/chat/Message.tsx`: 4 emoji; the composer inserts from 12 | A full emoji picker with search and recent emoji. **S** |
| @mentions with autocomplete | Collaboration | Expected | Partial | Keyboard listbox in `features/chat/Composer.tsx`; `renderText` in `Message.tsx` | People only. No @channel/@here, and "mentions me" is a name match. **S** |
| Edit and delete own messages | Creation & editing | Expected | Have | `editMessage`/`deleteMessage`; edit window set in Settings; admin delete; tombstone | — |
| Rich text: bold, lists, code, quotes | Creation & editing | Expected | Missing | `renderText`/`linkify` in `Message.tsx` render plain text plus mentions and links | Markdown-lite rendering and a small toolbar. **M** |
| File and image sharing (stored in Files) | Files | Expected | Partial | Composer "Upload from this device" plus a 3-file `FILE_MANAGER_SAMPLE`; `features/chat/FilePreview.tsx` | Only the name and size are kept. No thumbnails. "Open in Files" and "Download" are toast-only. Needs the Files API. **M** |
| Link previews | Collaboration | Expected | Partial | `features/chat/LinkPreview.tsx` builds cards from a fixed table of sites | Fetch the page title and image on the server. **M** |
| Message search with filters | Search | Expected | Have | `features/chat/SearchView.tsx` (messages/files/people; in, from, when, has file); `features/shell/SearchBox.tsx` (`/` focuses) | Thread replies aren't searched. |
| Unread badges and catch-up | Collaboration | Expected | Have | `markChannelRead`/`markAllRead`; `useUnreadTotal`/`useCatchUp` in `store/hooks.ts`; `features/chat/CatchUpView.tsx` | Catch-up is a good differentiator. |
| Per-channel notification level / mute | Notifications | Expected | Have | "Notify me about" in the channel details (`ChannelDialogs.tsx`) → `updateChannel({notify})` | — |
| Desktop push and email notifications | Notifications | Expected | Missing | Only in-app toasts. `/hq/settings/emails` shows static previews. The workspace `notifyOn` setting is saved but nothing reads it | Browser/PWA push and email for mentions and DMs that respect mute and quiet hours. **M** |
| Quiet hours / do not disturb | Notifications | Expected | Partial | Quiet hours in `features/shell/SettingsView.tsx`; Focus status in `features/shell/StatusPicker.tsx` | They hold office knocks only, not message alerts. **S** (after push exists) |
| Presence and custom status | Collaboration | Expected | Have | `StatusPicker.tsx` → `setStatus(status, customText, focusMinutes)`; auto-away in `features/shell/SettingsEffects.tsx` | — |
| Pinned messages | Collaboration | Expected | Have | `togglePin`; pinned banner in `features/chat/ChannelView.tsx`; Pins tab in the channel details | — |
| Save for later / bookmarks | Collaboration | Expected | Missing | No action in the `Message.tsx` menu | "Save" on a message, plus a Saved list. **S** |
| Channel details and members | Permissions | Expected | Have | Channel details pane in `ChannelDialogs.tsx`: topic, rename, add and remove people, leave | No per-channel roles; workspace roles apply. |
| Archive a channel | Core objects | Expected | Have | `updateChannel({archived})` with a confirm; archived section in `features/shell/HqSidebar.tsx` | — |
| Scheduled messages and "remind me" | Time | Expected | Missing | — | Schedule a send, plus "Remind me about this". **M** |
| Typing indicators and read state | Collaboration | Expected | Missing | — | Needs the real-time backend. **M** |
| Drafts | Creation & editing | Expected | Partial | The module-level `drafts` Map in `Composer.tsx` keeps drafts per conversation | Lost on reload; should sync on the server. **S** |
| Stored history (survives reload, all devices) | Core objects | Expected | Missing | `store/index.ts` has no persistence and no API; a reload resets messages and meetings | The real backend and gateway: the main step from prototype to product. **L** |
| Audio/video calls and screen share | Meetings | Expected | Partial | `features/meetings/useMedia.ts` (real `getUserMedia`/`getDisplayMedia`, local only), `CallStage.tsx`, `PreJoin.tsx` | Nothing is sent to anyone; remote people are placeholder tiles. Needs rented media (LiveKit per `PRODUCT.md`). **L** |
| Meeting scheduling and calendar view | Meetings | Expected | Have | `features/meetings/MeetingsView.tsx`, `MeetingsCalendar.tsx`; `scheduleMeeting`, `startInstantMeeting` | — |
| Google / Microsoft calendar sync | Suite integration | Expected | Partial | `connectIntegration` fakes OAuth with a 700 ms timeout (`store/index.ts`) | Real OAuth with two-way sync of meetings. **M** |
| Virtual office and quick huddles (knock to talk) | Meetings | Differentiator | Have (simulated) | `features/office/*`; `joinRoom`, `sendKnock`/`answerKnock`; `lib/audio.ts` | The product's signature. Keep it. |
| Meeting recording to Files | Meetings | Differentiator | Partial | `requestRecording`/`stopRecording` in `store/index.ts` (consent flow; the file is simulated) | Comes with the real media backend. |
| Whiteboard | Meetings | Differentiator | Partial | `features/meetings/Whiteboard.tsx` (real Excalidraw), `BoardScreen.tsx`; R0 local/code update replaces the false saved-in-Files claim with an unsaved warning in all five catalogs | Drawing remains transient. Files-backed structured state and references are planned in R2 (D-066); hosted acceptance is open. See `program/audits/r0-prototype/readout.md`. |
| Create a task from a message | Suite integration | Differentiator ★ | Missing | No such action in the `Message.tsx` menu | "Create task" with Tasks' form, linked back to the message. **M** |
| Context cards and "Discuss" from any suite object | Suite integration | Differentiator ★ | Partial | `features/chat/ContextCard.tsx`, `DiscussButton.tsx`; only the stand-in `features/shell/TaskScreen.tsx` uses them (CHT-042 partly fixed) | Embed Discuss in the real Tasks, HR and Sales screens. **M** |
| People directory and profiles (from HR) | Suite integration | Expected | Partial | People come from `mock/seed.ts`; the signed-in suite user becomes "me" (`adoptSuiteSession`); `features/shell/MeScreen.tsx` | A profile card with title, team and local time, from the suite/HR directory. **M** |
| Guests: meeting guests and client channels | Permissions | Differentiator ★ | Partial | `features/meetings/GuestJoin.tsx` (lobby, admit); works only in the same browser through `mock/tab-relay.ts` (CHT-024 open) | Guests by link across browsers, then shared client channels. **L** |
| Roles and workspace policies | Permissions | Expected | Have | `lib/roles.ts` (owner/admin/member/guest); "Access" section in `SettingsView.tsx`; `RoleSwitcher.tsx` is a labelled demo control | — |
| Message retention policy | Permissions | Differentiator | Partial | `retentionDays` in `SettingsView.tsx`; `features/insights/TransparencyPage.tsx` | Saved but never enforced. A real selling point in the EU. |
| Export chat history | Import/export | Expected | Partial | `exportWorkspace` → JSON download, owner only (`SettingsView.tsx`) | Add per-channel export as readable text or CSV. **S** |
| Voice messages | Creation & editing | Differentiator ★ | Missing | — | Widely used by Arabic-speaking teams that come from WhatsApp. **M** |
| Polls | Collaboration | Differentiator | Missing | — | Small, and nice to have. **S** |
| Message translation | Collaboration | Differentiator | Missing | Only `dir="auto"` and `<bdi>` handle mixed directions | Later. Useful in a 5-language suite. |
| Team insights with a transparency page | Reporting | Differentiator | Have (mock data) | `features/insights/InsightsView.tsx`, `TransparencyPage.tsx`, `mock/analytics.ts` | Group-level only, with a minimum group size. |
| Mobile / responsive | Mobile | Expected | Have | `features/shell/MobileTabs.tsx`; sidebar becomes a drawer below 1024 px; VS-1 20/20 at 390 and 1440 px (`program/audits/chats/vs1/`) | A web app only. |
| Accessibility and keyboard | Accessibility | Expected | Have | `role="log"` transcript, keyboard menus and mention list, live-region toasts | No Ctrl+K quick switcher; `/` search jumps to channels and people. |
| Languages and RTL (en, ar, de, fr, it) | Accessibility | Expected | Have | `messages/*.json` at parity; `dir` from the locale in `app/layout.tsx`; `lib/i18n.tsx` (Arabic plurals) | The demo content stays English. |
| Onboarding: setup wizard, activation, empty states | Onboarding | Expected | Have | `features/shell/SetupWizard.tsx`, `ActivationScreen.tsx`; empty states in search, channel start and pins | — |
| Bots, app directory, workflow builder | Templates/automation | Not for us | Missing | Excluded in `PRODUCT.md` ("not in v1") | — |
| AI summaries and transcripts | Meetings | Not for us | Missing | Excluded on purpose (`features/meetings/MeetingSummary.tsx` header) | — |
| Native desktop/mobile apps, end-to-end encryption | Mobile/security | Not for us | Missing | Excluded in `PRODUCT.md`; the app is an installable PWA | — |

## Top 8 to add, by value to an SMB owner

1. **Stored history and real-time delivery** (backend and gateway): messages survive reload, with typing and read state. **L**
2. **Real file sharing through the Files app**: upload, thumbnails, open and download. **M**
3. **Desktop push and email notifications** for mentions and DMs that respect mute, quiet hours and `notifyOn`. **M**
4. **Calls with real media** (LiveKit, as `PRODUCT.md` plans), including screen share. **L**
5. **Create a task from a message, and "Discuss" inside the real Tasks app**: the suite's main promise. **M**
6. **Rich text**: bold, lists, code and quotes. **M**
7. **Channel basics**: browse and join public channels, @channel/@here, and a full emoji picker. **S**
8. **Scheduled messages, "remind me" and "save for later"**. **M**


## A26 presentation overlay — 2026-10-08

PR24 Chats scene accepted: tab messages/channels/read state/saved/scheduled and mock call/task/file UI; integration pending. Existing benchmark scores and backend claims above remain historical. See the maintained release register and prototype guide; this overlay does not accept all72 or all15 journeys.
