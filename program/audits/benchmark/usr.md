# USR benchmark: customer dashboard vs Google Workspace admin console and Atlassian admin

Date: 2026-10-07. Read from code and mock, not from screen names. Scope: market features beyond the spec register (spec coverage is checked separately).

**Summary**
- Expected and Missing: **10** (onboarding, ownership transfer, team search, leave workspace, usage & limits, 2FA, sessions, workspace audit log, notification preferences, data export).
- Expected and Partial: **6** (workspace settings, invite management, member deactivation, invoice PDF / billing contacts, refund request, ticket attachments).
- Differentiators: **8**, 2 already shipped (seat cost before inviting, services pipeline), 4 worth adding (custom roles, finishing custom-plan activation, Google / Microsoft sign-in, data handover on removal), 2 later (more workspaces from inside the app, verified domain).

Evidence key: `app-api` = `mock/apps/admin/app-api.js` (/v1/app/*), `life` = `mock/apps/admin/lifecycle.js`, `store` = `mock/apps/admin/store.js`. Routes are under `apps/sos/app/(dashboard)/`, components under `apps/sos/components/workspace/`, RTK slices under `apps/sos/redux/features/platform/`.

Ratings: **Expected** means Google Workspace admin and Atlassian admin both treat it as standard for running a multi-app workspace. **Differentiator** means it is uncommon, or specific to OrgTik's model. **Not for us** means it does not fit SMB customers now. Sizes: S ≤ 3 days, M ≤ 2 weeks, L > 2 weeks.

| # | Feature | Area | Rating | OrgTik today | Evidence | Gap & size |
|---|---|---|---|---|---|---|
| 1 | Self-serve sign-up creates a workspace on the free General plan (also from a website order) | Setup | Expected | Have | store `createWorkspace`; app-api `/website-orders` | — |
| 2 | Onboarding: setup wizard or a checklist on Home (invite team, pick tools, billing details) | Setup | Expected | Missing | `page.tsx` (Home) shows tools only; no onboarding code in `apps/sos` | Checklist built from data that already exists (team size, lines, billing name). M |
| 3 | Workspace settings: name, logo, default language and time zone, company address | Setup | Expected | Partial | `account/WorkspaceSettings.tsx` (rename; slug read-only); app-api `PATCH /workspace` takes `name` only | Logo (also used in the switcher and on invoices), defaults for language and time zone. S |
| 4 | Switch between several workspaces | Setup | Expected | Have | `apps/sos/components/suite/WorkspaceSwitcher.tsx`; `platformApi.ts` `x-workspace` header; app-api `/me` `workspaces` | — |
| 5 | Create another workspace from inside the app (agencies, groups) | Setup | Differentiator | Missing | No create path in `apps/sos`; only sign-up creates one | S–M |
| 6 | Verified company domain (auto-join or restrict invites to that domain) | Setup / Security | Differentiator | Missing | — | Later. M |
| 7 | Invite by email with role and per-tool access; accept link | Users | Expected | Have | `team/InviteDialog.tsx`, `apps/sos/app/auth/invite`; app-api `/team/invite` | — |
| 8 | Seat cost shown before inviting or changing a role (paid seat vs free guest) | Users | Differentiator | Have | `team/SeatCost.tsx`, `team/seats.ts`; app-api `seatsAfter`, `perUserLines` | — |
| 9 | Managing invites: resend, expiry, bulk invite (paste or CSV) | Users | Expected | Partial | `team/TeamView.tsx` offers withdraw only; invite takes one email | Resend with expiry, multi-email invite. S |
| 10 | Built-in roles (owner / admin / member / guest); change role, only the owner makes admins | Users | Expected | Have | `team/TeamView.tsx`; app-api `PATCH /team/:id` (`owner_only`) | — |
| 11 | Custom roles and finer permissions | Users | Differentiator | Missing | Spec USR-21; store `switches.generalPaid` (G-21) | Paid-plan feature once G-21 is decided. M |
| 12 | Deactivate a member (blocks sign-in, keeps their data, frees the seat) as well as removing them | Users | Expected | Partial | app-api `PATCH /team/:id` sets `status: "removed"` only. The legacy `people/` page deactivates identity accounts, not workspace membership | A suspended membership status. S |
| 13 | Transfer workspace ownership | Users | Expected | Missing | `TeamView.tsx` says ownership changes "only by transfer", but app-api has no transfer endpoint and 409s on the owner | Owner picks an admin and confirms; billing role moves with it. S |
| 14 | Hand over a removed user's data (tasks, files, chats) to someone else | Users | Differentiator | Missing | — | Per-tool reassignment on removal. M–L |
| 15 | Per-user app access (tools a member or guest can open) | Users | Expected | Have | `team/AccessDialog.tsx`, `team/ToolAccess.tsx`; life `toolState` → `no_access` | — |
| 16 | Team list search and filters (role, status, tool), last active | Users | Expected | Missing | `TeamView.tsx` has no search or filter | S |
| 17 | Leave a workspace (non-owner) | Users | Expected | Missing | No action in app-api or UI | S |
| 18 | Subscriptions overview: plan, cycle, state, renewal / end date, monthly total, seats | Billing | Expected | Have | `billing/page.tsx` → `billing/SubscriptionsView.tsx`, `LineCard.tsx`; app-api `GET /subscriptions` | — |
| 19 | Buy or upgrade with proration credit, monthly / yearly, coupon, bundle discount, tax line, local payment options | Billing | Expected | Have | `checkout/page.tsx`; app-api `checkout/preview`, `checkout/confirm`, `quote()` | — |
| 20 | Downgrade at period end (and undo), cancel with reason, resume before the end | Billing | Expected | Have | `billing/LineCard.tsx`; app-api `subscriptions/:id/:action` | — |
| 21 | Trials without a card, trial-ending banner, waitlist for upcoming tools | Billing | Expected | Have | `tools/`, `tools/[key]`; app-api `/tools/:key/trial`, `/waitlist`; life `banners()` | — |
| 22 | Invoices list and detail with payments (failed ones too), refunds and credit notes | Billing | Expected | Have | `billing/invoices`, `billing/InvoiceView.tsx`; app-api `/invoices/:id` | — |
| 23 | Invoice PDF download, emailed receipts, extra billing contacts | Billing | Expected | Partial | `InvoiceView.tsx` can only print via `window.print()`; billing details have one email | Real PDF (shared with ADM), more than one billing recipient. S |
| 24 | Payment methods: add, make default, remove (blocked if it's the last card renewals use) | Billing | Expected | Have | `billing/PaymentMethodsView.tsx`, `AddCardDialog.tsx`; app-api `/payment-methods` (`last_method`) | — |
| 25 | Billing details with tax ID (VAT / UID / TRN); country change after first payment becomes a migration request | Billing | Expected | Have | `billing/BillingDetailsView.tsx`; app-api `PUT /billing` (`migrationQueued`) | — |
| 26 | Failed-payment recovery: banners in priority order, pay now / retry with another card | Billing | Expected | Have | life `banners()` (D-026); app-api `retry`; `LineCard.tsx` | — |
| 27 | Usage and limits per tool (used / max, % bar, reset date) | Billing | Expected | Missing | Spec USR-08; limits exist in the catalog (api `/v1/admin/features`), but app-api has no usage endpoint and the UI has no page | M |
| 28 | Cancel-and-refund request (proration or refund policy shown, request sent to finance) | Billing | Expected | Partial | Cancel exists (#20). No refund request in app-api; refunds are staff-only (ADM) | Refund request on the cancel flow. S |
| 29 | Custom plan request and accepting a quote | Billing | Differentiator | Partial | `tools/custom-plan`; app-api `custom-plans`, `/accept` sets `accepted` only | Accepting should activate the plan and invoice it. M |
| 30 | My profile: photo, name, language (5, flips RTL), time zone, password change | Security / Me | Expected | Have | `profile/page.tsx` | — |
| 31 | 2FA for the person and a workspace rule that makes 2FA mandatory | Security | Expected | Missing | No 2FA in `apps/sos`; store `switches.generalPaid` lists "2FA enforcement" (G-21) | Personal 2FA first (USR-23), then the owner's rule. M |
| 32 | Active sessions and devices; sign out everywhere | Security | Expected | Missing | — | S–M |
| 33 | Workspace audit log for owner and admins (who invited, changed roles or plans, paid; when OrgTik staff viewed the workspace) | Security | Expected | Missing | app-api already calls `S.log` (trial, checkout, line actions, deletion), but no `/v1/app` route reads it; staff `view_as` is only visible in ADM | Read-only log page with filters. M |
| 34 | Sign in with Google or Microsoft | Security | Differentiator | Missing | — | M |
| 35 | SAML SSO and SCIM provisioning | Security | Not for us | Missing | — | Enterprise-only; revisit with custom plans |
| 36 | Support tickets: open by category, reply, resolve; admins see all, members see their own | Support | Expected | Partial | `support/`, `support/SupportViews.tsx`, `Thread.tsx`; app-api `/tickets` | No attachments (screenshots) on tickets or service requests. S |
| 37 | Services: catalog → request → quote (accept / decline / pay) → deliveries (approve / revise) → messages | Services | Differentiator | Have | `services/`, `services/requests/[id]`, `services/RequestDetail.tsx`; app-api `service-requests/:id/actions` | — |
| 38 | Notification center: unread count, all / unread, mark one or all read, deep links | Notifications | Expected | Have | `notifications/` → `account/NotificationsView.tsx`; app-api `/notifications`, `/notifications/read` | — |
| 39 | Notification preferences (per type and channel: email / in-app) | Notifications | Expected | Missing | — | S |
| 40 | Export workspace data (choose tools → archive) | Data | Expected | Missing | Spec USR-27; nothing in app-api or UI | Needed for nFADP / GDPR requests; each tool has to export its own data. L |
| 41 | Delete the workspace: type its name to confirm, open invoices block it, data kept for the retention days | Data | Expected | Have | `account/WorkspaceSettings.tsx`; app-api `/workspace/delete` (`unpaid`, `deleteAt`) | The customer can't restore it within the window; only staff can reactivate (ADM). S |

## Top 8 to add (ordered by value)

1. **2FA**: personal first, then a workspace rule that makes it mandatory (#31). Both reference consoles lead with it, and it is the paid-tier lever in G-21. M.
2. **Transfer ownership** (#13). Today, if an owner leaves the company, the workspace and its billing are stuck. The UI copy already promises it. S.
3. **Workspace audit log**, including OrgTik staff "view as" entries (#33). The mock already records the events; this is a read view. M.
4. **Usage and limits page** (#27). Limits already exist in the catalog. Showing them drives upgrades and explains hard-limit blocks. M.
5. **Data export** (#40). Swiss nFADP and GDPR requests, and customer trust before they commit. L.
6. **Onboarding checklist on Home** (#2): invite the team, pick tools, add billing details. It turns new free workspaces into trials. M.
7. **Invoice PDF and billing contacts** (#23). Gulf and CH accounting teams need a document with the TRN / UID on it, sent to more than one person. S, shared with ADM.
8. **Team lifecycle basics**: deactivate a member, leave a workspace, resend and bulk invites, team search (#12, #17, #9, #16). Each is S, and together they cover the day-to-day admin jobs.


## A26 presentation overlay — 2026-10-08

PR26 account scene accepted; fixed PDF/contact extension has local evidence and awaits package CI. Existing benchmark scores and backend claims above remain historical. See the maintained release register and prototype guide; this overlay does not accept all72 or all15 journeys.
