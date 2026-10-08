# A20 — completed CMS publishing prototype

2026-10-08. After [A19](amendment-A19.md), the CMS now completes the stakeholder workflow: **edit → save draft → preview → independent approval → publish → reopen the website with the published change**. Public runtime loading and last-known-good fallback use existing CMS endpoints, without new services, security work or deployment infrastructure.

Approved current website content survives seed regeneration: Partners records/profiles, purchasing/component messages, password setup, the Imprint footer link, Legal wording and current redirects. The generator still records the archived source revision and its explicit monorepo overlays. A temporary regeneration reproduces all 75 current entry locale trees and retains media, SEO, ideas, pricing, formats and case-study data. Existing persisted edits, accounts, invoices and clocks are untouched.

[Final local evidence](../audits/cms-publishing/README.md) passes 19 bounded workflow assertions/5 captures/5 matching hashes, plus separate loader9 and regeneration3 tests. Existing website purchase49/session10 groups pass. The final website build exports 52 addresses, its 404, sitemap.xml and noindex robots.txt. A review correction prevents malformed successful CMS responses from poisoning the renderable last-good cache; legitimate optional metadata and empty dynamic lists continue to work.

The initial CMS alignment merged through [PR20](https://github.com/YossefElfeel/orgtik-suite/pull/20), source `c864a6a` → main `bfd12387e225dfe9da6e2f3da5be09afcdd0c995`, after CI37736001016/pause37736000942 passed. This publishing package is based directly on that validated main; its package PR/CI is pending at this source snapshot. Automatic Vercel execution and broader SaaS acceptance remain outside this local presentation completion.

The owner supplied `C:/Users/yosse/.claude/plans/make-a-plan-as-splendid-crown.md` for the next stage, explicitly after finishing CMS. That plan has not been started during this package. Move to it after current package integration, preserving the presentation-only scope unless the owner changes it.

بالمصري: CMS جاهز لرحلة العرض المحددة: تعديل وحفظ مسودة ومعاينة، موافقة شخص تاني، نشر، ثم فتح الويبسايت وشوف التغيير. لو CMS مش متاح أو رجّع بيانات ناقصة، الويبسايت يحتفظ بآخر نسخة سليمة. مصدر المحتوى بيحافظ على التحديثات الحالية بعد إعادة التوليد. مفيش شغل أمن أو نشر Vercel أو تغيير للبيانات القديمة. الخطة الجديدة هي المرحلة التالية بعد دمج الحزمة الحالية.
