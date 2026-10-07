# Review of the 2026-10-05/06 work: what is missing (work order)

Reviewed on 2026-10-06, read-only, against:
- `plans/2026-10-05-website-3a66678-wm-followup.md`
- `plans/2026-10-06-website-dc7735f-cms-sync.md`

Scope:
- website `cms/connect` commits `02dc5d0` → `443f5d0`
- local-dev commits `9159808` → `b61cba2`
- WM commits `f439b5c`, `5d2089f`
- orgtik-program commits `3741915` → `7736e34`
- the **uncommitted** local changes in every repo

Checks re-run during the review, all passing:
- website: `test:cart` 42/42, `roadmap-form` 3/3, `cms-purchase` 3/3, `format:check`, `content-parity --base dc7735f` (all equal)
- WM: `typecheck`
- mock: `content-followup.test.js` 15/15
- no CRLF churn in any commit

Same rules as the 2026-10-05 work order (§1 there):
- local only, never push
- explicit paths
- `mock.lock()` for flows
- EN pixel-identical except what the owner approved

---

## A. Uncommitted suite-wide work: "Authentication successful" screen (not part of either plan)

**Where it is.** The work is in 13 repos, uncommitted, last edited 2026-10-06 10:12. It may still be in progress in another session, so **ask the user who owns it before touching it**.
- `orgtik-ui`:
  - new `packages/ui/src/components/AuthSuccess.tsx` (untracked)
  - a new `./auth` export and a new `./provider` export in `package.json`
  - 5 new strings in `i18n/strings.ts`
  - BarChart gets `labelWidth` / `maxBarSize`
  - the version is still `1.0.0-rc.12`
- App auth pages call `useAuthSuccess()`. They are pushed via yalc into SOS (login + `/auth`), Files, Tasks, HR, Marketing, Sales, Chats (HQ), WM, ADM and the legacy content dashboard.
- Also uncommitted:
  - WM `components/overview/WebsiteNumbers.tsx`: chart sizing
  - SOS `app/(dashboard)/layout.tsx`: wraps the shell in `fixed inset-0`
  - content-dashboard: `package.json`, a 388-line lockfile change, `globals.css`, README

| # | Sev | Finding | Fix |
|---|---|---|---|
| A1 | High | **A forced 1.8 s full-screen splash on every hand-off.** Opening any app from the rail goes through SOS `/go` → app `/auth`, so every app switch now waits 1.8 s. A fresh sign-in shows it **twice**: once on SOS login, once on the target app's `/auth`, about 3.6 s in total. There is no way to skip it. | Show it at most once per sign-in, at SOS login only. Never show it on `/go` hand-offs. Or drop the delay: redirect right away and let the destination announce the session. Decide with the user (UX call). |
| A2 | High | **Copy is wrong for the context.** "Your credentials have been verified" is wrong for a one-time-code hand-off, where nothing was typed. "Redirecting you to the dashboard…" is wrong for WM, Chats or deep links. The title is in Title Case, against the suite's sentence case. "Access granted" and "Secure access verified" are decorative claims. | Rewrite through the glossary (D-025, D-027): e.g. "Signed in" / "Opening {app}…". Sentence case. Drop the duplicate badge and meter. |
| A3 | Medium | **Fake 100 % progress bar** labelled "Verified Successfully". It is decorative and implies a process. `role="status"` + `aria-live` on a section whose heading also takes focus makes screen readers announce it twice. `uppercase` is forced on the caption and badge (fine in Arabic, harsh in German). | Remove the Progress bar. Use either focus or a live region, not both. Remove `uppercase`. |
| A4 | Medium | **Library process skipped.** It is not committed and not released (rc.12 shipped with different content in 12 apps). There is no Storybook story, so the Storybook gate (pixels, axe, overflow) never saw it. The `./provider` export is added with no user. | Commit on a branch → add a story → run `pnpm --filter docs build && pnpm --filter docs check` → release `1.0.0-rc.13` with notes → re-push to apps. |
| A5 | Medium | **The legacy content dashboard got `@orgtik/ui` and a lockfile churn**, though it is scheduled for retirement (S7) and frozen. | Revert the content-dashboard changes unless the user wants them. |
| A6 | Medium | **SOS `(dashboard)/layout.tsx` wraps the shell in `fixed inset-0`** to hide a second scrollbar after the auth page. This may break printing, mobile browser chrome and sticky banners (WorkspaceBanners). | Fix the scroll at its source (the auth page's own scroll container), or verify SOS flows and VS-1 on mobile before keeping it. |
| A7 | Low | **WM `WebsiteNumbers.tsx` reaches into BarChart internals** (`[&>div:first-child]:min-h-16`). | Add a prop in the library instead. |

---

## B. Website `cms/connect`

| # | Sev | Finding (file:line in `landing-directions/`) | Fix |
|---|---|---|---|
| B1 | High | **Roadmap ideas ignore the forms mode and default to localhost.** `src/content/forms.js:42-44`: `sendIdea` posts unconditionally. `forms.js:8` falls back to `http://localhost:4007/v2`, so a build without `VITE_CMS_API` fails every submission. | Gate on `formsLive()` (owner's preview behaviour when off). Require `VITE_CMS_API` for live mode. |
| B2 | High | **No privacy notice on the Roadmap form.** 08570ba removed "Frontend preview · nothing is sent." and the form now sends name and email with `privacyVersion: "0.2"`, but shows no notice and no link to `/legal/privacy`. Contact has the same gap. This conflicts with D-041 (privacy policy, retention period, consent control before live forms). | Keep delivery off until the owner adds an approved notice and consent control, or add them now with the owner's sign-off. |
| B3 | High | **Payment radios lost their description.** `src/reference/PurchaseCheckout.jsx:521` still calls `msg("PurchaseCheckout:36", …)`, but the template was deleted, so `aria-describedby=""`. | ``aria-describedby={`purchase-method-${method.id}-description`}`` |
| B4 | High | **Code values are still editable CMS messages** (WP2.3 incomplete): `purchase-adapter.js:11` (session-storage key), `:43` (currency "CHF"), `PurchaseCheckout.jsx:305` (order-ref template "ORG-{0}"), `CaseStudy.jsx:843` (`msg("CaseStudy:18") in window` = "ResizeObserver"). The last contradicts the 10-06 plan. | Make them literals again. Exclude them in `connect-strings.mjs`. Regenerate seed and snapshot (`verify-regeneration.mjs`). |
| B5 | High (decision) | **The Roadmap differs visibly from owner `main` in English.** Owner PR #41 (10-05 15:30) restored the cinematic header, hero, ticker and preview note. Local `02dc5d0` (16:11) and later commits replaced them with: the commerce SiteHeader, a compact "Product roadmap" intro, a sample notice, reworded community and success texts, the preview note removed, a Comments section with 31 "Sample reader" comments, a custom board scrollbar, a focusable board and a focus trap. The 10-06 plan calls these "owner-requested", but no decision record exists. | **Ask the user to confirm** each deviation (list in the website review). Record it as a decision (e.g. D-049), or revert to owner `main` and keep only the content swap. |
| B6 | Medium | **"All" filters break if the label is edited or translated.** `Roadmap.jsx:531-532,573` and `Work.jsx:637` compare state against literal "All" / "All themes", but the state starts from CMS messages. | Use an internal value `"all"`; the message is only the label. |
| B7 | Medium | **Hard-coded English left:** `Roadmap.jsx:569` (Past/Now/Next), `:588-590,660` (plural nouns), `:2573,2605,2638` (form labels); `Work.jsx:467,636-638,817,1871,2428`; `SignIn.jsx:1274,1309`; `forms.js:54` `SEND_FAILED`; `src/content/index.js:26-32` status/period labels; "Made in Switzerland" in 10 footers; Home `footSoftware`. | Route them through copy/strings (WP2.2 pattern). |
| B8 | Medium | **The restored Roadmap was never mirrored for Arabic.** `mirror.mjs --dry` reports 16 physical style keys in `Roadmap.jsx` (e.g. 247-260, 945, 1188/1249 select chevron, 1372/1382 timeline rail with a 90° gradient, 1531 `textAlign:left`, 1589 `marginLeft:auto`). | Run `tools/site/mirror.mjs` on Roadmap. Add a `[dir=rtl]` rule for the rail gradient. Check `/ar/roadmap` with `mirror-review.mjs`. |
| B9 | Medium | **Idea submit can hang with the button disabled forever:** there is no timeout or AbortController (`Roadmap.jsx:761-766`). | Add a 15 s timeout and show `SEND_FAILED`. |
| B10 | Low | `Work.jsx:795`: gallery ids `"-g" + i + 1` (string concatenation) differ from the owner's `(i + 1)`. `SiteHeader.jsx:150`: `data-menu-toggle` is also on the close button. Home mobile menu "Home" became `/` instead of `#top`. Dead hero/ticker/header-scroll code in Roadmap (240-265, 521-564). The dialog focus trap has no null guard (`Roadmap.jsx:16-24`). The SiteHeader ProjectLink still uses `gl_commerce`, not `gl_header` (WP2.7 partial). | Small fixes, one commit. |

---

## C. Website Manager and mock

| # | Sev | Finding | Fix |
|---|---|---|---|
| C1 | **High** | **Starting or editing a translation revokes figure approval and switches the narrative off.** `local-dev/apps/wm/content.js:365`: `figuresChanged` compares against `base.locales[patch.locale]`, which is undefined for a new locale. "Start translation" (`EntryEditor.tsx:940`) copies the English tree, so the first save sets figures to `sample` and `narrativePublished` to false. | Detect figure changes only for `patch.locale === "en"`, against `base.locales.en`. Add a unit test. |
| C2 | **High** | **Idea submitters' name and email are visible without `leads:pii`.** `local-dev/apps/wm.js:391` `ideaOut` returns `submitter` to anyone with `marketing:view`, now that forms are live (9db04e6). Leads mask the same data. | Mask `submitter` unless `leads:pii` (reuse the `ops` masking). Add a personal-data erase route like the one leads have. |
| C3 | Medium | **Scheduling hides narrative errors:** `EditorExtras.tsx:160` only reads `fieldErrors.publishAt`, so the dialog stays open silently. | Show the other field errors and close the dialog. |
| C4 | Medium | **A scheduled publish that fails validation stays "scheduled" forever** with a past date and no audit entry (`content.js:500`). | Move it back to `approved`, clear `publishAt`, and audit `schedule_failed`. |
| C5 | Medium | **No translated message for `sample_narrative_needs_sample_figures`.** The field is hidden when figures are approved, so the error is invisible. `narrative_needs_approved_figures` is mapped by field, not by code (`EntryEditor.tsx:854-875`). | Add the `Editor.errorNarrativeFigures` / `errorSampleNarrative` keys in all 5 catalogs. Map by code; always render. |
| C6 | Medium | **The approve-figures dialog doesn't say it switches off the public sample story** (`content.js:445`). `figuresBanner` is outdated (`messages/*.json` `Editor.approveFiguresImpact`, `figuresBanner`). | Reword both, in all 5 locales. |
| C7 | Medium | **Public idea submission has no server-side consent check and no duplicate protection** (`wm.js:422-446`), unlike leads (`ops.js:104`). | Require `consent === true` and `privacyVersion === privacyInForce()`. Dedupe with an Idempotency-Key or by email+message within a time window. |
| C8 | Medium | **Moderators can't see what the site sends or shows.** The WM `Idea` type has no `submitter`, `source` or `commentPreview` (`store/api.ts:306-330`). Merging moves votes but not comments (`content.js:484-490`). The comment "form sends nothing yet" (`api.ts:316`) is stale. | Show the submitter (masked by PII rules) and the sample comments read-only. Merge comments too. Fix the comment. |
| C9 | Low | `defaults.js:20-21` hard-codes the dates 2026-10-05 / 2026. Copies replace a localized `sampleLabel` with English (`content.js:258`). Publishing doesn't require `image.src` for a case or article. The template picker uses the filtered list (`EntryList.tsx:389`). `sampleNarrativeHelp` shows up to 3× (`EntryEditor.tsx:870-890`). Restore shows a 403 only after confirming. A stale comment at `content.js:373`. `source-overrides.mjs` has about 20 `String.replace` calls with no "matched" check (they silently no-op after an upstream change). The board region has no accessible name (`source-overrides.mjs:56`). Legal 0.2 date mismatch. `pg_signUp` title "sign up \| OrgTik" with an empty description. f439b5c reformatted 6 WM files to 80 columns with no Prettier config. Pausing forms doesn't stop contact leads (`wm.js:356`, older). | Fix in a cleanup commit. Make `source-overrides` throw on no-match. |

---

## D. Records and process

| # | Finding | Fix |
|---|---|---|
| D1 | **D-048 is stale:** it still says "keep permanent redirects to /work for the 4 deleted projects". The projects were restored on 10-06, and b61cba2 correctly removed those redirects. There is no decision record for the `sampleNarrativePublished` model, nor for the Roadmap deviations (B5). | Mark D-048 superseded. Add **D-049** (restored projects plus the sample-narrative model) and, after the user confirms, **D-050** (Roadmap deviations from owner `main`). Update `decisions/README.md`. |
| D2 | **No `plan.md` amendment for the `dc7735f` sync** (the drift protocol, step 5). The A9 follow-up block still says "Eight permanent redirects cover the four deleted projects". | Add **A10: website `dc7735f`** (restored Roadmap and Work, sample-narrative model, recovery points, evidence) and correct the A9 follow-up redirect sentence. |
| D3 | **No full-site parity against the new owner baseline.** No `repo-dc7735f` capture exists. The 10-06 evidence covers only the 48 Work-page checks and the adapters; the last full-site capture is against `repo-3a66678`. | `capture.mjs --label repo-dc7735f` on a clean worktree of `origin/main`, then capture `cms/connect`, then `diff.mjs` (dev and build). Every difference must be either the confirmed Roadmap deviations (B5) or nothing. |
| D4 | **The full flow suite was not re-run after the 10-06 seed change** (5 case studies back, sample narratives, redirects removed). The 15-suite record `audits/wm/followup/flow-runs-wm-s0.json` is from 10-05 16:18. Since then only `wm-preview`, `site-forms` and the new sync checks ran. | Run `node tools/audit-kit/run-followup-flows.mjs` plus `wm-followup.mjs` under the lock, and commit the new counts in `audits/wm/sync-20261006/`. |
| D5 | **Local `main` is 4 commits behind `origin/main`** (3a66678 vs dc7735f). The seed is pinned through `WEBSITE_REF`, so nothing is broken, but the drift protocol expects `main` to equal the baseline. | `git checkout main && git merge --ff-only origin/main` (local only), or record that `main` stays pinned. |
| D6 | **Leftovers:** WM `AGENTS.md` / `CLAUDE.md` are still untracked (WP1.3 said to gitignore them). Untracked 10-03 parity folders in orgtik-program (`s5-*`, `s6-*`, `mirror/`, `cms-s6-forms*`, `diff-c8be7fe-*`). `audits/tasks/flows/*walks.json` still overwritten by a partial T9 run. `tools/audit-kit/_sales-vs1-final.mjs` and `probe.tmp.mjs`. | Gitignore the two WM files. Commit or delete the parity folders (user's call). Tell the Tasks/Sales owners about theirs; don't stage them. |

---

## Suggested order
1. **Ask the user:** who owns section A (the auth screen), and do they confirm the Roadmap deviations (B5)?
2. **Security and data:** C1, C2, C7, B1, B2.
3. **Correctness:** B3, B4, C3, C4, B6, B9.
4. **i18n and RTL:** B7, B8, C5, C6.
5. **Records and proof:** D1–D5, then the full flows and full-site parity.
6. **Cleanup:** B10, C9, D6, and section A after the owner's answer.
