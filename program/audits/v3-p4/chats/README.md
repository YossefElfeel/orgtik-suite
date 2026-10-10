# Chats P4 ordinary workspace cycle

This cycle uses signed ordinary routes and current source records. The historical /presentation route is retained only as an isolated walkthrough; it is absent from ordinary navigation and supplies no live business records.

## Implementation map

| Plan scope | Ordinary entry and owner behavior |
| --- | --- |
| Notifications, search, activity | Shared SuiteFrame reads actual current-visible Chats suiteFeed projections; links resolve exact channel/message/thread source IDs. |
| Message → Task | Native message controls use current source-aware Tasks projects and sections, one stable creation operation, verified source-owned references and actual Tasks handoff. Private, group and DM targets retain the current source audience. |
| Rich text, browse/join, schedule/remind/save | Ordinary channel workbench uses RHF/Zod and shared fields/editor. Existing message rows/settings own formatting, queues, personal saves/reminders and public membership. Sample delivery is explicit. |
| Typing, read receipts, @channel/@here, polls | Current member/cursor records drive visible state; polls own actual canonical votes and author close controls. Typing and receipts remain visibly local sample state. |
| Voice notes and calls | Voice playback is explicitly simulated; signed host/participant call controls, guest admission, recording state, meeting discussion and huddles use persisted source records. No remote media provider, microphone upload or arbitrary recording bytes are introduced. |
| Guest from another browser | Anonymous capability entry exposes minimal meeting metadata and only the visitor's own lobby state. The signed actual host admits/declines. No canonical person, seat, grant or private history is created. |
| D071 Files references and recording | Attachments and recordings bind exact immutable native Files references and bytes. Recordings require an actual packaged video/mp4 sample, labeled simulated; caller-selected unrelated content is refused. |
| D072 whiteboards | Existing real Excalidraw vector scene/Files version/custody/recovery contracts remain. Images, imports, embeds and external links remain deferred. |
| D046 accents, office, policies | Six existing accent presets sit over v2 action/focus tokens. Actual presence, floor rooms/templates, moderator mute/deafen, focus knocks, edit window and retention settings use their existing owner rows and current canonical member visibility. |
| Admin and first run | /hq/admin supplies overview, members/seats, roles, settings, connections, import/export, audit and billing. /hq/setup derives actual checklist completion and saves selected native floor/setup. Invitations and seats hand off to Account. |

## Design-system inventory

All handwritten React inline style attributes and direct element.style changes were removed. Static paint/typography/state uses tokens and CSS classes. The geometry helper accepts only source positions, dimensions, transforms and grid columns; it cannot set paint or typography. Vendor Excalidraw owns its internal canvas DOM.

Seven minimal mechanical/domain bindings remain in components/ui: Avatar/presence marks, ButtonLink, Calendar event composition, DateRangePicker presets, Overlays prop translation, Primitives house bindings and Stat translation. They delegate shared rendering/interaction behavior to @orgtik/ui. There is no parallel local visual kit, and this inventory does not claim zero local components.

The initial source inventory recorded 955 inline attributes (including 932 literal object usages). The final source scan has zero handwritten inline attributes, zero direct element.style writes and no new as-any casts. The one bounded detector scan found five issues; the calendar borders were reduced to one pixel, and four data meter/countdown transitions now animate transforms. Ordinary matrix checks confirm the resulting views.

## Accepted evidence

Final totals in verification.json: **673 passing scripted checks and171 unique accepted captures**, zero failed accepted checks and zero recorded runtime errors. Final production build, explicit typecheck, five catalogs,25 domain/transport/guest tests and14 client tests pass. The separately retained Files/boards/custody19 and board UI recovery6 checks remain linked with their original provenance. Reports and scripts use the owned disposable memory demo and actual source-created records; no auth tokens or guest capability material are committed. The ignored runtime input file supplies the current source IDs for repeatable browser scripts.

- flow-setup: signed canonical source creation, private audience refusal, actual thread Task creation/replay/reference, current source feeds and bounded MP4 record.
- native-flow: actual rich text, vote/save/reminder, explicit sample voice playback, workspace-zone scheduling/manual delivery, native Task picker/link, actual thread query, anonymous lobby and signed host admit.
- preference-handoff: one early actual Account menu click writes one native preference; late real bootstrap preserves it; actual Tasks handoff applies saved dark theme in the same workspace.
- matrix: hydrated ordinary office/workbench/meetings/setup/admin/settings/real whiteboard/catch-up across EN/AR, light/dark and 1440/390/768/1024; serious/critical axe, overflow, exact theme and runtime console checks.
- guest-matrix: anonymous ordinary guest entry across the same sixteen combinations, with no private shell, overflow, serious axe or runtime console errors.
- states-admin-huddle: actual delayed request, outage/retry, empty/no-match/private source, existing readonly view-as, persisted huddle, eight Admin sections, native export, first run and Files trial connection.
- readonly-pinned-flow: actual current admitted readonly actor opens and decodes exact pinned recording bytes without mutating the source.
- native-recovery: an actual committed rich message survives lost response and browser reload with the same body/operation and exactly one source row.

The retained source/transport tests cover current workspace/actor isolation, private channel audience, identity/custody, immutable pinned references, concurrent writes, cold restore and operation recovery. Production/providers, arbitrary uploads and all plan Tier C work remain deferred.

## Final handoff

Source18e293b refreshes the actual signed Chats context after a native Files trial and prevents premature linked-Task empty state. The saved source hashes and capture hashes identify the completed cycle. Current fresh confirmation on2026-10-11 includes original-body/key lost-response recovery6, actual Admin/states23 and first-run9, including a real vector rectangle written as immutable Files v1 after the trial.

The first-run harness initially sent the old default workspace header after the new owner handoff, then attempted to draw over Excalidraw's settings panel. These diagnostics remain outside accepted totals. The corrected harness uses the current signed workspace and visible Rectangle control with an unobstructed interactive canvas. No server boundary, permission or scene-validation rule was weakened.

Reproduce with owned offset600: pnpm demo chats,tasks,files. Set ORGTIK_CHATS_FLOW_DATA to the private run's v3-flow-data.json path; run flow-setup before native-flow and recording/other dependent checks. Runtime inputs contain private guest capability material and remain ignored. finalize.mjs refuses empty, failed or unfinished accepted reports and records exact source/capture hashes.

Disposition: **ship** for ordinary Chats Tier A/B in the frontend and persisted mock prototype. Provider delivery, real-time media/OAuth, arbitrary uploads and public client-channel expansion remain outside this scope.
