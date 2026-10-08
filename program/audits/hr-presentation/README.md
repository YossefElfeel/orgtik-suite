# HR presentation

The dev/demo-only `/[locale]/presentation` route reuses the existing HR shell, form wrappers and six shared presentation states. Separate fixture/types/schema modules hold its client-memory people, leave policy, change requests, onboarding tasks and mailbox receipts. It does not modify existing employee, leave, offboarding, payroll or billing data.

The local flow covers a policy change and balance calculation, Salma's profile request → Rana's approval → simulated receipt, CSV text mapping/review/import, CH/CHF and UAE/AED illustrative payroll downloads, onboarding task completion, document reminders and local reset. Typecheck, all five catalogs and the affected production build pass. Eight EN/AR light/dark desktop/mobile captures have no width overflow and zero axe critical findings; the final report records the bounded checks.

Payroll CSVs identify themselves as presentation samples and cannot be submitted to a bank. Onboarding task IDs are local; actual Tasks provisioning remains pending. The mailbox is an on-screen simulation with no external delivery. Existing offboarding/equipment/final-pay, leave decisions, employee detail and payslip surfaces are reused rather than rebuilt. Final HR and suite journey acceptance remains open; no backend/security tests or deployment were added.

The reset remounts local form/wizard drafts as well as restoring fixtures. Employee persona views show that person's balances, onboarding and receipts; HR/owner personas can review the presentation dataset. These are UI capabilities, not changes to backend authority.
