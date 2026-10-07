# Suite review: cross-app journeys (2026-10-07)

Plan v2, Phase 1a. Walked on the local stack (workspace install, mock with the frozen clock 2026-09-29, apps in dev mode) as the people each journey needs, or traced through the code where a step has no screen. Files couldn't run locally during the walk (its port was taken by another project). Findings are in `findings.jsonl` (SR-###), ranked with everything else in `program/backlog/backlog.csv`.

| # | Journey | Result | Where it stops | Findings |
|---|---|---|---|---|
| J1 | Visitor picks a plan → cart → checkout → sign-up → workspace → uses the tool | **Breaks** | Buying and signing up work and the order lands in the workspace (tools Active, paid invoice); opening a paid tool says "You can't open Tasks" | SR-001, SR-002, SR-004, SR-005, SR-006, SR-007, SR-008, SR-010, SR-011, SR-012 |
| J2 | Owner invites a member → member joins → gets a seat and tools → opens Tasks | **Breaks** | The invite records the member and previews the seat cost, but no link or email exists, so nobody can accept | SR-013, SR-014 |
| J3 | Renewal fails → past due → read-only in every tool → paid → restored | **Breaks** | The platform and USR handle the states (usr-billing flows green); no tool reads them | SR-016 |
| J4 | Staff launch a tool (Coming soon → Beta → Live) → website and My Tools | **Partial** | ADM → USR works; the website keeps its own catalog | SR-017 |
| J5 | Staff change a price → website and USR | **Breaks** | Two price authorities (CRM is CHF 59 on the site, CHF 15 per user × 2 in the workspace); publishing re-prices immediately and re-prices kept customers | SR-003, pricing rows P2, P3, P5 |
| J6 | Website lead → WM leads → Sales → won → customer workspace | **Partial** | Lead forms reach Sales' intake (D-028); purchases bypass Sales, and a won deal opens no workspace | SR-018 |
| J7 | HR hires → suite user → Tasks/Files access → time off → manager approves | **Missing** | HR employees aren't suite users | SR-019 |
| J8 | A project in Tasks with files from Files and a discussion in Chats | **Missing** | Each app keeps its own files; Chats keeps no history | SR-020, SR-021 |
| J9 | Marketing campaign → landing content in WM → leads → Sales | **Missing** | Marketing has no link to WM or Sales | SR-022 |
| J10 | Support ticket round trip; service request to completed | **Works** | ADM/USR flows green; gaps are notifications/email and the service team's scope (spec rows) | US-A-36, admin-side notifications |
| J11 | Editor edits → approver approves → publish → live on the hosted website | **Partial** | Works through pull + rebuild + deploy; D-012 wanted runtime reads | SR-023 |
| J12 | Staff "View as" a customer, read-only, audited | **Works** | SOS People → read-only token refused by every app (D-017) | — |
| J13 | Preferences once (language, theme, digits) carry across every app | **Partial** | Fine on localhost; on Vercel each app is its own domain | SR-024 |
| J14 | A notification raised in one app reaches the person in another | **Missing** | Each app has its own bell | SR-025 |
| J15 | Employee leaves → access revoked → files and tasks reassigned | **Missing** | Same gap as J7 | SR-019 |

**The pattern:** each app works well on its own (the waves made sure of that), and the SaaS core works within itself. What's missing is the layer between them: a customer **workspace** that every tool respects, **entitlements** that turn a paid tool, a trial or a seat into access, **one person** across identity, workspace members and HR employees, and **events** (notifications, billing states, publishing) that cross app borders. 8 of 15 journeys stop at that layer.
