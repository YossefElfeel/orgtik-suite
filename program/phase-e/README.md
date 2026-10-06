# Phase E: the SaaS core (ADM back office and USR customer dashboard)

Frontend only, against local-dev mocks (D-000), on @orgtik/ui, 5 languages with RTL (D-001), light and dark (D-003). Source of truth: the PM's spec 00–06 v1.0 (`specs/*.csv`), the decisions (`decisions/`), and this file.

## Who uses what

| App | Users | Where | Port |
|---|---|---|---|
| **ADM** (new app, D-011) | OrgTik's own staff: 8 roles (file 02, `specs/permission-matrix.csv`): Super Admin, Finance, Sales, Support, Service Mgr, Service Team, Content, Product Mgr | `orgtik-admin/` (Next 16, the Website Manager's stack) | web 3008 |
| **USR** (grows out of SOS, D-011) | A customer workspace's people: Owner, Admins, Members, Guests | `somion-sos-frontend-main/` (keeps its URLs, language in a cookie, D-033) | web 3013 |
| **Platform mock** | both, one store | `local-dev/apps/admin.js` + `apps/admin/` (`/v1/admin/*` on :4008; `/v1/app/*` on :4008 and on the SOS API :4000) | api 4008 |

- The suite's existing identities (`@orgtik.test`) are the people of the customer workspace **OrgTik Egypt** (Mona = Owner, Karim = Admin). **Nile Foods** is Nour's (`customer`, Owner): a trial ending in 2 days and a failed Files renewal. Four data-only workspaces cover the other states: Gulf Retail (AE, cancelling CRM, a currency migration queued), Spree Studio (DE, past due, read-only Tasks, expired card), Desert Logistics (KW, suspended), Quill & Co (SA, currency not locked yet).
- ADM staff are the same identities holding staff roles (`apps/admin/permissions.js` GRANTS, editable in ADM-30): Mona Super Admin; Hany and Aya Finance; Omar and Tamer Sales; Mahmoud and Rana Support; Sherif Service Mgr; Laila and Youssef Service Team; Hoda Content; Karim Product Mgr. They sign in through SOS (one-time code, D-017). ADM requires 2FA in the spec; `/v1/admin/me` reports it as verified in the mock.
- ADM-27 (content) and ADM-28 (suggestions) are the Website Manager's (D-019, D-029): ADM links there.
- USR-01 (public pricing) and USR-02 (sign-up) are the public website's (`/plans`, `/sign-up`, Website Manager). USR-03 (login and 2FA) is SOS's login.

## Platform mock (E0)

One store for both apps, envelope `{data, meta}` / `{error:{code,message,requestId,fieldErrors?,required?}}`, pagination `page`/`pageSize` (25), `/__mock/reset` and the mock clock like the other mocks. Time-based transitions run on every call (`apps/admin/lifecycle.js`), so moving the clock moves trials, dunning and auto-approvals. Test controls: `POST /v1/__mock/fail-next-payment {count}`, `POST /v1/__mock/advance`. Checks: `node local-dev/apps/admin/pricing.test.js` (resolver, 16) and the API smoke walk (48).

- **Catalog:** tools (the suite's apps plus spec tools not built yet, as Coming soon), tool status (Live, Beta, Coming soon, Retired), feature keys and limits per tool (G-20), plans per tool (Free/paid, monthly/yearly, per-user or flat, min seats, guest limit, trial days), waitlist.
- **Pricing (spec 03):** currencies with decimals, rounding step and mode (G-05); zones with a base currency and a Default zone; countries (zone, currency override, fixed prices); the price grid (plan × cycle × zone, drafts and publishing with effective date, apply mode and reason); exchange rates; bundles; coupons; the pricing log. **The price resolver implements R03-ALG-1…9 exactly; R03-EX-1…12 are its tests.**
- **Customers:** workspaces (state table), people and seats, subscription lines (state table, price snapshots R03-P1), trials (G-17), currency lock (R03-C1–C5), migration queue, custom plan requests, view-as (G-25, D-017, audited).
- **Money:** carts and checkout (server-side re-pricing, R03-X3), invoices (state table, numbering, credit notes and refunds G-14), payments with the USD rate (R03-R1), gateways and routing (G-11, simulated), tax rules per country (G-12: rules editable, **inclusive/exclusive and e-invoicing marked "not decided" until the PM answers**).
- **Services:** catalog with packages on the zone grid (R03-V1), requests (state table), quotes, milestones, deliveries, auto-approve after 7 days (G-30).
- **Support:** tickets (state table), suggestions link to the Website Manager.
- **System:** staff and roles, email/notification templates (5 languages), reports (MRR R03-R3 in USD), platform settings (retention G-22, dunning G-15, limits G-19).
- **Open gaps are switches**, never silent defaults: G-04 seat model (A: one seat count on every per-user line, as the files; B: per tool), G-12 tax display, G-18 add-ons (off), G-21 General plan features, G-24 hosting ops (out of scope), G-28 mailboxes (Email owns them). Proposed decisions (G-02, 03, 05–11, 13–15, 17, 19, 20, 22, 23, 25, 26, 29–32) are the defaults, each labelled with its gap ID in the API's `meta.rules`.

The contract is OpenAPI 3.1 (`phase-e/platform-api.yaml`, 115 operations), **generated from the mock** by `node phase-e/openapi.mjs` (`--check` fails when it's stale): paths and guards come from the routes, so `x-permission` (staff) and `x-workspace-role` (customer) are the ones the mock enforces.

## Stages

| Stage | Screens and flows | Exit |
|---|---|---|
| **E0** | Platform mock + OpenAPI; ADM app shell; USR shell in SOS | resolver tests R03-EX-1…12 green; both apps sign in through SOS |
| **E1** catalog → trial | ADM-01…15, 29 · USR-00, 04–06, 08 · F-01, 02, 04, 11 | a tool goes Coming soon → Beta → Live; a plan is priced in GCC and shows 44 AED in the UAE; a customer starts a trial from My Tools |
| **E2** pay and renew | ADM-16…21, 23 · USR-07, 09–15 · F-03, 05–10 | checkout with coupon and bundle; renewal fails → past due → read-only → paid; refund with a credit note |
| **E3** serve and support | ADM-02, 22, 24–26, 30–33 · USR-16–27 · F-12 | a service request goes to completed; a ticket round trip; the staff role matrix enforced |

Every screen meets the program's definition of done: all states (loading, empty, error with retry, no permission, read-only), 5 languages at 100% keys with Arabic plurals, RTL, light and dark, keyboard, AA contrast, 390/768/1440, golden flows green (`tools/audit-kit/flows/adm.mjs`, `usr.mjs`), VS-1 and dead ends clean.
