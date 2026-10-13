# Restoration verification — 13 October 2026

Base: `6432ef262fafbb235141d670af9724c3d0138c17` (`origin/main`, PR #82). Branch: `restore/v3-dashboards`.

The inverse of PR #64's merge (`dadd2bcc`, first parent) restores PR #52 and #57. PR #63's retired preview tooling remains reverted. Historical audit records restored by that inverse are retained as history; only `shots/` in this directory is evidence of the present review.

## Conflict resolutions

- WM mock state codec retains the current role overrides and restores studio state. Validation precedes import mutation. The restored studio router already exposes the atomic `savePageDraft` endpoint, so no duplicate handler was added.
- All five WM message catalogs contain the same 1,736 flattened keys. Current wording wins on collisions; restored keys are included.
- WM media keeps compact filters and current icons while restoring packaged-media import and tagging. The obsolete upload action referencing removed dialog state was removed.
- WM's obsolete local `useSuiteApps` hook was deleted because the restored frame uses the shared suite hook. Admin's hook remains because its scope constant is still imported.

## Integration changes beyond the inverse

- Console and WM launch other tools through their own authenticated `/go` bridge, preserving the staff actor and workspace. The active staff application uses its current URL.
- SOS delays workspace-dependent account navigation until mounting, avoiding a hydration mismatch, and refreshes workspace context for staff who are also workspace members (including Mona).
- The local launcher accepts a validated loopback host and port, so this review can run at `127.0.0.1:3400` with separate cookies and mock files. Defaults remain `localhost:3000`. Local Next development origins are limited to the two loopback names.
- Mock test files run serially: each launches private HTTP workers, and Windows resource contention caused transient connection failures during concurrent builds. Individual failures passed when rerun; the serial full run passed without failures.
- Chats' `CHATS_API_URL` hosted fallback, Mona's super-admin permissions, manual deployment workflows and PR #82's local navigation fixes survive the restoration.

## Verification

| Check | Result |
| --- | --- |
| Frozen dependency install | Passed |
| Root typechecks and catalog parity | Passed |
| Full workspace mock integration suite | **330/330 passed**, serial run |
| Targeted deployment, runtime, session, WM and preview regressions | **58/58 passed** |
| Loopback origins and native local router tests | **13/13 passed** |
| WM and website builds | Passed |
| DS v2 gates | **46 checks passed**; chart palette passed |
| Runtime source manifest | Passed |
| API contracts | **975 routes**, passed |
| Platform OpenAPI and split deployment configs | Passed |
| Secret scan before commit | Passed; repeated after staging evidence |

Root lint is **not green**: Files has 71 errors / 22 warnings; retired Content has 194 errors / 115 warnings; Chats lacks an ESLint configuration and prompts interactively; SOS has no installed eslint executable. Files and Content sources are unchanged by this restoration. These are existing lint debt, not grounds to claim all root gates passed. The actual CI workflow runs typechecks, catalogs, functional tests and the explicit repository gates; it does not run root lint.

Local screenshots include every restored WM, Console, Marketing UTM and SOS payment/invitations dashboard in English and Arabic. Chats' representative native routes and current audit coverage are indexed in `capture-index.json`. The UX report records exact walkthrough limits rather than treating historical screenshots as a new test.

No cloud deployment or real payment was made. Mock data is isolated in this worktree's `.vercel/dev/mock`. The audit launcher is stopped before handoff; the main checkout and its processes are left untouched.

## Merge hold

The requested plan explicitly says: “I won't merge it without the user's OK”. The PR is prepared for review and stays unmerged. Current Services production release is manual; merging this PR does not itself authorize a deployment.
