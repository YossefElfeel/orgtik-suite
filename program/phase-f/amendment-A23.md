# A23 — local launcher and first Tasks presentation flow

2026-10-08. Under [D-073](../decisions/D-073.md), `pnpm demo` now starts an isolated local presentation run. The default starts SOS and Tasks; selections can start other tools. The launcher uses distinct ports, private staged frontend output, an in-memory journal/accounts and a fixed clock. Existing session metadata stays inside the run folder. It refuses occupied ports and stops only its own processes. No deployment or configured-resource reset occurs.

Tasks exposes **Presentation workflow** at `/[locale]/presentation`, enabled only in development or with the existing demo flag. A client-only adapter holds separate disposable tasks. Workspace scene changes select/reset this dataset; persona selection supplies the assignee for new and bulk-assigned tasks. Actual login, membership and stored projects retain their existing behavior.

The first flow includes search/status/person/label filters, quick creation, editing, labels, watchers and a simulated reminder preview, weekly/monthly recurrence, one onboarding template, CSV text mapping/review/import and filtered export, and bulk completion/assignment. Completion through the row, bulk bar and editor creates the next occurrence; monthly dates clamp to the month end. CSV result cannot repeat a finished batch. A separate **Reset demo tasks** restores only this page's fixtures.

This is partial delivery of seven Tasks commitments, not closure of all eight: suite-wide search/notifications, Files integration in this surface, richer template selection, file-based import and the complete tool walkthrough remain pending. Shared components have not been duplicated into a new library; the surface consumes existing fields, dialogs, stepper, choices and states.

Evidence: [Tasks flow](../audits/tasks-presentation/README.md), type/catalog/build acceptance and independent interaction review. No new backend tests or frozen backend changes. The 15 final walkthroughs and online presentation remain open. Vercel stays paused.

بالمصري: التشغيل المحلي بقى أمر واحد في بيئة عرض منفصلة. أضفنا شاشة مهام تفاعلية فيها فلاتر، إضافة وتعديل، تصنيفات، تذكيرات محاكاة، تكرار، قالب، CSV وتعديل جماعي. دي أول دفعة من Tasks؛ مش اكتمال الـ72 ميزة أو الخطة كلها.
