# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 15 (App Router) + TypeScript strict, Tailwind, shadcn/ui, Zustand, Framer Motion, Excalidraw, Recharts, PWA manifest. Decided by the source documents (Part C, section C3) and confirmed by the user — not delegated.

## Users

Assumed customer size is 5-50 people. This is a hypothesis to be validated in the five Phase 0 customer interviews, not a confirmed fact; companies above 100 people change the floor, permissions and analytics and are out of v1 design scope.

- **Owner / managing director** — runs a 5-50 person company, buys the Business OS, often also the admin. Needs one bill, one login, a team that feels present, client meetings that look professional, no data-protection surprises. Fears paying for a tool nobody uses, or appearing to surveil staff.
- **Team lead / manager** — coordinates 3-12 people daily. Needs to see who is available, start a two-minute sync without scheduling, and a weekly view of meeting load and availability. Fears more noise, and being the only one using it.
- **Team member** — hybrid or remote knowledge worker. Needs fast answers, fewer interruptions, conversation next to the task, no tool-switching. Fears monitoring, always-on camera pressure, notification overload.
- **Workspace admin** — the owner or an operations person; IT at larger customers. Needs setup in minutes, guest policy, retention, recording permissions, roles inherited from the SaaS layer. Fears learning a new permissions model.
- **Guest** — a client, freelancer, accountant or job candidate. Needs to join a meeting or shared channel from a link with no account, seeing the customer's branding and clear trust signals. Fears installing something, or being tracked.

## Product Purpose

Somion HQ is the seventh module in the Somion Business OS: team chat, calls and meetings, and a virtual office — the place a team talks, meets, and sees who is around, with every conversation tied to work that already lives in the other six modules (Task Manager, HR, Sales CRM, Invoicing, Marketing Hub, File Manager).

It exists because the Business OS promise — "run the company from one place" — stops at the moment people talk to each other, which is most of the working day. Success is measured as a retention and attach-rate feature for the suite, not as a standalone revenue line.

This project is **Phase 0**: an 8-week, design-led discovery ending in a go/no-go decision. The deliverable being built here is the Next.js mock-data demo that answers one question for the founder and PM: *is this a product we can sell alongside the Business OS?*

## Positioning

It competes for the budget a small company spends on Slack + Google Meet (or Discord + WhatsApp, or nothing) — not for Slack's enterprise customers.

The mechanism a neighbouring product cannot truthfully copy: **any object in the Business OS — task, client, deal, invoice, employee, file — can start a conversation and render as a live card inside it, and the object's own page lists its conversations.** No competitor in the category owns the tasks, invoices and HR records. Kumospace, Gather, SoWork and Roam sell a room; Slack and Teams sell a channel. Somion HQ sells the conversation already attached to the work.

Secondary positioning: bundle economics (an add-on inside a suite the customer already pays for, against $7-16/user for a separate tool), one login and one file store for small teams, and Swiss/EU data handling as a genuine sales point in the target market.

## Operating Context

- Somion is customer zero and currently runs on Discord, with four reported pains: nothing is linked to the work, it is unsuitable for clients and guests, there is no usable recording/search/history, and channels are noisy without real threads.
- HQ lives inside the `/app` shell of the Business OS, using the SaaS layer's design system, navigation, top bar and notification centre. It is not a standalone product and must not look like one.
- Target customers are Swiss and European small companies. Communication and presence data are personal data about employees; analytics touch employee-monitoring law.
- Guests join from a link, outside the shell, on a page carrying the customer's branding — never a third-party brand.

## Capabilities and Constraints

**In scope for v1 (Release 1 + Release 2):**
- Chat core: public/private channels, DMs and group DMs, threads, mentions, reactions, edit/delete, pins, read state, Catch up, search, notifications, attachments via the File Manager. (`CH-1`..`CH-10`)
- Context cards and "Discuss" from any Business OS object, with the object page listing its conversations. (`CH-9`)
- Virtual office: one floor per workspace from a template, room and avatar states, walk-in room audio, knock, status and Focus, a "who's around" list view. (`OF-1`..`OF-3`, `OF-5`, `OF-8`)
- Calls and meetings: up to ~25 participants, screen share, pre-join device check, scheduling, guest links with lobby and admit. (`ME-1`..`ME-5`)
- Platform: users/roles/tenants/entitlements inherited from the SaaS layer, setup wizard, installable PWA, English first. (`AD-1`, `AD-2`, `AD-5`, `AD-6`)

**Release 3:** recording to the File Manager with consent, whiteboard, calendar sync, team insights with the transparency page, DE/FR.

**Explicitly not in v1, and not to be added:** native mobile or desktop apps; an app/bot/workflow platform; webinars, large events, telephony; end-to-end encryption (incompatible with recording, search and context cards); AI meeting notes and transcription; a custom floor editor or multiple floors; individual productivity scoring.

**Hard technical constraints:**
- The SaaS layer (accounts, users, roles, module entitlements, billing) is a hard dependency. HQ adds no parallel directory.
- Real-time media is rented, never built. LiveKit is the recommendation; the module is designed so **presence costs nothing** and media connects only inside rooms and conversations — always-on audio would cost $5-10/user/month and destroy the add-on's margin, versus ~$1-2 on demand.
- The floor is SVG/CSS with a small state machine. No game engine.
- Attachments, recordings and whiteboards are stored through the File Manager. HQ owns no second storage.

**Constraints specific to this demo (Part C):** mock data only, no backend, no WebRTC or LiveKit, a single fixed user, one tenant. Real camera self-view, real screen share, real Web Audio proximity and real Excalidraw are in scope because they are what makes the demo feel true.

**Undecided:** the final module name; actual Somion customer size distribution; the SaaS layer delivery date and its directory/roles contract; EU region pinning versus self-hosted media in a Swiss data centre; whether a single notification pipeline serves all seven modules; pilot customer identity.

## Brand Commitments

- Working name "Somion HQ" is a placeholder; the final name is a separate decision.
- HQ must read as the seventh module of the Somion Business OS — same shell, same chrome, same design system. Only the floor canvas and the call stage get their own visual treatment, and only inside that shared chrome.
- No Somion brand assets, palette, logo or design system files were supplied. The demo's token set is an original stand-in, built to be swapped when the real SaaS-layer system exists.
- Interface language is English. Every string passes through a `t()` wrapper; German and French follow at GA, with German expanding text ~30% and French ~20%. Layout uses logical properties from day one so RTL is possible later.

## Evidence on Hand

- `Somion HQ/Somion HQ - Proposal (AR).pdf|docx` — the business case, market landscape with September 2026 pricing, build-vs-buy, risks, Phase 0 plan and go/no-go criteria.
- `Somion HQ/Somion HQ - Product Design Frontend Plan (AR).pdf|docx` — the full PRD, design plan, 63-screen inventory, six golden paths, component and token specification, the demo script, stack, architecture, data model and build sequence, plus a sourced competitor appendix.

Both are in Egyptian Arabic and are the sole source of product truth. **There is no code, no design file, no brand asset, and no user research yet.** The five customer interviews have not happened; internal evidence is strong on the problem existing at Somion and weak on it generalising. Nothing about customer validation, pricing acceptance, call quality or adoption may be presented as established. Pricing figures in CHF are placeholders that satisfy a stated rule, not recommendations.

## Product Principles

1. **Context over channels.** The object is the first place a conversation starts; the channel is the second. The context card is structural, not decoration.
2. **Presence without surveillance.** Anything shown about a person is something they can see and change themselves. Insights are team-level with a minimum group of five and a transparency page; no screenshots, keystrokes, content analysis or individual scores, ever.
3. **One click to talk.** From "I can see you" to "I can hear you" in a single action — enter a room, knock, or press call. No links, invites or meeting IDs for internal conversation.
4. **Quiet by default.** Defaults protect attention: mentions and DMs only, threads collapsed, sounds soft and rare, Focus defers knocks and nothing is lost.
5. **Same shell, own stage.** The chrome belongs to the SaaS layer's design system. Only the floor and the call stage earn additional tokens.

## Accessibility & Inclusion

- WCAG 2.1 AA for chat, meetings and admin.
- The floor is a keyboard-navigable list beneath the canvas: rooms and people focusable in logical order, Enter as the primary action, Escape to leave.
- Screen-reader presence announcements are batched into a live region updating at most every 30 seconds.
- All six presence colours must clear 3:1 as UI components against the floor surface and the avatar fill; text clears 4.5:1.
- `prefers-reduced-motion` removes floor movement and the knock pulse, leaving opacity transitions only.
- Presence and status must never be conveyed by colour alone.
- German text expansion of +30% is a layout constraint on every dock and sidebar label.
