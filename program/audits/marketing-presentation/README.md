# Marketing presentation

The dev/demo-only `/[locale]/presentation` route reuses the Marketing shell, forms, fields, metrics and Board. Its separate tab-scoped scene covers campaign delivery/attribution, consent/unsubscribe effects, editable RTL email preview and HTML export, simulated social replies, post creation/move/reschedule, journey dry runs and template-based AI drafts applied to the email designer. Existing campaign/post wizards, approvals and reports remain in place.

Typecheck, five catalogs and affected production build pass. One local flow passes 28 scoped checks/eight EN/AR light/dark desktop/mobile captures with zero axe critical findings and no page overflow. It checks suppression after opt-out, local lead attribution, RTL/export content, replies, keyboard queue movement, schedule editing, saved journey delay, AI→editor and reset. Captures show the completed simulated campaign scene.

A private UI copy uses the app's existing peers to avoid stale local injected packages; source dependency/bundler versions are unchanged. The installed Next CLI's Webpack option was used for linked local verification; fresh CI validates the declared stack separately. The local compiler is warmed before the existing one-minute handoff.

External email/social/AI providers are deferred. CRM lead IDs and journey task steps are local; actual cross-app Sales/Tasks delivery remains pending. Editor content and scene records stay scoped by presentation workspace; changing workspace loads its own fixtures/editor, and reset restores only those demo fields. No backend/security tests, stored business-data changes or Vercel deployment.
