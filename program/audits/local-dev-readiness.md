# local-dev readiness (P0, session 2)

**Date:** 2026-09-30 · **Backend:** `local-dev` at `70cc37a` · **Check:** `node smoke.js` (exit 0)

## Result: ready for audits

- **All 7 mock APIs answer:** SOS 4000, Tasks 4001, Files 4002, Sales 4003, HR 4004, Marketing 4005, Content 4006.
- **All 9 web apps answer.** The seven dashboards and Chats redirect to their locale or login page (307). The website serves 200.
- **All 16 test people sign in** and load their profile and launcher.
- **Every app a person's launcher shows answers its screen endpoint with 2xx.**
- A browser check after the switch-over was clean. SOS and the Tasks dashboard load signed in with live data, and the new request log shows their calls.

| Person | Role | SOS | Tasks | Files | Sales | HR | Marketing | Content | Chats |
|---|---|---|---|---|---|---|---|---|---|
| Mona Adel | super admin | ok | ok | ok | ok | ok | ok | ok | web |
| Karim Hassan | manager | ok | ok | ok | ok | ok | ok | — | web |
| Salma Nabil | developer | ok | ok | ok | — | ok | — | — | web |
| Omar Farouk | salesman | ok | ok | ok | ok | ok | — | — | web |
| Nour Khaled | customer (Nile Foods) | ok | ok | ok | ok | — | ok | — | — |
| Hany Samir | finance | ok | — | ok | — | ok | — | — | web |
| Youssef Ibrahim | backend dev | ok | ok | ok | — | ok | — | — | web |
| Laila Mostafa | designer | ok | ok | ok | — | ok | — | — | web |
| Ahmed Tarek | QA | ok | ok | ok | — | ok | — | — | web |
| Rana Saad | HR specialist | ok | — | ok | — | ok | — | — | web |
| Mahmoud Gamal | DevOps | ok | ok | ok | — | ok | — | — | web |
| Dina Fathy | marketing | ok | ok | ok | — | ok | ok | ok | web |
| Tamer Wagdy | account manager | ok | ok | ok | ok | ok | — | — | web |
| Hoda Ashraf | content writer | ok | ok | ok | — | ok | ok | ok | web |
| Sherif Magdy | project manager | ok | ok | ok | ok | ok | — | — | web |
| Aya Hamed | accountant | ok | — | ok | — | ok | — | — | web |

**Key:** ok = in the launcher, and the screen endpoint answered 2xx · — = not in the launcher · web = Chats has no API (its data is built in).

## New test controls

These are documented in `local-dev/README.md`, under "Test controls".

| Control | Why the audits need it |
|---|---|
| `POST /__mock/reset` | Every flow walk starts from the same data. Sign-ins survive it, and chat sockets reconnect by themselves (tested). |
| `MOCK_NOW` + `MOCK_CLOCK=frozen`, `/__mock/clock`, `/__mock/clock/advance` | Screenshots are stable run to run (tested: seed dates are identical across rebuilds). Moving the clock on shows "overdue" and "expiring" states. |
| `/__mock/requests` + `logs/requests.jsonl` | Each flow step records which endpoints it hit, as whom, and with what status. |
| `/__mock/faults` | Forces the loading (delay), error (5xx) and no-permission (403) state on any screen, without touching the app (tested: count-limited rules, delay, regex match). |
| `/__mock/strict` | Makes the APIs refuse people without access, as a real backend would (tested: all 38 no-access probes returned 403). |

## Findings to carry into the audits

| # | Finding | Goes to |
|---|---|---|
| R-1 | **Most mock APIs don't check access.** Tasks, Sales, HR and Marketing answered people whose launcher doesn't include them (3, 10, 1 and 11 calls). Only Content refused them (13 of 13). So today the web apps' own guards are the only protection. The audits use strict mode to check that each app shows a proper no-permission state rather than a broken page. | Every app's audit (MS / PERM) |
| R-2 | **Every person has File Manager access,** including the customer Nour. Confirm this matches the product intent, or grant Files per role. | Gap analysis, PM |
| R-3 | **The customer (Nour) has Tasks, Files, Sales and Marketing in the launcher.** Presumably these are the client-facing portals. Confirm that each app shows her only its customer view. | Sales, Marketing, Tasks audits |
| R-4 | **Tasks logs a hydration mismatch** in the sidebar (`SidebarItemRenderer` / `LinkComponent`) on every load. It's app code and was already known. | Tasks audit (pre-seeded) |
| R-5 | **The web apps read the browser clock, the mocks the mock clock.** Screenshot runs freeze both to the same instant (the audit kit does this in session 4). | Audit kit |

## Next

**Session 3:** extract the spec register (about 197 items) and permission matrix from OrgTik_00–06, and inventory the apps' 191 routes and their components.
