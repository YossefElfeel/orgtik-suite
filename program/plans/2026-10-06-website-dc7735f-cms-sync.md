# GitHub website sync and CMS integration — 2026-10-06

Owner request: check GitHub for updates, import them into the local website, and fix CMS integration. Continue preserving the existing Website Manager, locale and SEO integration. Keep work local on website `cms/connect`; do not push, deploy, or change website `main`.

GitHub main advanced from `3a66678` to `dc7735f10cf24e34d31c590dfb0a651945dc00a7`: PR #41 restores Roadmap and PR #42 restores five Work projects and complete department stories. The local Roadmap already provides the same six milestones and seven public ideas, plus owner-requested CMS delivery, sample comments, compact introduction and refined scrollbar. Preserve these additions rather than restoring the upstream form's no-delivery behavior.

Import all five projects and stories through the CMS seed. Keep concept/mock status, sample figure labels, and the sample-results disclosure. Model this as `sampleNarrativePublished`, separately from `narrativePublished`. Both switches require `content:approve`, including history restoration. Approved narratives still require approved figures. Sample narratives require sample figures and cannot coexist with an approved narrative. Figure approval disables the sample mode; copied and blank cases disable both modes. Previously published content remains unchanged while drafts are edited. Publication, scheduling and restore use the same validation.

The restored `/work/<slug>` pages supersede the deleted-project redirects. Keep `/projects/<slug>` compatibility as a permanent redirect to its canonical project page. Keep Sign-up metadata-only, English-only public routes and noindex defaults.

Normal seed regeneration now reads the pinned `WEBSITE_REF`, not local `main`; an explicit `SEED_REF` remains available. Roadmap source is pinned to the same revision and transformed for the owner-requested integration. Seed, copy/string mappings and snapshot must be regenerated together and compared semantically, excluding `source.builtAt`. Case-study browser capability names remain code, never editable strings.

Recovery: website `backup/cms-before-sync-20261006` points to `43de730`; `orgtik-sync-backup-20261006` preserves the pre-sync seed, snapshot and templates. Earlier `d32eb8c`, `backup/cms-before-sync-20261005`, and 2026-10-05 records remain intact. Website `main` remains `3a6667876e960469e073eda26c08d633d64cf32a`. Preserve other sessions' changes, especially Tasks `walks.json`.

Evidence and actual passing counts: `audits/wm/sync-20261006/README.md`. Local previews: website 4173, Website Manager 3007, API 4007 and production build 4280.

Local implementation commits: website merge `443f5d0` (parents `43de730` and `dc7735f`), CMS mock/seed `b61cba2`, and Website Manager `5d2089f`.
