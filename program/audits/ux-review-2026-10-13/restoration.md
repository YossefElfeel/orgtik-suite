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
- WM setup uses the supported `OnboardingChecklist.onSelect` callback. Console
  checklist links include the current locale. Their destinations were tested in
  English and Arabic.
- Files, HR, CRM and Marketing pass their localized administration base paths to
  `ToolAdminScreen`; actual Roles/Settings hops retain `/ar/admin/...`.
- Local checkout receives a generated, persistent signing key from an ignored
  worktree-local file. The existing hosted fail-closed guard remains. A complete
  local CHF16 mock order produced one paid invoice and activated Tasks in the
  same new workspace; no external payment occurred.
- Files' archived view exposes the existing `ArchivedFolders` panel. A private
  audit folder was created, renamed, archived and restored through the UI.

## Verification

| Check | Result |
| --- | --- |
| Frozen dependency install | Passed |
| Root typechecks and catalog parity | Passed |
| Full workspace mock integration suite | **330/330 passed**, serial run |
| Targeted deployment, runtime, session, WM and preview regressions | **58/58 passed** |
| Loopback origins and native local router tests | **13/13 passed** |
| Local order key and existing checkout regressions | **23/23 passed** |
| Local routing/origins plus key regressions after changes | **15/15 passed** |
| WM and website builds | Passed |
| DS v2 gates | **46 checks passed**; chart palette passed |
| Runtime source manifest | Passed |
| API contracts | **975 routes**, passed |
| Platform OpenAPI and split deployment configs | Passed |
| Secret scan before commit | Passed; repeated after staging evidence |

Root lint is **not green**: the initial baseline run found Files at 71 errors /
22 warnings and retired Content at 194 errors / 115 warnings; Chats lacks an
ESLint configuration and prompts interactively; SOS has no installed eslint
executable. That baseline preceded the small Files recovery/locale changes.
These are existing lint debt, not grounds to claim all root gates passed. The
actual CI workflow runs typechecks, catalogs, functional tests and the explicit
repository gates; it does not run root lint.

Phase A CI passed on `c81431a1` before Phase B began (run38416981574). The final
code fixes at `6c4e09a3` also passed CI, including Windows library visuals:
[run38432564782](https://github.com/YossefElfeel/orgtik-suite/actions/runs/38432564782),
checks6m5s and visuals13m29s. The report commit's current results are available
on [PR83 Checks](https://github.com/YossefElfeel/orgtik-suite/pull/83/checks).

Local screenshots include every restored WM, Console, Marketing UTM and SOS payment/invitations dashboard in English and Arabic. Chats' representative native routes and current audit coverage are indexed in `capture-index.json`. The UX report records exact walkthrough limits rather than treating historical screenshots as a new test.

The full Egyptian Arabic [UX report](README.md) covers four personas, all six
workspace tools and their administration, Account/billing, WM and Console,
AR/RTL, dark mode and an actual390x844 viewport. Its44 findings distinguish37
remaining items from7 verified fixes. Non-fatal ThemeScript/ResizeObserver dev
warnings and a transient handoff loading retry are documented; this is not a
claim that every console reading was empty or a production performance test.

No cloud deployment or real payment was made. Mock data is isolated in this worktree's `.vercel/dev/mock`. The audit launcher is stopped before handoff; the main checkout and its processes are left untouched.

## Merge hold

The requested plan explicitly says: “I won't merge it without the user's OK”. The PR is prepared for review and stays unmerged. Current Services production release is manual; merging this PR does not itself authorize a deployment.
