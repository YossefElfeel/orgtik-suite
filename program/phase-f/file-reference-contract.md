# R2 Files reference contract

2026-10-08 · reviewed package with scoped local browser/API acceptance; package CI and hosted release acceptance pending. Extends [D-066](../decisions/D-066.md) and [D-071](../decisions/D-071.md).

## Record and authorization

The wire reference is exactly `{workspaceId, fileId, versionId}`. Unknown fields, incomplete references and malformed identifiers fail422; a different workspace fails404. The consuming API accepts its own signed tool audience and selected workspace. Shared metadata requires both that tool's record permission and current Files assignment/ACL. Task visibility uses the actual project guard; Chats requires actual conversation membership even for an administrator. A public share capability or global identity role cannot replace either permission.

The picker returns `{items, meta:{page,limit,total,totalPages}}`. Each item has only `workspaceId,fileId,versionId,name,mimetype,size,version`; size is raw bytes and version is an integer. Search is bounded, pagination is validated and results contain only supported packaged records the actor may read. Archived/custody records and archived ancestors are unavailable. New workspaces remain empty until an explicit sample creation.

`GET /api/shared/files?resourceType=task|channel&resourceId=...&search=...&page=1&limit=20` is mounted on Tasks and Chats, with their respective tool audience. Read-only Files permits selecting an existing record; attaching still requires the consuming tool's write capability. It grants no Files editing rights.

## Consumer mutations and projections

Tasks accepts `POST /api/tasks/:id/attachments`, JSON `{references:[...]}`, with a stable `Idempotency-Key`. It validates every record before mutation, stores minimal references and prevents duplicate same-file/version rows. The existing delete endpoint removes a reference with its own stable key and recovers exact repeated deletion after current task authority is checked. Removing a link never deletes its Files record.

Chats accepts minimum references in `message.created.message.attachments`. An attachment-only message is valid. Author, display metadata, content paths and timestamps come from the server. Exact file-message receipts remain recoverable beyond the rolling command window, including after restart; neither role nor conversation revocation is bypassed by an old key. Business-object context cards remain separately unfinished.

Task detail and Chats bootstrap project current Files metadata each time. Available rows include a private relative content path and their pinned reference. Unavailable rows retain the reference identity but expose no cached filename, size, preview or content path. Historical Chats fixture labels were not Files records; they remain historical data and project as unavailable instead of granting a fabricated download. Runtime/storage failures remain failures; they never manufacture saved records or successful content.

`GET /api/shared/files/:fileId/versions/:versionId/content` requires `resourceType=task|message`, `resourceId` and `referenceId` identifying the actual stored attachment. It checks the consumer guard and current Files ACL before reading bytes. Responses use private/no-store, nosniff and attachment disposition. Tokens stay in request headers; public URLs and share secrets are never copied into references.

## Packaged records, versions and persistence

Files exposes `GET /api/v1/files/samples`, returning `{items:[{sampleId,name,mimetype,size}],canCreate}`. `POST` on the same path accepts only `{sampleId,parentId?}` and requires a stable key. Current editor/parent permissions are checked before receipt recovery. It creates one native Files record, immutable version1 and an activity entry from a curated packaged asset. Sensitive demo files and HLS transport are outside this creation catalog. Existing readable records remain governed by their actual Files ACL rather than a filename-based policy.

Historic records without a content-version model infer only their packaged version1. Modeled missing versions never fall back to current bytes. The codec validates version storage and current-version pointers and remains compatible with previous snapshots without optional sample receipts. Metadata renaming does not replace pinned content. Further version creation, name-clash handling, comments and structured whiteboards remain separate R2/R3 work; arbitrary binary uploads remain deferred.

The coordinator caches a private Files runtime for the current consumer request and includes its snapshot in the same atomic realm checkpoint as the consuming tool. Refusals, persistence errors and CAS conflicts discard all candidate stores. Exact replay preserves source IDs and existing invoices/accounts; it never advances the business clock. Local verification uses disposable file-backed domains and signed HTTP, including cold restart and real lost responses.
