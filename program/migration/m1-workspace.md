# M1: one pnpm workspace, the library as a package, CI (2026-10-07)

Plan v2, Phases 0.3 and 0.4; decision D-054. Branch `build/pnpm-workspace`.

## What changed

- **Layout:** the nested `orgtik-ui` workspace is flattened: `packages/ui` (the library), `apps/docs` (Storybook), `tests/next-smoke-15|16`. The release tarballs are gone; their notes stay in `packages/ui/releases/`.
- **One workspace:** root `package.json` (pnpm 11.3.0, Turborepo 2.11.7), `pnpm-workspace.yaml`, `turbo.json`, one `pnpm-lock.yaml`. Removed: every app's `package-lock.json`/`pnpm-lock.yaml`, `.npmrc` (one at the root) and `.yalc/` copy of the library.
- **The library:** every app depends on `@orgtik/ui` `workspace:*`, as an **injected** copy (`injectWorkspacePackages`), re-synced after its build (`syncInjectedDepsAfterScripts: [build]`). That keeps today's behaviour: the apps run React 19.1 to 19.2.4, and each copy resolves the app's own React, Next and types. `@types/react` and `@types/react-dom` became optional peers of the library for the same reason.
- **Same versions as before:** each package's direct dependencies are pinned to the version its old lockfile installed (`origin/main` before this branch). Without that, pnpm resolved newer versions in range and Content and Sales stopped type-checking. Two dependencies the apps imported without declaring are now declared at their old versions: Sales `zod` 3.25.76 and Content `@tiptap/core` 3.31.3.
- **One copy where types must match** (`overrides`): `@types/react` and `@types/react-dom` 19.3.0, `@internationalized/date` 3.12.4. `packageExtensions` gives `@hookform/resolvers` an optional `zod` peer, so each app's resolver sees that app's Zod.
- **`@swc/core` 1.15.21** for everyone (override). Next-intl's plugin compiles with it; 1.16's native-binary cache is refused by this PC's sandbox permissions, and every app's old install used 1.15.x (HR 1.16.2).
- **Build-script policy** (`allowBuilds`): all native packages here ship prebuilt binaries as optional dependencies, so their install scripts stay off (`@parcel/watcher`, `@swc/core`, `unrs-resolver`, `sharp`, `esbuild`, `@tailwindcss/oxide`; `msw` only copies a committed worker file).
- **Scripts:** every app has `typecheck` (`tools/next-env.cjs` writes Next's standard `next-env.d.ts` when missing, then `tsc --noEmit`) and `i18n:check` (`tools/i18n/check-catalogs.mjs`); the mock and the website have `test`.
- **Local dev:** `mock/config.js` points at the monorepo folders. `mock/patch.js` and `tools/vercel-prebuild.cjs` replace files instead of writing through pnpm's hard links, so the shared store is never changed. `tools/dev/old-layout-links.mjs` gives the program tools their old folder names as git-ignored links.
- **Vercel:** `tools/vercel/configure.mjs` writes each project's `vercel.json`: install with pnpm 11, build with pnpm (library first), and skip the build when `turbo query affected` finds nothing changed for that project (`turbo-ignore` is deprecated). The website's `vercel.json` is written by its content pull, which now takes the same commands.
- **CI** (`.github/workflows/ci.yml`): typecheck, catalogs and tests for affected packages, the OpenAPI check, the Vercel settings check, the library's visual gate when it changed, and a secret scan (`tools/ci/secret-scan.mjs`). `preview-checks.yml` runs the audit kit against each Vercel preview; it stays off until the repository variable `PREVIEW_CHECKS` is `on` (needs the preview mock).
- **Turbo:** `agentGuidance: false` (no generated AGENTS.md). Library token build writes `src/tokens.ts` only when it changes (on Windows Turbo keeps task inputs mapped while the task runs).

## Proof (local, 2026-10-07)

| Check | Result |
|---|---|
| `pnpm install --frozen-lockfile` | ok |
| `turbo run typecheck` (11 packages) | 11/11 |
| `turbo run build` (12 projects: library, 10 apps, website) | 12/12, 225 s |
| `i18n:check` (9 apps) | 9/9 after removing one unused Files key (`Restore.confirmMessage`, the German text expected an `{item}` nothing passed) |
| Mock tests (`journal`, `pricing`, WM follow-up) | green |
| `openapi.mjs --check` | up to date |
| Secret scan | 7,140 files, nothing found |
| VS-1 on `/` (local dev servers on the workspace install, report label `mono-<app>-root`) | SOS 20/20 · ADM 20/20 · Tasks 18/20 · HR 18/20 · WM 16/20 |

Every render that isn't clean is "English left in an Arabic page", from two known causes, neither from this change: the suite rail's "OrgTik Admin" label (Tasks, HR, WM at 1440; it arrived with ADM after those apps' baselines) and, in WM's overview, the website's article titles and services, which stay English by decision (website content isn't translated). No console errors, uncaught errors, broken images or overflow anywhere. Both go on the review list.

## Known limits

- Content has no Arabic catalog; it is excluded from `i18n:check` (being retired, D-055).
- Lint is not in CI yet: the apps' lint baselines differ; added per app during the review fixes.
- Files could not be run locally during this check (its port was taken by another project).
