# HR P4 checkpoint

Dedicated branch: feat/suite-v3-hr. Shared base: 76bd23f, including dab0a11, 08c775b and 4745c80. Verification uses the owned memory-only demo, frozen at 2026-10-07T09:00:00Z. No deployment or provider integration is included.

## Ordinary feature map

| Capability | Ordinary surface | Persisted owner source |
| --- | --- | --- |
| Leave policy, annual/monthly accrual, carry and balances | /people/policies; /calendar/leave-balances redirects here | Existing HR settings + employment allocation + approved leave; native leave/calendar calculation retained |
| Self profile and approved change requests | /people/profile; /people/team | Existing employment fields + employee.workspaceFeatures; canonical person fields are not directly changed |
| Directory and My team | /people/directory; /people/team | Current employment visibility and manager relationships |
| Employee import | /people/import | Four-stage CSV source/mapping/review/result; existing hr.hire command and per-row receipt |
| Onboarding to Tasks | /people/onboarding | Actual employee checklist + actual Tasks rows/project/section; source-owned status references |
| Document expiry, mailbox and letters | /people/documents; /people/mailbox | Metadata, expiry reminders, generated employment/salary/experience sample letters and simulated mailbox on employment rows |
| Clock and correction to payroll | /people/attendance | Existing sessions; original sessions retain superseded provenance; effective correction updates draft payroll metrics |
| Reviews and goals | /people/performance | Existing employee extensions with self/team/HR visibility |
| Recruiting, scorecards, offer and Hire autofill | /people/recruiting; retained candidate/job screens | Existing applications/stages and application extensions; Hire calls existing hr.hire and links the real employee |
| Signed and anonymous careers | /careers; /jobs/:workspaceId | Actual publish setting/open jobs; anonymous text-only applications use the existing application constructor |
| Country holidays and workforce reports | /people/holidays; /people/reports | Existing attendance holidays/employee country and real employment headcount/turnover |
| CH/AE bank sample layouts | Retained payroll detail | Actual approved/queued payroll rows, including their snapshot currencies |
| Admin, billing, onboarding and six states | /admin/:section; /; ordinary people screens | Shared eight-section ToolAdminScreen, bootstrap/usage/roles/settings/connections/audit/export and real first-run counts |

Bulk import and candidate Hire preserve real pending invitations and employment, with tools:[] so seat assignment is explicit. Pending invitations stay invited, not activated. The individual employee wizard retains its established behavior.

## Ownership and mock scope

HR changes are in apps/hr, mock/apps/hr, mock/apps/hr.js and the narrow HR tool adapter. Extensions persist on existing employment/application/settings rows and survive the existing owner codec. Shared auth, session, journal, CAS, workspace authority and ecosystem contracts remain root-owned.

The pure public hooks are publicCareers({planEligible,canApply}) and applyPublicCareer({planEligible,canApply,jobId,application,operationId}) on the HR runtime. Root mounts bounded anonymous GET /v1/public/careers/:workspaceId and POST /v1/public/careers/:workspaceId/jobs/:jobId/applications with Idempotency-Key. Publication needs the actual careers setting and live HR plan. The DTO exposes opened job metadata only. Exact submission replay returns the same application; private fields/extra public fields are refused. Suspended/read-only workspaces cannot accept applications. Private HR admission is unchanged.

Mail, offers, signatures, letters and bank exports are explicitly simulated/sample outputs. They do not call live providers; bank CSVs are labelled NOT-FOR-BANK-SUBMISSION and preserve real row currencies. There are no arbitrary upload/provider shortcuts or presentation business datasets in ordinary flows.

## Design-system migration inventory

Original visual files in components/ui, the old Table, StatusBadge and MainHeader are deleted. Their callers now render shared @orgtik/ui controls, DataTable, PageHeader, charts, status matrix and Tiptap editor. Shadcn configuration/dependency/CSS import are removed. Alias-only Card, Badge, Label, Dialog, Sheet and Menu binding files are removed and their callers import shared exports directly.

Remaining mechanical adapters are components/bindings/select.tsx, radio-group.tsx, tabs.tsx, tooltip.tsx, avatar.tsx and children.ts. They translate existing compound children/props into shared controls without local visual-control implementations. Select retains trigger IDs, disabled state, accessible names and grouped labels; Tooltip retains render children and callbacks. ResourceTable binds the existing URL paging/selection callbacks to shared DataTable. EmploymentStatus uses the shared status matrix with localized employment labels. RHF bindings remain under components/ui/form. EmployeeFacts, WizardStep and HrRichTextEditor are house-domain compositions using shared primitives.

All five catalogs have matching keys/placeholders. Arabic copy is translated; DE/FR/IT retain the allowed English fallback for new HR copy.

## Verification

Accepted result files are flow.json, browser.json, states.json, ordinary-routes.json, public.json, public-readonly.json and preferences.json. verification.json records 450 accepted scripted checks, 50 passing test cases and 117 accepted captures. browser-first-pass.json, browser-settings-assertion.json, states-first-pass.json and ordinary-routes-first-pass.json are historical failed attempts, excluded from accepted totals. They document resolved hydration/locator assumptions; the cold auth route is prewarmed before minting the one-minute handoff.

The main browser matrix covers six ordinary people views in EN/AR, light/dark, 1440/390/768/1024. Each view checks ordinary routing, document overflow and serious/critical WCAG2 A/AA axe findings. The route smoke additionally covers retained HR screens and the other people views, with core retained routes in AR at390. The six-state harness uses actual empty HR trial, employee denial, forced read-only View-as, saved success and temporary network delay/outage with recovery. Theme evidence performs a real Account-menu toggle and HR→Account handoff.

Commands:

- pnpm --filter @orgtik/ui build
- pnpm --filter somion-hr-management-system typecheck
- pnpm --filter somion-hr-management-system i18n:check
- pnpm --filter somion-hr-management-system build
- node --test mock/apps/hr/workspace-v3.test.js mock/apps/hr/workspace-runtime.test.js mock/apps/hr/runtime-boundaries.test.js mock/lib/workspace-hr.test.js mock/lib/workspace-leave.test.js mock/lib/workspace-leave-boundary.test.js
- node program/audits/v3-p4/hr/flow.mjs
- node program/audits/v3-p4/hr/preferences.mjs
- node program/audits/v3-p4/hr/browser.mjs
- node program/audits/v3-p4/hr/states.mjs
- node program/audits/v3-p4/hr/ordinary-routes.mjs
- node program/audits/v3-p4/hr/public.mjs
- node program/audits/v3-p4/hr/public-readonly.mjs
- node tools/dev/workspace-manifest.mjs
- node program/phase-f/contracts.mjs

The six HR test files pass 50/50, including retained identity/seat/custody, leave refusal rollback/calendar isolation/cold restore and new owner-domain/public-careers/currency behavior. Production build, typecheck and five-catalog check pass. Inventories are generated source inventories; root will regenerate combined versions after integration.

Owned runtime: session16746, presentation-rMneB0. Web 3900/3901/3904; API 7900/7901/7904/7908; icons 7999; connections 7977. This run is separate from root/Tasks/CRM demos.

## Reviewed onboarding status follow-up

The overall employee badge now uses the exact same resolved linked/manual steps as the checklist, independently of the employment wizard's onboardingComplete flag. Empty and unavailable linked work stay Pending. References refresh on focus/visibility and every 30 seconds while visible, scoped to the current workspace/token. Manual steps have no mutation affordance when the current actor cannot manage them; unavailable linked steps have none.

Against shared fraction fix6b85927, onboarding-review.json records 11 passing actual API/browser checks and 2 AR dark390 captures. An actual Tasks record changes pending→done, then HR focus refresh changes0%/Pending→100%/Complete. The HR manual done/setup fields are unchanged. node --experimental-strip-types --test apps/hr/lib/hr-onboarding.test.mjs passes 3 focused cases for empty, stale/manual and current linked status. HR typecheck passes. The original117 captures were not repeated for this bounded correction.
