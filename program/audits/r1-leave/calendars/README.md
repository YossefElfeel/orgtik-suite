# Local approved-availability calendar acceptance

[Final report](calendar-report.json): **36/36 bounded assertions**, 14 captures, eight frontend source hashes matching the run. This is local J7 evidence, not36 separate journeys or hosted release acceptance. [Two final mobile polling assertions](calendar-mobile-polling-report.json) were rerun with visible accessible agenda selectors after an initial test mistakenly selected hidden desktop elements; the final report records this correction.

The run uses unique fixtures in `r1-leave-local`: one calendar employee, three approved leave requests and one task/project. It verifies EN/AR1440/390px, light/dark, own-tool authentication, workspace timezone with a different browser timezone, minimal private-data projection, read-only availability selection and existing task navigation. Actual HR approval/reset/reapproval/rejection changes disappear or return through polling. Temporary503 responses are explicitly simulated to verify error/retry behavior; recovery returns the real scoped API result.

One UI repair moves focus and scroll to the selected read-only Tasks detail; closing returns focus to the selected event. Background polling does not steal focus. Existing task and meeting navigation remains usable. HR categories, employee/decision notes, attachments and request routes are absent from availability detail. A legitimate HR launcher entry is not a privacy failure.

The business clock remains frozen at `2026-10-07T09:00:00.000Z`. No data reset, shared-clock advancement or deployment was used. The initial failure screenshot and raw bootstrap/private fixture files are excluded from this reviewed evidence. HR request/decision acceptance is recorded separately.
