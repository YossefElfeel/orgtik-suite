# A27 — accepted billing wave and first connected mock handoffs

2026-10-08. [PR31](https://github.com/YossefElfeel/orgtik-suite/pull/31), source `1b8e94f`, merged validated main `79ac558` after CI `37772667491` and pause `37772667697` passed, including Windows shared-library visuals. A26 retains the billing package's original pending-CI snapshot as history.

The next package adds one isolated memory presentation service under `tools/demo`, shared suite search/notification controls, and runtime variables supplied by `pnpm demo`. It does not read or alter accounts, journals, invoices, CMS content or the business clock. Synthetic records are separated by presentation workspace; persona projection filters search/feed results. Actual app admission remains the existing signed session and destination-scoped handoff.

Working connected flows: Chats message → memory task → search/notification → exact Tasks presentation detail; Marketing campaign contacts/source → memory leads → exact Sales presentation detail. The landing URL carries the scene, locale, theme, digits and timezone. Existing explicit project/record timezones remain authoritative. The old Tasks rail link is routed through the existing SOS launcher instead of its obsolete token-query format; no auth implementation is changed.

The [connected flow evidence](../audits/suite-connections/README.md) has 32 bounded checks and eight EN/AR light/dark desktop/mobile captures. Shared build and all20 consuming-app type/catalog tasks pass. Existing shared visual/interaction acceptance passes264 unchanged renders and all10 interactions. Local memory pressure from earlier owned QA sandboxes was resolved by stopping those temporary processes only; the existing CMS3157/website4197 preview and all worktree/files remain intact.

Remaining: broaden search/feed to tool-specific records, complete Files/HR/WM/public-website connectors and shared import/bulk/editor/mailbox reuse, then the suite consistency pass and15 scripted local journeys. These first connected flows do not close the full roadmap. Live providers, production acceptance and public Arabic website launch stay deferred. Vercel remains paused.

بالمصري: أول ربط محاكاة بقى شغال فعلًا: رسالة Chats بتظهر مهمة في Tasks وتفتحها من البحث والإشعارات، وMarketing بيضيف عميل بمصدر الحملة في Sales. اللغة والثيم والأرقام والمنطقة الزمنية وسيناريو المساحة بيتنقلوا مع التسليم الموجود. البيانات الجديدة منفصلة عن الحسابات والفواتير والمحتوى الحقيقي. باقي الربط والـ15 رحلة لسه مفتوحين، والنشر متوقف.
