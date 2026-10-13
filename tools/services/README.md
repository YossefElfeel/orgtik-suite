# OrgTik as one Vercel Services project

The repository-root `vercel.json` is for a new project named **orgtik-suite-services**.
Its root directory must be the repository root, not an individual app folder.
Vercel Services is in beta. Use **Vercel CLI 63.1.2** or a newer compatible version;
the previously used 54.7.1 CLI rejects `services`.

## Confirmed public routes and bindings

| Service | Source | Public path | Runtime binding |
| --- | --- | --- | --- |
| admin | apps/admin | /admin | mock via ORGTIK_MOCK_URL |
| chats | apps/chats | /chats | mock via ORGTIK_MOCK_URL |
| files | apps/files | /files | mock via ORGTIK_MOCK_URL |
| hr | apps/hr | /hr | mock via ORGTIK_MOCK_URL |
| marketing | apps/marketing | /marketing | mock via ORGTIK_MOCK_URL |
| sales | apps/sales | /sales | mock via ORGTIK_MOCK_URL |
| sos | apps/sos | /sos | mock via ORGTIK_MOCK_URL |
| tasks | apps/tasks | /tasks | mock via ORGTIK_MOCK_URL |
| wm | apps/wm | /wm | mock via ORGTIK_MOCK_URL |
| website | apps/website/landing-directions | / (catch-all, last) | none: static browser app |
| mock | mock | internal; no public rewrite | none |

`packages/ui` is a build dependency, not a deployable Next.js app. Storybook
(`apps/docs`) is omitted from this customer-facing deployment. The retired
Content app (`apps/content`) is omitted. The owner confirmed this layout.

Each Next.js service exposes `/SERVICE/api/backend/NAMESPACE/...`. That Route
Handler forwards the existing bearer token, workspace and idempotency headers
to its bound `mock` service. It streams uploads/downloads, preserves upstream
status codes, disables response caching, excludes mock-control URLs, and does
not trust client-supplied destinations or replay headers. Backend authorization
continues to verify the account and requested operation.

The Vite website uses the SOS gateway for identity, purchasing and published CMS
requests. This is a browser call to the public SOS service, not a server-side
binding. Binding URLs are not used during builds, in middleware, or in client
bundles. Do **not** configure `ORGTIK_MOCK_URL` manually.

## Environment

For the new project, configure the existing persistent store integration using
either `KV_REST_API_URL` and `KV_REST_API_TOKEN`, or
`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Never commit their values.
The provisioning script reuses the existing Redis integration with the confirmed
separate datasets: `MOCK_SANDBOX=services-production` in Production and
`MOCK_SANDBOX=services-preview` in Preview. An unconfigured hosted store fails closed.

`SUITE_SERVICES_PUBLIC_URL` is optional. It must be an origin with no path:
for example the new project's production domain. When omitted, the build uses
the current deployment's `VERCEL_URL`; all app links and browser APIs then point
at that same deployment. Local development defaults to `http://localhost:3000`.
Do not carry the old per-app `NEXT_PUBLIC_*`, `VITE_*`, `SUITE_WEB_URLS` or
`MOCK_PUBLIC_URL` values into this new project. The service build/config helpers
derive these from the single public origin.

The mock's conventional Express entrypoint is `mock/index.js`, which delegates
to the existing shared API handler. Existing per-app `vercel.json` files and the
separate-project deployment workflow remain available for the earlier layout;
they do not define the new root deployment.

## Local verification

```sh
pnpm install --frozen-lockfile
pnpm --filter @orgtik/ui run build
node --test tools/services/services.test.mjs packages/ui/src/auth/urls.test.mjs
npx --yes vercel@63.1.2 dev -L --listen 3000
```

`vercel dev` starts all services and injects the bindings. The mock's explicit
dev command uses the isolated `services-local` dataset under `.vercel/dev/mock`,
with file persistence, and never uses production Redis. Next.js base paths also
prefix framework assets; native browser navigation and session handoffs retain
the app prefix. Customer and staff app sessions have separate sessionStorage
keys even on one origin. Website prerendered routes, CMS redirects, and genuine
not-found behavior are retained.

Open `/sos/auth/login`, sign in using a seeded test account, then launch another
tool. Staff Website Manager entry is
`/sos/auth/login?mode=staff&target=wm&redirect=%2Fgo%2Fwebsite_manager`.

## Release

The owner confirmed the service names, public paths, private backend and caller
bindings above. Fetch GitHub `main` again before releasing. Use a reviewed commit based
on that latest main, link only the new project and configure its persistent
store. Build/validate the Services artifact before assigning its production URL.
All services deploy together, so this release is one deployment rather than
the earlier per-project matrix. The owning team's daily deployment limit still
applies; creating a new project does not reset it.

Official references: [Services](https://vercel.com/docs/services),
[routing](https://vercel.com/docs/services/routing),
[bindings](https://vercel.com/docs/services/bindings).
