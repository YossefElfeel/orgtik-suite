# Sales wave plan (wave 6: Sales CRM)

Gate A, 2026-10-03. This wave runs in the parallel session while the main session finishes HR (D-043). The user confirmed the start directly.

**Inputs:**
- **Three code reads:**
  - shell, session and roles
  - CRM screens
  - data, API, mocks and the website hand-off
- **Baselines:** the sweep and dead-end runs (2026-09-30).
- **VS-1 baseline** (`vs1/vs1-sales-before-*`): 40 of 180 clean renders on 9 CRM routes.
  - There is no dark mode: `data-theme` is never set.
  - Every route has critical axe hits: unnamed buttons, `aria-required-parent` on lists, and contrast.
  - Arabic leaves the suite's app names and people in Latin script.

The issue log is [issues.csv](issues.csv): **191 issues**, of which 27 are S1, 115 S2 and 49 S3. Ten are on frozen routes (`related` says "frozen route"). Eleven duplicates between the reads were merged.

## User decisions (2026-10-03)

- **Frozen routes.** The 17 SaaS-admin routes are **frozen**, not migrated: plan-management (8), coupons, packages(/id), subscriptions(/id), invoices(/id) and tickets(/id).
  - They move to their own sidebar group, which carries a short note that they move to the Admin app.
  - They retire when ADM/USR ship (D-011).
  - The wave's counts, vs1 and flows cover the CRM routes only.
  - Only the three serious frozen-route issues get minimal patches (FS-SAL-12).
- **Offers.** Salespeople create, edit and send **offers for their own customers**. Managers and admins see every offer. The mock enforces the same rule.
- **View as.** Sales' own "Sign in as" goes. Its entry points open **SOS's read-only View as** (D-017): an audited session with a banner and an exit. Sales turns every change off in that session, as Tasks and Marketing do.
- **Website.** The user asked for a lead/purchase inbox. The main session then clarified that the website's purchases, subscriptions, invoices and accounts belong to the SaaS core (ADM/USR, D-011, Phase E), and that only **leads** come to Sales (D-028).
  - So this wave builds the **leads inbox**: website leads land in Sales' pipeline with their source, page, bundle and UTM, and a salesperson works them to won or lost.
  - Purchase records don't land in Sales. If they're wanted later as read-only context, they'll come from the platform mock once it exists.

## Starting point

| Count | Today (whole app) |
|---|---|
| `@orgtik/ui` imports | 0 (rc.11 linked in 1541ce5) |
| `components/ui` imports | 456 lines in 252 files |
| lucide / iconify | 64 files / 104 files (117 distinct icons, fetched at runtime) |
| sonner | 28 files, 54 toasts |
| Raw hex / palette / `text-NN` | 21 + 5 arbitrary / 28 / 85 + 56 `text-[Npx]` |
| Physical direction classes | ~83 (0 `rtl:` variants) |
| Hard-coded `"en-US"` / English zod messages | 42 / 197 |
| Catalogs | en, ar, de, fr, it. ar lacks 20 CRM keys; 9 used keys exist in no catalog; 597 `t(…, { fallback })` calls do nothing |

**Wave exit (CRM routes and the shell):**
- Every count above is at 0 in CRM and shell code.
- The catalogs are at parity, with no missing keys.
- All CRM and shell issues are closed, plus the three frozen-route S1s.
- Flows S1–S8 are green in en and ar.
- vs1 is clean on every CRM route in both themes.

The frozen modules keep their old kit until they retire, so `components/ui` stays only as long as frozen code imports it.

## What this wave is, and isn't

**Is:**
- the CRM on `@orgtik/ui`: dashboard, customers and the leads pipeline, offers, projects/contracts, salespeople, commissions, loyalty, activity, archive, profile and user management
- 5 languages and both themes
- the suite shell
- the one-time-code hand-off
- roles from the `sales` scope
- View as through SOS
- the leads inbox (D-028)

**Isn't:**
- the frozen SaaS-admin modules
- website purchases and billing (ADM/USR)
- the spec-03 zone and currency model (a PM decision; see Backend contracts)
- new CRM features the spec doesn't ask for

## Roles (scope `sales`; grants in `local-dev/apps/sales.js`)

| Action | admin | manager | salesman | customer |
|---|---|---|---|---|
| Open Sales | ✓ | ✓ | ✓ | ✓ (portal) |
| Customers and leads: see | all | all | own (assigned) | — |
| Customers and leads: create, edit, move in the pipeline, notes, meetings | ✓ | ✓ | own | — |
| Assign a customer or lead to a salesperson | ✓ | ✓ | — | — |
| Offers: create, edit, send | ✓ | ✓ | own customers | — |
| Offers: counter, accept, decline | staff side ✓ | ✓ | own | own offers |
| Projects/contracts: see | all | all | own | own |
| Approve or reject a contract (sets the commission) | ✓ | ✓ | — | — |
| Commissions: see | all | all | own | — |
| Commissions: pay | ✓ | — | — | — |
| Salespeople, loyalty, archive | ✓ | ✓ (read) | — | — |
| User management (who has Sales, read-only; roles in SOS) | ✓ | read | — | — |
| View as (SOS, read-only) | ✓ | — | — | — |

**Enforcement:**
- A signed-in person without the `sales` scope gets the **no-access** page. Unknown user types no longer become admin (SAL-005).
- Roles come from the scope only. User Management shows who has Sales and links to SOS to change it, so a role change takes effect (SAL-006).
- View as sessions change nothing.
- The mock enforces the matrix: 403 `{code:"forbidden"}`.

## Fix specs

| Spec | Screen | Decision |
|---|---|---|
| FS-SAL-1 | Foundations | **Layout:** `<html lang dir {...themeAttributes}>`, ThemeScript, OrgtikNextProvider, library Toaster. **Dark mode** works. **Store:** per request from the server's cookies. **Feedback:** `lib/api-feedback` gives translated toasts by endpoint and status, with no raw server text. baseApi never throws. **i18n:** next-intl `getMessageFallback` and `onError` replace the 597 no-op `{ fallback }`, so a missing key shows English, never a path. **Pages:** translated error/404, and real tab titles. |
| FS-SAL-2 | Shell | **Frame:** SuiteFrame on SuiteShell, AppRail, Sidebar and UserMenu (the Marketing adapter). Tiles go through SOS `/go/<scope>`, so no token appears in any URL. **Sidebar:** CRM items by role, `aria-current`, and a **"Moving to Admin"** group with the frozen routes and a one-line note. **Notifications:** the bell, with socket reconnect and failure handling. **Removed:** `/demo`. **Copy:** "Welcome Title" and the "New Salesman" dead end. |
| FS-SAL-3 | Hand-off, session | **Hand-off:** `/auth` exchanges SOS's `?code=` once, clears the address, follows same-origin redirects only, and lands on the dashboard. **Deep links:** signed out goes to `/go/sales?redirect=`. **Failure states:** blank-screen and corrupt-cookie cases get a translated error state. **Not-allowed:** the paste-token page becomes "You don't have Sales". **Removed:** the dev credentials. **Session:** the cookie gets sameSite; HttpOnly needs the API. **SOS:** add `sales` to CODE_APPS (main session). |
| FS-SAL-4 | Roles | **Roles:** `lib/roles.ts` holds the matrix, read from the `sales` scope, and `useSalesRoles()` gets one fetch (no more 72 separate `/auth/me` calls). **Proxy:** gates on the scope. **Pages:** a no-permission state inside the shell. **User Management:** read-only, scope-based, with a link to SOS. **Mock:** a role guard per the matrix, which also closes the customer-path bypass (SAL-021). |
| FS-SAL-5 | View as | **Removed:** "Sign in as" (salesman and customer) and its token URLs. **Replacement:** "View as" opens `${SOS_URL}/go/global?redirect=/people/<id>/view-as`, or the SOS route the main session confirms. **Read-only sessions:** a `readOnly` token shows the `staff_viewing` banner, every change is off, and the mock refuses writes (already global). |
| FS-SAL-6 | Customers and leads | **Pipeline (D-028):** new → contacted → qualified → quoted → won / lost (a reason is required), plus unqualified, spam and duplicate. "Scheduled" becomes a meeting activity. Statuses use StatusBadge `lead`. **Leads inbox:** a pipeline view on the library Board, filtered by stage, source (website, manual, referral…), owner and age. A website lead shows its page, bundle and UTM. **Lead actions:** assign, convert to customer (won), lose with a reason. **Customer detail:** notes by id (not list position). The access column reads the API's `access`. Fake actions are made real or removed (SAL-015, SAL-027). **Intake (mock):** `POST /api/leads/intake`; the WM mock's public form can forward there (main session's call). |
| FS-SAL-7 | Offers and the deal builder | **One deal builder** (the library Stepper) for offers and projects: customer → plans (standard, custom) → terms → review. **Prices and terms:** from the API only, not `mock/project-plans.ts`. Installments of 18 and 24 months save as chosen. **VAT:** a percent, kept on edit. **Edit:** never re-prices. **Failed save:** keeps the form. **Counter-offers:** an accepted counter shows the agreed total everywhere. Accept, decline and counter ask for confirmation. **Money:** MoneyField and `f.money` in the deal currency, with no Egypt-zone fallback labelled in another currency. **Salesman:** creates and sends offers for own customers. |
| FS-SAL-8 | Projects and contracts | **Approve and reject** are real: a manager sets the commission (a fixed amount in the contract currency, or a %, with no silent 10% default). **Paid % and remaining:** from payments. **Detail states:** not-found, no-access and error, never an endless spinner. **Caches:** approving or accepting refreshes projects, customers, salespeople and commissions. **Filters:** the priority filter works on the server. |
| FS-SAL-9 | Salespeople, commissions, loyalty | **Pay:** the due amount is `amount − paid`, partial pays show "Partially paid", and percentage commissions show money. **Pay all:** settles the wallet (withdraw endpoint) or is relabelled. **Permissions:** payment is for admins only (managers see no Pay). **Bank account:** really saves, or the form goes (SAL-007). **Loyalty:** points and levels come from the API, with states. |
| FS-SAL-10 | Dashboard, activity, archive, profile | **Dashboard:** KPIs and charts on `@orgtik/ui` (Stat, charts with tables), from the API, per role. **Activity:** a timeline with relative times in the reader's language; "View all" only for roles that can open it. **Archive:** read-only, its data from the frozen catalog with a note. **Profile:** the header copy, and a theme and language menu via UserMenu. |
| FS-SAL-11 | Money, dates, languages | **Formatting:** dates, numbers, money and percents come from `useFormatter()` in the reader's locale, with the deal's currency and the org time zone. Zero-decimal currencies are right (no "JPY .00"). **Languages:** Arabic is offered as a customer's preferred language. **Catalogs:** the ar gap is filled, and status labels are translated. **Errors:** zod messages are translated. |
| FS-SAL-12 | Frozen routes (minimal) | **Payment reference:** the mark-paid and refund dialogs take a payment reference, never a card number (SAL-020). **Mock:** the role guard covers the subscription customer paths (SAL-021). **Invoice sender:** comes from the organisation profile, not the "Zimmer Inc" fixture (SAL-023). Nothing else changes on frozen routes. |
| FS-SAL-13 | Accessibility, RTL, cleanup | **Accessibility:** named controls, list semantics, and contrast to AA (text-fg-subtle, never faded ink). **RTL:** logical classes (codemod `physical-to-logical.mjs`) and tokens (codemod `colors-to-tokens.mjs`). **Icons:** Phosphor, with brand marks via the shared platform/brand components. **Removed:** from CRM and shell code, every `components/ui`, sonner, lucide, iconify, framer-motion and recharts-direct use. Dead fixtures in `mock/` and route `data.ts` files go. AGENTS.md is rewritten. |

## Library requests

None blocking. The library has DataTable, Board (pipeline), Stepper (deal builder), CalendarGrid (meetings), DateTimePicker with timeZone, MoneyField, charts, StatusBadge `lead`, ConfirmDialog and BannerRegion (`staff_viewing`).

Composed in the app:
- the notification centre
- the activity timeline
- the deal builder's plan cards
- the commission statuses (via the `MarketingStatus` pattern)

Candidates to promote afterwards: the relative-time formatter, the activity timeline, and a shared View-as banner controller.

## Backend contracts for the real API

**Implemented in the mock** (`local-dev/apps/sales*`):
- **Role guard:** per the matrix (scope-based; unknown types are refused).
- **Offers:** salespeople see and write offers only for their assigned customers.
- **Lead pipeline (D-028):** states as listed, and lost needs `lostReason`.
- **Intake:** `POST /api/leads/intake {source, name, email, company?, page, bundle?, utm…}` → a lead with `source`.
- **Subscription actions:** customer-path subscription actions respect the role guard.

**Gaps, and PM decisions:**
- **Spec 03 (PM decision):** Sales' zone and currency model conflicts with spec 03 (SAL-024). It has one currency per zone, no country override, no rounding step, and no price snapshot or currency lock.
- **Website hand-off:** the website's catalog IDs, CHF prices and discount rule don't map to Sales' plans (SAL-026/027). They belong to ADM/USR purchasing (D-011), not the CRM.
- **WM leads:** WM's public lead form should post to the Sales intake, so there is one pipeline. The WM mock is the main session's.
- **Session:** an HttpOnly session cookie (as TASKS-003/MKT-003).
- **Formatting:** the API sends money in minor units with the currency, and dates as ISO instants.

## Order

1. Foundations (FS-SAL-1) and the token bridge for unmigrated screens.
2. Shell (FS-SAL-2).
3. Hand-off, roles and View as (FS-SAL-3, 4, 5), and the mock guard.
4. Parallel area agents, on one brief (the Marketing brief, adapted):
   - (a) customers, leads pipeline and intake: FS-SAL-6
   - (b) offers, projects and the deal builder: FS-SAL-7, 8
   - (c) salespeople, commissions, loyalty, profile and user management: FS-SAL-9, 10 part
   - (d) dashboard, activity and archive: FS-SAL-10
5. Frozen-route patches (FS-SAL-12).
6. Languages and cleanup (FS-SAL-11, 13), flows S1–S8 in en and ar, vs1 on every CRM route, then close the issues.

## Golden flows (`flows/sales.mjs`)

| Flow | Who | Steps |
|---|---|---|
| S1 Open Sales from the suite | admin | A code hand-off with no token in history. A deep link survives sign-in. A user without the sales scope sees "You don't have Sales". |
| S2 Create and send an offer | salesman (Tamer) | For his own customer: a 12-month standard plan, plus a custom plan with 24 installments and VAT. The review shows the right totals. Send. An edit/save round trip keeps the terms, VAT and price. |
| S3 Counter and accept | customer → salesman | The customer counters at a lower total. The salesman accepts (with a confirm). The offer shows the agreed total and links to the new project, which appears without a reload. |
| S4 Approve a contract | customer → manager → salesman | The customer uploads the signed contract. The manager approves with 8%. The salesman's Commissions shows the money amount. |
| S5 Pay a commission | admin, manager | The admin pays part with a reference; the due amount equals the remaining; the status is "Partially paid". A manager sees no Pay. |
| S6 A website lead | intake → salesman | A lead posted to the intake appears in the Leads inbox as "Website", with its page and bundle. The salesman qualifies it, then wins it into a customer, or loses it with a reason. |
| S7 View as | admin | View as a salesman through SOS: the banner shows, nothing can be changed, and Exit returns. |
| S8 Customer lifecycle in Arabic | salesman, manager | RTL. Create a customer with an invite; the access column reads "Invited". A note survives a failed save. A meeting in the org time zone. Deleting a document needs a confirm. |

## Progress

- **2026-10-03, Gate A:** three reads, 191 issues, this plan, and the vs1 baseline (40/180).
- **Step 1, align:** @orgtik/ui rc.11 via yalc (app 1541ce5).
