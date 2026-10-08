# Structured whiteboard contract

2026-10-08 · local source reviewed and accepted within this package; CI and hosted acceptance pending.

## Canonical content

`{schema:'orgtik.whiteboard',version:1,elements,appState:{viewBackgroundColor}}` is the only scene envelope. The shared server parser validates local IDs, supported Excalidraw vector/text/frame fields, bounded finite geometry, colors, local bindings and UTF8 size. It rejects unsupported fields, image/binary/embedded data and external links before any mutation. Canonical JSON removes deleted elements and normalizes only known volatile reconciliation fields. Corrupt stored content fails503.

The maximum scene is256KiB,1000 elements,20000 points and100000 text characters. The Files content MIME is `application/vnd.orgtik.whiteboard+json`. Every modeled version stores its own canonical scene, size and SHA256; missing versions never fall back to the head. The packaged sample preview has its own immutable manifest entry and is explicitly labelled.

## Chats routes and identity

`GET /api/hq/whiteboards?channelId?meetingId?` returns permission-filtered `{items}`; a supplied association must itself be authorized. `GET /api/hq/whiteboards/:id?versionId?` returns the selected detail. Source access is standalone author, actual conversation member or current participant of the canonical saved meeting. Files assignment and inherited record ACL are also required. Bootstrap returns filtered summaries, never an unfiltered drawing table. Missing/denied source records do not disclose titles or scenes.

`POST /api/hq/whiteboards` accepts only `{name,parentId?,channelId?,meetingId?,scene}` and returns201. Association IDs are mutually exclusive and refer to saved server records. `PATCH /api/hq/whiteboards/:id` accepts `{baseVersionId,scene}` and returns200. Both require `Idempotency-Key` and current write capabilities in Chats and Files. The name limit is100 characters.

Summary: `{workspaceId,id,name,channelId,meetingId,revision,reference,headReference,updatedAt,historical,capabilities:{canWrite,readOnly}}`; detail adds canonical scene. A historical selection has no editing capability. Mutations add `savedReference` and `replayed`; an exact earlier operation may recover version1 while the detail shows a later head, without rolling that head backward. Permanent receipts retain only fingerprint/board/version identifiers, not duplicated drawings or credentials.

## Files routes and linked state

Native `GET /api/v1/files/:fileId/versions/:versionId` returns the existing IFile metadata with pinned download URL and `whiteboard:{boardId,versionId,version,currentVersionId}`. The `/download` route serves the exact canonical JSON; `/preview` serves the allowlisted sample SVG after the same authorization. Native current-head metadata and existing task/message references retain their respective head/pinned meanings.

Files source checks carry the actual file ID and verify the immutable board association. Reading metadata, content, list/ZIP entries or previews also requires current Chats source authority. Recursive folder archive/restore/move/access/purge preflights all affected structured records before changing a candidate. Structured files cannot be publicly shared; direct creation returns a typed422 only after current record authority is checked, while folder public items/ZIP omit them. Ordinary packaged assets keep their existing behavior.

The coordinator uses its request-scoped related Files/Chats graphs and commits both candidates in one atomic checkpoint. HTTP refusal, storage failure and CAS conflict restore the complete candidate baseline. Custody checks the actual successor's source association and archives both records when it is ineligible; it never adds the successor to another person's private conversation or meeting.

## Current evidence

Eight signed HTTP scenarios pass together in47.6 seconds, covering real create/save/native/pinned ZIP flows, concurrent same-base CAS, lost responses/503, malformed scenes, current permissions, read-only states and cold restart. Canonical meeting, renewal and custody fixture setup is private accepted historical state; it does not claim that new meeting scheduling or a full offboarding journey was delivered here.

The final complete mock chain passes **436 checks**, with exit 0: authentication 17 + journal 8 + pricing 20 + Node 107 + workspace 284. The workspace chain discovers the eight parser and six actual-client UI regressions. The eight HTTP, eleven Files-board, parser and UI cases are overlapping included subsets. The 37 focused Files checks (19 new plus 18 retained) overlap these groups; the earlier 422 run is superseded. Fourteen Chats app tests and twelve Files client tests pass separately. All 20 consuming-app type/catalog tasks and 24 configuration/artifact guards pass; contracts cover 720 routes.

[Final browser evidence](../audits/r2-whiteboards/README.md) passes 93 bounded assertions with 15 captures and 26 matching source hashes across English/light and Arabic/dark 1440/390px. Actual conflicts, retained draft restoration, lost-response recovery with a newer head and pinned read-only navigation are covered. One later 403 is an explicitly controlled transport refusal. Embedded meeting UI remains typechecked/API-tested rather than browser-accepted. Current package CI, full J8 and all 15 hosted release journeys remain pending; no production/shared data reset, clock advance or deployment occurred.
