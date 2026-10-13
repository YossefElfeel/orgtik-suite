# OrgTik Services on separate Hobby projects

The owner confirmed this split after Vercel rejected the combined deployment's
serverless function count. Each project must stay within **12 functions**. The
release checks the compiled artifact before uploading; service count alone does
not establish the function count.

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

`vercel.dev.json` is the reviewed all-services template for local development.
`tools/services/projects.mjs` generates the ten deployment configs at the repo
root, so service roots resolve relative to the repository. Regenerate after
changing the template, and check that the generated files are current:

```sh
node tools/services/projects.mjs
node tools/services/projects.mjs --check
pnpm install --frozen-lockfile
npx --yes vercel@63.1.2 --local-config vercel.dev.json dev -L --listen 3000
```

Local Services use the isolated `services-local` file dataset under
`.vercel/dev/mock`, never production Redis. Node middleware is required because
Services does not support Edge function output. App prefixes also apply to
assets and native browser navigation. Tab sessions use separate keys per app.

## Production release

The main-only workflow validates the reviewed source, then builds and deploys
the nine frontend/private-backend projects with a maximum of two parallel jobs.
Each artifact preserves original backend assets and dependencies, rejects Edge
output, and stops if it contains more than twelve functions. Each frontend is
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
