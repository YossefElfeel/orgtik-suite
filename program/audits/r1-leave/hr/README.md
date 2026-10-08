# Local HR leave acceptance

[Final report](report.json): **64/64 bounded checks**,10 captures and all ten starting source hashes matching after the final run. This is local flow/recovery/layout evidence, not64 separate journeys or hosted acceptance. The prior run was repeated after the final load-error and role-change guards, using a fresh employee so an already approved date did not create a duplicate.

The actual UI/API run covers JSON creation, current manager approval remaining pending, final HR approval, cancellation with history retained, and all three mutation responses lost after real server commit. Reload recovers the same original key/body/workspace without duplicate requests or decisions. A simulated401/account change during refresh verifies the old body is not resent under the new actor, the new actor is not logged out and the original uncertain attempt remains available. Date/detail fetch-error responses are simulated and identified in the assertions.

EN/AR1440/390px and light/dark checks cover localized request fields, workspace timezone, viewport containment and keyboard/close labels. The inherited Arabic dialog centering was repaired within the touched app dialogs, and close controls use translated copy. Historical attachment display remains available; new binary upload is explicitly deferred in the request form.

The business clock remains `2026-10-07T09:00:00.000Z`; no shared data reset, clock advancement or deployment was used. Private fixture credentials and failure/probe screenshots are excluded from this evidence.

`acceptance.cjs` is the exact local runner. It requires disposable fixture credentials in `.qa/j7-hr/.env.shared-fixture.local` created through the current invitation/hiring APIs; that private file is intentionally excluded. It only targets localhost, creates or uses a dedicated test employee, and needs sufficient purchased/trial HR capacity. Never supply production or shared hosted credentials. Preserve this report before rerunning with a new fixture.
