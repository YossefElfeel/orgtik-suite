# OrgTik suite — frontend prototype

All OrgTik frontends in one repo, deployed on Vercel as a clickable prototype. A mock API stands
in for the real backend. This is a snapshot of the local program (`New sass/`) with fresh history.

| Folder | What it is | Vercel project |
|---|---|---|
| `apps/sos` | SOS hub: sign-in, launcher, people, USR customer dashboard | `orgtik-suite-sos` |
| `apps/tasks` | Tasks | `orgtik-suite-tasks` |
| `apps/files` | Files | `orgtik-suite-files` |
| `apps/sales` | Sales / CRM | `orgtik-suite-sales` |
| `apps/hr` | HR | `orgtik-suite-hr` |
| `apps/marketing` | Digital marketing | `orgtik-suite-marketing` |
| `apps/content` | Legacy content dashboard | `orgtik-suite-content` |
| `apps/chats` | Chats (Somion HQ prototype, own demo data) | `orgtik-suite-chats` |
| `apps/wm` | Website Manager (CMS) | `orgtik-suite-wm` |
| `apps/admin` | ADM back office | `orgtik-suite-admin` |
| `apps/website/landing-directions` | Public website (Vite, `cms/connect` state) | `orgtik-suite-website` |
| `mock` | Mock backend (Express), every API in one function | `orgtik-suite-mock` |
| `packages/ui` | `@orgtik/ui` design system source (apps use the built copy in `.yalc/`) | — |
| `program` | Plan, decisions, specs, audits | — |

## How the hosted prototype is wired

- **Mock API**: `mock/api/index.js` serves each app's API under its key, e.g.
  `https://orgtik-suite-mock.vercel.app/sos/api/...`, `/tasks/...`, `/wm/v2/...`.
  `MOCK_PUBLIC_URL` and `SUITE_WEB_URLS` (JSON `{key: origin}`) tell it where everything lives.
- **Data is in memory.** It is reseeded whenever the function starts cold, so changes don't
  last. Live updates over sockets (chat, notifications) don't work on Vercel.
- **Launcher**: `tools/vercel-prebuild.cjs` points `@somion/sos-bar` at the hosted SOS and
  mock before each build (the hosted version of `mock/patch.js`).
- **Sign in** on the SOS app with the test accounts in `mock/README.md`. Apps open through
  SOS (`/go/<app>`) with a one-time code.

## Local development

See `mock/README.md`: run the mock (`node mock/server.js`), then each app's `npm run dev` with
its `.env.local` pointing at `http://localhost:40xx`.
