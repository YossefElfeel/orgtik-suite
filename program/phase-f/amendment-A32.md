# A32 — UI retirement of superseded routes

2026-10-08. Seventeen frozen Sales SaaS routes now redirect to verified ADM catalog or SOS customer billing/support route mappings. Legacy detail IDs have no canonical counterpart, so their replacement lists open instead of guessing an invoice/ticket ID. Customer returns use the current SOS-origin tab session; staff catalog links use the existing launcher/handoff. SOS Content/client-CMS screens redirect to WM; the existing Chat redirect is retained and `icons-test` is absent.

All20 original screens (17 Sales, three SOS) are preserved byte-for-byte as adjacent `legacy.tsx` sources. No backend, UI-kit dependency, application directory or Vercel project is deleted. Content's rail/launcher entry was already hidden in A30. This is UI-only application of D-055 under D-073; production/backend retirements remain frozen.

Sales/SOS typechecks and five-language catalogs pass. A loaded old Sales invoice route → SOS invoices walkthrough passes three checks. Staff-target navigation is the remaining local acceptance check for this package. [Mappings and evidence](../audits/prototype-retirement/README.md). Package CI is pending; no Vercel deployment.

بالمصري: الشاشات القديمة بتودّي البديل الصحيح بدل ما تفضل ظاهرة في العرض. الكود الأصلي محفوظ بنفس البايتات، ومفيش حذف لتطبيق أو اعتماد أو مشروع Vercel. فاتورة Sales القديمة فتحت فواتير SOS فعلًا؛ قبول روابط الموظفين لسه بيتأكد محليًا.
