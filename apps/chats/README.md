# Somion HQ — Phase 0 prototype

Team chat, calls and a virtual office, with every conversation attached to the
work it belongs to. The seventh module of the Somion Business OS.

**This is a prototype running on mock data.** No backend, no WebRTC, no
authentication. It exists to answer one question for the founder and the PM:
*is this a product we can sell alongside the Business OS?*

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Then read **[DEMO.md](DEMO.md)** before showing it to anyone.

---

## What is here

| File | For |
|---|---|
| [DEMO.md](DEMO.md) | The ten-minute script, the hotkeys, and the pre-demo permission ritual |
| [DESIGN.md](DESIGN.md) | The design system as actually built |
| [HANDOFF.md](HANDOFF.md) | What developers keep and what they throw away |
| [PRODUCT.md](PRODUCT.md) | Product truth: users, positioning, constraints, principles |
| [tokens.json](tokens.json) | Design tokens exported from the CSS source |
| `Somion HQ/` | The two source documents this was built from (Arabic) |

## The six golden paths

All six run end to end:

1. **Morning arrival** — open HQ, see who is around, sit down.
2. **Knock** — reach someone in one action; Focus holds it instead of dropping it.
3. **Discuss from a task** — start a conversation from a record, and find it
   from that record a week later.
4. **Client meeting** — schedule, guest link, lobby, admit, screen share,
   whiteboard.
5. **Focus and catch up** — nothing interrupts, nothing is lost.
6. **The manager's week** — team-level insights and the transparency page.

## Architecture

The rule that keeps this from being thrown away: **the UI does not know the
data is mock.**

```
app/(shell)/hq/…     routes inside the Business OS chrome
app/guest/[token]    guest join, deliberately outside it
features/            office · chat · meetings · insights · shell
entities/            the API contract — types and the event catalogue
store/               Zustand; applyEvent() is the single seam
mock/                seed + simulator — disposable, isolated for deletion
lib/                 audio (Web Audio proximity), time, i18n, presence
components/ui/       the design system
```

Every state change flows through `applyEvent(event: ServerEvent)`. The
simulator emits those events today; the WebSocket gateway will emit exactly the
same shapes. Store actions are named for the endpoints that replace them.

## What is genuinely real

Because these are the moments where a viewer can tell a product from a picture
of one:

- The **camera** (`getUserMedia`) and **screen share** (`getDisplayMedia`) —
  local capture only, nothing transmitted.
- **Proximity audio** — a real Web Audio `PannerNode` graph. Walking toward
  someone makes them louder and pans them correctly.
- The **microphone meter** on the pre-join screen — a real analyser.
- The **whiteboard** — real Excalidraw, the component recommended for
  production.

The floor is walkable with the arrow keys or `W` `A` `S` `D`: crossing into a
room enters it and connects its audio, crossing out releases it. Rooms are
furnished from the same tokens as the rest of the interface — desks, chairs,
tables, plants, a water cooler, shelves, doors and windows — drawn at low
contrast so a person always outranks the furniture.

The floor is a place rather than a diagram. Each room has a floor material
(wood under the desks, tile in the kitchen, a rug in the prayer room) and a
wall with thickness; the whole floor is lit by the actual time of day. People
breathe at rest and take a step when they walk. Two people within earshot on
the open floor get a soft bubble around them — the spatial audio made visible.
A strip above the floor lists everyone by room, and clicking a face centres the
floor on them. Zoom with ctrl-scroll or the buttons, pan with space-drag or the
middle button, and a minimap appears while zoomed. Hover a room to see who is
in it before walking in; drag your own tile to move.

Remote participants render as audio-first tiles rather than fabricated video.
That is not a shortcut: rooms are audio-first and the camera is optional, so a
wall of stock faces would misrepresent the product.

## Insights

A period and a group of people, and every number below re-reads against
both. The date picker offers presets as rows (this week, last 7, 30 and 90
days, this month, last month) and a custom span on two months side by side,
or typed. The people picker is a cohort picker: below the workspace minimum
(five, or higher in settings) the page shows nothing and says why. The one
exception is you - everyone may see their own numbers, and nobody else can
open that view of them.

What is computed, from a daily fact table the store sums (`lib/analytics.ts`
is the shape the API returns; `mock/analytics.ts` is the disposable data):
hours here, in meetings and in focus, messages and threads, people here on a
working day, meeting count and average length, room utilisation, knocks
answered; hours by day or by week against the period before; the weekly
rhythm heatmap as average headcount; meetings by weekday, size and length;
where the conversation happens, with direct messages as one bar and never a
named pair; the share of threads started from a Business OS object, against
the 30% the product aims for; room use. A table view carries every day, and
admins can export it as CSV. Two measures never share an axis.

## Calendar

Meetings has a third tab. A month shows which days are heavy, with the day
beside it; a week lays each meeting out at its hour, with today tinted and a
line at now. Every block links to the meeting, and scheduling from a day
opens the same form with that day filled in. The month grid is one component
(`components/ui/Calendar.tsx`) shared with the date picker: roving tab stop,
arrows by day and week, PageUp and PageDown by month.

## What the spec asks for

The product plan numbers its requirements. Every P0 in the Phase 0 scope,
and most of the P1s, has a place here:

| Requirement | Where it lives |
|---|---|
| CH-1 channels: create, archive, members, topic, pins | sidebar, channel details pane, archived section |
| CH-2 direct and group messages, named | New message, `openOrCreateDm` from every avatar |
| CH-3 threads, follow, also send to channel | thread panel, its "Also send to" line |
| CH-4 composer: mentions, emoji, files, drafts that survive | composer, drafts kept per conversation |
| CH-5 reactions, edit, tombstone, pin, copy link | message menu and hover actions |
| CH-6 read state, badges, Catch up, mark all read | sidebar counts, Catch up |
| CH-7 notification centre, toasts, per-channel level, quiet hours, Focus | bell, channel details, settings |
| CH-8 search with filters: conversation, person, time, has a file | search page |
| CH-9 context cards and Discuss | cards in messages, Discuss on the task page |
| CH-10 retention policy | settings, transparency page |
| OF-1 floor from a template, rooms renamed and sized | setup, floor, room settings |
| OF-2 six statuses, custom text, Away after ten minutes | status picker, auto-away |
| OF-3 audio on entering a room, the dock shows who speaks | floor, media dock |
| OF-4 proximity audio on the open floor | Web Audio graph, earshot setting |
| OF-5 knock: accept, decline, later; held in Focus; missed list | person menu, bell |
| OF-6 room lock, capacity, purpose, meeting in progress | room settings, the meeting chip on a room |
| OF-7 presence across the suite, find on floor | task page assignee |
| OF-8 who-is-around list, grouped by room | office List view, the phone's Office |
| ME-1 calls, grid and speaker views, mute and camera | call stage |
| ME-2 screen share with the presenter marked | call stage |
| ME-3 pre-join for everyone, participants, raise hand, chat, host mute and end | pre-join, call stage's People panel |
| ME-4 scheduled meetings with people, room, length, description, reminders | schedule form, calendar, the bell |
| ME-5 guest by link, branded lobby, admit, name, recording notice | guest page |
| Meet now: an instant meeting from Meetings or from any conversation, with its link to share | Meetings header, a conversation's header, the call's Invite people |
| ME-6 recording with consent, into the File Manager | call stage |
| ME-7 whiteboard in the call | call stage |
| IN-1 this week on the floor | office header panel |
| IN-2 team insights: rhythm, meetings, rooms, replies to mentions, cohort of five | Insights |
| IN-3 my time, exported for HR | Insights, "Export my time" |
| IN-4 transparency page from every insight and every profile | transparency page |
| IN-5 adoption: active members, conversations in use, calls, client visits | Insights |
| AD-1 people and roles from the suite, never a second directory | settings, roles |
| AD-2 setup wizard | setup |
| AD-3 policies: guests, retention, recording, notifications | settings |
| AD-5 installable PWA, phone layout for chat, calls and the list | manifest, phone views |
| AD-6 English first, strings behind `t()`, pseudo-locales that stretch | language switch |
| AD-7 keyboard and screen-reader paths, one h1 a page | audit suite |

Out of scope by the plan's own schedule: CH-11 guests in shared channels,
CH-12 export and audit log, OF-9 multiple floors, ME-8 calendar sync, ME-9 AI
notes, AD-4 data residency.

## The screens

The design plan's inventory (B3) lists sixty-three screens with their
states. Every one in the Phase 0 scope exists here, and the ones that only a
state or a hotkey can reach are listed so they are not missed:

- **Activation** (`/hq/activate`): the module's entry point from the suite
  in its three states - not switched on, on trial with days left, activated
  on a tier. A switched-off module keeps the shell on this screen. The owner
  can switch it off from here to show the first state.
- **Setup**: five steps and a ready screen with first steps.
- **Floor**: empty, people, in a room, in a call; rooms empty, occupied,
  locked, full, in a meeting; a first-day floor when nobody else is in
  (Shift+E empties the office and fills it again).
- **In a room**: the dock says connecting, connected, or connection problem
  with a retry; Room details opens the room panel - who is inside with a
  volume each, the room's own chat that lasts, lock and leave.
- **Chat**: the composer's upload from the device beside the File Manager
  picker, link previews, and on a phone the thread and details as the whole
  screen with Back returning to the messages.
- **Meetings**: the schedule form with a weekly repeat, someone else's screen
  share (Shift+P in the client call), a guest declined at the lobby and told
  so, a whiteboard outside any call (`/hq/whiteboard`).
- **Meet now**: from Meetings, or from a conversation's header, where it
  invites everyone in it and leaves a Join card in the transcript. Alone in the
  call, the meeting link is already open to copy or share; open it in a second
  tab to arrive as a guest, and admit yourself from the first.
- **Settings**: calendar integrations in their three states, the plan row,
  and the four emails HQ sends (`/hq/settings/emails`) with the language
  switch that stretches them.

## Rooms

Twelve kinds, each a bundle of defaults a room can override in its own
settings: meeting, boardroom, phone booth, studio, training, focus, lounge,
reception, terrace, wellness, prayer, and the open desk area. A kind decides
whether walking in opens a microphone, what it does to your status, whether the
floor names the people inside, and what the room is furnished with — a room an
admin adds is never a bare rectangle.

Per room, an admin can set: what it is for (shown when empty and on hover),
whether audio opens on entry, a hard capacity (refuse beyond it), the status it
puts you in, whether clients may join it by link, whether the floor names who is
inside, and opening hours. A closed or full room refuses entry and says why.

## Hearing

What you hear of a person is yours to set — a volume slider and "mute for me"
on their menu, and "deafen" on the dock to hear nobody. What everyone hears of
them is a moderator's: "mute mic" and "deafen" apply for everyone, are labelled
as such, and the person is told.

## Settings

Presence and focus (auto-away, default focus length), audio and floor
(earshot, daylight, idle motion, hover cards, default view), chat (default
notification level, edit window), meetings (default length, lobby), access (who
may create channels, invite guests, record — narrows members, never widens
guests), workspace (name, language, the minimum group size for Insights, which
cannot go under five), and an owner's export of the workspace as JSON. Every
setting changes something real; `flows-advanced.mjs` asserts each one.

## Appearance

The system colour is the person's, not the workspace's: it changes how HQ
looks on their device and nothing anyone else sees. Five presets - Rose,
Orchid, Olive, Midnight, Graphite - each re-point the seven brand primitives
and nothing else, so every accent, ring and primary button follows. The ramps
are the rose ramp with its hue rotated in OKLCH, which keeps lightness and
chroma per step, and therefore every contrast pair, unchanged.

Why no blue: the six presence hues are the only saturated colour in the
product, and an accent within 30 degrees of one of them would read as a
status. Teal, amber, violet and blue are therefore not offered. The choice is
painted before first paint by a one-line inline script, so a person who chose
Olive never sees a rose flash. `lib/appearance.ts`, `tokens.json` under
`primitive.accents`.

## Sessions

A workspace policy ends a session after N minutes without mouse, keyboard or
touch (5, 15, 30, 60, or never; default 30). The last minute is announced with
a countdown and a button, and any input cancels it - reaching for the button
is enough. A live meeting counts as being here. The measurement is one
timestamp in a variable on the person's device; nothing is sent or stored,
and the transparency page says so.

What counts as input is the computer, not the tab. A tab can only see its
own events, so someone writing an email in another window would look idle to
it and be signed out for working. HQ asks the computer instead, through
whichever of these exists (`lib/idle.ts`): the desktop shell's
`window.somionDesktop.idleSeconds()`, read from the operating system with no
permission and no gap; the Idle Detection API in Chromium, which answers one
question - has the machine seen input, is the screen locked - and needs a
permission granted once, which HQ asks for on the first click it sees; and
only then the tab's own input, which the settings row says plainly. Nothing
learns what the person was doing, and nothing leaves the device.

Signing out, by policy or from the status picker, is an event like every other
change (`session.signed_out`, `session.signed_in`), so a server that revokes a
session tomorrow speaks the same language. The person's status is Offline to
colleagues while signed out, and comes back on sign-in.

## Roles

Roles come from the Business OS directory; HQ never keeps its own list. Every
"may I?" is answered in one place, `lib/roles.ts`, and a person is never shown
a control they cannot use.

| | Member | Admin | Owner |
|---|---|---|---|
| Create channels, start conversations, invite guests, see Insights, record | yes | yes | yes |
| Add, rename, remove rooms; change the floor template | | yes | yes |
| Change workspace settings; run setup again | | yes | yes |
| Rename, archive and unarchive channels | | yes | yes |
| Remove people from a channel; delete anyone's message | | yes | yes |
| Reset the workspace to its opening state | | | yes |

A guest is in one meeting and nothing else. The switcher in the top bar is a
prototype control for showing each view; in the product the role is the
session's.

## Closing things

Every overlay - modal, menu, picker, the details pane, a thread - closes three
ways: its own close control, Escape, and the browser's Back. One press does
one visible thing: Back closes the most recent overlay first, then the next,
and only then leaves the page. A choice that navigates (starting a group, say)
leaves history clean, so Back from the new page returns to where you were with
nothing reopened.

The mechanism lives in `lib/useDismiss.ts`. It keeps its own ledger of the
history entries it pushed rather than reading `history.state`, because the app
router rewrites that after its own renders. The one thing it does not model is
the browser's Forward button.

Below the sidebar's breakpoint, Chat opens on a list of conversations, a
channel's header carries a way back to it, and search results have a Back.

## Loading

Two servers, two speeds. `pnpm dev` compiles each page the first time it is
asked for and ships unminified script - twelve megabytes for the office page
- which is what makes the first visit to each route slow. It now runs on
Turbopack, and the icon set is imported per icon rather than as a barrel, so
those compiles are shorter; but it is still a development server. For anyone
who is not editing code, `pnpm demo` builds once and serves the production
build: the office page is 168 kB of script and every route is ready before
the first click.

Three things make waiting feel shorter either way. The server renders the
shell's shape - top bar, rail, sidebar - so the first paint looks like the
app rather than a blank ground. A two-pixel bar sweeps the top edge from the
moment an in-app link is pressed until the next page is on screen. And the
insights fact table is built the first time Insights is opened, not at
startup on every page.

## Verification

```bash
pnpm typecheck     # TypeScript strict, noUncheckedIndexedAccess
node warm.mjs      # load every route once so the suites measure the product, not the compiler
node flows.mjs     # walks every flow and asserts it completes
node test/quiet-hours.test.mjs   # the midnight-wrapping window
node shots.mjs     # 17 views: screenshots + console errors + overflow check
node audit.mjs     # accessibility pass and the keyboard path on the floor
node deadends.mjs  # clicks every control and reports the ones where nothing changed
node deadends-deep.mjs  # links, controls behind openers and tabs, the phone layout, the pages the first pass skips
node popovers.mjs  # every dropdown and menu is inside the viewport and on top
node flows-owner.mjs  # owner, admin and member: what each may do, walked to the end
node flows-advanced.mjs  # settings and room behaviour: each one changes something real
node backs.mjs     # Back and Escape close overlays in order, then leave the page
node verify.mjs    # keyboard entry, reduced motion, focus ring
```

The dev server compiles a route on first request and can answer 404 for its
JavaScript for twenty seconds while it does; a suite that lands in that window
reports a failure that is not one. Run `warm.mjs` first, and treat a failure
on the very first click after a page load as a cold route until it repeats.

Every stub answers. Where the prototype stops - the other six modules, the
File Manager, a download, the people directory - the control is still
pressable and says so in a toast, because a disabled button teaches nothing
and an inert one is indistinguishable from a bug. Two sweeps enforce it:
`deadends.mjs` presses every control a page opens with, and
`deadends-deep.mjs` presses links, everything behind an opener or a tab, the
phone layout, and the pages the first pass never reaches. Both judge a press
by what a person could see change.

Current state: zero console errors and zero horizontal overflow across all 16
views; one `h1` per page; no unnamed controls; the keyboard reaches each of the
six rooms exactly once.

## Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind v4 · Zustand ·
Recharts · Excalidraw · Phosphor icons · Geist. Installable as a PWA.
