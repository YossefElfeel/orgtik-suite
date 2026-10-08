# WM studio presentation

The dev/demo-only `/[locale]/presentation` route extends the existing OrgTik staff CMS frame. It demonstrates sample analytics/notices/read state, packaged media alt/bulk tags/replacement, responsive SVG previews, editable translation drafts/review, preset genuine/spam form outcomes, and release bundle draft→review→approved→published→rollback states. Customer workspace/persona selections show a no-access projection; this studio remains OrgTik’s internal CMS under D-059/D-073.

Typecheck, all five catalogs and the affected production build pass. One local walkthrough passes 28 scoped checks with eight EN/AR light/dark desktop/mobile captures, zero axe critical findings and no page overflow. It covers alt/tag/revision updates, preview width, translation review, form outcomes, bundle transitions, notices/read state and reset.

The installed Next version required a root layout for the existing `/` redirect. Its identical redirect page now lives in a route group with its own minimal root layout; language route layouts, URL and behavior are retained. Packaged SVG samples are copied unchanged from Files. Responsive variants reuse those bytes; external conversions and arbitrary uploads are deferred.

Bundle and translation changes affect only this scene. Existing CMS editing/approval/publish→website refresh/LKG remains the actual selected mock publishing flow from PR20/21; this scene links to that editor and does not overwrite published content. Spam outcomes are UI presets, not new security protection. External analytics/AI/notifications and integrated bundle publishing remain pending/deferred. No backend/security tests or Vercel deployment.
