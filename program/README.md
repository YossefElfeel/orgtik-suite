# OrgTik program

The working repo for the OrgTik suite program:
- the shared design system (`@orgtik/ui`)
- the Website Manager (CMS)
- the dashboard refactor waves
- the SaaS core (Admin back-office and customer dashboard)

It holds the decisions, registers, audits and question packets that the app repos don't. Nothing in here ships to users.

The current maintained roadmap is [plan-v3-execution.md](plan-v3-execution.md): adaptive ecosystem, DS v2 and ordinary-screen mock flows. [The P0 report](v3-report.html) awaits owner review; [A37](phase-f/amendment-A37.md) records decisions and [feasibility](v3-feasibility.md). [Plan v2](plan-v2-execution.md) and the R1 implementation/evidence in [phase-f/README.md](phase-f/README.md) retain historical acceptance. Keep existing configured resources; Vercel deployment remains paused by the owner.

## What lives where

| Folder | Contents | Status |
|---|---|---|
| `decisions/` | Decision log (`D-###`): context, options, decision, consequences | D-000 to D-008 accepted |
| `pm-packets/` | Question packets for the PM, in EN and AR | Packet 01 drafted |
| `specs/` | Spec register extracted from OrgTik_00–06, plus the permission matrix | Session 3 |
| `gap-analysis/` | The gap matrix (what the specs say vs what exists) and its generated report | After the audits |
| `audits/<app>/` | Per-app inventory, issues, flow walks and evidence. `audits/local-dev-readiness.md` holds the environment check. | Readiness done (session 2); apps from session 4 |
| `glossary/` | One concept, one term per language (EN, AR, DE, FR, IT) | Session 5 |
| `status-matrix/` | Every entity's states: labels, tones, icons, next actions | Session 5 |
| `tools/` | Spec extractor, audit kit, static scans | Sessions 3–4 |
| `baselines.md` | Git baselines of every app repo | Done |

## Phases

| Phase | Outcome | Gate |
|---|---|---|
| P0 Foundations | Baselines, local-dev ready, registers, audit kit, glossary, status matrix, spikes | G0 |
| P1 `@orgtik/ui` v1 | Tokens (light and dark), 5 locales with RTL, components, Storybook, Figma library, the VS-1 slice | G1a, G1 |
| P2 Website Manager | A CMS that manages everything on the website (slugs and metadata on every page and entry), connected with zero visual change | G2 |
| Waves | Files → SOS/USR foundation → Tasks and Chats → HR → Marketing → Sales, screen by screen and flow by flow | A / D / R per app |
| E | Admin back-office (ADM) and customer dashboard (USR) | E0–E3 |

## Rules

- **The website's design never changes.** Every website change must pass the pixel-parity harness.
- **Persistent hosted mock prototype.** Apps use the workspace-aware backend in `../mock/`; payments, mailbox and external integrations are simulated. Local compatibility links keep older audit tooling usable.
- **Decisions are recorded here before they're built.** PM answers are copied word for word.
- **Upstream stays mergeable.** Each app keeps its pristine `main`; our work lives on branches (see `baselines.md`).
