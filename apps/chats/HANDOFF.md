# Somion HQ — developer handoff

What survives this prototype and what does not. Written for the team that
builds Release 1, so that the honest answer to "how much of this is reusable"
is on paper before anyone asks.

---

## Keep

### `entities/` — the API contract
Written as the contract, not as demo convenience. `entities/index.ts` is the
starting point for the OpenAPI schema; `entities/events.ts` is the WebSocket
message catalogue.

Types worth arguing about before you build: `Presence` (position in floor units
0-100, `focusUntil` driving knock deferral, `speaking` separate from status),
`ObjectRef` (the cross-module card, including its `stale` / `no_permission` /
`deleted` states, which are the interesting cases), and `Insight` with
`MIN_COHORT`.

### The event seam
`store/index.ts` exports `applyEvent(event: ServerEvent)`. It is the only path
by which workspace state changes. The simulator calls it today; the socket
gateway calls it with identical payloads tomorrow. **Do not add a second way to
mutate state** — the moment there are two, the mock and the server stop being
interchangeable and this whole structure stops paying for itself.

Sessions are events too: `session.signed_out` (reason `inactive` or `manual`)
and `session.signed_in`. The inactivity monitor in `features/shell/InactivityMonitor.tsx`
emits the first from the client; the gateway can emit it to revoke a session,
and the client will behave identically.

Three meeting events are worth knowing before the gateway exists:
`meeting.share_changed` carries who is sharing (or nobody), so the stage lays
itself out from the event, not from a local flag; `meeting.guest_declined`
tells the guest page why the lobby closed on them; and `meeting.guest_arrived`
carries a `name` when the guest came by the meeting link without an invitation,
in which case they are added to the meeting as they reach the lobby (the
guest's `viaLink` is set, and their `email` is a key for that visit only).
`meeting.scheduled` is idempotent: the same meeting can arrive twice.
`meeting.guest_left` is the guest leaving, or closing the tab: someone who was
in the call becomes `left` and still counts as having come; someone who only
waited goes back to `invited`, or disappears if they came by the link. A
visitor takes up an invitation only as the person it was sent to (today, by
the name they type; in production, by the invitation's own token), so the host
never admits one name while someone else is on the line.

`observeEvents(fn)` is told about every applied event. It is for the transport,
never the UI. Today only `mock/tab-relay.ts` uses it: a `BroadcastChannel` that
carries the meeting events (`scheduled`, `guest_arrived`, `guest_admitted`,
`guest_declined`, `guest_left`, `ended`) between browser tabs, and answers a tab that asks
for a meeting it has not heard of. That is what lets a meeting link copied from
one tab be opened in another, and the host admit the guest, with no server. The
gateway's broadcast replaces it; delete it with `mock/`.

### Endpoint names
Store actions are deliberately named for the endpoints that replace them:

| Store action | Becomes |
|---|---|
| `sendMessage(channelId, text, threadId?)` | `POST /channels/:id/messages` |
| `editMessage` / `deleteMessage` | `PATCH` / `DELETE /messages/:id` |
| `toggleReaction` | `PUT /messages/:id/reactions/:emoji` |
| `markChannelRead` / `markAllRead` | `POST /channels/:id/read` |
| `setStatus(status, text?, focusMinutes?)` | `PUT /presence/me` |
| `joinRoom` / `leaveRoom` | `POST /rooms/:id/join` / `leave` |
| `sendKnock` / `answerKnock` | `POST /knocks` / `POST /knocks/:id/answer` |
| `scheduleMeeting` / `admitGuest` / `declineGuest` | `POST /meetings` / `POST /meetings/:id/admit` / `decline` |
| `startInstantMeeting({ title, channelId?, announcement? })` | `POST /meetings` with `instant: true`, starting now; from a conversation, the server also posts the message carrying `meetingId` |
| `setShare(meetingId, userId?)` | `PUT /meetings/:id/share` (the media provider reports who is sharing) |
| `ensureRoomChannel(roomId)` | `POST /rooms/:id/channel` — a room's chat is an ordinary private channel |
| `setActivation(state)` | Read from the suite's billing service; never written by HQ |
| `connectIntegration` / `disconnectIntegration` | The suite's OAuth flow; HQ only shows the result |

### Routes and feature structure
The route tree is the information architecture, already argued through. Feature
folders (`features/office`, `chat`, `meetings`, `insights`, `shell`) map to the
ownership split in the design plan.

### Visual components
`components/ui/*` and the feature components, after your own accessibility
review. Two are published to the shared design system so other modules can use
them, and only these two:

- **`Avatar`** — the presence unit. Four sizes, six states, each with its own
  mark *shape* as well as its own hue. This is what appears on an assignee in
  Task Manager and a contact in the CRM.
- **`DiscussButton`** + **`ObjectConversations`** — the only HQ code that ships
  into another module.

### Design tokens
`app/globals.css` and `tokens.json`. Every value is verified rather than
chosen by eye; see `DESIGN.md` for the measured table. Replace them wholesale
when the real SaaS-layer system exists — the point is that no component
contains a raw colour, so that swap is a one-file change.

---

## Throw away

| What | Why |
|---|---|
| Everything in `mock/` | `seed.ts`, `simulator.ts`. Deleting the directory is the whole removal. |
| `lib/audio.ts` proximity graph | The `PannerNode`/`GainNode` topology is right and worth keeping as a reference, but it drives synthesised samples. Replace the source with the media provider's tracks; the graph around it stays. |
| The accelerable clock and hotkeys | `DEMO_EPOCH`, the `demo.*` events, `mock/simulator.ts` key handling. |
| `features/shell/AppShell.tsx`, `SuiteRail.tsx`, `TopBar.tsx` | A facsimile of the SaaS-layer shell. The real one replaces them; the module keeps its sidebar and content. |
| `features/shell/TaskScreen.tsx` | A stand-in for a sibling module, present only to prove the two published components work outside HQ. |
| `features/shell/ClientOnly.tsx` | Exists because all state is client-side mock data. Once data arrives from an API the server has something real to render. |
| `public/sw.js` | Minimal, only so the prototype installs on a phone. |
| `shots.mjs`, `audit.mjs`, `verify.mjs`, `flows*.mjs`, `backs.mjs`, `deadends*.mjs`, `warm.mjs` | Verification scripts for this build. |
| The prototype-only controls | The owner's "switch the module off" line on the activation screen, the 700 ms fake OAuth in `connectIntegration`, and the `Shift+E` / `Shift+P` simulator keys. Each is marked in place. |

---

## What the prototype does not answer

State these plainly rather than letting the demo imply otherwise.

1. **No WebRTC.** Camera and screen share are real *local* capture; nothing is
   transmitted. Call quality on real networks is the developer spike in weeks
   3-4, and it is the single largest technical unknown.
2. **No authentication, tenancy or permissions.** One fixed user, one tenant.
   `AD-1` — inheriting users, roles and entitlements from the SaaS layer — is
   the hard dependency that gates Release 1 and it is entirely unbuilt here.
3. **No persistence.** State lives in memory and resets on reload.
4. **Search is a client-side substring match.** Real search is Postgres
   full-text with per-channel permission filtering, and the design plan is
   right that it is routinely under-estimated.
5. **No notification pipeline.** In-app only. Email, web push, quiet hours and
   digests are `CH-7` and unbuilt.
6. **Insights are computed from a fixed seed.** The aggregation thresholds are
   enforced in the UI here; in production they must be enforced in the data
   layer, so that no per-person series exists to be queried in the first place.

---

## Carry these constraints into the build

They are product decisions, not prototype conveniences, and each is cheap now
and expensive later:

- **Presence opens no media connection.** Audio connects on entering a room or
  a huddle, and nowhere else. This is the margin of the whole module.
- **Insights have no per-person path.** Not hidden in the UI — absent from the
  data model. Cohorts below `MIN_COHORT` render nothing.
- **The transparency page reads real settings**, not a static policy page.
- **Attachments, recordings and whiteboards live in the File Manager.** HQ owns
  no second store.
- **Status is never colour alone.** Every presence state has a distinct mark
  shape and a text label.
- **German expands interface text about 30%.** The pseudo-locale toggle in the
  top bar (`?` icon, dev only) renders every string at +30% so the constraint
  can be checked in a browser rather than asserted in a document. Keep it.

## Insights

`lib/analytics.ts` is the contract: `aggregate(facts, meetings, range, cohort, rooms)`
returns an `Aggregate`, and that is the response shape for
`GET /insights?from&to&people`. The server computes it; the client never sees
a fact row. `mock/analytics.ts` (the fact table) is deleted with the rest of
`mock/`. Keep the cohort rule server-side too: a request for fewer than the
workspace minimum, other than the caller alone, returns nothing.

## Inactivity

`lib/idle.ts` looks for `window.somionDesktop.idleSeconds()` first. The desktop
shell's preload should expose it from Electron's
`powerMonitor.getSystemIdleTime()`; with it present, the sign-out policy reads
the operating system's own idle count and never asks the browser for a
permission. In a plain browser the Idle Detection API is used where it exists
(Chromium), asked for on the first click; elsewhere the tab's input is all
there is, and the UI says so.
