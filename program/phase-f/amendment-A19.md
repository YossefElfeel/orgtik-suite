# A19 — CMS alignment for the stakeholder prototype

2026-10-08. The owner resumed the presentation prototype after [A18](amendment-A18.md), with security work explicitly excluded and Vercel still paused. This package aligns Website Manager's visible editor to the latest merged website without redesigning or changing its content.

Partners introduction, controls, profiles and optional social links now have localized editor labels. Plans, Cart, Checkout, Partners and offer/payment messages have localized entry names in all five CMS languages. A UI-only label adapter translates older layout labels while preserving their content keys, values and published structure.

Software rows identify Admin as the current pricing source instead of displaying old CHF samples. The sidebar and editor call the retained pricing records **Offer references** and clearly mark them as historical, read-only examples. Current checkout arithmetic, regional prices, quantities, website offer identities and per-tool quote policy remain unchanged.

[Local evidence](../audits/cms-alignment/README.md) passes 66 bounded assertions, 13 captures and 10 matching source hashes in English/light desktop and Arabic/dark mobile; focused WM type/catalog checks pass in five languages. The actual Partners draft saves and persists while public content and the frozen clock remain unchanged. The existing website preview renders the saved draft, separately verified with three checks and one capture. This is visible package acceptance, not a new full-suite test run.

Whiteboard [PR #19](https://github.com/YossefElfeel/orgtik-suite/pull/19), source `327e895`, has now merged into main `1d8c5df45a0038cb940854d5ce04ddd9e7d3ae7b` after CI37732109610 and pause37732109529 passed. This CMS package is based directly on that validated main. Its PR/CI are pending at this source snapshot.

Next: durable regeneration that retains the current website fields, then the mock publishing/runtime connection and stakeholder walkthrough. No security work, live integration, new production infrastructure or Vercel deployment was performed.

بالمصري: المالك استأنف شغل البروتوتايب للعرض على أصحاب المصلحة. CMS بقى أوضح في أسماء الصفحات وحقول الشركاء بخمس لغات، ومراجع الأسعار القديمة متعلّمة بوضوح وما بتظهرش كأسعار الدفع الحالية. حفظنا مسودة فعلية وشُفناها في معاينة الويبسايت، من غير تغيير النسخة المنشورة. باقي ربط النشر ومصدر المحتوى لسه الخطوة التالية، ومفيش شغل أمن أو نشر Vercel.
