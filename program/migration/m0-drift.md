# M0: drift between the local repos and the monorepo (2026-10-07)

Plan v2, Phase 0.1. Measured on 2026-10-07 at 01:20 by comparing each local repo's committed
blobs at HEAD with `orgtik-suite` `main` (`d374fce`), then listing each repo's uncommitted files.
Ignored in the comparison: `.yalc/`, lockfiles, `vercel.json`, `AGENTS.md`, `CLAUDE.md`
(snapshot-only by design).

## Committed drift: none to carry

| Monorepo folder | Local repo [branch] | HEAD | Differences | Why |
|---|---|---|---|---|
| `apps/sos` | somion-sos-frontend-main [phase-e/usr] | a0f54a2 | `.gitignore` | hosted-only |
| `apps/tasks` | task-manager-front-main [wave3/tasks] | 27651e8 | `.gitignore`, `next.config.ts` | hosted-only (images allow `*.vercel.app`) |
| `apps/files` | file-manager-dashboard-main [wave1/vs-1] | 8f16d6c | same two | hosted-only |
| `apps/sales` | sales-dashboardv2-main [wave6/sales] | 29f3dd3 | `.gitignore`, `next.config.mjs` | hosted-only (+ the config bracket fix 9b7dd62) |
| `apps/hr` | somion-hr-dashboard-main [wave4/hr] | 963842d | same two | hosted-only |
| `apps/marketing` | digital-marketing-frontend-main [wave5/marketing] | 172f73a | `.gitignore` | hosted-only |
| `apps/content` | content-dashboard-somion-main [local-dev] | fd1ff83 | not-allowed page, `next.config.ts` | Q-004 token removed; hosted images |
| `apps/chats` | somion-hq [wave3/chats] | 5372018 | 163 files | **line endings only**: the snapshot stored them CRLF. Fixed by `.gitattributes` in Phase 0 |
| `apps/wm` | orgtik-website-manager [main] | 5d2089f | `.gitignore`, `next.config.ts` | hosted-only |
| `apps/admin` | orgtik-admin [main] | 76f1102 | `.gitignore` | hosted-only |
| `apps/website` | orgtik-website [cms/connect] | 19bf963 | none | — |
| `mock` | local-dev [main] | a203454 | `config.js`, `server.js`, `lib/requests.js`, `apps/wm.js`, `apps/admin/admin-api.js`, + `api/index.js` | hosted mock (`MOCK_PUBLIC_URL`, `/tmp` data dir, no sockets); the monorepo is ahead |
| `packages/ui` | orgtik-ui [main] | 5e01f9a | none | — |
| `program` | orgtik-program [main] | 74d4298 | 15 `audits/wm/followup/*.log` only local | logs are ignored in the monorepo |

The "GitHub repo and Vercel deployment" session kept `main` in step with every local commit.

## Uncommitted work: carried on branch `wip/2026-10-06-work-order` (4ff93be)

The user chose to finish the open work order (`plans/2026-10-06-bugs-and-remaining.md`) inside the
monorepo. Copied from the working trees, each file keeping the monorepo's line-ending style:

- **@orgtik/ui**: `AuthSuccess.tsx` (new), `package.json` (`./auth`, `./provider` exports), `i18n/strings.ts`, `charts/index.tsx`, `index.ts`.
- **Sign-in hand-off** (`useAuthSuccess()`): SOS `app/auth/page.tsx` + `app/auth/login/page.tsx`, Tasks, Files, Sales, Marketing `AuthContent`, HR/Chats/WM/ADM/Content `app/[locale]/auth/page.tsx`; SOS `app/(dashboard)/layout.tsx`.
- **Content dashboard**: its old local-dev patches (README, `.gitignore`, `globals.css`, `proxy.ts`, `package.json` with `@orgtik/ui`). Its lockfile was regenerated (`npm install --package-lock-only`) instead of copied: the local one points at the retired `sdk.somion.ch`.
- **WM**: ideas page, `EditorExtras`, `EntryEditor`, `EntryList`, `WebsiteNumbers`, `store/api.ts`.
- **Mock WM**: `wm.js`, `wm/{content,defaults,ops}.js`, `wm/seed/strings.mjs`, `wm/content-followup.test.js`, new `wm/ideas.js` + `ideas.test.js`.
- **Website**: `CaseStudy.jsx`, `PurchaseCheckout.jsx`, `purchase-adapter.js`.
- **Program**: the 10-06 work order and review findings; VS-1 evidence for Sales (19 routes), SOS/USR (5), ADM (1); website parity manifests; `tools/site/regenerate-followup.mjs`.

**Not carried (user's rule):** `audits/tasks/flows/{walks.json,ar/walks.json}` (overwritten by a partial T9 run), `tools/audit-kit/_sales-vs1-final.mjs`, `tools/audit-kit/probe.tmp.mjs`, WM's `AGENTS.md`/`CLAUDE.md` (next-dev notes). The 104 Arabic mirror screenshots (117 MB) stay out of git and are now ignored like the other screenshot folders.

## Freeze: waiting

The user's decision (2026-10-07): the local repos are frozen (tag `archive/pre-monorepo-2026-10-07`, `FROZEN.md`) **only after the "GitHub repo and Vercel deployment" session stops**, since it still commits there and copies into `main`. Its later commits on `main` are merged into the Phase 0 branches.
