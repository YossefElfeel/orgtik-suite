# OrgTik Services on separate Hobby projects

The owner confirmed this split after Vercel rejected the combined deployment's
serverless function count. Each project must stay within **12 functions**. The
release checks the compiled artifact before uploading. Next.js route artifacts
marked for deferred bundling are grouped by Vercel during deployment; neither
service count nor route count establishes the final function count.

| Vercel project | Config | Public service/path | Private service/binding |
| --- | --- | --- | --- |
| orgtik-suite-services | vercel.json | website at /; router for every app prefix | none |
| orgtik-suite-services-admin | vercel.admin.json | admin at /admin | admin → mock, ORGTIK_MOCK_URL |
| orgtik-suite-services-chats | vercel.chats.json | chats at /chats | chats → mock, ORGTIK_MOCK_URL |
| orgtik-suite-services-files | vercel.files.json | files at /files | files → mock, ORGTIK_MOCK_URL |
| orgtik-suite-services-hr | vercel.hr.json | hr at /hr | hr → mock, ORGTIK_MOCK_URL |
| orgtik-suite-services-marketing | vercel.marketing.json | marketing at /marketing | marketing → mock, ORGTIK_MOCK_URL |
| orgtik-suite-services-sales | vercel.sales.json | sales at /sales | sales → mock, ORGTIK_MOCK_URL |
| orgtik-suite-services-sos | vercel.sos.json | sos at /sos | sos → mock, ORGTIK_MOCK_URL |
| orgtik-suite-services-tasks | vercel.tasks.json | tasks at /tasks | tasks → mock, ORGTIK_MOCK_URL |
| orgtik-suite-services-wm | vercel.wm.json | wm at /wm | wm → mock, ORGTIK_MOCK_URL |

Vercel service bindings target services within the same project. Each frontend
therefore has its own internal instance of the existing mock application. No
public rewrite targets `mock`. All instances use the same confirmed Redis store
and datasets: `services-production` for Production and `services-preview` for
Preview. Persistent state and signing authority are shared through Redis.

The public website/router forwards app prefixes to their frontend project
domains. Browser URLs, API paths and session handoffs retain the shared origin
`https://orgtik-suite-services.vercel.app`. The static website calls the public
SOS gateway; each frontend gateway calls its bound private mock. Binding URLs
are never used in builds, middleware or client bundles. Do not set
`ORGTIK_MOCK_URL` manually.

`packages/ui` remains a library. Storybook and the retired Content frontend are
omitted from the deployment.

## Configuration and local development

Run the whole suite locally with `pnpm dev:local`, or double-click
`start-local.cmd`. Open `http://localhost:3000/sos/auth/login`; Mona's local test
account is `mona.adel@orgtik.test`, password `Local@2026`. Ctrl+C stops a run
started in the terminal. Local data persists under `.vercel/dev/mock`.

The launcher uses an isolated configuration directory beside the repository
because CLI 63's development service discovery chooses the Git-root config even
when `--local-config` points at the local template. Source and dependencies are
linked into that directory; production deployment configs stay in the repo.

`vercel.dev.json` is the reviewed all-services template for local development.
`tools/services/projects.mjs` generates the ten deployment configs at the repo
root, so service roots resolve relative to the repository. Regenerate after
changing the template, and check that the generated files are current:

```sh
pnpm install --frozen-lockfile
pnpm dev:local
```

Use Node.js 22.13 or newer and the repository's pnpm 11.3.0. No Vercel account
or Redis connection is required for this local command. The pinned CLI may be
downloaded by `npx` on first use; it runs only the development server locally.

After changing the service template, regenerate the deployment profiles with
`node tools/services/projects.mjs` and check them with
`node tools/services/projects.mjs --check`.

Local Services use the isolated `services-local` file dataset under
`.vercel/dev/mock`, never production Redis. Node middleware is required because
Services does not support Edge function output. App prefixes also apply to
assets and native browser navigation. Tab sessions use separate keys per app.

## Production release

Cloud releases are manual. Publishing local changes does not start a Vercel
deployment. Run the Services workflow on `main` explicitly for a cloud release.

The main-only workflow validates the reviewed source, then builds and deploys
the nine frontend/private-backend projects with a maximum of two parallel jobs.
Each artifact preserves original backend assets and dependencies, rejects Edge
output, and stops if it contains more than twelve dedicated functions. It lists
Next.js routes awaiting provider bundling separately; Vercel must accept their
final bundled function count before any promotion. Each frontend is
staged, its entry route and bound CMS gateway checked, and then promoted.

The website/router deploys after all frontend jobs succeed. Its staged routing
is checked before promotion; public staff sign-in and Website Manager handoff
are checked afterward. It retains the website's prerendered routes and genuine
404 responses. This workflow releases Production; the separate Preview dataset
is configured for future Preview releases.

Provisioning creates only the confirmed project names. It attaches the existing
Redis integration directly, preserving managed Secrets and the original
connection's variable prefix. Credential values are never exported. The shared
public origin is set in each project's `SUITE_SERVICES_PUBLIC_URL`. Earlier
per-app URL settings are not copied. Existing standalone projects remain
available; automatic legacy deployment matrices are skipped.

The team-wide daily deployment limit still applies to these separate projects.
Creating a project does not reset that limit.

Official references: [Services](https://vercel.com/docs/services),
[routing](https://vercel.com/docs/services/routing),
[bindings](https://vercel.com/docs/services/bindings).
