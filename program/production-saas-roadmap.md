# Future production SaaS roadmap

The current delivery is an interactive mock prototype. It runs locally, and the owner authorized a hosted mock release on 2026-10-14. The production work below remains separate: no real payment, delivery, media, tax or identity provider is claimed.

## Preserve the product contracts

Keep the existing workspace/member/tool-seat and staff/customer separation, canonical HR people and CRM contacts, source-owned operations, immutable issued invoices, pinned Files versions and replay/recovery behavior. Mona's prototype access is a fixture, not a production authorization shortcut. Migrate existing data with versioned conversion and recovery checks; do not reset it.

## Production sequence

1. Define initial launch countries, customer size, availability targets and a budget. Select providers only after these are agreed.
2. Replace file-backed domain storage with durable transactional storage and object storage. Preserve tenant boundaries, revisions, receipts and file/version identities. Prove migration rollback, backups and a full restore exercise before onboarding production data.
3. Replace prototype credentials and identity previews with real identity, email verification, MFA/SSO and invitation delivery. Retain the existing permission and audience contracts; test revocation, workspace switching and impersonation attribution.
4. Connect a payment provider to the retained invoice/quotation reducers. Add verified webhook reconciliation, uncertain-payment recovery and operational review. Never rewrite issued invoice totals or historical tax snapshots. Decide advanced coupon durations and standalone customer credits as separate financial-policy changes.
5. Introduce background jobs with retry/recovery records for timed messages, recurring work, reminders, exports, email/push and provider webhooks. Integrate real calendars, social channels, analytics, AI and signatures individually; keep unsupported integrations visibly unavailable.
6. Add realtime board/chat synchronization and rented call media where the business case requires them. Preserve Files ownership of attachments and recordings; do not create independent per-tool storage.
7. Establish service logs, metrics, alerts, bounded request rates, abuse handling, operational incident procedures, data-retention/deletion policies and recovery objectives. Test degraded dependencies without claiming successful writes.
8. Review country-specific privacy, payroll, tax and invoicing requirements with qualified specialists before claiming compliance. Mock regulatory previews remain labelled as simulations.

## Release gate

Require permission/tenant regressions, real provider success/failure/replay checks, migration and restore evidence, operational ownership, performance measurements and a reviewed country/customer scope. Production rollout requires a separate explicit implementation/release request.
