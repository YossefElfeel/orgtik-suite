import fs from 'node:fs';
import { parseCsv } from './reconcile-v3.mjs';

const groups = {
  TASKS: { name: 'Tasks', evidence: 'audits/v3-p4-tasks/README.md', rows: [
    ['Project list and My tasks', 'Current visible task query, assignee/priority/date/label filters, saved views and shared source search.', 'No production search service.'],
    ['Task inspector', 'Stored watchers and reminder settings create actual local notification receipts; overdue uses workspace time.', 'External email/push delivery deferred.'],
    ['Task inspector and completion', 'Current stored recurrence produces the next native task once on completion.', 'Production scheduling remains separate.'],
    ['Task inspector and quick add', 'Three sample templates plus persisted save/reuse, with actual task fields and owner checks.', 'No cross-provider template import.'],
    ['Task inspector → Attach from Files', 'Current Files permission, source audience and exact workspace/file/version reference; open resolves protected bytes.', 'Approved packaged assets; arbitrary uploads deferred.'],
    ['Project list and task inspector', 'Current label picker/filter and persisted task labels.', 'Prototype workspace label contract.'],
    ['Project toolbar → Import / Export', 'Text CSV mapping, per-row errors/outcomes and filtered RFC4180 export of native rows.', 'Arbitrary binary and external Asana/Trello import deferred.'],
    ['Project toolbar and list', 'Native quick add, selection and bulk outcomes; blocked dependencies remain enforced for board moves.', 'No fabricated client-only task IDs.']
  ] },
  HR: { name: 'HR', evidence: 'audits/v3-p4/hr/README.md', rows: [
    ['/employees/:id → Offboard', 'Retained departure flow preserves identity, source custody, equipment and settlement records.', 'Payroll/provider execution is simulated.'],
    ['/people/policies, /calendar/leave-balances and tool Admin', 'Actual leave policy/accrual/balance projection, employee request/cancel and manager approval.', 'No legal payroll-compliance claim.'],
    ['/people/profile, /people/directory, /people/team', 'Current canonical employee profile/directory and approved contact/bank change requests; private salary stays guarded.', 'External email is a local mailbox sample.'],
    ['/people/import', 'CSV mapping/validation stores actual employee records and pending native invitations with bounded outcomes.', 'Seat assignment remains explicit; arbitrary XLSX upload deferred.'],
    ['/payroll and employee editor', 'Current employee currency and recorded payroll export produce explicit CH/UAE sample formats.', 'Bank submission/provider/regulatory acceptance deferred.'],
    ['/people/onboarding', 'Current source employee creates exact native Tasks in eligible projects/sections, with original operation recovery.', 'External reminder delivery deferred.'],
    ['/people/documents and employee detail', 'Stored document expiry and current source reminders use packaged immutable Files references.', 'Arbitrary document uploads deferred.'],
    ['/people/mailbox and HR activity', 'Actual mock notifications/mailbox records for the scoped HR events, with current recipient permissions.', 'No real email provider.']
  ] },
  FILES: { name: 'Files', evidence: 'audits/v3-p4-files/README.md', rows: [
    ['/file/:id and native Tasks/Chats pickers', 'Current source permissions and pinned file/version references resolve the original immutable content.', 'Arbitrary uploads deferred.'],
    ['/file/:id → Versions', 'Packaged new versions, conflict resolution, keep-both/replace/restore, retaining exact historical bytes and custody.', 'No arbitrary upload/conversion provider.'],
    ['/file/:id → Sharing', 'Canonical per-person grant and actual source recipient notification with exact deep link.', 'External email/push deferred.'],
    ['/file/:id → Access', 'Effective view/comment/edit grants, inherited/protected source ACL, removal and readonly ceilings.', 'No client-side permission authority.'],
    ['/ and /admin/settings', 'Current retained byte usage, storage policy, warnings and admission-time blocking for new samples/versions.', 'Packaged-assets quota is the prototype safety contract.'],
    ['/ and folder routes', 'Native selection, drag/destination move and per-item conflict outcomes; archive/restore keep identities.', 'ZIP/provider storage extensions outside scoped evidence.'],
    ['/file/:id → Comments', 'Actual attributed source comments under current grant/read-only rules.', 'Live external notification delivery deferred.'],
    ['/ and /my-files', 'Current-visible file/folder query, type and order, native saved views, actual suite search/activity.', 'No external index.']
  ] },
  SALES: { name: 'CRM', evidence: 'audits/v3-p4-crm/README.md', rows: [
    ['/customers/:id and projects → Follow-up', 'Actual source-owned Task creation in native project/section and exact retained relation.', 'External reminders deferred.'],
    ['/customers and CRM toolbar', 'Current native CSV import/export and per-row assignment/stage/delete outcomes.', 'No arbitrary provider import.'],
    ['Customer/project pipeline routes', 'Owner-configured pipelines/stages, probabilities and forecast from current native deals.', 'No external revenue prediction.'],
    ['/customers/:id → Activity', 'Current notes, call/email/meeting logs, offers and stage events in one source timeline.', 'Call/WhatsApp/email actions are explicit simulations.'],
    ['/admin/settings and current leads', 'Stored lead routing and bounded source rules apply to current native records.', 'Provider automation deferred.'],
    ['Offer detail and compatibility constructor', 'Immutable authenticated offer PDF, validity and explicit local signature; retained price/contract semantics stay intact.', 'Real e-signature/regulatory acceptance deferred.'],
    ['/companies, /customers, /admin/settings', 'Actual company masters, typed fields/tags and prospect duplicate merge, without copied Marketing masters.', 'No production CRM synchronization provider.'],
    ['/reports and targets', 'Native target/progress, stage/source/lost-reason projections from visible CRM records.', 'Historical contracts keep their preserved money semantics.']
  ] },
  CHATS: { name: 'Chats', evidence: 'audits/v3-p4/chats/README.md', rows: [
    ['/hq/chat/:id', 'Current native channels/messages/history, exact source scope, immutable retries and reload recovery.', 'Production real-time gateway is deferred.'],
    ['/hq/chat/:id and call/board detail', 'D071 exact pinned Files references and protected packaged previews; D072 real vector board versions/CAS.', 'Arbitrary media uploads deferred.'],
    ['Shared bell, /hq/chat/catch-up and settings', 'Current source notices and personal reminders are native records, with visible local delivery semantics.', 'Desktop push and real email remain deferred.'],
    ['/hq/meetings/:id/call and office huddles', 'Signed host/participant controls, actual anonymous guest lobby/admission and source-owned recording state.', 'Real microphone/camera/screen transport is explicitly simulated.'],
    ['Message → Create Task', 'Current source-aware native Tasks picker and audience check, verified link and actual Tasks handoff.', 'No synthetic demo-bridge Task.'],
    ['/hq/chat/:id → Formatted message', 'Shared RHF/Zod rich editor saves source content; original body and operation survive uncertain responses.', 'Prototype rich-content format; no external editor service.'],
    ['/hq/chat/:id → Browse public channels', 'Current discovery and actual public membership; private/DM history stays guarded.', 'No public client-channel expansion.'],
    ['Message controls and catch-up', 'Stored workspace-zone scheduled message, explicit sample delivery, personal save/reminder and current source receipts.', 'External timed delivery deferred.']
  ] },
  MARKETING: { name: 'Marketing', evidence: 'audits/v3-p4-marketing/README.md', rows: [
    ['Current project campaign and CRM contact selector', 'Fresh canonical CRM references/consent and guarded campaign/page lead attribution; no duplicated contact masters.', 'Live CRM provider sync deferred.'],
    ['Campaign audience and send controls', 'Unknown/opted-out suppression, current opt-in provenance and fresh approval/template checks before native mock delivery.', 'External email tracking/delivery is simulated.'],
    ['Campaign → Results', 'Current CRM lead/deal outcomes and currency-separated estimates; deterministic mock engagement is visibly labelled.', 'Production tracking/pixel providers deferred.'],
    ['Campaign email editor', 'Shared RTL-safe design blocks, current brand kit, export and actual native approval state.', 'Email renderer/provider delivery deferred.'],
    ['Social inbox', 'Native source thread/reply state with an explicitly local send.', 'Real Facebook/Instagram providers deferred.'],
    ['Posting queue and calendar', 'Stored native order/time, drag/move schedule and re-approval gates when content changes.', 'Provider posting and real best-time analytics deferred.'],
    ['Campaign journey', 'Current ready/approved source steps and actual source-owned Tasks in eligible project/section; exact operation receipts.', 'Provider-triggered automation deferred.'],
    ['Writing and brand kit', 'Persisted native brand guidance and labelled deterministic writing samples.', 'No real AI provider claim.']
  ] },
  WM: { name: 'Website Manager', evidence: 'audits/v3-p4-wm/README.md', rows: [
    ['/content/pages/:id → Review / Publish', 'Actual CMS draft/review publication and runtime website reload with last-known-good fallback.', 'Website markup/CSS/design remain frozen; public Arabic launch deferred.'],
    ['/overview → Analytics', 'Source-owned deterministic local analytics samples, clearly labelled.', 'Real traffic provider deferred.'],
    ['Shared staff bell and content review', 'Actual owner/reviewer/lead projections and guarded CRM launch for the current effective staff person.', 'External delivery deferred.'],
    ['Public form endpoint and form settings', 'Retained bounded spam rules/rate outcomes with explicit local source records.', 'Production anti-abuse acceptance deferred.'],
    ['/media', 'Packaged asset tags, bounded batch/replace operations preserve references/uses.', 'Arbitrary upload and conversion provider deferred.'],
    ['/media and native editor preview', 'Current packaged responsive renditions/focal metadata and editor preview.', 'Website markup/srcset redesign and arbitrary image service deferred.'],
    ['Entry → Translation draft', 'Explicit deterministic translation draft goes through the actual review/publication gate.', 'Real AI translation provider deferred.'],
    ['/releases', 'Native retained release versions, review/four-eyes policy and guarded rollback to published content.', 'No invented snapshot or website-design replacement.']
  ] },
  ADM: { name: 'OrgTik Console', evidence: 'audits/v3-p4-console/README.md', rows: [
    ['/billing', 'Current native failed invoices, policy, retry pause/recovery, local dunning/card-expiry notices.', 'Live gateway/email deferred; existing financial reducers preserved.'],
    ['/billing and invoice document', 'Immutable invoice PDF bytes and per-entity/year number series from native issued snapshots.', 'Regulatory e-invoicing deferred.'],
    ['/workspaces/:id → Subscription line', 'One exact line uses native server preview/confirm, quantity/plan/cycle/cancel/resume and original attempt recovery.', 'Existing quotation/proration policies retained.'],
    ['/reports', 'Current native recurring MRR, actual source movement deltas and cohorts, with scoped CSV.', 'Historical trend data is not fabricated.'],
    ['/tax/checks', 'Explicit UID/VAT mock checks and labelled regulatory preview.', 'Live VIES/ZATCA/ETA/submission deferred.'],
    ['/billing → Pay link and Account /billing/pay/:id', 'Actual current invoice/owner/link/method and exact replay/revocation guards.', 'Payment provider remains mock.'],
    ['/billing and /reports → Export', 'Native invoice/payment/credit/accounting rows and formula-safe CSV.', 'Real accounting connector deferred.'],
    ['/staff/security and audit', 'Mock staff 2FA configuration plus current actual staff action/read-only audit projections.', 'Authentication-strength/identity hardening deferred.']
  ] },
  USR: { name: 'Account', evidence: 'audits/v3-p4-account/README.md', rows: [
    ['/account/security', 'Person-scoped local 2FA enrollment/recovery/policy previews with explicit mock code.', 'Real authentication-strength changes deferred.'],
    ['/team → Transfer ownership', 'Actual eligible successor, existing stable command and native ownership change.', 'Frozen seats and financial behavior retained.'],
    ['/account/audit', 'Current workspace activity/filter and true actor/effective identity including View as start/exit.', 'Prototype audit retention contract.'],
    ['/usage', 'Current admitted-tool usage, purchased/assigned capacity and metered limits.', 'No fabricated provider usage.'],
    ['/account/data', 'Structured current-visible owner-domain records with secrets/hashes excluded.', 'No regulatory-compliance or full production archive guarantee.'],
    ['/account/setup and adaptive Home', 'Checklist derives from actual membership/lines/billing/source records, with person-scoped dismissal.', 'No fake presentation onboarding state.'],
    ['/billing/invoices/:id and /billing/contacts', 'Actual document/print-PDF and guarded native billing contacts.', 'External receipt email deferred.'],
    ['/team', 'Canonical native membership/invitations/capacity, bulk outcomes, custom roles and suspension/recovery.', 'External invitation delivery remains local mailbox.']
  ] }
};
const packages = parseCsv(fs.readFileSync('program/backlog/release-packages.csv', 'utf8')).rows;
const commitments = packages.filter(row => /^R3-(TASKS|HR|FILES|SALES|CHATS|MARKETING|WM|ADM|USR)-\d\d$/.test(row.id));
if (commitments.length !== 72) throw new Error('Expected original 72 commitments');
let markdown = '# OrgTik v3 ordinary-screen feature map\n\nThe original 72 commitment IDs and titles are preserved. The current implementation uses signed ordinary routes and native owner-domain mock records under D-075/D-076. Historical presentation routes remain isolated references and are absent from ordinary navigation. This map specifies frontend/mock behavior, its tool-cycle evidence and remaining external boundaries; it does not imply production providers or acceptance of every broader historical benchmark.\n\n';
for (const [key, group] of Object.entries(groups)) {
  markdown += `## ${group.name}\n\nEvidence: [ordinary cycle](${group.evidence}).\n\n| ID | Original commitment | Ordinary entry | Native behavior | Limits |\n| --- | --- | --- | --- | --- |\n`;
  const rows = commitments.filter(row => row.id.startsWith('R3-' + key + '-')).sort((a, b) => a.id.localeCompare(b.id));
  if (rows.length !== 8 || group.rows.length !== 8) throw new Error(key);
  rows.forEach((row, index) => {
    const [route, behavior, limits] = group.rows[index];
    markdown += `| ${row.id} | ${row.title} | ${route} | ${behavior} | ${limits} |\n`;
  });
  markdown += '\n';
}
markdown += '## Approved Tier B and shared ownership\n\n';
markdown += '| Owner | Ordinary additions | Evidence |\n| --- | --- | --- |\n';
const additions = {
  TASKS: 'Timeline/Gantt, typed custom fields, bounded native rules, source time tracking, project archive and actual first-run sample project.',
  HR: 'Employee/manager self-service, web clock and correction→payroll, reviews/goals, careers/scorecards/offer→Hire, country holiday sets, letters and headcount/turnover reports.',
  FILES: 'Current Shared with me/starred/recent, retention-based due purge, protected write-only sample request links and immutable packaged sheet/slide PNG previews.',
  SALES: 'Actual call/email/meeting logs, multiple pipelines, duplicate merge, targets/funnel, explicit local WhatsApp/click-to-call.',
  CHATS: 'Actual sample typing/read receipts, @channel/@here audiences, native polls, simulated voice and bounded anonymous meeting guest lobby across browsers.',
  MARKETING: 'Fresh canonical CRM contact browse/reference/consent, native sender/domain mock verification and self-test delivery receipts.',
  WM: 'Source draft autosave with revision conflict handling, element comments and bounded signed webhook configuration/test logs.',
  ADM: 'Current source MRR movements/cohorts/CSV, actual registered staff invitations, ticket SLA configuration and current-visible global search.',
  USR: 'Mock email verification/SSO/API-key/webhook settings, actual session list/sign-out, notification preferences, bulk invites/custom roles/suspend/leave, second workspace/personal deletion, refund request/pause/win-back and product help/status/release/feedback surfaces.'
};
for (const [key, text] of Object.entries(additions)) markdown += `| ${groups[key].name} | ${text} | [Cycle](${groups[key].evidence}) |\n`;
markdown += '\nAll tools use the shared SuiteFrame, current access/connector states, eight owner-aware Admin sections, data-derived first run, native loading/empty/error/no-access/readonly/success evidence, five catalogs and the adopted EN/AR × light/dark ×390/768/1024/1440 matrix. CRM owns services and delivery; Console owns software and platform operations; internal Website Manager exposes readonly mirrors and actual guarded owner handoffs. Account/Home adapts to the current admitted tool set.\n\nPayments, email/push, AI, analytics, social delivery, signatures, calls, regulatory submission, arbitrary uploads and public Arabic website release remain explicit Tier C boundaries. Existing D-073 financial bytes, D-071 pinned Files and D-072 vector board CAS/custody are retained.\n';
fs.writeFileSync('program/prototype-feature-map.md', markdown);
console.log({ commitments: commitments.length, tools: Object.keys(groups).length });
