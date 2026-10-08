# Sales benchmark: OrgTik Sales (CRM) vs HubSpot CRM and Pipedrive

> Latest presentation overlay — 2026-10-08; A33/A34. Validated merge baseline `eebc85d` through PR37; closure extensions await integration.
>
> Connected campaign/website intake, follow-up Tasks, editable pipeline/probability/forecast, import/export, timeline/routing, mock quote/print/signature and reports. Company/field detail source has accepted focused UI evidence: 80 scoped checks and23 captures, including functional paths, locale/theme/width and digit-format checks shared with Marketing depth.
>
> UI/mock package coverage is separate from the historical benchmark below. No competitive rating or score was recalculated. Backend, hosted and external capabilities remain pending/deferred. Evidence: program/audits/prototype-business-closure/business-report.json; program/audits/sales-presentation/README.md; program/audits/prototype-final/feature-detail-report.json; `program/prototype-journeys.md`.


Date: 2026-10-07. Read from code and mock, not from screen names. Scope: the CRM part of `apps/sales` only. The 17 frozen SaaS-admin routes (plan-management, coupons, packages, subscriptions, invoices, tickets) are out of scope because they are moving to ADM/USR (D-011).

**Summary**
- Expected and Missing: **12** (companies, custom fields, tags, forecast, tasks, call/email logging, quote expiry, targets, automation, import, export, bulk actions).
- Expected and Partial: **10** (duplicate merge, deal board and stages, won/lost reporting, meetings, record timeline, quote PDF and e-sign, product catalog, funnel reports, customer hand-off, mobile).
- Differentiators: **10** are worth having. 6 are already shipped: website lead intake with UTM, online counter/accept, contract approval with commission, commissions and wallets, the customer portal, and 5 languages with RTL. 4 are worth adding or finishing: automatic lead routing, WhatsApp, a Marketing link, and Files for documents.

Evidence key: `crm` = `mock/apps/sales/crm.js`, `deals` = `mock/apps/sales/deals.js`, `engage` = `mock/apps/sales/engage.js`, `billing` = `mock/apps/sales/billing.js`. Routes are under `apps/sales/app/[locale]/(dashboard)/`, and components are under `apps/sales/components/`.

Ratings:
- **Expected** means HubSpot CRM and Pipedrive both treat it as standard for a small team.
- **Differentiator** means it is uncommon in those products, or it fits OrgTik's suite or markets (website hand-off, Arabic, the Gulf and Egypt).
- **Not for us** means it does not fit non-technical SMB owners now.

Sizes: S ≤ 3 days, M ≤ 2 weeks, L > 2 weeks.

| # | Feature | Area | Rating | OrgTik today | Evidence | Gap & size |
|---|---|---|---|---|---|---|
| 1 | Contact/lead records: name, email, phone, company, country, preferred language (all 5), owner | Contacts | Expected | Have | `customers/[id]`, `components/pages/customers/CustomerDetails`; crm `customerOut`, `customerBody` | — |
| 2 | Companies as their own records, with several contacts and deals per company | Contacts | Expected | Missing | The company is a text field (`companyName`) on the contact (crm `customerBody`) | A company entity, with contacts and deals linked to it. M |
| 3 | Custom fields on contacts and deals | Contacts | Expected | Missing | The fields are fixed in crm `customerBody` and deals `PATCH /api/projects/:id` | Owner-defined text, number, date and choice fields, in forms, list columns and filters. M |
| 4 | Tags / labels on contacts | Contacts | Expected | Missing | There is no tag field in crm `customerOut` | Free tags, with a filter. S |
| 5 | Search and filters (stage, source, owner, age), kept in the address | Contacts | Expected | Have | `customers/page.tsx` + `components/pages/customers/LeadToolbar`; crm `GET /api/customers` (source, owner, createdAfter, search) | — |
| 6 | Duplicate handling | Contacts | Expected | Partial | Create refuses an existing email (409). Website intake adds a note to the existing lead instead of a copy. There is a `duplicate` stage (crm `customerBody`, `/api/leads/intake`) | Merge two records (notes, deals, documents). S |
| 7 | Documents on the record (ID, business registration) | Contacts | Differentiator | Partial | crm `POST/DELETE /api/customers/:id/documents/{id,business}`; `CustomerDetails/DocumentsDetails`. Stored in the Sales uploads only | Keep them in the Files app and open them from there. S |
| 8 | Website lead intake with source, page, bundle, UTM and message | Leads | Differentiator | Have | crm `POST /api/leads/intake` (D-028); WM forwards its form (`mock/apps/wm.js:369`); `CustomerDetails/LeadSourceDetails`, `customers/LeadSource` | — |
| 9 | One lead pipeline (new → contacted → qualified → quoted → won/lost, plus unqualified/spam/duplicate), lost needs a reason, list and board views | Leads | Expected | Have | crm `LEAD_STATES`, `PATCH /api/customers/:id/status`; `customers/pipeline/page.tsx` (Board: drag, keyboard, "Move to"); `dialogs/customers/LostLeadDialog` | — |
| 10 | Manual assignment and reassignment (admin, manager) | Leads | Expected | Have | `dialogs/customers/AssignOwnerDialog`; crm `customerBody` (salespeople can't reassign) | — |
| 11 | Automatic routing of new leads (round-robin or by rule) | Leads | Differentiator | Missing | Intake creates the lead with `assignedSalesmanId: null` and notifies admins (crm `/api/leads/intake`) | Round-robin or source/country rules for website leads. S |
| 12 | Stale-record nudge ("needs check-in" after 14 days without activity) | Leads | Expected | Have | crm `customerSummary.contactAttention`; `CustomerDetails/CustomerOverview` | — |
| 13 | Lead scoring | Leads | Not for us | Missing | — | — |
| 14 | Deal records (projects): value, priority, due date, owner, plans | Deals | Expected | Have | `projects/`, `projects/[id]`; deals `/api/projects*` | — |
| 15 | Deal board with stages the owner can edit, more than one pipeline | Deals | Expected | Partial | Projects are a table with fixed statuses (deals `changeProjectStatus`). Only the lead pipeline is a board, and its stages are fixed | A board for deals and editable stages. M |
| 16 | Win probability, expected close date, weighted forecast | Deals | Expected | Missing | Deals have no probability or close-date field (deals). The dashboard shows past sales only (engage `staffDashboard`) | Probability per stage, a close date, and a forecast by month. M |
| 17 | Won/lost reason reporting and win rate | Deals | Expected | Partial | The lost reason is stored (crm). The dashboard shows stage counts only (engage `customerStatus`) | Lost reasons and win rate by source and owner. S |
| 18 | Notes on contacts and deals | Activities | Expected | Have | crm `/api/customers/:id/notes`; deals `/api/projects/:id/contact-notes`; `CustomerNotes`, `projects/ProjectNotes` | — |
| 19 | Meetings | Activities | Expected | Partial | One `meetingAppointment` per contact, replaced when rescheduled (crm `POST /api/customers/:id/meeting`); `dialogs/customers/ScheduleMeetingDialog` | Several meetings per record, a meetings calendar, and a calendar invite (.ics). M |
| 20 | Tasks and follow-up reminders | Activities | Expected | Missing | The Sales mock has no task model, and there is no link to the suite's Tasks app (`apps/tasks`) | Create a follow-up in Tasks from a lead or deal, with a due date and owner. M |
| 21 | Log calls and emails on the record, send email from the CRM, click-to-call | Activities | Expected | Missing | The Sales mock has no call or email activity. The phone shows as plain text | Log a call with its outcome, `tel:` links, and send/log email (BCC or suite mail). L |
| 22 | Record timeline (every activity in one place) | Activities | Expected | Partial | Timelines exist on offers and projects (`offers/OfferTimeline`, `projects/ProjectTimeline`) and app-wide in `activity-feed/`. The contact page has none | A contact timeline: notes, meetings, offers, stage changes. M |
| 23 | Real-time notifications | Activities | Expected | Have | engage `/api/notifications*`; socket `/notifications` (`mock/apps/sales.js`) | — |
| 24 | WhatsApp click-to-chat and conversation log | Communication | Differentiator | Missing | There is no WhatsApp in `apps/sales` | A `wa.me` link and "log as activity". S |
| 25 | Quote/offer builder: plans, custom plan, VAT %, installments, deal currency | Quotes | Expected | Have | `dialogs/shared/deal-plans/DealBuilderDialog`; deals `buildDeal`, `POST /api/offers`; engage `/api/currency/*`, `/api/vat/countries` | — |
| 26 | Customer counters, accepts or declines the offer online | Quotes | Differentiator | Have | deals `/api/offers/:id/{counter,accept,reject}`; `offers/OfferRespondCard`; flow `program/tools/audit-kit/flows/sales.mjs` | — |
| 27 | Quote PDF and e-signature | Quotes | Expected | Partial | A contract PDF is generated and a signed copy is uploaded (deals `/api/contracts/:id/pdf`, `/sign/upload`). Offers have no PDF, and there's no e-signature | Offer PDF in the customer's language, plus click-to-sign. M |
| 28 | Quote validity and expiry | Quotes | Expected | Missing | Offers have no valid-until field (deals `createOffer`) | A valid-until date, auto-expiry, and a reminder. S |
| 29 | Manager approval of contracts, setting the commission | Quotes | Differentiator | Have | deals `/api/contracts/:id/approve`, `/reject`; `dialogs/projects/ApproveContractDialog` | — |
| 30 | Product catalog and price lists | Products | Expected | Partial | The deal builder prices from plans and features with zone prices (`mock/apps/sales/catalog.js`). Their management is on the frozen plan-management routes, which are moving to ADM | The tenant's own products/services and price list, editable in Sales. M |
| 31 | Roles and record visibility (own vs all) | Team | Expected | Have | Role matrix in `program/audits/sales/wave-plan.md`; crm `canSeeCustomer`, deals `canSeeProject`, 403 guards | — |
| 32 | Commissions (fixed or %), payouts, salesperson wallets | Team | Differentiator | Have | `commissions/`; billing `/api/commissions/*`, `/api/wallets/salesmen/*`; `dialogs/salesman/PayoutDialog` | — |
| 33 | Sales targets / quotas, with progress | Team | Expected | Missing | There's no target model. `salesmanStats` shows history only (crm) | A monthly target per person and team, with progress on the dashboard. M |
| 34 | Salesperson performance page | Team | Expected | Have | `salesman/[id]`; engage `salesmanPerformance` | — |
| 35 | Territories | Team | Not for us | Partial | Salespeople have `zoneId` and `departmentId`. A manager's dashboard is scoped by department (engage `scopeFor`) | — |
| 36 | Role-based dashboard: KPIs, sales trend, stage mix, top plans, needs attention | Reports | Expected | Have | `page.tsx` + `components/pages/home/*`; engage `GET /api/dashboard` | — |
| 37 | Funnel conversion and lead-source reports | Reports | Expected | Partial | `home/LeadPipelineChart` shows stage counts. There's no conversion rate by stage, source or owner | Conversion over a period by stage, source and owner. M |
| 38 | Custom report builder | Reports | Not for us | Missing | — | — |
| 39 | Workflow automation ("when X, do Y") | Automation | Expected | Missing | Only built-in rules exist: an offer moves the lead to quoted (deals `createOffer`), and a meeting moves it to contacted (crm `/meeting`) | Simple recipes: on a stage change, create a task, notify someone or send an email. L |
| 40 | Customer portal: offers, projects, contract signing, own dashboard | Portal | Differentiator | Have | `customer` grant (`mock/apps/sales.js`); `home/CustomerHome`, `offers/OfferRespondCard`, `projects/ProjectContractCard`; engage `customerDashboard` | — |
| 41 | Customer account hand-off (invite to sign in, USR account) | Portal | Expected | Partial | There's an invite on create (`sendInvite`, crm `newInvite`), and the link can be copied. Resend and revoke wait for endpoints (`CustomerDetails/AccountAccess` header comment). There's no USR link | Resend/revoke, and a link to the USR account. S |
| 42 | Marketing link: leads tied to campaigns, CRM stages usable as audiences | Suite | Differentiator | Missing | UTM is stored on leads (crm `sourceContext`), but it isn't tied to Marketing campaigns, and the audiences aren't shared | A campaign id on leads, and a segment sync. M |
| 43 | Import contacts (CSV) | Data | Expected | Missing | There's no import in `apps/sales` | CSV import with column mapping (Marketing's importer can be reused: `mock/apps/marketing/routes/audience.js`). M |
| 44 | Export (CSV) | Data | Expected | Missing | There's no export in `apps/sales` | Export the filtered list. S |
| 45 | Bulk actions (assign, move stage, delete) | Data | Expected | Missing | The `customers/` DataTable has row actions only (`customers/CustomerRowActions`) | Multi-select actions. S |
| 46 | Mobile use | Data | Expected | Partial | The responsive web is checked at 390px (`program/audits/sales/vs1/*`). There's no app, push or offline | Quick actions on a phone (call, log, move stage) and push. M |
| 47 | Five languages, including Arabic RTL | Data | Differentiator | Have | `apps/sales/messages/{en,ar,de,fr,it}.json`; vs1 renders in all 5 | — |

## Top 8 to add (by value)

1. **Tasks and follow-ups through the Tasks app** (#20). Today nothing reminds a salesperson to call back. M.
2. **CSV import, export and bulk actions** (#43–45). Owners arrive with spreadsheets, so this is the first thing they need. M.
3. **Deal board with editable stages, probability, close date and forecast** (#15, #16). M.
4. **Contact timeline with several meetings, plus call, email and WhatsApp logging** (#19, #21, #22, #24). M–L.
5. **Automatic routing of website leads, plus simple automations** (#11, #39). Website leads currently arrive with no owner. S + L.
6. **Offer PDF, validity date and e-signature** (#27, #28). M.
7. **Companies, custom fields and tags** (#2–4). M.
8. **Targets, plus funnel, source and lost-reason reports** (#17, #33, #37). M.


## A26 presentation overlay — 2026-10-08

PR28 Sales scene accepted: forecast/routing/fields/CSV/bulk/mock signatures/local tasks; integration and full tool acceptance pending. Existing benchmark scores and backend claims above remain historical. See the maintained release register and prototype guide; this overlay does not accept all72 or all15 journeys.
