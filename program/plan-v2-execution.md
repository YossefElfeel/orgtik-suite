# OrgTik Suite — Plan v2 execution (after the review gate, 2026-10-07)

## الخلاصة بالمصري

- **اللي خلص (محلي، لسه ما اتعملوش push):**
  - التجميد والمزامنة.
  - الموك بيحفظ الداتا (journal).
  - الـ pnpm workspace والـ CI.
  - المراجعة الكاملة: ١٥ رحلة، و٢٦ ملاحظة، و٩ مقارنات، و٢٢٨ بند سبيك اتراجعوا.
  - backlog فيه ٤٠٧ بند.
  - تقرير بالعربي: https://claude.ai/artifact/FBRH7howZC9vnQT3JgAGNU
  - قراراتك D-056…D-062.
- **محتاج منك حاجتين بس** (الخطوات بالتفصيل في القسم ١): توصيل Upstash، وعمل `VERCEL_TOKEN`.
- **الترتيب اللي اخترته:**
  - **R0** إصلاحات فورية: الفلوس، والـ flows الصغيرة، ونصوص الويبسايت.
  - **R1** أساس السويت: مساحة العميل في كل tool، والاشتراك يبقى صلاحية دخول، والدعوات، ومقاعد لكل tool، وHR مربوط بالحسابات، وحالة الفاتورة تقفل التعديل.
  - **R2** ربط الأبلكيشنز: الملفات، والإشعارات، والبحث، والـ CRM، ونشر WM، واللغة والثيم، والتجربة من الويبسايت، وأسعار الويبسايت من المنصة.
  - **R3** أهم ٨ فيتشرز لكل tool، يعني ٧٢ فيتشر.
  - **R4** اكتمال الـ SaaS core: التجديد، والـ dunning، والـ proration، والـ limits، والـ onboarding، و2FA، وPDF للفواتير، والمقاييس، والإيميلات.
- **طريقة الشغل:**
  - كل حاجة PR صغير، والـ preview بيتعمل بـ GitHub Actions للأبلكيشنز اللي اتغيرت بس.
  - الـ checks بتمشي على الـ preview.
  - الرحلات اللي كانت بتقف بتتحول لـ tests، ولازم تبقى خضرا قبل ما الـ release يتقفل.

---

## Context

Plan v2 Phases 0–2 are done locally (nothing pushed: the Vercel Hobby daily limit was hit, each push created 12 deployments). The suite-wide review found that each app works on its own, but the layer between them is missing:
- tools are single-tenant demo datasets;
- launcher access is static seed grants in `mock/lib/identity.js`;
- platform subscriptions, seats and members never reach the tools;
- 8 of 15 journeys stop there.

The user approved the release order and decided the open product questions (D-056…D-062). This plan turns the backlog into an executable sequence with work packages, files, designs and checks.

### Current state (branch stack in worktree `New sass/orgtik-suite-v2`)
| Branch | Content | Pushed |
|---|---|---|
| `program/plan-v2` (PR #2) | plan-v2.md, D-052…055, A10, m0-drift.md | partly (2 local commits) |
| `wip/2026-10-06-work-order` (PR #3, draft) | carried 10-06 WIP (AuthSuccess, WM ideas, website checkout) | yes |
| `mock/persistent-journal` | write journal + sandboxes (D-053), journal.test 8/8 | no |
| `build/pnpm-workspace` (on journal) | pnpm 11 + Turborepo, library as workspace pkg, CI, vercel.json generator, i18n checker, secret scan (D-054); typecheck 11/11, build 12/12 | no |
| `fix/review-quick-fixes` (on workspace) | review outputs, gap matrix v1, backlog, readout, SR-002 fix, merge of plan-v2, D-056…062 | no |
| `fix/r0-platform` (worktree `orgtik-suite-r0-platform`) | empty, created for the platform fixes | no |

Key review outputs: `program/audits/suite-review/{journeys.md,findings.jsonl,gap-v1/*.json,readout.html}`, `program/audits/benchmark/*.md`, `program/backlog/backlog.csv` (`program/tools/review/build-backlog.mjs`), `program/gap-analysis/gap-matrix.csv` (v1, all rows verified 2026-10-07).

---

## 1. What the user does (one time, ~10 minutes)

### 1a. Connect Upstash Redis to the mock (makes hosted demo data persistent, D-053)
1. Open https://vercel.com, sign in, choose the team **yossef-elfeels-projects**.
2. Open the project **orgtik-suite-mock**, then the **Storage** tab.
3. Press **Create Database** (or **Connect Database** → **Create New**). In the Marketplace list choose **Upstash** → **Upstash for Redis** → **Continue**.
4. Plan: **Free**. Primary region: **Frankfurt (eu-central-1)** (closest to Switzerland and the Gulf). Name: `orgtik-suite-mock-journal`. Press **Create**.
5. When asked to connect it to projects: tick **orgtik-suite-mock** only; environments **Production** and **Preview** (Development optional); leave the env-variable prefix as the default **`KV`**; press **Connect**.
6. Check: project **orgtik-suite-mock** → **Settings** → **Environment Variables** lists `KV_REST_API_URL` and `KV_REST_API_TOKEN` (others such as `KV_URL` may also appear; that's fine).
7. Tell Claude "Upstash connected". Nothing to copy: the mock reads those variables itself (`mock/lib/journal.js`).

### 1b. Create the Vercel token for GitHub Actions deploys
1. Vercel → avatar (top right) → **Account Settings** → **Tokens** (https://vercel.com/account/tokens).
2. **Create Token**: name `orgtik-suite-actions`, scope **yossef-elfeels-projects**, expiration **1 year** → **Create** → copy the token (shown once).
3. GitHub → https://github.com/YossefElfeel/orgtik-suite → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**: name `VERCEL_TOKEN`, value the token → **Add secret**.
4. Tell Claude "token added". Claude never sees or prints the token; it's only read inside Actions.

Claude then does the rest with the user's go-ahead given here (these change Vercel project settings): turns off Git auto-deploys on the 12 projects (`git.deploymentEnabled: false` in each `vercel.json`), creates the preview mock project, and sets the env vars that point previews at it.

---

## 2. Delivery mechanics (Phase 0.4, revised: Actions deploys)

- **`tools/vercel/projects.json`** (committed, not secret): `{key: {projectId, dir, package}}` for the 12 projects + `orgId`; read from the existing Vercel projects (the other session's `projects.json` in its scratchpad, or `vercel project ls` in Actions).
- **`.github/workflows/deploy.yml`**:
  - Triggers: `pull_request` (preview) and `push` to `main` (production).
  - Job 1 `affected`: `turbo query affected --packages` against the base, mapped to project keys. The mock and the library count; a library change deploys every app that uses it.
  - Job 2 `deploy` (matrix over the affected keys, `max-parallel: 2`): `vercel pull --yes --environment=<preview|production>` → `vercel build` (runs the `vercel.json` install and build commands) → `vercel deploy --prebuilt`. It records each URL.
  - Job 3 `checks`: runs the existing preview checks (`preview-checks.yml` logic moves here) against the deployed URLs. It posts one PR comment with the links and results.
  - `concurrency: preview-mock`.
- **Preview mock:** second Vercel project `orgtik-suite-mock-preview` from `mock/` with `MOCK_SANDBOX=preview` and the same Upstash store, so preview data stays separate from demo data. Apps' **Preview** env vars point at it, and **Production** points at `orgtik-suite-mock`.
- **`tools/vercel/configure.mjs`** adds `"git": {"deploymentEnabled": false}`; CI `--check` keeps it true.
- **Order of first pushes:** PR #1 (other session) merges first. Then the stack lands in this order, rebasing each on `main`: plan-v2 (#2) → journal → workspace → review → R0 PRs.
- **Before the first workspace deploy:** run `git add --renormalize .` in its own PR. That fixes the CRLF files (Chats) once, after PR #3 has merged or been rebased.
- **Hosted re-check (Phase 1c, deferred until deploys work):**
  - `sweep` + `deadends` + `vs1` against the production URLs for every route.
  - Compare with the last local numbers, then add the regressions to the backlog.

---

## 3. R0 — fixes that need no approval

Two parallel streams, separate worktrees, separate PRs.

### R0-A Platform money and lifecycle (agent in worktree `orgtik-suite-r0-platform`, branch `fix/r0-platform`)
Source: `program/audits/suite-review/gap-v1/pricing.json` and `adm.json`/`usr-cms.json` rows marked Exists-flawed. Files: `mock/apps/admin/{admin-api.js,app-api.js,pricing.js,lifecycle.js,store.js}`, tests `mock/apps/admin/pricing.test.js` + new `lifecycle.test.js`.
| Row | Fix |
|---|---|
| P2 | Publishing stores a scheduled change with `effectiveAt`; the grid used for new quotes switches at that instant (lifecycle step), not at publish |
| P3 / P5 | "Existing now" re-prices only the edited zone/currency cells, and treats a new cell as an increase with a notice entry (`db.notifications` + mock mailbox) |
| ALG-7 | Checkout ignores client `seats`; seats come from the workspace per tool (D-061) |
| B1 / X3 | `bundleId` validated: bundle exists, active, and every cart plan is in it; the bundle % applies only to its lines |
| ALG-8 | Discount order bundle → coupon → proration → tax; monthly↔yearly switch credits the unused period |
| C3 / R1 (D-058) | Website orders priced by the platform: line amounts from the plan's resolved price for the workspace's region; currency is the workspace's; payments carry the USD rate |
| TAX-EU (D-060) | Region tax display; reverse charge for EU business customers with a VAT ID (Spree Studio → 0 %) |
| PAY (D-062) | Gulf routing to Tap/HyperPay; KWD never falls back to Stripe |
| US-C-14 | Lifecycle applies scheduled downgrades at period end and lists data over the new limits |
| F-12 | Accepting a custom-plan quote creates the private plan and the subscription line |
| US-A-36 | Service Team staff see only requests assigned to them |
| EX-11 | The publish test calls the endpoint and reads a line |
| Phase E switches | `seatModel` switch → `B` (per tool) per D-061, `taxDisplay` per D-060; OpenAPI regenerated (`phase-e/openapi.mjs`) |
Checks: `node mock/apps/admin/pricing.test.js` (16 + new cases from the worked examples), `node mock/apps/admin/lifecycle.test.js`, `node program/phase-e/openapi.mjs --check`, ADM/USR flows `program/tools/audit-kit/flows/{adm-*,usr-*}.mjs` en+ar green (update their expectations only where the fix changes the money, documented per case).

### R0-B UI and copy (main worktree, branch `fix/review-quick-fixes`)
| Item | Fix | Files |
|---|---|---|
| SR-002 | done (1a91e27) | — |
| SR-006 | Home tool links named "Open Tasks" (visible "Open", `aria-label` with tool name) | `apps/sos` Home tool card component, `messages/usr/*/home.json` |
| SR-010 | Invoices table: Total moves next to Number at narrow widths (column order + sticky first column) | USR invoices list |
| SR-011 | One `/v1/app/tools` request per Home view (shared RTK Query cache key/`selectFromResult`, no per-card queries) | `apps/sos` Home + `platformApi` |
| SR-012 | Tool page shows **Open {tool}** (link to `/go/<scope>`) when Active/Trial | USR `/tools/[key]` |
| SR-004 (D-057) | Sign-up after a guest purchase pre-fills name and email from the receipt in memory | `apps/website/landing-directions/src/reference/SignIn.jsx`, checkout receipt state |
| SR-005 (D-057) | "Account access is simulated" → real-account wording; confirmation copy only mentions CRM onboarding when services were bought | website copy via CMS strings (`st_commerce`), WM seed |
| Rail label | `Suite.apps.platform_admin` in ar (and missing locales) for Tasks, HR, WM, Sales | each app's `messages/ar.json` |
| Chats | Whiteboard copy no longer claims "Saved in Files" (until R2 makes it true) | `apps/chats` messages ×5 |
| HR-020 | Employee finance tab uses the employee's currency, not "CHF" | `apps/hr` finance tab |
Checks: `pnpm turbo run typecheck i18n:check test --affected`; VS-1 on each touched route (`program/tools/audit-kit/vs1.mjs`); website EN parity on touched pages (`program/tools/qa` capture+diff; only the reworded strings may differ, recorded in the PR).

---

## 4. R1 — Suite foundation (T1)

Goal: J1, J2, J3, J7, J15 pass end to end. Design facts from the code map:
- every tool mock has one module-level store, created in `routes()` or at load (`tasks.js:39/457`, `files.js:32`, `hr.js:12`, `sales.js:12-36`, `marketing.js:12`, `content.js:23`, `wm.js:77`);
- users come from `identity.requireUser`;
- access is `grants[scope][userKey]` (static);
- the platform has `workspaces[]` with members (`userKey`/email/role/status/tools) and lines (`snapshot.quantity`);
- `lifecycle.toolState()` already computes trial/read_only/active/not_subscribed;
- apps already map 403 `code:"read_only"` to a message (tasks, files, marketing, hr, sales, sos).

### R1.1 Tenancy in the mock (`mock/lib/tenancy.js`, new)
- **Picking the workspace:** each request resolves its workspace from the token claim `ws`, then the `x-workspace` header, then the person's default workspace (`admin/store workspaceOfUser`). The SOS hand-off issues codes for a chosen workspace and puts `ws` in the exchanged token.
- **`tenantStore(appKey, seedFn, emptyFn)`:** returns `forWorkspace(wsId)`. The existing seed becomes the data of the seeded customer workspaces: Nile Foods = today's demo data, and OrgTik's own `ws_orgtik` for internal tools (WM, ADM, HR of OrgTik). Every new workspace gets `emptyFn()`: empty lists plus the workspace's own people.
- **Per app:**
  - Change: replace each module-level `db` access with `db(req)` (a getter via `req.ws`). Apps: tasks, files, hr, sales, marketing.
  - Unchanged: WM and ADM stay OrgTik-internal, and content is retiring.
  - Effort: mechanical, one PR per app with its flow suite green.
- **Determinism:** the journal replay is unaffected, because the workspace comes from the request headers and token that the journal records.

### R1.2 Entitlements → access (`mock/lib/entitlements.js`, new)
- **`access(user, wsId, tool)`:**
  - `no_access` when the person isn't a member, or has no seat or tool grant in that tool (D-061: the seat is assigned by the owner);
  - `read_only` when the line is past due or read only;
  - otherwise `trial`, `active` or `free`.
- **`identity.userScopes`** returns the static staff grants for OrgTik people, plus the entitled tool scopes of every workspace the person belongs to (roles from the member role → tool role mapping table in `mock/apps/admin/permissions.js`).
- **`/api/auth/my-scopes`** and **`/go`** become correct with no frontend change, so SR-001 and SR-007 are fixed.
- **New middleware in `mock/server.js`, after `readOnlyMiddleware`:** `entitlementMiddleware(key)`.
  - It refuses changes with 403 `code:"read_only"` when the access is `read_only` (SR-016). Apps already show the message.
  - It answers 403 `code:"no_access"` when there's no access.
  - The strict-scopes switch becomes this middleware, always on for customer workspaces.

### R1.3 Members, invitations, one person
- **Invite** (`app-api.js:315`): creates an invitation `{token, wsId, email, role, tools}`, and on accept an identity user if missing (reusing `addSignupUser`). It writes the email to a **mock mailbox**.
- **Mock mailbox:**
  - `mock/lib/mailbox.js`, served at `/__mock/mail`.
  - Viewer page in SOS: `/dev/mail`, shown only when the mock says so.
  - Templates already exist in `admin/store.js` (T("invite", …)).
- **Accepting:** SOS `/auth/invite` accepts workspace invitations too (new `/v1/app/invitations/:token` metadata + accept). Not signed in → sign up or sign in, then join. Signed in as another person → the existing "sign out and accept" choice.
- **USR Team:**
  - "Copy invitation link", resend, cancel invitation, deactivate member, leave workspace;
  - transfer ownership (endpoint missing today, benchmark USR #2).
- **One person:**
  - Workspace members always carry `userKey` once accepted.
  - HR employees keep `authUserId`/`userKey` (already linked, `hr/routes/people.js:86`) and are linked to the workspace member of the same person.

### R1.4 Seats per tool (D-061)
- **Lines:** a per-user line's `snapshot.quantity` is the purchased seats for that tool. `S.seats(ws, tool)` counts assigned seats; `free = quantity − assigned`.
- **USR Team:**
  - a per-tool seat table: bought, assigned, free, and Buy seats (checkout for extra seats, prorated per R4);
  - each member's tool access chips assign or unassign a seat.
- **Invitations** need a free seat in each chosen tool, with a clear error and a "Buy a seat" path.
- **Checkout** quotes seats from the request per tool, validated against the minimum seats (fixes SR's CRM "per seat × 1" vs "at least 2").
- **Settings switch:** `seatModel` → `B` (done in R0-A), with the switch value documented in `phase-e/README.md`.

### R1.5 HR ↔ suite
- **Hire** (`hr/routes/people.js:62-109`): creates the identity user as today, plus a workspace invitation (same mailbox) with seats in the tools HR's onboarding chose.
- **Offboarding** (new HR action, replacing the soft delete at 124-135):
  - an end date;
  - revoke the workspace membership and seats at the end date (lifecycle step);
  - transfer prompts: Tasks owner, Files owner and Sales assignee, through each app's mock API (new `POST /api/transfer-owner` in tasks, files and sales mocks);
  - equipment return checklist;
  - final pay flag.
- **Suite user ↔ employee:** a suite user without an employee record shows "Add to HR" in HR (fills the wizard).

### R1.6 Frontend
- **SOS:**
  - workspace switcher in the shell for people with several workspaces; the hand-off passes `ws`;
  - Home: "Open" goes straight through for entitled tools; "Ask your owner" when the person has no seat.
- **Tools:**
  - show the workspace name in the shell;
  - empty states for a new workspace: every list's existing EmptyState with a primary action;
  - the library `States` components keep their copy in all 5 catalogs;
  - 403 `no_access` maps to the existing NoPermission state.
- **Sample data:** "Try with sample data" on an empty workspace: the mock copies a small sample into that workspace (optional, S).

### R1 checks
- New flows, each the journey as a test (`program/tools/audit-kit/journeys/j1.mjs` … `j15.mjs`, Playwright, en + ar):
  - **J1:** buy on the website → sign up → open Tasks → create a project → the project is in Leila's workspace only.
  - **J2:** invite → read the mailbox → accept → the member opens Tasks.
  - **J3:** `POST /v1/__mock/fail-next-payment` + advance → write in Tasks refused `read_only` → pay → write works.
  - **J7/J15:** hire in HR → invitation → join → offboard → access gone, ownership transferred.
- Existing suites stay green: every app's golden flows (seeded Nile Foods/OrgTik workspaces keep today's data), VS-1, `smoke.js`, `journal.test.js`.
- Tenancy isolation test (`mock/lib/tenancy.test.js`): data written in one workspace is invisible in another, for every tool API.

---

## 5. R2 — Apps working together (T3)

| Package | Design | Main files |
|---|---|---|
| R2.1 Files everywhere (SR-020) | Files mock gains `GET /api/v1/pick` + `POST /api/v1/files/from-app`. `@orgtik/ui` gets a `FilePicker` (dialog over the Files API, given the Files base URL and token). Tasks attachments and Chats shares store Files references; the Chats whiteboard saves to Files for real | `mock/apps/files.js`, `packages/ui/src/components/FilePicker.tsx`, `apps/tasks` attachments, `apps/chats` share + whiteboard |
| R2.2 Suite notifications (SR-025) | `mock/lib/notify.js` (`notify({ws, userKey, app, kind, title, link})`) used by every module; SOS API `/api/notifications` (list, read, preferences); `SuiteShell` bell in the library reads it in every app; per-app bells forward to it | `mock/lib/notify.js`, `packages/ui` SuiteShell, apps' shells |
| R2.3 Suite search (SR-026) | SOS `/api/search?q=` fans out to each tool mock's `/api/search` (people, tasks/projects, files, customers/deals, campaigns), results grouped with deep links; ⌘K command palette in `SuiteShell` | mock tool modules, `packages/ui` `CommandPalette` |
| R2.4 CRM ↔ platform (SR-018) | Website orders also create/update the Sales customer and a "won" deal (lead source website); a won deal in Sales can "Open workspace" (calls the platform to create the workspace + invitation to the contact) | `mock/apps/admin/app-api.js` website-orders, `mock/apps/sales/crm.js`, `apps/sales` deal page |
| R2.5 Publishing reaches the website (SR-023, D-012) | Website reads published content from the WM public API at runtime with the snapshot as fallback (`src/content/index.js` loader + cache), and WM publish triggers a Vercel deploy hook for SEO heads (prerender) | `apps/website/landing-directions/src/content/`, `mock/apps/wm.js` publish, deploy hook env |
| R2.6 Preferences across domains (SR-024) | Theme, language and digits stored on the identity user (`/api/auth/me/preferences`); hand-off carries `theme`; every app's `/auth` page applies them and writes changes back; `packages/ui` theme reads the server value first | `mock/lib/identity.js`, `apps/sos/lib/handoff.ts`, `packages/ui/src/theme/*`, apps' auth pages |
| R2.7 Website prices and trials from the platform (D-058, SR-008, SR-017) | Website `/plans` and product pages read tools, plans and prices for the visitor's region from `/v1/public/catalog` (new, no auth) with the code catalogs as fallback; "Start free trial" CTA → sign-up with `intent=trial:<tool>` → trial started in the new workspace; tool status (Coming soon/Beta/Live) shown from ADM | `mock/apps/admin/app-api.js` (public catalog), website catalog adapters, `SignIn.jsx` |
| R2.8 Chats keeps history (SR-021) | Mock `chats` API (channels, messages, members per workspace) behind the journal; the client store syncs with it; polling on Vercel (no sockets) | `mock/apps/chats.js` (now with routes), `apps/chats/store/index.ts` |
| R2.9 Marketing ↔ WM ↔ Sales (SR-022) | Campaign links to a WM page (picker over WM public pages) with UTM; Sales lead intake keeps UTM; Marketing campaign results show leads per campaign from Sales | `mock/apps/marketing`, `mock/apps/sales/crm.js`, `apps/marketing` campaign page |
Checks: journeys J4, J5, J6, J8, J9, J11, J13, J14 as tests (en + ar) on previews; website EN parity on pages whose numbers now come from the platform (expected diffs = prices only, listed); VS-1 on new UI.

---

## 6. R3 — Tools complete: top 8 per tool (T4, 72 features)

From each `program/audits/benchmark/<tool>.md` "Top 8", each a small PR series per tool. Each tool runs as its own agent in its own worktree, with the shared library changes going through one owner.
- **Tasks:**
  1. filters + search across tasks;
  2. reminders/overdue alerts + watchers;
  3. recurring tasks;
  4. templates;
  5. Files attach (via R2.1);
  6. labels;
  7. CSV import/export;
  8. quick add + bulk edit.
- **HR:**
  1. offboarding (R1.5 base) + equipment;
  2. leave policies/accruals + own balances;
  3. self-service profile + directory;
  4. bulk import;
  5. bank files CH/UAE + currency per employee;
  6. onboarding checklists as Tasks;
  7. document expiry reminders;
  8. email notifications (mailbox).
- **Files:**
  1. attach in Tasks/Chats (R2.1);
  2. version history + upload new version + name clash;
  3. notify on share;
  4. per-person access;
  5. storage quota;
  6. bulk select + drag move;
  7. comments;
  8. one search with filters + sort.
- **Sales:**
  1. follow-up tasks via Tasks;
  2. import/export/bulk;
  3. deal board with editable stages, probability, forecast;
  4. contact timeline + logging;
  5. lead routing + simple automations;
  6. offer PDF/validity/e-sign;
  7. companies, custom fields, tags;
  8. targets + funnel/source/lost-reason reports.
- **Marketing:**
  1. CRM sync + attribution (R2.9 base);
  2. consent/unsubscribe + delivery stats;
  3. campaign results;
  4. RTL email designer;
  5. social inbox;
  6. posting queue + drag reschedule;
  7. simple journeys;
  8. AI writing with brand kit.
- **Chats:**
  1. stored history (R2.8);
  2. Files sharing (R2.1);
  3. desktop/email notifications;
  4. calls with real media (LiveKit, deferred to R3 end; needs a provider decision → ask then);
  5. create task from message;
  6. rich text;
  7. browse/join channels;
  8. scheduled messages, remind me, save for later.
- **WM:**
  1. publish updates the site (R2.5);
  2. real analytics;
  3. reviewer/lead notifications;
  4. form spam protection;
  5. media tags + bulk upload + replace;
  6. responsive images;
  7. AI translation drafts into review;
  8. release bundles.
- **ADM:**
  1. dunning retries + emails + card-expiry warnings;
  2. invoice PDF + series per entity;
  3. edit a single subscription;
  4. SaaS metrics;
  5. tax IDs + ZATCA (after D-060);
  6. pay-by-link;
  7. CSV/accounting exports;
  8. staff 2FA + full audit log.
- **USR:**
  1. 2FA per person + workspace rule;
  2. transfer ownership (R1.3);
  3. workspace audit log incl. view-as;
  4. usage and limits page;
  5. data export (nFADP/GDPR);
  6. onboarding checklist;
  7. invoice PDF + billing contacts;
  8. team basics (R1.3).

Features that overlap R1, R2 or R4 are built once there and only finished here.

Each feature follows the plan's per-feature recipe:
1. fix spec;
2. library components first;
3. 5 catalogs;
4. all states;
5. mock + OpenAPI;
6. a flow test;
7. VS-1.

---

## 7. R4 — SaaS core completeness (T5)

Ordered by dependency:
- **R4.1 Renewal engine** in `lifecycle.js`:
  - renews lines at period end;
  - applies scheduled price changes, downgrades and currency migrations (P4/C4/X6, US-C-14);
  - issues invoices.
- **R4.2 Dunning** (F-06, US-C-25):
  - retries on day 1/3/5 with the mock clock;
  - emails through the mailbox;
  - past due → read only → ended.
- **R4.3 Proration** (US-C-12/13): adds and upgrades align to the billing date, and the summary shows current → new and the next renewal.
- **R4.4 Usage and limits** (US-C-16, US-A-06):
  - tool mocks report usage;
  - warnings at 80 % and 100 %;
  - server-side blocking at the limit, as a 403 `code:"limit_reached"` that apps map to the library's LimitReached state.
- **R4.5 Onboarding wizard** (US-C-08/10, USR-04): workspace name, country/currency, language, time zone, tools, invites.
- **R4.6 Security:** 2FA for people and staff (US-C-41, US-A-40), sessions, notification preferences (US-C-42).
- **R4.7 Invoices:** PDF in Arabic/English, type column, e-invoice QR for KSA (US-C-24), refunds with eligibility (US-C-26/USR-15).
- **R4.8 ADM:**
  - payments/failed tabs, pay links, grace extension (US-A-27/28);
  - zone moves with impact and migrations (US-A-12/F-08);
  - tool launch checks and waitlist emails (US-A-02/05, F-11);
  - ticket SLA, merge and canned replies (US-A-41/42);
  - the overview's charts.
- **R4.9 Admin-side notifications:** every "is notified" requirement goes through `notify.js` and the mailbox.

Checks:
- ADM/USR flows extended per row;
- the gap matrix moves each row to Exists-OK with evidence;
- the pricing and lifecycle tests cover every worked example of spec 03 and the 06 state tables.

---

## 8. Phase 5 — Re-verify and close
- All 15 journey tests green on production (sandbox `demo` reset first), en + ar.
- Gap matrix v2 (`program/tools/review/update-gap-matrix.mjs` with a new verification pass), benchmarks updated, backlog rebuilt.
- Dead-end detector across the suite, VS-1 per app ≥ the last recorded, axe 0 critical.
- Retirements (D-055) done inside the releases where they belong:
  - **in R0/R1:** R2 Sales frozen routes → redirects to ADM/USR, and R3 SOS superseded screens;
  - **in R1:** R5 `@somion/sos-bar` → library SuiteShell;
  - **after R2.5:** R1 Content dashboard, and the Vercel project deletion **asked first**;
  - **in R3:** R4 `components/ui` shims, per tool.
- Final Arabic readout artifact (update the same URL), plan amendment A11, memory updated.

---

## 9. How the work runs
- **One PR per work package:**
  - branch `<release>/<topic>`;
  - preview + checks via the Actions deploy;
  - squash-merge;
  - commit messages end with the Co-Authored-By line, and PR bodies with the Claude Code line.
- **Parallelism:**
  - up to 3 agents at once, each in its own git worktree with explicit file ownership (e.g. R0-A platform agent owns `mock/apps/admin/**`);
  - the main session owns `packages/ui`, `mock/server.js`, `mock/lib/**`, shells and integration;
  - agents never push; the main session reviews, runs the checks and pushes.
- **Stop and ask the user (AskUserQuestion)** only for:
  - Vercel project deletion;
  - provider choices (LiveKit or another for calls, email provider if real email is ever wanted);
  - anything that changes the owner's website design beyond D-057 wording;
  - money rules not covered by spec 03 or D-058…D-062.

## Verification (summary)
- **Every PR:**
  - `pnpm turbo run typecheck i18n:check test --affected`;
  - secret scan;
  - OpenAPI check;
  - Vercel config check;
  - preview checks (golden flows en+ar + VS-1 for the deployed apps).
- **Per release:** its journeys as tests are green on previews, then on production after merge.
- **Money:** pricing and lifecycle tests for every spec 03 worked example, plus the review's failing cases as regression tests.
- **Website:** EN parity capture vs the owner's design, with only the listed diffs allowed (D-057 wording, D-058 prices).
