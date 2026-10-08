# A30 — reusable presentation controls and account setup

2026-10-08. PR34 merged validated main `11819c3` after CI `37790103189` and deployment-pause checks `37790103368` passed. A29 retains its first pending snapshot.

Shared `ImportWizard`, `BulkActionBar`, `RichTextEditor` and `MailboxPreview` now reuse the existing component system. Tasks/HR use the import progression; Tasks/Files use the bulk bar; Chats uses the formatting editor; HR/ADM use mailbox previews. Parsing, validation and tool records remain owned by their consumers. Demo billing scenarios now move failed renewal → grace → read-only → recovery in UI state only; the actual clock/accounts/invoices stay untouched. Legacy Content is hidden from the shared rail and SOS launcher.

Account adds a region/currency/timezone → tools → invitations → review/result wizard with an owner seat and capacity preview, owner-only simulated workspace verification policy, and tagged setup/contact/policy export. Duplicate billing contacts do not add activity. Sixty-one checks/eight EN/AR light/dark desktop/mobile captures passed with zero critical axe violations and document overflow.

The SOS launch helper warms the target auth screen before requesting its existing short-lived code. This fixes cold local navigation without changing session authority. Actual SOS → Tasks and exact ADM workspace landing passed; no console/page errors. Backend/session/journal implementations remain frozen.

J12 now has an explicitly simulated customer preview from ADM's existing audited View as action. In demo/development it stays in the same staff tab, preserving the existing tab session. Owner, capacity, tool states and invoice references are read-only; the staff actor and reason remain attributed. Fourteen checks and a desktop capture passed, including unchanged session, invoice history and clock, zero critical axe and overflow. The frozen production impersonation path is not claimed complete by this UI preview.

All20 consumer type/catalog tasks passed. Existing library acceptance passed264 unchanged renders, no baseline changes, zero axe findings and10/10 interactions. [Account/shared evidence](../audits/prototype-shared-account/README.md). Final connected journeys, remaining UI retirement and roadmap reconciliation remain open. Vercel is paused; package integration CI is pending.

بالمصري: مكونات الاستيراد والتعديل الجماعي والتحرير والبريد بقت مشتركة، وتهيئة المساحة فيها خطوات ومراجعة ونتيجة وتصدير واضح. فشل التجديد والسماح والقراءة فقط والاسترجاع حالات واجهة فقط، من غير تغيير الساعة أو الفواتير. فتح Tasks من SOS اتصلح بتجهيز شاشة الدخول قبل إصدار كود التسليم الموجود. الرحلات النهائية لسه بتتقفل والنشر متوقف.
