# Local use

Use [program/local-prototype.md](../../program/local-prototype.md) for development, prebuilt preview, data persistence and performance checks. The configuration below is retained for optional hosted releases.

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
public rewrite targets `mock`. All instances use the same persistence provider
and datasets: `services-production` for Production and `services-preview` for
Preview. Supabase is selected explicitly; legacy deployments continue using the
confirmed Redis store until that switch is configured. Persistent state and
signing authority must be shared across all nine backend instances.

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

The launcher generates a random local checkout signing key at
`.vercel/local-suite/orders.key` and reuses it across restarts. It is ignored by
Git and never needs a hosted credential. Keep it with the local mock dataset;
a corrupt key stops checkout startup rather than silently replacing the signing
authority and invalidating existing order claims. Hosted signing requirements
remain unchanged.

For an isolated parallel preview, set `ORGTIK_LOCAL_PORT` to another free port.
`ORGTIK_LOCAL_HOST=127.0.0.1` also isolates browser cookies from a preview using
`localhost`. Each worktree keeps its own local dataset and process marker.

This is an interactive prototype: the mock simulates application data and
actions locally. Mona has platform and Website Manager super-admin roles, plus
admin access to all six workspace tools. Her launcher exposes all nine apps
even when she signs in directly to a staff app. Opening a workspace tool selects
the OrgTik workspace before exchanging its app session.
Startup also points the older frontends' installed launcher dependency at
localhost, keeping app links and logout inside the local prototype.

The launcher runs a small local router and one file-backed mock process. It
builds the shared UI once, then starts each frontend when first opened, using
Turbopack for Next.js. API requests go straight to the mock rather than through
a frontend compilation and Vercel's development proxy. All public app prefixes
and the existing local dataset stay the same. The first visit to a new page
still compiles that page; subsequent visits reuse the development cache.

`vercel.dev.json` is the reviewed all-services template for Vercel Services.
`tools/services/projects.mjs` generates the ten deployment configs at the repo
root, so service roots resolve relative to the repository. Regenerate after
changing the template, and check that the generated files are current:

```sh
pnpm install --frozen-lockfile
pnpm dev:local
```

Use Node.js 22.13 or newer and the repository's pnpm 11.3.0. No Vercel account
or Redis connection is required for this local command. It uses the installed
workspace dependencies and does not download or start the Vercel CLI.

After changing the service template, regenerate the deployment profiles with
`node tools/services/projects.mjs` and check them with
`node tools/services/projects.mjs --check`.

Local Services use the isolated `services-local` file dataset under
`.vercel/dev/mock`. The launcher removes inherited Supabase, Redis and hosted
configuration before loading the mock, so local work cannot write to a cloud
dataset. Node middleware is required because
Services does not support Edge function output. App prefixes also apply to
assets and native browser navigation. Tab sessions use separate keys per app.

## Production release

Cloud releases are manual. Publishing local changes does not start a Vercel
deployment. Run the Services workflow on `main` explicitly for a cloud release.
Choose `target=website` only when unchanged frontends already passed their release.
This mode verifies every public frontend upstream and releases the website/router
without rebuilding nine apps. Full releases remain the default.
`target=sos` updates only the launcher and then verifies/publishes the shared site,
when the other eight frontend/mock deployments already match application source.
`target=tasks` provides the same focused release for Tasks.

The main-only workflow validates the reviewed source, then builds and deploys
the nine frontend/private-backend projects in parallel on independent runners.
Each artifact preserves original backend assets and dependencies, rejects Edge
output, and stops if it contains more than twelve dedicated functions. It lists
Next.js routes awaiting provider bundling separately; Vercel must accept their
final bundled function count before any promotion. Each frontend is
staged, its entry route and bound CMS gateway checked, and then promoted.

The website/router deploys after all frontend jobs succeed. The protected staged
website and ordinary public upstreams are checked separately, so a protection
bypass for one project never propagates to another. Complete shared-domain routes,
public staff sign-in and Website Manager handoff
are checked afterward. It retains the website's prerendered routes and genuine
404 responses. This workflow releases Production; the separate Preview dataset
is configured for future Preview releases.

Provisioning creates only the confirmed project names. With Supabase selected,
the configure step receives credentials from GitHub Actions `production`
environment secrets
and validates the complete persistence configuration. It writes the backend key
and signing secret as **sensitive** Vercel environment variables on each
frontend/private-backend project, so subsequent API/CLI exports cannot read
them back. The provider name and project URL are ordinary configuration. Values
stay in memory; logs, workflow summaries and generated project files contain no
credentials. The public website/router project and other workflow steps never
receive the Supabase environment secrets. No source-project secret export is used.

Without Supabase selected, provisioning attaches the existing Redis integration
directly, preserving managed Secrets and the original connection's variable
prefix. The shared mock journal can also be reconnected by its confirmed
resource identity if the old Redis source project was deleted. Provisioning
does not create, reset, delete or upgrade any database or storage plan.
The shared public origin is set in each project's `SUITE_SERVICES_PUBLIC_URL`. Earlier
per-app URL settings are not copied. Existing standalone projects remain
available; automatic legacy deployment matrices are skipped.

The team-wide daily deployment limit still applies to these separate projects.
Creating a project does not reset that limit.

## Supabase configuration and migration

Use a dedicated Supabase project on the Free plan. Do not reuse an unrelated
project. In the GitHub deployment environment named `production`, set variable
`MOCK_PERSISTENCE=supabase` and secrets `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and
`MOCK_SESSION_SECRET`. The workflow
passes them only to the frontend configure step, which sets the corresponding
server variables below. None may have a `NEXT_PUBLIC_` or `VITE_` prefix:

| Variable | Required value |
| --- | --- |
| `MOCK_PERSISTENCE` | `supabase` |
| `SUPABASE_URL` | The dedicated project's HTTPS `https://<project-ref>.supabase.co` origin |
| `SUPABASE_SECRET_KEY` | A backend secret key (`sb_secret_...`), preferred |
| `MOCK_SESSION_SECRET` | Shared signing authority, at least 32 UTF-8 bytes; preserve it when importing sessions |

`SUPABASE_SERVICE_ROLE_KEY` remains a compatibility input for a legacy
`service_role` JWT belonging to the same project. Provisioning normalizes either
input into `SUPABASE_SECRET_KEY`; a preferred secret key takes precedence over
retained legacy credentials. An `anon` or publishable key cannot serve the
backend. Missing, redacted or malformed Supabase configuration stops the
release when the provider is selected; provisioning does not silently reconnect
Redis in its place. An unset provider environment variable retains Redis even if
Supabase secrets are already prepared for a later migration. Keep Vercel's
sensitive protection enabled; credentials do not need to be readable by the CLI.

Before enabling the deployment environment's Supabase selection:

1. Install and verify the reviewed database migration and private media storage.
   Confirm public/anonymous callers cannot read persistence records or uploaded
   objects. Run the adapter's concurrency and rollback checks against an
   isolated test realm.
2. Stop hosted writes for the migration window. Export and back up the existing
   journal, operation receipts, identity accounts, session state, presentation
   settings and uploaded media. Preserve the signing secret so migrated sessions
   keep their authority. Verify exported and imported record counts and media
   hashes before switching traffic.
3. If Upstash denies reads because of its current plan limit, retain the existing
   database and leave the production switch pending until a usable export or
   backup is available. With explicit owner authorization, start with the current
   mock fixtures instead: use a fresh realm and new signing authority, bootstrap
   it once before parallel deployment, and retain the old provider untouched.
   This option does not carry over hosted edits, accounts or sessions.
4. Store the three deployment environment secrets securely and set its provider
   variable only after the import or authorized fresh dataset is verified.
   Run a **full** Services release so all nine
   backend instances move together. The current workflow promotes frontend
   projects individually; keep writes paused until every frontend and the shared
   website have passed their health checks.
5. Verify sign-in, account changes, a Website Manager content edit and uploaded
   media after promotion, then reopen writes. Keep the source export and old
   Redis integration for rollback.

Production and Preview use separate realms in the same project. Preview is not
a backup. Rolling back requires verified, current data on the old provider:
setting the deployment environment variable `MOCK_PERSISTENCE=redis` and releasing all
backends does not copy newer Supabase writes back into Redis. Do not roll back
while writes are active.

The [Supabase Free plan](https://supabase.com/pricing) has finite database,
storage and transfer quotas and can pause inactive projects. It cannot guarantee
unlimited free operation. Check usage before importing and during operation;
retain an external export because Free does not include automatic backups. No
paid upgrade or automatic billing change is part of provisioning.

Official references: [Services](https://vercel.com/docs/services),
[routing](https://vercel.com/docs/services/routing),
[bindings](https://vercel.com/docs/services/bindings).
