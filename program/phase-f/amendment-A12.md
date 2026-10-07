# A12 — R1 workspace and billing implementation

2026-10-07 · implementation evidence in progress; hosted release acceptance remains open.

This amendment extends A11 without changing the R0 → R4 sequence, the72 tool commitments, website offer arithmetic or the hosted mock defaults. The owner continues to authorize coherent PRs and code merges after CI while Vercel deployment remains paused. Quota reset does not authorize deployment.

The R1 implementation binds each session and app store to one workspace. Membership, assigned tool access, purchased capacity and billing state govern the launcher, app helpers and APIs. OrgTik staff permissions remain separate and end when employment in the internal workspace ends. Existing people, credentials, paid orders and invoices are preserved; old unsigned sessions require sign-in again.

Invitations reserve available capacity, acceptance consumes the reservation once, and cancellation/expiry releases it. Hiring reuses or creates identity and sends a mock invitation without collecting a password in HR. Offboarding preserves other workspaces, transfers or archives operational ownership, revokes the departed workspace's access, and tracks equipment/final pay. An unavailable owner successor suspends the workspace for ownership review instead of retaining departed access.

Renewal, retries on days1/3/5, seven-day grace, read-only enforcement, recovery and paid seat proration use explicit persistent commands. Read endpoints do not advance that lifecycle. Current authority is checked before idempotency receipts; account and business effects share the domain CAS. Security expiry uses real UTC rather than the mock business clock.

The source package also supplies the persistent Chats prerequisite, polling and private tool graphs needed by R1. These prerequisites do not close R2's file references, suite search/notifications, CRM intake or CMS publishing. R3 feature evidence and R4 operational completion remain separate work.

Local regression evidence is recorded in [the R1 package report](README.md). Shared/tool source contracts and runtime packaging checks accompany the existing platform contract. The final release still requires all15 hosted journeys, EN/AR walkthroughs, light/dark and responsive review. No hosted acceptance is claimed by this amendment.
