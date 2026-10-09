# A37 — adaptive ecosystem and DS v2 plan, P0

2026-10-09. The owner designated `C:/Users/yosse/.claude/plans/i-want-you-to-buzzing-haven.md` for work. [The maintained v3 plan](../plan-v3-execution.md) adopts its P0–P5 sequence, Tier A/B scope and explicit review gates. Previous presentation evidence and the 129 historical release-package IDs are retained.

P0 uses a new `orgtik-suite-v3` worktree on `feat/suite-v3-p0`, starting from refreshed `origin/main` `c7c7e1f` (PR45). Existing worktrees were inspected; other sessions' files were not edited. [D-075](../decisions/D-075.md) through [D-080](../decisions/D-080.md) record adaptive entry/connected states, ordinary-screen migration, DS v2, hybrid radius, business ownership and tool administration.

[The Egyptian Arabic light/dark report](../v3-report.html) presents the audit, qualitative tool scorecard, ownership architecture, illustrative design direction, Tier A/B/C, Top25 and gates. [Feasibility](../v3-feasibility.md) identifies the bounded command-adapter exception needed for P3 while preserving frozen session/tenant/journal semantics. The report's concept is not an implemented DS v2 specimen.

Backlog reconciliation adds current status, evidence and links to release packages without replacing the 407 original findings. Historical findings, severity/rank and earlier evidence remain intact. Bounded implemented mock behavior is distinguished from presentation-only UI and pending ordinary-route/hosted/provider acceptance. V3 delivery packages are appended rather than overwriting historical acceptance statuses. `reconcile-v3.mjs --check` validates foreign keys and deterministic regeneration.

**Current gate:** P0 report ready for owner review after recorded local validation; P1 and G-DS1 are pending. Tier A and B are approved scope, not completed implementation. The report review is the first explicit gate in the adopted plan. No app runtime, library token, website markup/CSS, backend foundation or online deployment changes are part of P0. Native/manual Vercel deployment remains paused under D-073/D-074.
