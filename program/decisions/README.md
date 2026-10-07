# Decision log

Each decision gets a `D-###.md` file with its context, options, decision, consequences, owner, approver, date and status. This index is the one-page view.

**Statuses:**
- **Accepted:** decided by the owner or the PM.
- **Proposed:** our recommendation, not yet approved.
- **Assumed:** a reversible default we applied after 5 working days without an answer. Never used for money, tax or legal.
- **Superseded:** replaced by a later decision.

## Accepted

| ID | Decision | Decided by | Date |
|---|---|---|---|
| D-000 | Constraints: the website's design never changes; frontend only for now; Claude acts as senior PO, PM, front-end engineer and UI/UX designer | Yossef | 2026-09-29 |
| D-001 | Languages from day one: **EN, AR, DE, FR, IT**, with full RTL | Yossef | 2026-09-29 |
| D-002 | The CMS (Website Manager) is **internal, for OrgTik's own team**: one site. It replaces the old content dashboard and manages everything on the website, with a slug and metadata on every page and entry. | Yossef | 2026-09-29 |
| D-003 | **Light and dark themes from day one** | Yossef | 2026-09-29 |
| D-004 | **Code first.** The Figma library (variables and components) is generated from code. | Yossef | 2026-09-29 |
| D-005 | **Connect the website to the CMS in the same phase**, with zero visual change | Yossef | 2026-09-29 |
| D-006 | The library ships as a **private package `@orgtik/ui`** on sdk.orgtik.org, linked locally while it's built | Yossef | 2026-09-29 |
| D-007 | Scope: the **7 suite dashboards** (content is replaced by the CMS), **Chats (HQ)**, and the **missing SaaS core** (ADM and USR) | Yossef | 2026-09-29 |
| D-008 | **Phosphor icons** everywhere | Yossef | 2026-09-29 |
| [D-010](D-010.md) | Arabic typeface: **IBM Plex Sans Arabic** | Yossef | 2026-09-30 |
| [D-012](D-012.md) | The website reads CMS content **live from the Website Manager's API**, with a last-known-good copy for outages; it doesn't adopt `@orgtik/ui` in this phase | Yossef | 2026-09-30 |
| [D-013](D-013.md) | EN pixel parity is the gate; real paths, head prerender and lifting `noindex` are separate approved steps | Yossef | 2026-09-30 |
| [D-016](D-016.md) | Digits: **a per-person setting, default Latin 0–9** (Arabic-Indic available) | Yossef | 2026-09-30 |
| [D-022](D-022.md) | Pills on every button, dense tables included; fields 12px | Yossef | 2026-09-30 |
| [D-009](D-009.md) | Base UI is the one primitive layer; React Aria calendars inside Base UI popovers for dates | Yossef | 2026-09-30 |
| [D-021](D-021.md) | recharts 3 behind a themed wrapper; the time axis is mirrored in RTL | Yossef | 2026-09-30 |
| [D-023](D-023.md) | The default theme is **light**; dark is a per-person choice | Yossef | 2026-09-30 |
| [D-024](D-024.md) | Tokens v0 are the base of `@orgtik/ui`'s tokens | Yossef | 2026-09-30 |
| [D-025](D-025.md) | German keeps *Mitarbeiter/Benutzer*; plan is *Tarif* (de) and *Formule* (fr); "Save" everywhere | Yossef | 2026-09-30 |
| [D-026](D-026.md) | Banner priority: suspended → read-only → payment failed → trial ending → beta billing → price change → downgrade; staff ribbon outside it | Yossef | 2026-09-30 |
| [D-027](D-027.md) | Status labels are written **per viewer** (customer and staff) where they differ | Yossef | 2026-09-30 |
| [D-028](D-028.md) | **One lead pipeline**: website leads go into Sales' CRM pipeline | Yossef | 2026-09-30 |
| [D-029](D-029.md) | Roadmap suggestions (ADM-28) are managed in the Website Manager | Yossef | 2026-09-30 |
| [D-030](D-030.md) | The P1 scope is approved as written (VS-1 first) | Yossef | 2026-09-30 |
| [D-031](D-031.md) | The website baseline follows the website's `main`: first move 30db536 → d76ee3b; the drift protocol runs on every change | Yossef | 2026-09-30 |
| [D-032](D-032.md) | Case studies: one shared brief plus one block set per department (design, development, hosting, marketing, IT support) | Follows the website design | 2026-09-30 |
| [D-034](D-034.md) | The Website Manager (CMS) comes first, on @orgtik/ui 1.0.0-rc.2, modelled on the website at d76ee3b (incl. case studies); connecting the website waits for the owner's go-ahead | Yossef | 2026-09-30 |
| [D-035](D-035.md) | Connecting the website to the Website Manager happens on a local branch of orgtik-website, never pushed; every step proves zero visual change | Yossef | 2026-09-30 |
| [D-036](D-036.md) | Arabic on the website is the same design mirrored; the RTL infrastructure is built now on cms/connect, English stays pixel-identical, Arabic isn't public yet | Yossef | 2026-10-01 |
| [D-037](D-037.md) | The website's content stays in English for now: no translation drafts; languages are the Website Manager's interface and workflow | Yossef | 2026-10-01 |
| [D-038](D-038.md) | Claude drafts the missing page and image descriptions as suggestions for review; image rights are not guessed | Yossef | 2026-10-01 |
| [D-011](D-011.md) | ADM is a new app; USR grows out of SOS; Sales stays a CRM (its plan, coupon, invoice and ticket modules retire when ADM/USR ship) | Yossef (ahead of the PM's answer to Q-008) | 2026-10-01 |
| [D-014](D-014.md) | LocalizedField: tabs with a completeness badge for 5 languages (EN and AR required; the others fall back until translated), replacing the spec's side-by-side AR/EN inputs | Yossef (ahead of the PM's answer to Q-007) | 2026-10-01 |
| [D-015](D-015.md) | Modern Standard Arabic for all UI, email and PDF copy | Yossef (ahead of the PM's answer to Q-007) | 2026-10-01 |
| [D-017](D-017.md) | No tokens in URLs: every app takes SOS's one-time code in its wave (the endpoints are a contract for the backend); **and** "View as" (read-only, audited) replaces "Login as" | Yossef | 2026-10-01 |
| [D-018](D-018.md) | SOS's 1:1 chat retires in favour of Chats | Yossef (ahead of the PM's answer to Q-008) | 2026-10-01 |
| [D-019](D-019.md) | The spec's ADM-27 "Content" is delivered by the Website Manager | Yossef | 2026-10-01 |
| [D-020](D-020.md) | Namespaced `--ot-*` tokens plus a per-app bridge, removed at the end of each app's wave | Yossef | 2026-10-01 |
| [D-033](D-033.md) | SOS keeps its URLs; its language lives in a cookie (no `/[locale]` routes) | Yossef | 2026-10-01 |
| [D-039](D-039.md) | Claude's drafted page and image descriptions (D-038) are approved as written; the team can still edit them in the Website Manager | Yossef | 2026-10-01 |
| [D-040](D-040.md) | All 19 website images with unknown rights are OrgTik's own | Yossef | 2026-10-01 |
| [D-041](D-041.md) | The website's forms (contact, idea suggestions) go live **locally on the mock** now: leads and ideas reach the Website Manager. Going live in production still needs a real privacy policy and a retention period. | Yossef | 2026-10-01 |
| [D-042](D-042.md) | The Arabic website (D-036) is built after the dashboard waves | Yossef | 2026-10-01 |
| [D-043](D-043.md) | Waves run in parallel sessions: another session runs Tasks; this session runs Chats (HQ) next, as the plan pairs them | Yossef | 2026-10-01 |
| [D-044](D-044.md) | Everything stays local: no pushes, and @orgtik/ui isn't published, until GitLab access and sdk.orgtik.org publish rights exist. *Exception 2026-10-07: one fresh-history snapshot in the private repo orgtik-suite, hosted on Vercel as a prototype. **Superseded by D-052** (2026-10-07) for orgtik-suite* | Yossef | 2026-10-01 |
| [D-045](D-045.md) | The pricing-override colour is the brand violet (brand tone, with an icon and a word), not the spec's orange | Yossef | 2026-10-01 |
| [D-046](D-046.md) | Chats keeps its accent presets (each person chooses Chats' accent colour); the rest of Chats follows the brand | Yossef | 2026-10-01 |

- [D-047](D-047.md): Restore the clearly labelled sample Roadmap with local preview voting (2026-10-05).
- [D-048](D-048.md): Permanently redirect deleted work and legacy project addresses to Work (2026-10-05).
- D-049, D-050, D-051: reserved by `plans/2026-10-06-bugs-and-remaining.md` (restored projects; the Roadmap follows the owner's GitHub version; the sign-in success screen only on success). Written when that work order is finished.
- [D-052](D-052.md): `orgtik-suite` is the source of truth; branch → PR → Vercel preview; local repos frozen. Supersedes D-044's no-push rule (2026-10-07).
- [D-053](D-053.md): The hosted mock keeps its data: write journal in Upstash Redis, sandboxes demo/preview/review/local (2026-10-07).
- [D-054](D-054.md): `@orgtik/ui` is a workspace package; pnpm workspace + Turborepo; yalc retired (2026-10-07).
- [D-055](D-055.md): Retire the Content dashboard, Sales' 17 frozen routes, SOS's superseded screens, the `components/ui` shims and `@somion/sos-bar` (2026-10-07).
- [D-056](D-056.md): Build order after the review: R1 suite foundation → R2 apps working together → R3 tools complete (top 8 Expected features per tool) → R4 SaaS core completeness (2026-10-07).
- [D-057](D-057.md): Website copy and flow fixes found by the review are made on our side (the CMS-connected website in this monorepo); the owner's repository is never changed (2026-10-07).
- [D-058](D-058.md): The platform's price resolver (spec 03) is the single price authority; the website reads prices and products from the platform (2026-10-07).
- [D-059](D-059.md): 'Website Manager' sold on the website is a managed website service: buying it opens a service request for OrgTik's team (2026-10-07).
- [D-060](D-060.md): G-12 tax display is per region: GCC prices include VAT; Europe and Switzerland show prices excluding VAT, labelled; EU business customers with a valid VAT ID get reverse charge (2026-10-07).
- [D-061](D-061.md): G-04 seat model: seats per tool. The owner buys a seat count for each per-user tool and assigns seats to members; an invitation or a tool grant needs a free seat in that tool (2026-10-07).
- [D-062](D-062.md): Gulf payment gateways follow spec 03: Tap and HyperPay (2026-10-07).

## Proposed

Each one has a full write-up: context, options with their trade-offs, the proposal, consequences, and the evidence still pending. They were drafted in session 5 for the G0 review.

| ID | Proposal | Needs |
|---|---|---|

None open: on 2026-10-01 every proposal above was decided (see Accepted). The PM's answers to packet 01 can still reopen D-011, D-014, D-015 and D-018.
