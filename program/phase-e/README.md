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

The current contract is OpenAPI 3.1 (`phase-e/platform-api.yaml`, 102 paths, 120 operations, 40 schemas; the original Phase E baseline had 115 operations), **generated from the mock** by `node phase-e/openapi.mjs` (`--check` fails when it's stale): paths and guards come from the routes, so `x-permission` (staff) and `x-workspace-role` (customer) are the ones the mock enforces.

## R0 merged prototype: contracts and verification

The R0 changes below are merged prototype implementation at main`998d821` with green code CI; revision-specific hosted release acceptance remains open and Vercel deployment is explicitly paused. They are prototype/mock behavior; no live payment, VAT verification or delivery provider is connected.

- `seatModel.value` is **B**, decided by D-061. Stored `snapshot.quantity` is purchased capacity per tool. Ordinary checkout ignores the legacy browser `seats` field. An explicit purchase uses `items[].intent: "seat_purchase"` and `items[].quantity`, validated as an integer against plan minimum, assigned seats and pending reservations. Invitation allocation/atomic acceptance and tool entitlements remain R1 work.
- `taxDisplay.value` is **regional**, decided by D-060. GCC prices include configured VAT; Europe/CH display excludes it. Mock-valid EU business VAT IDs reverse-charge. No configured rule means zero tax; this does not assert regulatory compliance or add new legal rates. New Gulf routing uses Tap/HyperPay; unsupported currencies return `no_gateway` rather than inventing Stripe fallback.
- Price publication stores future changes until `effectiveAt`. Existing-line impact compares resolved prices at stored quantities, respecting zones, country overrides and derived yearly prices. Existing-next notices are stored once in `notifications` and the prototype `mailbox`; their date is the first renewal outside the notice window. Downgrades apply at period end, preserve data and expose `overLimits` from recorded workspace usage; runtime tool usage integration is still required before complete journey acceptance.
- Checkout calculates eligible bundle → eligible coupon → proration/unused-period credit → tax. Same-cycle changes preserve the billing end; cycle switches credit the remaining old period. Any surplus is preserved in workspace `billingCredit` and applied to later mock checkout. Invoice ledger lines carry `kind` for prorated charges, discounts and credits, and their net `subtotal` plus tax equals payment total; full-period `quotedSubtotal` remains separately auditable. Invoices/payments retain currency, quote totals and the payment's USD rate.
- D-067 custom quotes carry `lines: [{tool, amount}]`, in the workspace currency, summing after currency rounding to `amount`. Each allocation is the full term price for the agreed capacity, never a unit price multiplied again. Legacy single-tool quotes have one unambiguous allocation; multi-tool quotes need explicit staff allocations. Acceptance exposes workspace-private plans (`privatePlanIds`) for ordinary checkout, without an unpaid active subscription. Only a successful mock payment creates active lines (`lineIds`); another workspace cannot see or buy the private plan.
- Shared store helpers for the website adapter: `resolveForWorkspace(planId, ws, cycle, quantity)`, `purchasedSeats(ws, tool, planId)`, `taxForWorkspace(ws)`, `routeGateways(ws, {method, recurring})`, and `notifyOwner(ws, kind, details, eventKey)`. Public catalog/quote/mock-payment routes now retain their resolved region, currency and four-term policy. Authenticated linking accepts only the immutable paid order reference and claim proof; browser monetary fields are rejected. The paired website adapter and consuming-app preview flows still require acceptance.

Verification: the complete mock suite passed141 checks on source3d13cc4 in CI37647486335. Overlapping subsets include pricing20, lifecycle4, actual R0 endpoints24, term/proration3, and public offers20 use disposable fixtures/fresh loopback requests. The generated platform contract now describes102paths,120operations and40schemas, including the public routes and optional authorized payment-attempt receipts. Run `pnpm --filter orgtik-local-dev test` and `node program/phase-e/openapi.mjs --check`; production verification must preserve business data and the shared clock.

The legacy setup description above records the original Phase E baseline. Its G-04/G-12 open-switch defaults are superseded by this section and D-060/D-061; the maintained release order/readiness state is `program/plan-v2-execution.md`.

## Stages

| Stage | Screens and flows | Exit |
|---|---|---|
| **E0** | Platform mock + OpenAPI; ADM app shell; USR shell in SOS | resolver tests R03-EX-1…12 green; both apps sign in through SOS |
| **E1** catalog → trial | ADM-01…15, 29 · USR-00, 04–06, 08 · F-01, 02, 04, 11 | a tool goes Coming soon → Beta → Live; a plan is priced in GCC and shows 44 AED in the UAE; a customer starts a trial from My Tools |
| **E2** pay and renew | ADM-16…21, 23 · USR-07, 09–15 · F-03, 05–10 | checkout with coupon and bundle; renewal fails → past due → read-only → paid; refund with a credit note |
| **E3** serve and support | ADM-02, 22, 24–26, 30–33 · USR-16–27 · F-12 | a service request goes to completed; a ticket round trip; the staff role matrix enforced |

Every screen meets the program's definition of done: all states (loading, empty, error with retry, no permission, read-only), 5 languages at 100% keys with Arabic plurals, RTL, light and dark, keyboard, AA contrast, 390/768/1440, golden flows green (`tools/audit-kit/flows/adm.mjs`, `usr.mjs`), VS-1 and dead ends clean.
