# Website Manager follow-up — 2026-10-05

Implemented the approved specification in `plans/2026-10-05-website-3a66678-wm-followup.md`. Work stays local on website `cms/connect`; website `main` remains `3a6667876e960469e073eda26c08d633d64cf32a`. Nothing was pushed, deployed or published externally. Public languages remain English-only.

## Implemented behavior

Roadmap has the previous timeline, filters, idea board, details, submission and page-local preview votes with the current shared header and compact introduction. Six milestone and seven public idea examples carry an explicit sample notice; three pending ideas remain private. Pending, declined, merged and hidden ideas never enter the public adapter. Submissions use the configured `sendIdea` moderation contract; votes reset on reload and make no writes.

Shared schema defaults support template-free articles, milestones and all five case departments. Explicit copying retains department and resets to sample figures and a disabled narrative. Only approvers can change narrative publication; enabled narratives require approved figures. Figure changes revoke approval and disable the draft narrative before validation, preserving the previous publication. Save, restore, publish, schedule and scheduled execution enforce this rule. Three-frame WM preview rendering is covered.

Payment, identity, adapter and older Home/Sign-in text is CMS-backed. Payment translation is resolved lazily after preview overrides load. Synthetic test values are protected numbered placeholders displayed read-only in the editor. Selectors and generated IDs stay in code. Commerce navigation uses `gl_header`; RTL account positioning and stable focus return are tested. Sign-up owns metadata only, shares Sign-in body copy, is noindex and excluded from the sitemap. Legal 0.2 is dated 2026-10-05 and keeps 0.1 history. Eight permanent redirects cover the four deleted project slugs at `/work/...` and legacy `/projects/...` addresses.

## Verification records

| Check | Passing result | Evidence |
|---|---:|---|
| Purchasing | 42 distinct tests: 39 existing + 3 regressions | Website `tests/cart.test.mjs`, importing `cms-purchase.test.mjs` |
| Mock content model | 12 tests | `local-dev/apps/wm/content-followup.test.js` |
| All 15 existing WM/site suites | 147/147 steps, every exit status 0 | `flow-runs-wm-s0.json` and per-suite logs |
| Focused browser/API regressions | 81/81 | `regressions.json` (each check retains its actual `checkedAt`) |
| Production responsive/accessibility checks | 24/24 | `production-responsive.json` |
| Unaffected adapters + restored Roadmap datasets | 35 checks | `tools/qa/content-parity.mjs --base 3a66678 --roadmap-base c8be7fe` |
| Unaffected dev parity | 144/144, zero differences | `audits/website/parity/diff-repo-3a66678-vs-followup-dev.md` |
| Unaffected production parity | 144/144, zero differences | `audits/website/parity/diff-repo-3a66678-vs-followup-production.md` |
| Roadmap repeat and production parity | 3/3 each, zero differences | `diff-restored-roadmap-final-vs-restored-roadmap-r2.md`, `diff-restored-roadmap-final-vs-restored-roadmap-production.md` in `audits/website/parity/` |
| Clean route discovery | 49 routes, 95 legacy aliases, clean `02dc5d0` | `audits/website/routes.json` |
| Semantic regeneration and every template binding | Pass | `regeneration.json` |
| Formatting, website build, WM typecheck | Pass | Commands below |

The existing flow suites run serially under `mock.lock()`. The final run's actual per-suite counts, exit statuses and durations are in `flow-runs-wm-s0.json`, with one log per suite. `wm-followup.mjs` covers Roadmap filters/empty states/dialogs/local voting, validation/failure/retry, moderation/privacy, empty-list creation, explicit copying, narrative permissions/approval/revocation/live preservation/preview, edited payment messages, locked values, shared navigation, EN/AR account focus and RTL positioning. It checks WM light/dark at 390/1440 and six touched website routes at 320/390/768/1440 in English and Arabic. Production checks cover those six routes at all four widths in English.

Accessibility reports have **zero critical issues**. Existing serious contrast findings remain in raw records; zero critical is not a claim of zero accessibility findings. Visual parity uses reduced motion, fixed clocks and threshold-zero pixel comparisons plus text, headings and accessibility trees. Roadmap is the specifically authorized exception to the unchanged-site gate; its separate baseline is `restored-roadmap-final`, repeated in `restored-roadmap-r2` and compared with `restored-roadmap-production`. PNGs remain local and are reproducible from committed manifests/tools. Existing large-chunk build warnings remain; builds succeed.

## Reproduce checks

Run the local WM API (4007), WM (3007), SoS (3013), website dev (4173), and production host (4280). Do not run independent mutation flows concurrently: they share one mock. Each guarded flow resets fixtures and restores the exact website snapshot and `vercel.json` bytes in `finally` before releasing the lock.

From the website's `landing-directions`:

```powershell
node --test tests/cart.test.mjs
npm run format:check
npm run build
```

From `local-dev` and `orgtik-website-manager`, respectively:

```powershell
node --test apps/wm/content-followup.test.js
npx tsc --noEmit
```

From `orgtik-program`:

```powershell
node tools/audit-kit/run-followup-flows.mjs
node tools/audit-kit/flows/wm-followup.mjs
node tools/audit-kit/flows/site-followup-production.mjs
node tools/qa/content-parity.mjs --base 3a66678 --roadmap-base c8be7fe
node tools/site/verify-regeneration.mjs
node tools/qa/capture.mjs --label followup-dev --exclude /roadmap
node tools/qa/diff.mjs --base repo-3a66678 --head followup-dev --exclude /roadmap
$env:SITE_URL = 'http://localhost:4280'
node tools/qa/capture.mjs --label followup-production --exclude /roadmap
node tools/qa/diff.mjs --base repo-3a66678 --head followup-production --exclude /roadmap
Remove-Item Env:SITE_URL
node tools/qa/capture.mjs --label restored-roadmap-r2 --exact /roadmap
node tools/qa/diff.mjs --base restored-roadmap-final --head restored-roadmap-r2
$env:SITE_URL = 'http://localhost:4280'
node tools/qa/capture.mjs --label restored-roadmap-production --exact /roadmap
node tools/qa/diff.mjs --base restored-roadmap-final --head restored-roadmap-production
Remove-Item Env:SITE_URL
```

## Regeneration and recovery

The seed reads `SEED_REF`, normally website `main`; it does not read the connected CMS branch. Roadmap extraction explicitly overrides its source with `c8be7fe3cd863a7f8f04cd4fdd91e8e8e318b76e`; the rest reads `3a66678`. Only rendered sections are extracted. Compare generated seeds semantically after deleting `source.builtAt`; the timestamp is intentionally new. `verify-regeneration.mjs` also verifies every generated copy/string binding against its seed slot.

Regenerate the seed first in `local-dev` with `$env:SEED_REF='main'; node apps/wm/seed/build.mjs`, then run `node tools/site/regenerate-followup.mjs` in the program. This helper rewrites the selected Roadmap/payment readers from their recorded sources and remaps all bindings together; do not run it over later manual changes without reviewing the diff. Run `node tools/site/reset-followup.mjs` to reset the isolated mock and pull the matching website snapshot, then format the website, verify regeneration and rebuild. The one-off `--recover` navigation option and `repair-followup-flows.mjs` migration helper are historical recovery tools, not routine regeneration steps. Discover routes only against a clean committed website.

Preserved recovery points:

- Website sync `d32eb8c`, and `backup/cms-before-sync-20261005` at `76e565ff1c57123ab286547cb97f7a003c3b04f2`.
- `orgtik-sync-backup-20261005/` retains original seed, templates, audit evidence and the untouched repository baseline.
- Existing A9 recovery commits: `local-dev` **9159808**, `orgtik-program` **3741915**.
- Completed follow-up recovery commits: website **02dc5d0** on `cms/connect`, `local-dev` **91020b6**, Website Manager **f439b5c**. The program verification commit follows these in its local history. Capture manifests correctly record that they were taken before the local website commit; final comparisons pass against the committed follow-up behavior.
- The original downloaded work order and other sessions' Tasks `walks.json` files remain untouched. WM's preexisting untracked `AGENTS.md` and `CLAUDE.md` remain outside the commits.

Local preview: `http://localhost:4173/roadmap`. Production comparison host: `http://localhost:4280/roadmap`. Real voting, production forms, payments, authentication and CRM provisioning remain outside this follow-up.

## Comment-button correction — 2026-10-05

The owner requested that clicking a comment count show comments. Each public idea now has a distinct sample discussion matching its count (31 sample comments across seven ideas); the existing dialog displays those comments with explicit sample labels. The moderated public API carries `commentPreview`, and the website reads it through `content.IDEA_COMMENTS` without changing the existing `IDEAS` shape. Empty threads show an empty state. No real commenting infrastructure was introduced.

`node tools/audit-kit/flows/roadmap-comments.mjs` passes **21/21** checks: matching threads/counts for every idea, pending privacy, empty state, focus containment/Escape/return, native scrolling, and 320/390/768/1440px layouts. Dev covers EN/AR and production EN, with zero critical accessibility findings. Results are in `roadmap-comments.json`; local modal screenshots use `comments-*.png`. The closed Roadmap still matches `restored-roadmap-final` in three dev and three production captures (`roadmap-comments-closed-dev`, `roadmap-comments-closed-production`). All 35 existing adapters, formatting, build and seed/template synchronization pass. The seed now has 448 strings and 307 page-copy slots; prior run records retain their original timestamps and counts.

Comment-display recovery commits: website **f5f4e4d** (`cms/connect`), mock/seed **048e10c**. The prior completed follow-up remains available at website **02dc5d0**, mock **91020b6**, WM **f439b5c**, and program **8af0958**. Website `main` remains `3a66678`; nothing was pushed or deployed.

## Local Roadmap delivery — owner request, 2026-10-05

Removed the obsolete “Frontend preview · nothing is sent” form note. The existing local CMS forms setting is enabled, and the form now submits to Website Manager → Ideas. The CMS accepts new ideas as private pending entries; the form shows success only after acceptance. Pausing delivery in the dashboard remains authoritative. Failed delivery preserves inputs and permits retry; pending requests disable the submit button and block duplicate calls. Concurrent accepted ideas receive distinct IDs rather than overwriting each other. Sample comments and page-local voting remain unchanged.

`roadmap-delivery.json` records **15/15** browser/API checks, including actual display in the CMS Ideas dashboard, pending privacy, pause, failure/retry, concurrency and all four widths on dev/production. `tests/roadmap-form.test.mjs` passes three transport regressions. The settings and `site-forms` flows explicitly pause delivery when testing transitions, rather than depending on the old preview default. Formatting, build, semantic regeneration and all 35 adapters pass. Mutation fixtures are cleaned up; the website snapshot and host configuration are restored exactly, and the normal local setting finishes enabled. Prior completed follow-up and comment-display records retain their historical counts and timestamps. Production activation remains outside scope.

Relevant existing flows pass: CMS S3 **14/14**, site forms **6/6**. The final S3 run is `flow-runs-wm-s3.json`; `site-forms.log` records the actual six steps. Recovery commits: website **08570ba** on `cms/connect`, mock/CMS **9db04e6**. The form transport no longer simulates successful Roadmap submission when delivery is paused. The existing shared dashboard control also governs Contact delivery, preserving its configured preview/live contract. Website `main` stays `3a66678`; nothing is pushed or deployed.
