# R1 workspace runtime and session contract

2026-10-08 · **Foundation source merged with CI and scoped local SOS evidence through PR14; subsequent people, leave and due packages merged through PR15–17. Full R1 integrated/hosted acceptance remains open.** See [A12 and the evidence report](README.md). R0 ancestry and hosted release gates still apply. Hosted mock only; existing Redis/identity resources, sample bytes and `@orgtik/ui` remain.

## 1. Source facts and the chosen boundary

The inspected baseline main6032161 had these concrete gaps, addressed by this package:

- `mock/lib/identity.js` makes JWT-shaped tokens ending in literal `.local-dev-signature`; `decode` checks only parsed expiry. Access/refresh tokens are not distinguished by API authorization, logout has no revocation, refresh/handoff omit workspace binding, and `userScopes` unions global seed grants.
- `mock/server.js` hydrates accounts, runs handlers, commits account changes, then commits journal state separately. Existing journal epoch/revision CAS and operation receipts are useful, but this ordering cannot atomically hire a person and reserve workspace seats.
- Tasks holds `db/ctx/identity` in module globals; Files closes over state inside `routes`; HR builds its DB at module evaluation and directly imports identity; Sales has singleton `S` and profile preferences; Marketing builds module-global DB. Chats has no backend API and uses client `mock/seed.ts` with fixed `ME`.
- Tasks, HR, Sales and Marketing role helpers add global `super_admin`; Files also trusts `userType === "admin"`. Frontend examples are Tasks `lib/roles.ts`, Files `hooks/useSessionAccess.ts`, Sales `types/role.ts`, Marketing `lib/roles.ts`, HR route roles/auth projection and Chats `lib/roles.ts`.
- `mock/lib/platform-replay.js` already demonstrates a private CommonJS cache/VM loader for frozen financial reducers. It does **not** provide tenant snapshot codecs or a security sandbox. `createStore` in `mock/lib/util.js` hides an ID counter; Tasks stores counters in `db.seq`.

**Chosen R1 bridge:** one private owned-module graph and explicit state codec per `{realm, workspaceId, appKey, revision}`. No process-global DB/context swapping, global `require.cache` purges, client-selected module paths or fallback to a global demo router. Existing URLs/envelopes remain; middleware resolves authority first and dispatches to the scoped router. Failure to build/hydrate a scoped runtime returns 503, never another workspace's seed.

| Product key | App / scope | Default owner / admin / member / guest tool roles |
|---|---|---|
| tasks | tasks / task_manager | super_admin / project_manager / developer / viewer |
| files | files / file_manager | super_admin / super_admin / file_editor / file_guest |
| hr | hr / hr_system | super_admin / hr / employee / unsupported |
| crm | sales / sales | admin / manager / salesman / customer |
| marketing | marketing / digital_marketing | super_admin / marketing_manager / marketing_specialist / client_reviewer |
| chat | chats / hq | owner / admin / member / guest (meeting-only) |

These are defaults for an **explicit tool grant**; narrower tool roles override them. HR manager/finance_manager and Marketing content_writer remain selectable roles. Ownership alone does not grant a tool or a seat. HR guest requests fail `unsupported_tool_role`; Chats guest cannot receive workspace channels/floor/directory. Existing fixture overrides preserve established personas. ADM (`platform_admin`) and WM (`website_manager`) use separate OrgTik staff authority, never this customer-role mapping; website-management purchases grant neither.

## 2. Authoritative context and session rules

Pin the public consumer context below; server-only authorization/replay capabilities are not JSON fields.

```ts
type ToolKey = "tasks" | "files" | "hr" | "crm" | "marketing" | "chat";
type MemberRole = "owner" | "admin" | "member" | "guest";
type WorkspaceContextV1 = {
  version: 1;
  realm: string;                      // configured sandbox, never a client namespace
  workspace: { id: string; name: string; kind: "customer" | "orgtik_internal";
               state: "active" | "past_due" | "suspended" | "cancelled" | "deleted";
               timeZone: string };     // stored IANA business zone, not Node process TZ
  actor: { userId: number; effectiveUserId: number; readOnly: boolean;
           impersonatedBy?: number };
  member: { id: string; role: MemberRole; revision: number; accessEpoch: number };
  tools: Partial<Record<ToolKey, {
    scope: string; roles: string[];
    access: "no_access" | "not_subscribed" | "trial" | "free" | "active" | "read_only";
    canWrite: boolean; reason?: string;
    seats: { capacity: number | null; assigned: number; reserved: number; available: number | null };
  }>>;
  revision: number;                   // workspace authority/data revision
};
```

`AuthEnvelope` retains safe person/preferences/tokens and adds `workspaceContext` plus separate `staffAccess` launch metadata. Consumer `scopes` contain only grants for the selected workspace, with no privileged global scope. Staff context is a distinct `{mode:"staff", actor, roles, permissions}` projection derived from current OrgTik staff records. Membership in OrgTik's customer tools does not make someone staff; staff roles do not give access to another customer's tools. Internal ADM can manage authorized customer records without becoming a customer member. Tool access derives current membership, explicit role/grant, paid/trial/free line, assigned seat and billing state.

Suspension makes every customer tool read-only; cancellation/deletion removes tool access except authorized platform retention/export flows. Past-due grace does not immediately disable writes: only the affected subscription line reaching read-only does so. A viewer's role can make `canWrite=false` while its line remains active; never turn that into a billing failure or lock unrelated paid tools.

### Token/session authority — first shared package

- Sign and verify mock JWTs with built-in HMAC-SHA256, exact `alg=HS256`, issuer/realm/audience/type/subject/session/expiry validation and timing-safe signature comparison. JWT role/userType claims are never permission authority. Reject missing/unknown/revoked sessions and access tokens presented as refresh tokens.
- Derive a purpose-separated per-realm signing key from configured server auth secret or the existing persistent-store credential. Hosted mode has no public default secret. Local file mode persists a random signing key; memory tests may inject an isolated test key. Do not distribute keys to apps or serialize them in commands.
- Keep current prototype TTLs initially: access 30 days, refresh 90 days, handoff 60 seconds. All security expiry uses **real UTC time**, independent of the business mock clock. Shorter TTLs are a later compatibility change; persistent revocation is mandatory now.
- Persist `Session {sid, principalUserId, authVersion, createdAt, expiresAt, revokedAt, authStrength, impersonation?}` and `RefreshFamily {fid,sid,workspaceId,mode,generation,tokenHash,expiresAt,revokedAt}` in the existing realm identity store. Rotate refresh generation atomically; reuse returns 401 and revokes that family. Store hashes of opaque refresh/handoff values, not bearer tokens in business history.
- Exact signed claims are `{v:1,iss:"orgtik-mock:<realm>",aud,sub,sid,fid,type,workspaceId,mode,iat,exp,jti}`. `sub` is the authenticated principal even during view-as; effective person/readOnly come from the stored grant. Refresh tokens use audience `identity`; their family stores `accessAudience` for renewed access. Generation equality is checked for refresh redemption; existing access tokens may live until expiry unless their family/session is revoked. Never embed authoritative roles/grants in claims.
- Token audiences are `identity`, `suite`, `tool:<appKey>`, `staff:admin` or `staff:wm`. Identity profile/refresh/handoff routes accept the relevant valid session token; customer-platform routes need `suite`, tool routes need their app audience, internal staff routes need staff mode/audience. Handoff mints only its recorded destination audience after current authorization recheck.
- Access tokens carry selected `workspaceId`; a supplied `X-Workspace` must match it or return 409 `workspace_mismatch`. An absent header uses that verified binding, **never the person's first workspace**. A person with no workspace can use identity/onboarding endpoints only. `POST /api/auth/workspace {workspaceId,mode}` verifies eligibility and issues a new context/refresh family. Old tabs retain their existing workspace binding; changing a preference must not switch their data underneath them.
- Refresh preserves its family's workspace, mode, audience and impersonation restriction; it never unions grants. Handoff records `sid/fid/workspaceId/mode/target/readOnly`, consumes once, rechecks both session and destination access and returns the current context. A URL contains an opaque one-time code, never a JWT. Remove HTTP `?token=` identity authentication; public file/meeting grants are separate scoped capabilities. Temporarily normalize existing JSON token wrappers in Authorization before verification.
- `POST /api/auth/logout` persistently revokes the SID; `logout-all`/account deactivation increment account authVersion and revoke all families. Workspace removal/offboarding revokes only refresh contexts for that workspace and its membership authority; other workspace access remains. A 503 storage outage retains client credentials and offers retry; it never authorizes from an unchecked cache or masquerades as 401.
- View-as uses a persisted child-session grant with original staff actor, effective customer person, exact workspace, reason and forced readOnly. Verify current staff permission **and** effective member/seat access on each request. It cannot mint writable refreshes or staff audiences. Business commands audit both actor IDs.
- Invalidate old unsigned/public-secret sessions with a one-time re-sign-in boundary; preserve accounts/password hashes/business state. Old token parsing is allowed only inside private committed-history replay, never current HTTP authorization. Mock MFA strength cannot be inferred from ADM's current placeholder `2faVerified`; functional mock 2FA remains the agreed R3 prerequisite.

Server order: validate signature/current session → load current member/staff authority → validate workspace/audience → calculate entitlement/roles → enforce read-only/write capability → resolve runtime → only then check a scoped idempotency receipt. Mutation commit rechecks expected actor/session/member revisions. Replay consumes committed effects/snapshots; revoked actors do not invalidate earlier legitimate history, and a client `x-mock-replay` header grants nothing.

Public resource routes use a separate server-verified `{mode:"public_resource",realm,workspaceId,resourceId,capabilities,expiresAt}` grant context. They bypass neither general membership rules nor the resource boundary; no workspace bootstrap/directory is exposed. The grant registry chooses the private runtime before lookup. Legacy seeded share codes are indexed explicitly to `ws_orgtik` only; new grants use secure opaque values/hashes, not guessable fixture `shareSecret(id)` hashes.

## 3. Stable interface for all six app adapters

```ts
type ToolSnapshotV1 = {
  schema: string; version: 1; realm: string; workspaceId: string; appKey: string;
  data: unknown; sequences: Record<string, number>; fixtureId?: string;
};
type RuntimeInput = {
  appKey: string; workspace: WorkspaceContextV1["workspace"];
  initialization: { kind: "empty" | "fixture"; fixtureId?: string; seedAt: string };
  snapshot?: ToolSnapshotV1;
  identity: TenantIdentityFacade; clock: BusinessClock; rng: RecordedRng;
  assets: ScopedSampleAssets; services: WorkspaceServices;
};
type WorkspaceRuntime = {
  router: ExpressRouter;              // existing routes, private closure graph
  exportSnapshot(): ToolSnapshotV1;   // plain data plus EVERY counter
  bootstrap(context: WorkspaceContextV1): unknown; // permission-filtered, never raw DB
  usage(): { key: string; used: number }[];
  transferOwnership(command: {
    fromUserId: number; target: { kind: "member"; userId: number } | { kind: "archive" };
    operationId: string;
  }): { transferred: string[]; archived: string[] };
  applyCommitted(command: CommittedToolCommand): void;
  close(): void;
};
createWorkspaceRuntime(input: RuntimeInput): WorkspaceRuntime;
```

Shared registry `runtimeFor({realm,workspaceId,appKey,revision})` owns lifecycle/cache. Candidate writes create a **fresh private instance** from the committed snapshot; they never mutate a cached committed instance. The coordinator supplies a server-owned request-scope capability to the router. Returned effects/snapshot/result are published only after persistence succeeds. A losing CAS candidate is discarded; retry reauthorizes from fresh state. Permission-filtered bootstrap and entity lookup always use the same context; identical numeric IDs in two workspaces are permitted because the workspace is resolved before lookup. UI cache keys include workspace ID and authority revision; switch clears/reloads app data before rendering it.

`TenantIdentityFacade` exposes synchronous `requireUser/userFromReq/findUser/findByKey/findByEmail/fullName/userScopes` and read-only `users/grants` projections for legacy handlers. Its directory includes authorized current-workspace people only; globally unique email reuse occurs through shared identity commands, not directory enumeration. In customer mode `global` grants are empty. Legacy userType is a scoped display/filter compatibility projection (viewer/client versus staff-like collaborator), never the canonical person's type or an authorization source. Remove actual userType/global-super-admin fallbacks in both app helpers and API guards; UI cookies are presentation mirrors.

### Private CommonJS/VM bridge

- Cache owned modules privately per instance, including relative seed/lib/role/routes modules. Resolve only recorded app dependency roots; inject tenant identity, config, util and clock adapters when modules import shared mutable globals. Never load owned mutable modules through host `require` or expose global cache eviction. Reuse only explicitly approved immutable third-party/builtin dependencies; construct a new Express router per instance.
- Run repository code in a dedicated VM context with instance/request-scoped Date and Math.random. Business time/RNG comes from recorded command scope, not process-global swapping. Security crypto stays in the host authority service. No raw environment credentials, process control, unrestricted filesystem or network imports enter the VM. VM isolation is a closure-isolation tool, not a malicious-code sandbox.
- `BusinessClock` supplies `nowMs/iso/localDate/dayStart/addCalendarDays/timeZone`. Port host-local `setHours/getDay` calendar calculations to these helpers; a Date shim alone does not reproduce Cairo on Linux. Seed fixtures retain their recorded anchor/zone. Workspace business zone defaults once from owner preference (else Africa/Cairo); viewer timezone is a separate preference. Never mutate process TZ between tenants.
- Add explicit seed/bootstrap/codec hooks to each legacy app; wrapping alone cannot export hidden closures. Validate snapshot schema/workspace/app and recreate methods/counters before mounting routes. No stringify of functions/socket objects. Every observed ID allocator/RNG cursor must round-trip, including deletions of highest IDs.
- `ctx.io=null` in hosted/private runtime; never attach multiple tenant graphs to the legacy shared Socket.IO namespaces. Use polling. Any later local socket mode needs the same verified session/context and workspace-prefixed rooms; no unscoped online-user registry.
- Sample bytes remain packaged/read-only. Generated exports use buffers/approved ephemeral paths scoped by workspace/app; arbitrary binary uploads return `sample_assets_only`. Asset/reference authorization happens before URL/file resolution; public grants resolve exactly their recorded workspace/resource, not a guessed default runtime.
- Generate an owned-source/dependency/asset manifest before dispatch, verify hashes, and explicitly include/copy that tree after Vercel tracing. Test the generated Linux function loading two private workspaces; preserve HLS `.ts` bytes and frozen reducer sources. Unknown dynamic requires/missing codecs/changed manifest bytes fail closed with 503. Do not rewrite frozen financial reducers.

| Adapter work | Exact bootstrap/codec requirement |
|---|---|
| Tasks | Isolate module globals; serialize owned arrays, `db.seq`, orders/bookmarks and notifications. Empty state has no projects/tasks/teams/conversations; people come from scoped membership. |
| Files | Expose routes-local state through factory initialization/codec hooks; preserve folder/file/share/version/comment IDs and allocator state. Empty folders/files/shares, sample asset catalog only. |
| HR | Redirect identity/util/config **and seed factory** before module evaluation; use an explicit empty/schema initializer rather than building OrgTik data and clearing it. Serialize each `createStore` table's rows **and nextId**, plus non-table state. Empty employment/leave/payroll/hiring/finance tables; keep safe reference/config schemas, set company name from workspace and address blank. Replace direct identity writes/password mutation with commands. |
| Sales | Isolate `S` and `profilePrefs`; retain reference dictionaries while business contacts/deals/tasks/activity start empty. Scope customer/staff lookup, exports and ownership; retired SaaS routes stay under D-055 replacement gates. |
| Marketing | Isolate module-evaluated DB and all service closures; empty projects/posts/campaigns/audiences/integrations/history. Lift lazy GET scheduling into an idempotent system transition before returning data. |
| Chats | New backend runtime using this interface, not the launcher-only module. Stores channels/messages/member/read/whiteboard state; bootstrap identifies the signed-in person rather than fixed `ME`. Empty floor/channels/history; minimum create-channel/message/read commands use the same commit boundary, with R2 completing polling/integration. |

Ordinary GETs do not create business records. Declared due lifecycle transitions run as system commands with persisted effects; read-only impersonation cannot write user-originated changes. Missing counters/codecs or unexpected GET mutations block adapter acceptance.

## 4. One atomic identity/business command boundary

Introduce shared `SuiteCommand.execute({operationId,workspaceId,kind,payload}, verifiedContext)` for `workspace.create`, `member.invite/resend/cancel/accept/remove`, `ownership.transfer`, `capacity.purchase/reduce`, `hr.hire/offboard.schedule/offboard.execute`, `session.revoke` and linked custody/notification effects. App-specific handlers call it; they never push global identity arrays or independently append journal/email state.

```ts
commitSuiteCommand({
  expected: { realmEpoch, journalRevision, identityRevision, sessionRevision,
              memberRevision, workspaceRevisions },
  actor, authorizationDecision, operationId, fingerprint,
  identityChanges, sessionChanges, workspaceStateRefs,
  committedEffects, notifications, mailbox, result
}): { sequence: number; result: unknown; duplicate: boolean };
```

Use one multi-key Redis Lua/CAS transaction on the **existing** realm identity and journal keys to publish account/email uniqueness changes, session changes, workspace/tool snapshot manifest pointers, committed command/effects, operation receipt, audit and outbox. The memory/file test backend commits the same aggregate atomically. Existing prefixes remain; do not recreate resources or perform separate account-first/journal-second writes. Authenticate/authorize before receipt lookup; same actor/workspace/ID with changed fingerprint gives 409. No unverified client actor/role/replay flags are accepted.

Large state is staged as immutable hash-addressed JSON chunks (≤128KiB) before the atomic pointer publication. The commit checks all staged references, revisions and uniqueness first; consumers cannot see uncommitted candidates. Respect current journal 512KiB/request limits; incomplete staging/oversized commits return 503 and leave no success. Orphan candidate chunks expire; no business reset is a cleanup mechanism. On conflict discard speculative state and retry once after reauthorization, then return 409. On storage failure return 503, retain client credentials and rebuild from last committed manifests. Credentials/hashes belong only in identity storage; public results/journal receipts exclude passwords and bearer tokens.

### Seats, invitations and owner lifecycle

- Persist per-tool `capacity/assignments/reservations`; capacity comes from paid/trial line snapshot quantity. Available = capacity − paid assignments − unexpired paid reservations. Per-user guest allowance has its own slots; guests above that allowance reserve paid capacity. Flat plans remain quantity 1 and do not acquire an invented per-person price; explicit guest roles still enforce item/meeting restrictions.
- Invitations name explicit tools and local roles, never null/“all tools”. Reserve all required tools atomically or reserve none. Default expiry is 7 business days with a 7-day real-time ceiling on redemption; expired state never revives by moving the clock backward. Resend rotates the opaque token hash without double reservation; cancel/expiry release once. Mailbox delivery is an atomic outbox event, not real email.
- Acceptance requires the signed-in canonical email to match the invite; a wrong account gets a sign-out/switch path. New accounts set their own password through invitation acceptance, never HR-supplied/default credentials. Convert reservations to assignments once and activate membership atomically. Normal public signup explicitly creates an owned empty workspace; invitation signup joins the target and does not trigger an accidental extra owned workspace.
- Initial tool purchase assigns the owner a paid seat from available capacity plus an explicit default tool role. Owner/admin membership never bypasses capacity or tool grants. Ownership transfer changes billing/team authority; it does not silently assign tool seats or widen tool roles.
- Capacity purchase uses R0's server pricing/proration and requires an increase. Reduction is scheduled for next real renewal and cannot undercut assignments/reservations; new invitations also respect scheduled future capacity. Require cancellation of a pending incompatible reduction before a purchase. Private contracted capacity needs a new explicit quote.

### Hiring and offboarding

`hr.hire` reuses normalized email identity or atomically allocates a collision-checked safe numeric person ID compatible with current APIs. Existing passwords/profile/staff roles are untouched. Create a workspace-local employee record (`authUserId/userKey`), invitation/reservations and mailbox together; if any seat/email CAS fails, none exists. Re-hire reuses the person and restores employment only through this command. HR cannot edit global grants or another person's password.

The HR hire wizard must remove password collection and its validation/payload requirement; it offers invitation delivery instead. Adapt all five catalogs and pending/onboarding states with the backend change, rather than ignoring a password the form still requires.

Preserve existing numeric IDs; new people use collision-checked cryptographic 48-bit IDs, not `max(users)+1`. Employee IDs may still equal auth IDs within a scoped workspace, but new readable codes use that workspace's serialized employee-code sequence (`EMP-0001`, …), not arithmetic on the global ID. Existing employee codes remain unchanged.

Offboarding schedules an end date, eligible per-tool custody recipients, equipment/final-pay checklist and an ownership successor when needed. At the end, atomically end employment, revoke that workspace membership/tool grants/assignments/reservations and refresh contexts, and transfer Tasks/Files/Sales custody. Other workspace memberships/accounts/sessions survive. Revalidate recipients at execution. If a recipient became ineligible, archive affected records under a workspace system custodian, mark them read-only and create an owner-review item; never retain departed access, delete data or assign a hidden new privilege. A lost last-owner successor suspends the workspace for ownership review and alerts authorized staff; scheduling without a successor is rejected.

OrgTik employment-linked staff authority expires with that internal employment/membership, revoking staff-mode contexts while preserving the person's independent customer memberships. Protect the existing last-super-admin/self-lockout rule: choose a qualified replacement before scheduling; late failure creates a staff recovery incident rather than leaving departed authority alive. Customer-workspace offboarding never edits unrelated OrgTik staff roles.

Replay applies committed snapshots/effects exactly once without re-running credentials, invitations, pricing or today's authorization. Mail/notification/custody effect IDs are `{operationId, effectKind, target}`. Identity records required by a committed snapshot must already exist from the atomic transaction; missing historical identity/state returns 503, never token-based resurrection.

## 5. Fixture manifest and acceptance before delegation

Pin `workspace-fixtures.v1.json` as data, with `{realm,workspaceId,fixtureId,sourceCommit,sourceHashes,seedAt,appFixtures,peopleMappings,explicitMemberships,toolGrants,seatAssignments,defaultWorkspaceByUser,resourceSelectors}`. New workspace IDs not listed use **empty-v1 for all six tools**, with reference catalogs and current member directory only. Sample loading is an explicit authorized command, never a fallback on hydrate/error.

- `ws_orgtik`: independent full legacy agency fixture for Tasks/Files/HR/Sales/Marketing; client names within agency projects remain agency records. Convert existing explicit seed roles into local tool grants, preserving the current golden personas; keep system staff roles separate. Chats uses the existing client fixture as historical sample content, replacing fixed self/role authority with current identity. Unmapped sample authors are historical display records, not login-capable members.
- `ws_nile`: independent Tasks project **ID 1 / “Nile Foods E-commerce Revamp”** with its sections/tasks/comments/attachments only; Files includes **asset `pdf_msa_nilefoods`** and necessary folder ancestry only. Remap ownership/assignee references to admitted Nile members, excluding foreign member directories, unrelated teams/bookmarks/conversations and other-client documents. HR/Sales/Marketing/Chats begin empty. Nothing shares mutable objects with `ws_orgtik`.
- Preserve Nour's established agency-client review persona through an **explicit restricted guest membership in `ws_orgtik`** and existing customer tool roles/item grants; no ADM/WM/HR access. Her default billing workspace remains `ws_nile`. Golden client-review tests explicitly select the agency workspace; they must not obtain access by global grants or a union of workspaces. Legacy active members without an identity become pending invitations/reservations, never authenticated principals.
- Existing paid orders/invoices and account IDs are preserved. Capture legacy tool history into named fixture/scoped snapshots using a frozen private reducer or verified current checkpoint before migration; missing/ambiguous history blocks with 503 for review, never reseeding/resetting production. Canonical financial replay remains R0-owned.

The shared owner first delivers authority/session/context, atomic command writer, private loader/codec harness and manifest validator. Then delegate **Tasks/Files**, **HR/Chats**, **Sales/Marketing** against the exact interfaces above; shared server/identity/journal/shell edits stay with that owner. Each adapter has a coherent PR and changes both API and frontend role/cache helpers.

Required acceptance evidence (none is supplied by this document):

1. Tampered/unsigned/wrong-type/wrong-audience/wrong-realm JWTs fail before data hydration; logout/revocation survives cold start; stale refresh reuse fails; 503 does not log out a valid client. Switch/refresh/handoff preserve exact context and cannot promote view-as.
2. Two app/workspace instances interleave awaits with overlapping numeric IDs; reads/writes/people/assets remain isolated. Snapshot round-trip preserves deleted-highest-ID counters and seeded output. New workspaces stay empty; missing modules/codecs never fall through to demo data.
3. Global super-admin/userType spoofing cannot grant customer privileges; local guest/viewer restrictions survive UI/helper/API checks. Staff ADM/WM access never grants a customer tool. All touched UI states/catalogs remain five-language, EN/AR RTL, light/dark and responsive.
4. Concurrent last-seat invites yield one winner; resend/cancel/expiry/repeated acceptance release/convert once. Owner without seat cannot open the tool. Identity-created/journal-failed and journal-created/identity-failed simulations leave neither half of hire/accept/offboard visible.
5. HR hire → mailbox → join → approved leave → end-date offboard transfers/archive custody and revokes only that workspace. Test another workspace still works, revoked owners cannot reuse receipts, and recipient/last-owner races fail safely.
6. Linux prebuilt function loads both private runtimes from the explicit manifest with original sample/frozen bytes. Verify cold starts, persistence outages and replay without production reset/clock advancement. R0/R1 preview/stack gates and all 15 release journeys remain separately open.
