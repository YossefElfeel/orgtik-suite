# ADM benchmark: OrgTik back office vs Stripe Billing dashboard and Chargebee

Date: 2026-10-07. Read from code and mock, not from screen names. Scope: market features beyond the spec register (spec coverage is checked separately).

**Summary**
- Expected and Missing: **8** (invoice PDF/resend, multi-entity invoicing, pay-by-link, card-expiry warnings, e-invoicing, SaaS metrics, CSV export, accounting integration).
- Expected and Partial: **9** (coupons, staff-side subscription edits, credit notes, dunning, tax, staff onboarding, staff 2FA, audit log, notifications).
- Differentiators: **11**, 5 already shipped (country pricing + preview, bundles, currency migration, gateway routing, services pipeline), 6 worth adding or finishing (maker-checker, pause, custom-plan activation, global search, ticket SLAs, usage/add-ons once G-18 is decided).

Evidence key: `api` = `mock/apps/admin/admin-api.js` (/v1/admin/*), `app-api` = `mock/apps/admin/app-api.js`, `life` = `mock/apps/admin/lifecycle.js`, `store` = `mock/apps/admin/store.js`, `perm` = `mock/apps/admin/permissions.js`. Routes are under `apps/admin/app/[locale]/(app)/`, components under `apps/admin/components/`.

Ratings: **Expected** means Stripe Billing and Chargebee both treat it as standard for a subscription back office. **Differentiator** means it is uncommon, or specific to OrgTik's markets (CHF, Gulf, Arabic). **Not for us** means it does not fit OrgTik's model now. Sizes: S ≤ 3 days, M ≤ 2 weeks, L > 2 weeks.

| # | Feature | Area | Rating | OrgTik today | Evidence | Gap & size |
|---|---|---|---|---|---|---|
| 1 | Product catalog with lifecycle status (coming soon / beta / live / retired), ordering | Catalog | Expected | Have | `tools/`, `tools/[key]`; api `/v1/admin/tools` + `STATUS_NEXT` | — |
| 2 | Plans per product: tiers, per-user pricing, min seats, visibility, yearly discount | Catalog | Expected | Have | `plans/`, `plans/[id]`, `components/catalog/PlanForm.tsx`; api `planErrors` | — |
| 3 | Entitlements: feature flags and limits (hard / soft), guarded when used by a plan | Catalog | Expected | Have | `plans/features`; api `/v1/admin/features` (409 `in_use`) | — |
| 4 | Price points per currency and region, monthly / yearly, currency rounding rules | Pricing | Expected | Have | `pricing/`, `pricing/currencies`; api `/v1/admin/grid`, currency `decimals/step/mode` | — |
| 5 | Country → zone → currency mapping with overrides, fixed local prices, price preview per country and seats | Pricing | Differentiator | Have | `pricing/zones`, `pricing/preview`, `components/pricing/CountrySheet.tsx`; api `/v1/admin/countries`, `/v1/admin/price-preview` | — |
| 6 | Price changes as drafts, then published: apply to new only / next renewal with notice / now (decreases only), versions, grandfathered snapshots, log | Pricing | Expected | Have | `components/pricing/PublishDialog.tsx`, `pricing/log`; api `price-drafts/:id/publish` (P3–P5), `pricingLog` | — |
| 7 | Exchange rates for pricing and reporting | Pricing | Expected | Have | api `/v1/admin/rates` (manual, new purchases only) | Manual only. An automatic rate feed would be a nice-to-have, not a gap |
| 8 | Maker-checker approval for price publishing and large refunds | Pricing / Finance | Differentiator | Missing | api `publish` and `refund` need one staff member with a reason; no approver field | A second approver above a threshold. M |
| 9 | Bundles (multi-tool discount, applied automatically at checkout) | Pricing | Differentiator | Have | `bundles/`; api `/v1/admin/bundles`; app-api `quote()` auto-detects bundles | — |
| 10 | Usage-based billing, overage, add-ons (storage, SMS / WhatsApp credits) | Pricing | Differentiator | Missing | store `settings.switches.addOns` (G-18, undecided) | Blocked by the G-18 decision. L |
| 11 | Trials: length per plan, no card needed, one per tool per workspace, reminder days, staff can extend | Trials | Expected | Have | api `planErrors.trialDays`, `extend_trial`; `components/customers/ExtendTrialDialog.tsx`; app-api `/tools/:key/trial`; store `settings.trial` | — |
| 12 | Coupons: percent or fixed per currency, redemption cap, validity, scope, locked once used | Promotions | Expected | Partial | `coupons/`, `components/commerce/CouponDialog.tsx`; api `/v1/admin/coupons` | Missing: duration (once / N months / forever, so far only the checkout invoice gets it), first purchase only, limit per customer, bulk unique codes. M |
| 13 | Automatic subscription state changes (trial → free / ended, past due → read-only → ended, cancelling → ended, retention → deleted) | Lifecycle | Expected | Have | life `advance()` | — |
| 14 | Staff edits one subscription: change plan / seats / cycle, cancel or resume one line, add discount or credit | Lifecycle | Expected | Partial | api `workspaces/:id/actions` has only suspend / reactivate / cancel (whole workspace) / extend_trial / note / view_as | Line-level actions for staff, using the customer's quote and proration logic. M |
| 15 | Proration on upgrade (credit for the unused period) | Lifecycle | Expected | Have | app-api `quote()` (`prorationFactor`, `credit`) | Staff can't preview it in ADM (see #14) |
| 16 | Scheduled changes: downgrade at period end, price change after notice | Lifecycle | Expected | Have | app-api `downgrade`; api publish `l.scheduled`; life `banners()` | — |
| 17 | Pause a subscription (keep data, stop billing for a while) | Lifecycle | Differentiator | Missing | No `paused` state in life | Pause state, resume date, banner. M |
| 18 | Sales-led custom plans: request → quote with validity → accept | Lifecycle | Differentiator | Partial | `custom-plans/`; api `custom-plans/:id/quote`; app-api `custom-plans/:id/accept` only sets `accepted` | Accepting doesn't create a private plan, line or invoice. M |
| 19 | Currency / country migration queue (approve or reject, applied at renewal) | Lifecycle | Differentiator | Have | `migrations/`; api `/v1/admin/migrations/:id/approve\|reject` | — |
| 20 | Invoices: list with filters (state, workspace, currency), detail, manual draft → issue, void with reason, mark paid offline with reference, retry | Invoicing | Expected | Have | `invoices/`, `invoices/[id]`, `components/billing/InvoiceActions.tsx`, `NewInvoiceDialog.tsx`; api `invoices/:id/:action` | — |
| 21 | Refunds (partial / full, original currency) with numbered credit notes; standalone credit notes and customer credit balance | Invoicing | Expected | Partial | api `refund` creates `CN-…` | A credit note only comes from a refund. No standalone credit, no balance carried to the next invoice. M |
| 22 | Invoice PDF, and resending the invoice to the customer from the back office | Invoicing | Expected | Missing | No download or resend in `components/billing/*` or api | A PDF renderer shared with USR, plus a resend action. M |
| 23 | Several legal entities (e.g. CH and Gulf) with their own invoice series, seller details and tax number | Invoicing | Expected | Missing | store `settings.company` has one `legalName`; numbers hard-coded `INV-2026-…` in api and app-api | Entity per zone or country, a numbering series per entity per year. M |
| 24 | Payment gateway routing by country and currency (KNET, Paymob, Checkout, Stripe), with priority | Payments | Differentiator | Have | `tax/` → `components/commerce/Gateways.tsx`; api `/v1/admin/gateways/route` | — |
| 25 | Pay-by-link for gateways that can't charge again on their own (KNET) and for manual invoices | Payments | Expected | Missing | store gateway `gw_knet` note "renews by a pay link"; nothing creates a link | Generate, send and expire payment links per invoice. M |
| 26 | Dunning: policy (grace, read-only, cancel days), automatic retry schedule, emails at each step | Dunning | Expected | Partial | `settings/` (dunning); life past_due → read_only; api `retry` is manual; store templates `payment_failed`, `read_only` | No automatic retry schedule and no email per dunning step. M |
| 27 | Warnings before a card expires (pre-dunning) | Dunning | Expected | Missing | store `pm_4` has `expired: true` but nothing warns | Notify N days before expiry, plus an ADM list of cards about to expire. S |
| 28 | Tax: rules per country (rate, inclusive, B2B reverse charge), tax line on invoices, display mode, tax-ID validation | Tax | Expected | Partial | `tax/` → `components/commerce/TaxRules.tsx`; api `/v1/admin/tax-rules`; store `switches.taxDisplay` `decided: false` (G-12) | Decide display (G-12). Validate VAT / UID / TRN numbers before applying reverse charge. M |
| 29 | E-invoicing compliance (KSA ZATCA QR / XML; UAE e-invoicing) | Tax | Expected | Missing | Only a free-text `eInvoicing` field in TaxRules | Needed before charging Saudi B2B customers at scale. L |
| 30 | Overview KPIs and revenue reports: MRR (USD), MRR by tool and country, revenue, refunds, payments at their own day's rate | Metrics | Expected | Have | `page.tsx` (overview), `reports/`; api `/v1/admin/overview`, `/v1/admin/reports` | — |
| 31 | SaaS metrics: MRR movements (new / expansion / contraction / churn), churn rate %, trial conversion, ARPU, trends over time, cohorts | Metrics | Expected | Missing | api `/reports` returns sums and counts at one point in time only | Snapshot history, then movement and cohort views. L |
| 32 | Customer list with search and filters; customer 360 (members, subscription lines, invoices, tickets, service requests, notes, payment methods, audit); suspend / reactivate / cancel with reason | Customers | Expected | Have | `workspaces/`, `workspaces/[id]`, `components/customers/WorkspaceDetail.tsx`, `WorkspaceActions.tsx`; api `/v1/admin/workspaces/:id` | — |
| 33 | View as the customer (read-only, reason required, audited, ribbon in the customer app) | Customers | Expected | Have | api `view_as`; `components/customers/WorkspaceActions.tsx`; `apps/sos/components/suite/SuiteFrame.tsx` (`staff_viewing`) | — |
| 34 | Global search (invoice number, ticket number, email, workspace) from anywhere | Customers | Differentiator | Partial | Only `workspaces/` searches (`q` on name or member email) | One search box in the frame. S |
| 35 | Staff roles: permission matrix (8 roles × 17 modules), assign roles, can't lock yourself out | Admin | Expected | Have | `staff/`; perm `MATRIX`; api `PUT /staff/:key/roles` (`self_lockout`) | Roles are fixed. Editable roles aren't needed yet |
| 36 | Staff onboarding and offboarding (invite a staff account, remove access) | Admin | Expected | Partial | api `/v1/admin/staff` lists identity users; roles can be cleared, but nobody can be invited | Invite by email and deactivate from ADM. S |
| 37 | Staff 2FA, enforced | Admin / Security | Expected | Partial | api `/v1/admin/me` hard-codes `twoFactor: { required: true, verified: true }`; `program/phase-e/README.md` | Real enrolment and checks in the identity service. M |
| 38 | Audit log: covers every staff action, filters (who, action, target, date), export | Admin / Security | Expected | Partial | `audit/` (paged list, no filters); api ticket actions, coupon, bundle, gateway and currency changes call no `S.log` | Log every write, add filters and export. S |
| 39 | CSV export of lists (invoices, payments, workspaces, coupons) | Data | Expected | Missing | No export anywhere in `apps/admin` | Export from each list with the active filters. S |
| 40 | Accounting integration or export (Bexio for CHF, Xero, Zoho Books for the Gulf) | Integrations | Expected | Missing | — | Journal export first, then one connector. M |
| 41 | Outbound webhooks for third parties | Integrations | Not for us | Missing | — | OrgTik is the only consumer. Its own tools read the platform directly |
| 42 | Notifications: customer email / in-app templates in 5 languages (flags missing translations); staff alerts (new ticket, failed payment, request waiting) | Notifications | Expected | Partial | `templates/`; api `/v1/admin/templates` (`missing`); overview counts and "mine" filters | No staff inbox or email alerts. Templates can't be previewed or test-sent. M |
| 43 | Support desk: assign, internal notes, priority, wait for customer, auto-close, reopen window | Support | Expected | Have | `tickets/`, `tickets/[id]`; api `/v1/admin/tickets/:id/actions`; life auto-close | — |
| 44 | Ticket SLAs (first-response and resolution timers) and saved replies | Support | Differentiator | Missing | — | S–M |
| 45 | Service requests pipeline: assign, review, quote in the workspace currency, milestones, delivery, auto-approve | Services | Differentiator | Have | `service-requests/`, `services/`; api `/v1/admin/service-requests/:id/actions`; life auto-approve | — |
| 46 | Test mode / test clocks | Ops | Not for us | Missing (dev mock clock only) | `POST /v1/__mock/advance` | A staging environment covers it |

## Top 8 to add (ordered by value)

1. **Automatic payment retries, a dunning email at each step, and card-expiry warnings** (#26, #27). This is the largest source of recovered revenue in Stripe and Chargebee. The policy settings and the state machine already exist. M.
2. **Invoice PDF, resend, and one invoice series per legal entity** (#22, #23). CH and Gulf customers need a proper invoice document with the right seller and tax number. USR needs the same PDF too. M.
3. **Staff-side subscription edits** (#14): change plan, seats or cycle, cancel or resume one line, add credit, all reusing `quote()` and proration. Today support has to ask the customer to do it. M.
4. **SaaS metrics** (#31): MRR movements, churn %, trial conversion, cohorts. Overview and Reports show totals only. L.
5. **Tax completion** (#28, #29): decide G-12, validate tax IDs before reverse charge, then add ZATCA e-invoicing for Saudi Arabia. M, then L.
6. **Pay-by-link** (#25) for KNET and for manual or service invoices. Without it, renewals in Kuwait have no way to collect. M.
7. **CSV exports and an accounting journal export** (#39, #40) so finance can close the month without copying by hand. S, then M.
8. **Real staff 2FA and a complete, filterable audit log** (#37, #38). The spec requires 2FA (ADM-01), and several write actions leave no audit trace today. M.
