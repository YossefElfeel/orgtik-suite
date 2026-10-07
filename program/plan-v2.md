# OrgTik Suite: Plan v2, full-suite UX review, flow fixes, missing features (monorepo + Vercel)

## الخلاصة بالمصري

- **الخطة القديمة خلصت تقريبًا:** الديزاين سيستم، الـ Website Manager، الست waves، Chats، و Phase E (ADM + USR). بس كل ده اتراجع **أبلكيشن أبلكيشن** وعلى الجهاز.
- **الخطة الجديدة بتبص على السويت كله كمنتج واحد**، على النسخة المنشورة على Vercel:
  1. **نجهّز طريقة الشغل الجديدة** (ريبو واحد `orgtik-suite` هو المصدر، PR + preview لكل تعديل، موك بيحفظ الداتا، CI بيفحص كل preview). ده أساس، مش الهدف.
  2. **UX review كامل للسويت:** رحلات بتعدّي بين الأبلكيشنز (من الويبسايت لحد ما العميل يشتغل في Tasks)، والحاجات المشتركة (الإشعارات، البحث، الإعدادات، الصلاحيات، اللغة والثيم)، وإعادة فحص كل أبلكيشن على الـ hosted.
  3. **نلاقي الناقص من 3 مصادر:** نراجع الـ 228 بند في الـ gap matrix من تاني (آخر مرة 30 سبتمبر)، ونطلّع الناقص من الرحلات، ونقارن كل tool بالمنتجات اللي اليوزر متعود عليها (Asana، BambooHR، HubSpot، Drive، Slack…).
  4. **تقرير بالعربي + backlog مترتب** (أثر × مجهود) **وانت اللي بتختار** نبني إيه. الحاجات اللي فيها بيزنس أو فلوس بتروح للـ PM.
  5. **نصلّح الـ flows المكسورة** (وفيها شيل الأبلكيشنز القديمة)، و**نبني الفيتشرز اللي وافقت عليها** رحلة رحلة.
  6. **نقفل:** نمشي كل الرحلات على production، و gap matrix v2، وتقرير نهائي.
- **اللي مش بيتغير:** كل القرارات D-001…D-048 (ماعدا D-044)، الـ DoD، الـ audit method، وقواعد الويبسايت (عمرنا ما نغيّر ديزاين الأونر).

---

## Context

The old plan (`orgtik-program/plan.md`) is delivered: `@orgtik/ui` rc.12, the Website Manager + website connection (A1–A9), the six dashboard waves, Chats, and Phase E (ADM + USR, integration green at `1d9757f`). But every review so far was **per app, on localhost**. Nobody has yet reviewed the suite **as one product**: journeys that cross apps, suite-wide pieces, and whether the tools are complete for their category.

The suite now lives on GitHub (`YossefElfeel/orgtik-suite`, private) and Vercel (12 projects `orgtik-suite-*`, mock as one function). The user wants:
- the work to move to that monorepo + Vercel (their choices: **monorepo is the only source of truth**, **persistent mock store**, **`@orgtik/ui` as a workspace package**, **CI + preview checks first**, **retire legacy apps**);
- a **full-suite UX review**, **fixing flows**, and **finding and adding missing features and flows**;
- missing features drawn from **all three sources**: spec re-check, cross-app journeys, benchmark per tool;
- a **ranked backlog the user approves** before anything new is built; business items go to the PM.

Facts this plan builds on:
- Gap matrix `orgtik-program/gap-analysis/gap-matrix.csv`: 228 rows (ADM 73, USR 72, price resolver 63, mixed/CMS 20), statuses Missing 156 / Partial 58 / Conflicts 14, **last verified 2026-09-30, before the waves and Phase E** → stale.
- Specs (`specs/`): 61 screens, 87 stories, 12 flows (F-01…12), 5 state tables, 73 flow steps, 17-row staff permission matrix. **They cover ADM/USR only**; the tools have no PM spec.
- Per-app audits exist in `audits/<app>/` (issues.csv, wave-plan, flows). Sales still has 191 issues un-verdicted and VS-1 296/380 (activity-feed hydration, Arabic "OrgTik Admin" rail label).
- Audit tooling to reuse: `tools/audit-kit/` (sweep, deadends, vs1, report, flows/*.mjs per app incl. adm-*/usr-*), `tools/qa/` (website parity), codemods.
- Local repos have moved past the snapshot (e.g. website `9601097` vs snapshot `41b2454`) and several are dirty (WM 9, local-dev 8, content 7, orgtik-ui 5, SOS 3, website 3, program 74 files).
- The hosted mock keeps data in memory (resets on cold start, no sockets); 7 apps still depend on `@somion/sos-bar`.

---

## Phase 0: Working setup on the monorepo and Vercel (prerequisite)

Short and mechanical; the review needs a hosted suite whose data survives a multi-step journey, and fixes need PR previews with checks.

| Step | What | Done when |
|---|---|---|
| 0.1 Freeze + final sync | List drift and dirty files per local repo (`program/migration/m0-drift.md`); **ask the user about every dirty file we didn't write**; carry committed drift in (diff-and-copy pattern); tag old repos `archive/pre-monorepo-2026-10-07` + `FROZEN.md`. Record **D-052** (monorepo is source of truth; D-044 superseded; client history never leaves the machine). `.gitattributes` (LF), branch protection on `main` | monorepo `main` = latest local state minus excluded WIP |
| 0.2 Persistent mock | User connects Upstash Redis (Vercel Marketplace, free) to `orgtik-suite-mock`. Mock gets a **write journal** (successful mutating requests replayed after reseed; one `LLEN` per request keeps instances in sync) and **sandboxes** `/~demo` (default), `/~preview`, `/~review-<n>`, `/~local`. Determinism audit first (`Math.random`/`Date.now` in seeds → seeded RNG + mock clock); per-app snapshot fallback where replay can't be deterministic. Reset per sandbox. **D-053** | data survives a mock redeploy; reset clears; previews never touch demo |
| 0.3 Workspace | pnpm workspace + Turborepo; flatten `packages/ui/packages/ui` → `packages/ui`; apps use `workspace:*`; delete `.yalc`; one root lockfile; Vercel Ignored Build Step `npx turbo-ignore`. **D-054** | clean clone builds; VS-1 on one route per app unchanged |
| 0.4 CI + preview checks | `ci.yml` (typecheck, lint, i18n:check, tests, OpenAPI `--check`, library Storybook gate when touched) and `preview-checks.yml` on Vercel `deployment_status` (reset `~preview`, run that app's golden flows en+ar + VS-1 against the preview URL, `concurrency: preview-mock`, PR comment + artifacts). Audit kit reads base URLs/sandbox from env | a broken PR is blocked; a clean PR is green with a report |

**In-flight work carried into Phase 0** (found 2026-10-07 while running 0.1):
- The monorepo already equals every local repo's last commit (hosted adaptations aside; Chats was committed with CRLF → fixed by `.gitattributes`). Only uncommitted work remains.
- That uncommitted work belongs to the open work order `orgtik-program/plans/2026-10-06-bugs-and-remaining.md` (detail in `2026-10-06-review-findings.md`), whose user decisions stand: **D-049** restored projects + `sampleNarrativePublished`, **D-050** Roadmap follows the owner's GitHub version, **D-051** the "Authentication successful" screen stays, only on a successful sign-in. Its WIP: `AuthSuccess` in `@orgtik/ui` + `useAuthSuccess()` in every app's auth page, SOS layout, WM overview chart, WM/mock ideas (M1–M3), website checkout/case-study files, program evidence files.
- It is finished **inside the monorepo** as the first PRs (one per section of that work order), so nothing is lost and it gets preview checks.

**Amendments found while running Phase 0 (2026-10-07):**
- **Vercel Hobby deployment limit hit:** every push creates 12 deployments (one per project, even when its build is skipped), and the daily cap was reached. Phase 0.4 must make a push deploy only the affected apps — either Vercel Pro, or git auto-deploy turned off and GitHub Actions deploying only `turbo`-affected apps with the Vercel CLI (needs a `VERCEL_TOKEN` secret the user creates). The user decides. Until then: few pushes, batched.
- **Sandboxes are separate mock deployments, not URL prefixes:** the mock's modules are process-wide singletons, so two sandboxes can't share one process. Each sandbox is the same `mock/` code deployed with its own `MOCK_SANDBOX` (journal key): `demo` = `orgtik-suite-mock`, `preview`/`review` = a second mock project. Replay pins the mock clock to each entry's time and seeds `Math.random` per entry (177 uses of time/randomness in the mock).

Working rules from here on: branch `<area>/<topic>` → PR → green checks → squash-merge; each parallel session in its own worktree; never touch the owner's `orgtik-website` repo or Vercel project; drift protocol D-031 runs inside the monorepo; ask the user whenever work stops on their decision.

---

## Phase 1: Full-suite UX review (on the hosted suite, sandbox `~review-1`)

### 1a. Personas and journeys

Personas (from specs 01/02 + the tools): visitor; customer owner; customer admin; customer member; OrgTik staff ×8 roles (Super Admin, Finance, Sales, Support, Service Mgr, Service Team, Content, Product Mgr); employee; line manager; content editor/approver.

Cross-app journeys to walk end to end (each: start → end, apps crossed, spec link if any):

| # | Journey | Apps crossed |
|---|---|---|
| J1 | Visitor picks a plan → cart → checkout → sign-up → lands in their workspace → trial starts (F-01/02) | website → identity → SOS/USR → tool |
| J2 | Owner invites a member → member accepts → gets a seat + tool role → opens Tasks | USR → identity → Tasks |
| J3 | Renewal fails → past due → read-only **in every tool** → pays → restored; refund with credit note (F-05…10) | USR → ADM → all tools |
| J4 | Staff launches a tool Coming soon → Beta → Live; it appears on the website and in My Tools | ADM → WM/website → USR |
| J5 | Staff changes a price → website catalog + USR price; currency lock respected | ADM → website → USR |
| J6 | Website lead form → WM leads → Sales intake → pipeline → won → customer workspace | website → WM → Sales → ADM/USR |
| J7 | HR hires an employee → becomes a suite user → gets Tasks/Files access → time-off request → manager approves → shows in calendars | HR → SOS → Tasks/Files |
| J8 | A project in Tasks with files from Files and a discussion in Chats (linking, previews, permissions) | Tasks ↔ Files ↔ Chats |
| J9 | Marketing campaign → landing content in WM → leads → Sales | Marketing → WM → Sales |
| J10 | Customer support ticket round trip; service request to completed (F-12) | USR ↔ ADM |
| J11 | Editor edits → approver approves → publish → live on the hosted website | WM → website |
| J12 | Staff "View as" a customer, read-only, audited (D-017) | ADM/SOS → tools |
| J13 | Preferences once: language, theme, digits, time zone carry across every app; sign out everywhere | all |
| J14 | A notification raised in one app reaches the person and deep-links to the right screen | all |
| J15 | Employee leaves → access revoked suite-wide → files and tasks reassigned | HR → SOS → Files/Tasks/Chats |

Each journey is walked in **en and ar, light and dark, 1440 and 390**, as the right identities, with evidence (screens, route, identity, console/network). Journeys that are already automatable become `program/tools/audit-kit/flows/journey-<n>.mjs`.

### 1b. Suite-wide heuristic review

One checklist across all apps: shell and launcher consistency (rail, app switcher, user menu, workspace switcher); navigation and deep links; global search (exists?); notification centre (exists?); onboarding / first-run empty states; settings and profile (one place or eleven?); permissions and no-access screens; error, offline and slow states (Vercel cold-start latency included); language/theme switching persistence; terminology vs glossary and status matrix; accessibility (axe + keyboard); mobile widths; performance budget per route on production.

### 1c. Per-app re-check on hosted

Automated: `sweep`, `deadends`, `vs1` against production URLs for every route of every app (compare to the last recorded per-app numbers → regressions list). Manual: a heuristic pass per app (Nielsen + the screen definition of done), focusing on what the waves deferred or froze. Close the Sales loose ends (191 verdicts, VS-1 fixes) here.

**Output of Phase 1:** `program/audits/suite-review/` — `journeys.md` (each journey: steps, result Works / Breaks at step N / Missing), `issues.csv` (same taxonomy DE/BF/MS/IC/A11Y/I18N/PERM/DATA/SEC/…, severity, app, journey), screenshots, and the regressions list.

---

## Phase 2: Find the missing features and flows

### 2a. Spec re-check: gap matrix v1
Re-verify all 228 rows against today's suite (read the code + walk it), update `status`, `evidence`, `last_verified`; regenerate `gap-analysis.md`. Expect most Missing rows to flip after Phase E; whatever stays Missing/Partial/Conflicts is real backlog.

### 2b. Journey gaps
Every journey step that says *Missing* (e.g. HR → suite user provisioning, cross-app notifications, global search, offboarding) becomes a gap row with the journey ID as its source.

### 2c. Benchmark per tool
For each tool, a feature checklist against the products its users already know, each feature rated **Expected** (users will miss it) / **Differentiator** / **Not for us**, with what exists today:

| Tool | Compared with |
|---|---|
| Tasks | Asana, Linear, ClickUp |
| HR | BambooHR, Personio, Zoho People |
| Files | Google Drive, Dropbox |
| Sales (CRM) | HubSpot CRM, Pipedrive |
| Marketing | HubSpot Marketing, Mailchimp, Buffer |
| Chats | Slack, Microsoft Teams |
| Website Manager | Webflow CMS, Storyblok |
| ADM (billing/back office) | Stripe Billing, Chargebee |
| USR (customer admin) | Google Workspace admin, Atlassian admin |

Benchmarks use public product knowledge and documentation (no copying of copy or visuals). Run as parallel research agents, one per tool, each writing `program/audits/benchmark/<tool>.md`.

### 2d. Ranked backlog and gate G-R (user decision)
Merge 1 + 2a–2c into `program/backlog/backlog.csv`: item, source (review/spec/journey/benchmark), type (Fix flow / Missing flow / Missing feature / Retire), apps, journey, impact (users × frequency × severity), effort (S/M/L), priority score, decision dependency (user / PM / none).
Deliver an **Egyptian-Arabic readout artifact** (journeys map with where each breaks, top issues, gap counts before/after, benchmark tables, the ranked backlog). **The user approves the build list** (AskUserQuestion). Business, pricing, legal items → **PM packet 02** (EN + AR, ≤10 questions, each with options and a recommendation).

---

## Phase 3: Fix the flows

Everything of type *Fix flow* (no new feature needed) is fixed right away — it doesn't wait for G-R, except S3 items that touch design direction.

- Grouped **by journey**, one PR per group, so a fix that spans apps lands together (the monorepo's main gain).
- Each fix: evidence → fix spec only for S1/S2 flow changes → change → the journey's flow test added/updated → PR preview checks green.
- **Legacy retirement** (user's earlier choice) rides here, each its own PR, **asking before deleting any Vercel project**:
  - R1 the old Content dashboard (`apps/content`, its mock, launcher scope, Vercel project);
  - R2 Sales' 17 frozen SaaS-admin routes (superseded by ADM/USR; redirects where an equivalent exists);
  - R3 SOS superseded screens (systems/cms, chat, content, icons-test — verify each);
  - R4 `components/ui` shims → library in every app (HR-027 and peers), then lucide/iconify/Radix leftovers;
  - R5 `@somion/sos-bar` in 7 apps, then the prebuild patch.
  Record as **D-055**.

## Phase 4: Build the approved missing features and flows

Ordered by the approved backlog, delivered **journey by journey** (a journey isn't done until it works end to end on production). Per feature:
1. Fix spec: problem, evidence, decision, library components (a missing component = library request, never a local one-off), message keys in 5 languages, all states, Given/When/Then.
2. Design: code-first in `@orgtik/ui` patterns; a preview link for the user to review on the PR (Figma stays deferred unless the user asks).
3. Mock endpoints + OpenAPI (`phase-e/openapi.mjs`) so the backend contract grows with the screen.
4. Screens to the definition of done (states, en/ar, RTL, light/dark, keyboard, AA, 390/768/1440).
5. Flow test in `flows/`, wired into preview checks.

Likely suite-wide candidates (to be confirmed by Phase 2, not assumed): notification centre with deep links, global search, HR → suite user provisioning and offboarding, cross-app linking (Files in Tasks/Chats), one settings/profile surface.

## Phase 5: Re-verify and close

- Walk all 15 journeys on production (sandbox reset first), en + ar → each "Works".
- Gap matrix v2 + benchmark tables updated; dead-end detector clean across the suite; VS-1 per app ≥ last recorded.
- Final Arabic readout artifact: what was fixed, what was added, what's left and why (blocked on PM/backend/owner).
- `program/plan.md` amendment A10 points to this plan; decisions D-052…D-055 recorded.

---

## Out of scope / blocked (record, don't do)
Real backend and payments; publishing `@orgtik/ui` (D-006); Arabic website public (D8 owner sign-off, translators Q-007c); noindex lift (Q-010b); live forms (D-041 privacy policy); any change to the owner's website design; Figma library (deferred) unless the user asks.

## Risks
| Risk | Mitigation |
|---|---|
| Review finds far more than can be built | ranked backlog + user gate; fixes ship continuously; features journey by journey |
| Hosted mock non-deterministic replay | determinism audit; snapshot fallback per app |
| Benchmark turns into feature bloat | every item needs a persona + journey; "Not for us" is a valid rating |
| Sockets missing on Vercel weakens Chats/notifications reviews | review realtime locally; record hosted limit |
| Shared preview sandbox flakiness | concurrency group, reset per run |
| Losing uncommitted work in the freeze | 0.1 asks before carrying or leaving each dirty file |

## Verification
- Phase 0: clean clone builds; persistent data survives redeploy; broken PR blocked, clean PR green with a preview report.
- Phase 1–2: every journey has a result and evidence; all 228 gap rows have `last_verified` ≥ review date; every tool has a benchmark file; backlog approved by the user.
- Phase 3–4: each PR's preview checks green; each journey's flow test passes en + ar on its preview and then on production.
- Phase 5: 15/15 journeys "Works" (or explicitly blocked with a reason); readout published.

## Critical files
- Review outputs: `program/audits/suite-review/{journeys.md,issues.csv}`, `program/audits/benchmark/<tool>.md`, `program/backlog/backlog.csv`, `program/gap-analysis/{gap-matrix.csv,gap-analysis.md}`, `program/pm-packets/02-*`.
- Tooling to reuse/extend: `program/tools/audit-kit/{sweep,deadends,vs1,report}.mjs`, `flows/*.mjs` (+ new `journey-*.mjs`), `program/tools/qa/*`, `program/specs/*.csv`, `program/status-matrix/`, `program/glossary/`.
- Platform: `mock/{server.js,api/index.js,config.js}` + new `mock/lib/{journal,sandbox}.js`; root `pnpm-workspace.yaml`, `turbo.json`, `.gitattributes`; `.github/workflows/{ci,preview-checks}.yml`; `apps/*/{package.json,vercel.json}`; `program/decisions/D-052…D-055.md`.
