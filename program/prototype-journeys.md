# OrgTik prototype: 15 presentation walkthroughs

These scripts retain the J1–J15 definitions from `audits/suite-review/journeys.md`. They are **presentation instructions**, not a record of completed final acceptance. Individual retained/tool flows have scoped evidence; the complete revision-specific end-to-end run remains pending. No hosted acceptance is claimed and Vercel remains paused.

Run `pnpm demo --list` to inspect addresses, then select the required tools with `pnpm demo <tools>`. The launcher uses a private memory-backed, fixed-clock dataset. Use existing synthetic accounts from `mock/README.md` through SOS; this guide does not reproduce passwords. Demo persona selection changes the presentation, not the authenticated person. Open staff/customer retained flows with their matching account.

Before each walkthrough, reset the tool's **demo records** and restore Demo controls to Normal. Shared **Reset scene** resets selectors only. Retained lifecycle/reset/time operations must target the isolated launcher dataset; never reset an existing shared/production dataset or advance its clock. For loading/empty/error/no-access/read-only/success, use Demo controls and restore Normal after showing the state.

## J1 — visitor purchase → workspace → first tool

**Persona:** visitor, then Nour/owner. **Tools:** website, SOS, Tasks. **Status:** retained purchase/pricing foundation; final walkthrough pending.

1. Open the English website and compare 1/3/6/12-month offers. Show the greater duration/item saving and mock-region price.
2. Choose an offer, review the platform quote and simulate successful checkout. Show the simulated receipt/order before linking the account.
3. Link/sign in through the existing account flow, open My Tools and the paid invoice. Confirm displayed currency/total matches the quote.
4. Open Tasks through the launcher; create the first task. Switch the new-workspace presentation to Empty, then Normal to explain first-use guidance.
5. Show checkout failure using the existing mock payment flow and explain retry. Never create an invoice from edited browser totals.

**Show:** empty → success; payment labelled Simulated. **Developer handoff:** offer quote/payment snapshot/account linking and tool entry. **Deferred:** real payments/geolocation, hosted acceptance.

## J2 — owner invitation → acceptance → seat → Tasks

**Persona:** Nour, then invited synthetic member. **Tools:** SOS, Tasks. **Status:** retained Team/mailbox/seat implementation; final walkthrough pending.

1. Open `/team`, inspect capacity/assigned/reserved/available for Tasks.
2. Invite a synthetic member with role/tool choices; show the pending reservation and mailbox invitation.
3. Accept through the existing invitation screen in a separate private session. Show the resulting assigned seat and tool entry.
4. Open Tasks; create/read a task appropriate to that member. Return to owner to demonstrate resend/cancel on a separate pending invitation.
5. Show No access and Read-only with Demo controls as presentation states, then restore Normal.

**Show:** loading, invitation success, no access. **Handoff:** team counts/invitation metadata/acceptance result. **Deferred:** external email; final connected acceptance.

## J3 — failed renewal → read-only → recovery → credit note

**Persona:** Hany, then Nour. **Tools:** ADM, SOS, Tasks (representative consuming tool). **Status:** retained billing lifecycle and new Operations UI; final connected scenario pending.

1. In ADM Operations Billing, inspect a past-due invoice, attempts and pause/resume.
2. Preview the card-expiry/reminder message. Open customer Billing/mailbox to explain customer-facing recovery.
3. Set Demo scenario Renewal failure, then Grace/read-only; attempt task editing and show the inert read-only presentation.
4. Restore Normal; simulate invoice retry/payment recovery in the appropriate isolated mock surface.
5. Create a full simulated credit note with a reason; show its receipt and the invoice currency. Explain that the Operations scene does not issue a real refund.

**Show:** error/retry, read-only, recovery success. **Handoff:** lifecycle state, retry result, notice and credit-note snapshot. **Deferred:** live gateway/email; full cross-tool billing scenario acceptance.

## J4 — tool Coming soon → Beta → Live

**Persona:** Mona, then Nour/visitor. **Tools:** ADM, SOS, website. **Status:** retained tools/waitlist/My Tools; website alignment verification pending.

1. Open ADM `/tools`, inspect a tool status and its plan/waitlist relationships.
2. Demonstrate the existing status editor using an isolated demo tool. Review launch prerequisites before selecting Beta/Live.
3. Open SOS My Tools; show the corresponding start-trial/choose-plan/open/waitlist actions.
4. Open the website product/catalog display and compare the status/presentation. Record any mismatch rather than claiming completion.
5. Show the empty waitlist, then a synthetic waitlist entry and notification preview.

**Show:** coming-soon/empty/success; waitlist mail Simulated. **Handoff:** catalog status/actions/waitlist notice. **Deferred:** live email and hosted publish.

## J5 — price change → public offer → customer billing

**Persona:** Hany/Mona, then Nour/visitor. **Tools:** ADM, SOS, website. **Status:** retained R0 pricing foundation; final walkthrough pending.

1. Open ADM Pricing and select one regional/currency cell. Review scheduled effective date and affected customers.
2. Preview the change and publish through the existing isolated mock flow; show affected-cell repricing/notice behavior.
3. Compare website terms and SOS subscription quote/invoice. Explain website offer saving vs subscription bundle/coupon/proration/tax policy.
4. Open a multi-tool custom quote; show per-tool prices adding to the total, preserving the approved quantity model.
5. Show error/retry and a scheduled-downgrade/read-only presentation without changing historical invoices.

**Show:** preview → success; mock-region display. **Handoff:** regional prices, effectiveAt, quantity, quote and invoice snapshots. **Deferred:** live gateway/rates and hosted verification.

## J6 — website lead → OrgTik CRM → won → workspace

**Persona:** visitor/Hoda, then Omar/Mona. **Tools:** website, WM, Sales, SOS. **Status:** existing website intake retained; new WM→Sales connector pending verification; won provisioning presentation incomplete.

1. Show a website contact/offer form and its mock submission. Explain that public leads belong to OrgTik, not the customer's CRM.
2. In WM Studio Forms, select Genuine and submit; compare Bot/blocked as a simulated outcome.
3. Find the accepted lead through suite search and open its exact Sales detail in the OrgTik scene.
4. Assign the owner, add a timeline note, move through the pipeline to Won.
5. Demonstrate the available create-workspace preview/action only if implemented; otherwise identify this remaining step explicitly. Open new-workspace empty state to show the intended destination.

**Show:** success, blocked form outcome, new workspace empty. **Handoff:** lead source/campaign, deal status and provisioning result. **Deferred:** real external CRM/mail; provisioning acceptance.

## J7 — hiring → onboarding Tasks → approved leave

**Persona:** Rana, then Salma/manager. **Tools:** HR, SOS, Tasks, Files, Chats. **Status:** retained hiring/invitation/leave flow; onboarding Tasks connector pending verification.

1. Open HR hiring/employee record and the retained identity/invitation flow; accept the invitation in the synthetic person's session.
2. In HR People presentation, open Onboarding and create the employee checklist.
3. Find its generated task in suite search and open the exact Tasks detail; demonstrate the assigned person and source.
4. As the employee request leave; as manager/HR approve using retained Time off.
5. Open the retained Tasks/Chats calendars to show approved availability, preserving workspace timezone. Show own balance/profile request and approval mailbox preview.

**Show:** loading, success, own-only balance and read-only presentation. **Handoff:** identity/invitation/onboarding task/leave availability records. **Deferred:** external email/bank submission; final connected acceptance.

## J8 — Tasks project + Files + Chats discussion

**Persona:** Nour/Omar, then Salma. **Tools:** Tasks, Files, Chats. **Status:** retained references/whiteboards; new-scene Files connectors pending verification; Chats→Tasks first connection locally verified.

1. In Files select the packaged launch brief, inspect its version/comments and share view/comment access.
2. Attach that workspace record to a task through the retained picker or the new verified presentation picker.
3. In Chats launch-review attach the same Files record, send a message and create a follow-up task.
4. Use suite search/notification to open the exact task; compare file ID/version/workspace, not filename alone.
5. Show the structured whiteboard and its Files record using the retained board flow; demonstrate no-access/read-only states.

**Show:** file picker loading/empty, sharing success, no access. **Handoff:** versioned workspace references, message/task relation and board state. **Deferred:** arbitrary binary uploads/real calls; final connected acceptance.

## J9 — Marketing campaign → WM page → Sales attribution

**Persona:** Hoda, then Omar. **Tools:** Marketing, WM, Sales. **Status:** campaign→Sales first connection locally verified; full WM attribution connector pending verification.

1. In Marketing Campaign review eligible/consented recipients and create the campaign's CRM leads.
2. Open the linked WM landing-page/form scene, preserving source/campaign metadata.
3. Submit a Genuine mock form; compare a blocked Bot attempt.
4. Open the exact Sales lead through search and inspect source/campaign tags; compare the Marketing attribution view.
5. Toggle one recipient's consent off and rerun the mock send, showing suppressed recipients and deterministic results.

**Show:** success, no recipients/empty, error/retry; delivery Simulated. **Handoff:** campaign/page/source/contact/lead attribution. **Deferred:** live analytics/email/social delivery; final connected acceptance.

## J10 — support/service request round trip

**Persona:** Nour, then authorized support/service staff (Mona for setup). **Tools:** SOS, ADM. **Status:** retained support/service round trip, new Operations SLA/reply/merge UI; final combined walkthrough pending.

1. As Nour create a support ticket in `/support`; show the thread and attachment/reference preview if available.
2. As staff open ADM ticket, review assignment/SLA, reply, and show the customer reply through retained SOS support.
3. In Operations Support demonstrate a duplicate merge and attributed reply; explain its local-only scene.
4. Create a managed-service request, assign the service team and progress to completion. Website management is a service request, not customer WM access.
5. Inspect mailbox/notification preview and demonstrate no-access for an unassigned presentation persona.

**Show:** loading, error/retry, no access, completed success. **Handoff:** ticket thread/SLA/merge/assignment/service state. **Deferred:** live email; final notification integration.

## J11 — CMS edit → approve → publish → website fallback

**Persona:** Hoda, then Mona. **Tools:** WM, website. **Status:** selected retained actual CMS flow complete locally in PR20/21; final release walkthrough pending.

1. Open WM `/content/pages/pg_partners`, edit one approved presentation field and save the draft.
2. Submit for review; sign in as approver and approve/publish through the actual CMS editor.
3. Reload the local website and show the changed published content. The website does not promise live no-reload refresh.
4. Demonstrate the documented last-known-good loader fallback during a controlled isolated outage, then restore the service.
5. Show Studio release-bundle transitions separately; disclose that these local scene bundles do not publish the actual website.

**Show:** draft/review/success, fallback/error recovery; AI translation Simulated. **Handoff:** CMS revision/publish/loader fallback and SEO rebuild trigger. **Deferred:** hosted deployment; public Arabic website launch.

## J12 — staff View as customer → read-only → audit

**Persona:** Mona, then the selected customer view. **Tools:** SOS, ADM, one customer tool. **Status:** retained impersonation restrictions/attribution; final presentation walkthrough pending.

1. Open the retained staff People/View as flow and choose the synthetic customer workspace.
2. Navigate to its tool through the existing handoff; inspect the current-workspace/actor indicator.
3. Demonstrate read-only access; show a disabled edit action. Demo controls can explain the state but do not replace actual View as behavior.
4. End the view and inspect the retained audit screen. Show actor vs represented person.
5. Compare the Account presentation searchable activity as a simulated design reference.

**Show:** read-only and no access; attributed activity. **Handoff:** workspace context/impersonation actor/audit record. **Deferred:** no new hardening work; final walkthrough evidence.

## J13 — preferences across tools

**Persona:** Nour, then Hoda for staff tools. **Tools:** SOS, Tasks, Chats, Sales, Marketing; WM/ADM through staff access. **Status:** first connected scene carrier locally verified; full nine-tool sequence pending.

1. Select Arabic, Dark, Arabic digits and Cairo timezone in Demo controls.
2. Open a generated task/lead using suite search; confirm landing language/theme/digits/timezone and exact item.
3. Navigate among accessible tools and repeat in English/Light/Latin digits/Zurich.
4. Show 390px mobile navigation and a long Arabic title; check logical alignment and number isolation.
5. Explain that explicit record/project timezones remain authoritative where the screen specifies them.

**Show:** Arabic/English, light/dark, 1440/390; error/retry on unavailable handoff target. **Handoff:** scene/preferences carrier + existing handoff. **Deferred:** hosted cross-domain acceptance.

## J14 — event in one tool → notice → exact destination

**Persona:** Omar/Rana/Hoda, then intended recipient. **Tools:** Chats, Tasks, HR, Files, WM, Sales, SOS. **Status:** Chats task/Marketing lead first notice links verified; added source adapters pending verification.

1. Create a task from a Chats message. Open the suite bell and inspect the new task notice.
2. Follow the notice to the exact Tasks record and mark the notice read.
3. Repeat one source adapter: HR expiry/onboarding, Files share, or WM form/review notice, after its connector passes.
4. Switch presentation workspace and confirm that its synthetic notification list is independent.
5. Show notification Empty, Loading and Error/retry states; compare simulated mailbox preview with real external delivery deferral.

**Show:** unread→read, exact-item success, empty/error/retry. **Handoff:** `{id,tool,title,path,read}` notification + workspace/persona projection. **Deferred:** external push/email; final full-source acceptance.

## J15 — offboarding → reassignment → revoked access

**Persona:** Rana, then departing synthetic employee and successor. **Tools:** HR, SOS, Tasks, Files. **Status:** retained offboarding/equipment/deadline work; final presentation walkthrough pending.

1. In HR employee record open the retained Offboarding sheet; review immediate/effective-date choices.
2. Select the required successor and show task/file ownership/equipment/final-pay actions.
3. Apply the operation to the isolated demo dataset, then inspect its offboarding record and action checklist.
4. Demonstrate the departing person's workspace No access and successor's task/file access; preserve the person's other workspace in the explanation/retained test flow.
5. For a scheduled boundary, use only the isolated demo's documented lifecycle controls; Demo scenario metadata alone does not execute offboarding.

**Show:** review, loading/error/retry, completed success, no access. **Handoff:** employment effective boundary, membership/seat release, successor and custody records. **Deferred:** external payroll/equipment systems; final connected acceptance.

## Final acceptance sheet

For each J1–J15, record release revision, actual tool URLs, signed-in synthetic persona/workspace, steps passed/blocked, representative EN/AR light/dark 1440/390 captures and critical accessibility findings. Mark unimplemented steps as pending; do not replace them with a scripted narration and call the journey passed. Existing individual flow reports remain historical scoped evidence.

The final reviewer must reconcile the [72-feature map](prototype-feature-map.md), maintained register, gap matrix, tool benchmarks and Arabic readout. Report **UI prototype done / backend pending** only where visible behavior and its required states have accepted evidence. Keep live integrations, arbitrary uploads, public Arabic website launch and hosted acceptance visibly deferred.
