# Website sync verification — 2026-10-06

Imported GitHub `dc7735f` into the local CMS-connected website. The five complete Work stories retain their sample status and results; all 35 data adapters match upstream content, with explicit `approved: false` / `sample: true` adapter metadata. Roadmap matches the latest upstream datasets while retaining CMS submission, sample comment dialogs, compact introduction and scrollbar styling.

Passing checks:

- 42 distinct purchasing unit tests, 3 Roadmap transport tests, and 15 CMS model tests (including three new sample-publication regressions).
- 58 sync checks: 48 Work-page route/layout checks at 320/390/768/1440px on dev and production; CMS editing, sample controls, approval permission, draft/live isolation, three preview widths, EN/AR light/dark accessibility; restored URLs, legacy redirects, sitemap, Sign-up SEO and 404s. `checks.json` preserves each result. The corrected save selector and theme-cookie checks were rerun; the 48 successful public-route checks were retained without repeating them.
- 21 Roadmap comment checks and 15 CMS submission checks, including pending privacy, configurable pause, failure/retry and duplicate protection.
- 5 existing narrative regressions: template copy, permission explanation, figure approval, eligible preview and approval revocation with published-version preservation.
- Existing WM preview flow: 3 scenarios / 10 steps, including three draft frames, preview token protection, live isolation and Arabic layout. Existing website forms flow: 6 steps, including contact lead delivery and pending Roadmap submission.
- Website formatting/build and Website Manager formatting/typecheck pass. Production output has 52 addresses and 47 sitemap URLs. Regeneration matches excluding `source.builtAt`, and all 589 copy / 538 string bindings match the seed.
- Route discovery against clean website commit `443f5d0` records 54 routes and 109 legacy aliases. The crawl was supplemented with the unlinked `/software/plans` landing page after browser verification. Every published CMS address and all five restored projects are included; the remaining routes are a legacy plan example and the missing-page fixture. The crawler now seeds its queue from the published CMS address catalog.

Zero critical accessibility issues and no page overflow/runtime errors were found on the 48 restored Work-page checks. CMS themes are confirmed via the shared `ot-theme` cookie and `data-theme`. Mobile case-study captures are available locally; PNGs are excluded from Git. Historical committed follow-up and flow records were preserved; this folder stores the new results.

All fixture-changing flows held `mock.lock()` and reset fixtures while restoring exact snapshot/host files in cleanup. The final local snapshot uses the five seeded sample stories, seven moderated ideas, privacy version 0.2 and enabled local CMS form delivery. Production delivery, real voting, payments and authentication remain outside scope.

Recovery points and source/regeneration instructions are in `plans/2026-10-06-website-dc7735f-cms-sync.md`. Nothing was pushed or deployed.
