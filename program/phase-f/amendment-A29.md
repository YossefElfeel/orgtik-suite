# A29 — Sales import/stages and billing lifecycle scenes

2026-10-08. PR33 merged validated main `ec1a761` after CI `37788231249` and deployment-pause checks `37788231499` passed. Its library job correctly skipped because no shared library source changed.

Sales now edits stage labels/order/default probabilities and adds custom stages while preserving won/lost identities. The contact text-import wizard maps arbitrary headers, validates duplicates, reviews routed rows and imports once into a visible result. Eight focused browser checks passed; five-language catalogs and typecheck passed.

ADM now demonstrates open/failed/retry/paid/expired pay links, scheduled next-cycle currency changes with previous-cycle history, bounded grace extensions, local mailbox previews and suite notification delivery. Pay-link terminal states stay immutable; no platform paid order or invoice is manufactured. Applying the next-cycle scene does not change the shared clock or historical invoices. Fifty checks and eight EN/AR light/dark desktop/mobile captures passed; critical accessibility and document overflow were zero.

[Package evidence](../audits/prototype-commercial/README.md). Existing backend/auth/journal implementations remain frozen. No new backend/security tests, external delivery or Vercel deployment. The full prototype still needs shared reuse and final journey reconciliation; this amendment does not close all72 commitments or15 journeys. Package integration CI is pending.

بالمصري: مراحل Sales بقت قابلة للتعديل والترتيب، واستيراد العملاء فيه اختيار أعمدة ومراجعة ونتيجة واضحة. عرض الفوترة بيوضح الفشل وإعادة المحاولة والانتهاء، وتغيير العملة في الدورة التالية مع الحفاظ على التاريخ، وفترة السماح والبريد المحاكي. اتراجعوا محليًا؛ مفيش تعديل للساعة المشتركة أو الفواتير القديمة، والنشر متوقف.
