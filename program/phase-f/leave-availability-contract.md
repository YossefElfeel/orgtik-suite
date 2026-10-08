# J7 leave and calendar contract

Working package based on merged PR15. Reuse the current workspace authority, private HR runtime and atomic journal; do not borrow an HR token from another app or introduce a second store.

| HR route | Current authorization | Command |
|---|---|---|
| `POST /api/attendance/time-offs/requests` | HR employee requests self; manager may request its actual reporting team; HR/super-admin may request current workspace employees | JSON body, mandatory original `Idempotency-Key` |
| `PATCH /api/attendance/time-offs/requests/:id/decision` | Verified local HR role or actual reporting manager; stage derived on the server | `{status,decisionNote?}`, mandatory original key |
| `PATCH /api/attendance/time-offs/requests/:id/cancel` | Request employee or current HR; fresh cancellation requires pending status | Empty JSON body, mandatory original key |
| `GET /api/attendance/time-offs/requests/:id` | Existing HR employee/team visibility | Current detail and capabilities |

Creation accepts `employeeId` (legacy `employeeUserId` alias), `timeOffType`, `durationType`, civil `startDate/endDate`, `halfDayPeriod`, `partialStartTime/partialEndTime` and `employeeNote`. Conflicting aliases, invalid/unknown fields, non-existent local times and overlapping pending/approved requests fail before commit. Canonical duration is `full_day`, `half_day` or `partial`; input aliases `custom_hours` and `partial_day` normalize to `partial`. A creation range is at most366 civil days. Arbitrary binary attachment upload remains deferred; existing packaged attachment display is preserved.

All workspace mutation responses use scalar overall `status` and the existing `V.timeOffDetail` fields, including manager/HR statuses, notes, actors and timestamps. Added `capabilities` contains `canDecide`, `decisionStage` (`hr`, `manager` or null), `canCancel`, `readOnly` and `managerRequired`. Missing manager approval is displayed as not required. Preserve the existing reducer: either rejection rejects; HR approval approves; otherwise pending. Resetting HR approval withdraws final availability; resetting only the manager stage does not override a recorded HR approval.

Current session, tool write state and record/team authority are checked before an operation receipt. The same actor/workspace/kind/key/body returns its original result; altered bodies conflict. Failed persistence returns failure and restores all candidate HR records, notices and receipt effects. A response lost after successful commit recovers the original result without creating another request or notification. A new action still validates its current status and permissions.

Tasks and Chats each expose `GET /api/calendar/availability?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD` using that app's own signed tool token and selected workspace. Both dates are required and inclusive; the range is at most93 civil days. Read-only tool lines may read it. Guests receive no coworker records; unassigned tools fail.

The successful envelope's `data` contains `workspaceId`, `timeZone`, `fromDate`, `toDate` and `items`. Each item contains only opaque `id`, `personId`, `personName`, inclusive `startDate/endDate`, half-open ISO `startAt/endAt`, canonical `durationType` and nullable `halfDayPeriod`. Full days use workspace midnight through midnight after the last date. Half days use the workspace work schedule's midpoint; partial times resolve in that timezone. DST gaps fail, overlaps use the earliest instant, and civil days may last23 or25 hours.

Projection reads committed HR stage records, not the obsolete `workspace.approvedLeave` cache. It intersects final approval with active employment, canonical account, membership and consuming-tool assignment. It publishes no medical category, employee/decision note, attachment, private HR profile or HR request route. Revocation/reset removes entries on the next authorized fetch. Calendar events are read-only; existing task and meeting navigation remains separate.

The generated [route inventory](api-contracts.json) includes this route's own-tool authorization. Hosted J7 acceptance, trusted due-transition execution and R2–R4 remain open until their evidence is recorded.
