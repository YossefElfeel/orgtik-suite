# OrgTik suite

All OrgTik frontends in one repository, deployed on Vercel as a clickable prototype. A mock API
stands in for the real backend. Since 2026-10-07 this repository is the only place the suite is
changed (decision D-052, `program/plan-v2.md`).

| Folder | What it is | Vercel project |
|---|---|---|
| `apps/sos` | SOS hub: sign-in, launcher, people, USR customer dashboard | `orgtik-suite-sos` |
| `apps/tasks` | Tasks | `orgtik-suite-tasks` |
| `apps/files` | Files | `orgtik-suite-files` |
| `apps/sales` | Sales / CRM | `orgtik-suite-sales` |
| `apps/hr` | HR | `orgtik-suite-hr` |
| `apps/marketing` | Digital marketing | `orgtik-suite-marketing` |
| `apps/content` | Legacy content dashboard (retiring, D-055) | `orgtik-suite-content` |
| `apps/chats` | Chats | `orgtik-suite-chats` |
| `apps/wm` | Website Manager (CMS) | `orgtik-suite-wm` |
| `apps/admin` | ADM back office | `orgtik-suite-admin` |
| `apps/website/landing-directions` | Public website (Vite, the CMS-connected state) | `orgtik-suite-website` |
| `apps/docs` | Storybook for the design system (not deployed) | — |
| `mock` | Mock backend (Express); on Vercel every API in one function | `orgtik-suite-mock` |
| `packages/ui` | `@orgtik/ui`, the design system | — |
| `program` | Plan, decisions, specs, audits and their tools | — |
| `tests/next-smoke-*` | Next 15/16 smoke apps for the library | — |

## Working here

- **Install:** `pnpm install` (pnpm 11, see `packageManager`). One lockfile for everything.
- **Run locally:** `pnpm dev:mock` for the mock, then `pnpm --filter <package> dev` per app. Each
  app's `.env.local` (git-ignored) points it at `http://localhost:40xx`; `node mock/patch.js` points
  the old launcher package at localhost.
- **Check:** `pnpm turbo run typecheck i18n:check test` (add `--affected` to check only what changed);
  `pnpm turbo run build` builds the library first, then the apps.
- **The library** is a workspace package. Each app gets an injected copy (its own React and
  Next resolve it), refreshed after every library build. Change the library and the apps that need
  it in one pull request.
- **Program tools** (`program/tools/**`) still use the old folder names; run
  `node tools/dev/old-layout-links.mjs` once to create them as git-ignored links.
- **Work:** branch `<area>/<topic>` → pull request → Vercel preview + checks → merge. Never push to
  `main` directly. Parallel sessions use their own git worktree.

## How the hosted prototype is wired

- **Vercel** builds a project only when the project, or a workspace package it uses, changed
  (`turbo query affected` in each `vercel.json`, written by `node tools/vercel/configure.mjs`).
- **Mock API**: `mock/api/index.js` serves each app's API under its key, e.g.
  `https://orgtik-suite-mock.vercel.app/sos/api/...`. `MOCK_PUBLIC_URL` and `SUITE_WEB_URLS`
  (JSON `{key: origin}`) tell it where everything lives. With a journal store connected (Upstash
  Redis, D-053) its data survives cold starts; see `mock/README.md`.
- **Launcher**: `tools/vercel-prebuild.cjs` points `@somion/sos-bar` at the hosted SOS and mock
  before each build.
- **Sign in** on the SOS app with the test accounts in `mock/README.md`. Apps open through SOS
  (`/go/<app>`) with a one-time code.
