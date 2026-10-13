# Run the local prototype

Use Node 22.13 or newer and pnpm 11.3.0. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm dev:local
```

Open http://localhost:3000/sos/auth/login. Mona's synthetic account is `mona.adel@orgtik.test`, password `Local@2026`. Mona can open all nine apps and their administration screens. Customer tools are Tasks, Files, HR, CRM, Marketing and Chats; Console and Website Manager remain staff surfaces.

Development starts an app on its first request. Next must compile that app and route; a warm visit is a different measurement. For a smoother walkthrough, build once, stop development, then use the prebuilt preview:

```sh
pnpm build:local
pnpm preview:local
```

Preview uses Next production servers and Vite's static preview server. The mock stays local. It does not deploy, connect to Redis, deliver email, charge money or enable real integrations. Builds are serial to reduce desktop memory pressure. The launcher rebuilds if the source or public origin has changed. Do not run a development server and a preview build against the same `.next` directories.

The public app paths are `/sos`, `/tasks`, `/files`, `/hr`, `/sales`, `/marketing`, `/chats`, `/admin` and `/wm`. The website uses `/`. Apps start on demand in both modes; prebuilt pages avoid route compilation. Stop the launcher with Ctrl+C.

On PowerShell, an isolated worktree can use a separate origin:

```powershell
$env:ORGTIK_LOCAL_HOST='127.0.0.1'
$env:ORGTIK_LOCAL_PORT='3057'
pnpm preview:local
```

Use those same values when building. Browser cookies share a hostname across ports, so use a separate browser context for another dataset. The launcher checks its process marker and refuses to reuse a different mode or an unrelated occupied port.

Data is stored under the ignored `.vercel/dev/mock` directory. Local selected file bytes live in `local-assets`; application records retain scoped immutable references. Keep this directory and `.vercel/local-suite/orders.key` together when backing up the prototype. Do not reset them to fix startup. Preview and development in the same checkout share this dataset.

## Checks and measurements

```sh
pnpm lint
pnpm turbo run typecheck i18n:check test --concurrency=1
node mock/test-workspace.mjs
pnpm test:journeys
```

Shared lint covers active apps with one rule set. `tools/ci/lint-baseline.json` records existing findings from GitHub main `72a68708`; new findings fail. This is a gate against additional debt, not a claim that the legacy source is lint-clean. The retired Content frontend is outside this gate.

`test:journeys` runs Chromium against a prebuilt local launcher, using disposable test identities. It covers Mona's tool cards, handoff paths, a team form, Arabic mobile layout and a single-tool owner's Home link. Screenshots and timing results are ignored under `.vercel/journey-results`. Set `ORGTIK_JOURNEY_ORIGIN` to an already-running isolated local origin to reuse it. The CI workflow builds SOS and Tasks for these representative journeys and runs the same checks and retains their evidence.

Measure startup, HTTP documents and API latency separately from browser hydration:

```powershell
$env:ORGTIK_MEASURE_ORIGIN='http://127.0.0.1:3057'
pnpm measure:local
```

The report contains the first measured request, three warm requests, median warm time, launcher startup, service readiness and router memory. Results are saved under `.vercel/local-suite`. Router RSS excludes frontend child processes. A document request is not proof that an authenticated app has hydrated or its data has finished loading.

## Retired surfaces

Content, historical Sales billing screens and historical presentation data are not active suite applications. Replacement routing remains in the local router and app redirects. The Content mock's seed is still consumed by Website Manager, and several apps still import legacy identity types or logout hooks. Removing those modules without migrating their consumers would break the prototype. Their verified dependency inventory is recorded in the implementation ledger; hosted project deletion requires its own explicit release action under D-055.

The future production requirements are in [production-saas-roadmap.md](production-saas-roadmap.md). They are separate from this local prototype.
