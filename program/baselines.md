# Git baselines (2026-09-29)

The seven tools arrived as zip exports with no git history.

**How each one was baselined:**
- `main` holds exactly one commit: the pristine zip tree, with the zip's SHA-256 in the commit message.
- That commit is tagged `upstream/zip-2026-09-29`.
- The `local-dev` branch holds the small changes needed to run against `../local-dev/`.

**Repo settings:**
- Every repo has `core.autocrlf=false`, so files are stored byte for byte as they came in the zip.
- `core.longpaths=true` is set because some paths pass Windows' 260-character limit.

| Repo | Files in zip | Zip SHA-256 (prefix) | `main` (pristine) | `local-dev` | local-dev commits |
|---|---|---|---|---|---|
| somion-sos-frontend-main | 225 | `3150f2b71c9ec18e` | `4e9b49d` | `a665f54` | URL overrides (default avatar, next/image localhost) |
| task-manager-front-main | 302 | `c2eee42bef01b161` | `9e3e497` | `e43afaf` | URL overrides (dev login URL, next/image localhost) |
| file-manager-dashboard-main | 218 | `e9b3fa032da6bf5a` | `4dc0b9a` | `54fa3d2` | Agent notes written by `next dev` |
| sales-dashboardv2-main | 666 | `e0f7e466032bdede` | `2d3f2d6` | `6c3d0fd` | URL overrides (redirect URL) + `next dev` agent notes |
| somion-hr-dashboard-main | 374 | `07d1bbf91e8ed484` | `a3221aa` | `7dbc00f` | URL overrides (SOS API, task-manager link, dev login, next/image) |
| digital-marketing-frontend-main | 434 | `79d0d48e0b3a910d` | `b014985` | `b014985` | none |
| content-dashboard-somion-main | 219 | `c3c7bccefe6ed2c7` | `f8573fa` | `fd1ff83` | URL overrides (blog links, local Monaco, next/image) + `next dev` agent notes |

Every URL override keeps the original URL as its fallback, so without `.env.local` each app behaves exactly as upstream. The `.env.local` files are git-ignored (`.env*`) and stay local.

## Repos that already had git

| Repo | Remote | State |
|---|---|---|
| somion-hq (Chats) | github.com/YossefElfeel/somion-hq | `main` is untouched at `1941d0e`. New local branch `local-dev/suite-integration` (`459b478`) holds two commits: "Open HQ from the suite launcher" and "Meet now and a shareable meeting link". Nothing is pushed. |
| orgtik-website | github.com/YossefElfeel/orgtik-website | Clean at `30db536`. This commit is the reference for the pixel-parity baseline (`pre-cms`). |

## Aligning with the team's real repos later

Once we get access (PM packet 01, Q-002):
1. Add each GitLab remote.
2. Find the upstream commit whose tree equals our `upstream/zip-2026-09-29` commit.
3. Rebase or graft our branches onto it.

Mechanical changes (codemods) and behaviour changes go in separate commits, so upstream can re-run the codemods on newer code instead of merging ours.
