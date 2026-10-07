# Bugs and remaining work (2026-10-06)

This is a work order for an AI agent. It comes from the read-only review of the 2026-10-05/06 work; full detail is in `plans/2026-10-06-review-findings.md`.

Earlier plans:
- `plans/2026-10-05-website-3a66678-wm-followup.md`
- `plans/2026-10-06-website-dc7735f-cms-sync.md`

## Rules (same as the 10-05 work order, §1)
- **Stay local:** never push, publish or deploy. Work on website `cms/connect`; never touch `main`'s content.
- **English must not change visually:** English stays pixel-identical to owner `main`, **with no exceptions, Roadmap included** (decision Q2).
- **Your files only:** commit explicit paths only. Never stage these other owners' files:
  - `audits/tasks/**`, `audits/sales/**`, `audits/sos/**`, `audits/admin/**`
  - `tools/audit-kit/_sales-vs1-final.mjs`, `probe.tmp.mjs`
- **Shared mock:**
  - Take `mock.lock()` before any reset or flow.
  - Never kill `node local-dev/server.js`.
  - Stop only your own processes, by PID.
- **Editing on Windows:**
  - Use the Edit/Write tools.
  - Check `git diff --stat` against `--ignore-cr-at-eol` before each commit.
  - Use `MSYS_NO_PATHCONV=1` for route arguments.
- **Builds:** never run a bare `vite build` while the host on :4280 or a capture is running.
- **Commit messages:** end each one with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **New decisions:** if a step needs a decision not listed here, stop and ask the user with AskUserQuestion.

## The user's decisions (answered 2026-10-06; don't re-ask)
- **Q1, the "Authentication successful" screen: it stays.**
  - It is shown **only when sign-in succeeds**. Any error (wrong password, expired or used code, 403, network failure, a hand-off exchange that fails) shows the existing error state, never the success screen.
  - The work in section 1 is the user's, so finish it; don't revert it.
  - The splash itself is not removed: A1 is no longer a removal. The quality fixes A2–A7 still apply.
  - Record as **D-051**.
- **Q2, the Roadmap: it must look and behave like the owner's GitHub version** (`origin/main` `dc7735f`, PR #41). Every local deviation is reverted (W5):
  - the commerce header
  - the compact intro
  - the sample notice
  - the reworded texts
  - the removed preview note
  - the sample comment threads
  - the custom scrollbar
  - the focusable board
  - the CMS idea delivery

  The idea form goes back to the owner's local-only preview ("nothing is sent"). Only the content swap stays: the words and data come from the Website Manager through `run()`/`msg()`/adapters. Record as **D-050**. This replaces the 10-06 plan's line "Preserve these additions rather than restoring the upstream form's no-delivery behavior".

---

## 1. Bugs: uncommitted "Authentication successful" screen
**Where it is:**
- `orgtik-ui`: `AuthSuccess.tsx` (untracked), `package.json` exports, `i18n/strings.ts`, `charts/index.tsx`
- The auth pages of SOS, Files, Tasks, HR, Marketing, Sales, Chats, WM, ADM and the content dashboard
- SOS `app/(dashboard)/layout.tsx`
- WM `components/overview/WebsiteNumbers.tsx`

- [ ] **A1 (High, decided: keep):** the success screen stays, but **only after a successful sign-in** (Q1). Fix:
  - Verify in every app that `confirm(...)` is called only on the success path, after the session is stored. It must never run in a `catch`, a 401/403/expired branch or a failed exchange.
  - Add a flow step per app: a bad code or a wrong password shows the error state and no `[data-auth-success]`.
  - Still worth fixing without removing the screen: a fresh sign-in shows it twice (SOS login, then the target app's `/auth`), about 3.6 s. Show it once per sign-in: on SOS login when the person stays in SOS, or on the target app when SOS hands off. Add a visible "Continue" button so nobody has to wait for the timer.
- [ ] **A2 (High):** wrong copy. "Your credentials have been verified" appears on a code hand-off; "Redirecting you to the dashboard…" appears in apps that aren't dashboards; the title is Title Case; "Access granted" and "Secure access verified" are decorative claims. Fix: rewrite through the glossary (e.g. "Signed in" / "Opening {app}…") in all 5 languages, sentence case.
- [ ] **A3 (Medium):** a fake 100 % progress bar. Screen readers hear it twice (`role="status"` + `aria-live` while the heading also takes focus). `uppercase` is forced on text. Fix: remove the bar; use one announcement method; no forced capitals.
- [ ] **A4 (Medium):** the library change isn't committed, versioned (still rc.12) or covered by a Storybook story, but it was already copied into 12 apps. The unused `./provider` export was added. Fix: commit on a branch, add a story, run `pnpm --filter docs build && pnpm --filter docs check`, release `1.0.0-rc.13` with notes, then re-push to the apps.
- [ ] **A5 (Medium):** the legacy content dashboard (to be retired, S7) got `@orgtik/ui` and 388 lines of lockfile churn. Fix: revert, unless the user wants it.
- [ ] **A6 (Medium):** SOS `(dashboard)/layout.tsx` wraps the shell in `fixed inset-0`, which risks printing, mobile browser chrome and sticky banners. Fix: fix the scroll at the auth page. If the wrapper stays, re-run SOS flows and VS-1 at 390 px.
- [ ] **A7 (Low):** WM `WebsiteNumbers.tsx` uses `[&>div:first-child]:min-h-16`, which reaches into the chart's internals. Fix: add a library prop instead.

## 2. Bugs: Website Manager and mock (`local-dev/apps/wm*`, `orgtik-website-manager`)
- [ ] **M1 (High):** starting or editing a translation revokes figure approval and turns the narrative off. `local-dev/apps/wm/content.js:365` compares figures with `base.locales[patch.locale]`, which is undefined for a new locale. Fix: detect figure changes only when `patch.locale === "en"`, against `base.locales.en`. Add a unit test in `content-followup.test.js`.
- [ ] **M2 (High):** idea submitters' name and email are visible without `leads:pii`. `local-dev/apps/wm.js:391` `ideaOut` returns `submitter` to `marketing:view`. Fix: mask it like leads (`ops.js`), and add an erase-personal-data route.
- [ ] **M3 (Medium):** public idea submission has no consent check and no duplicate protection (`wm.js:422-446`). Fix: require `consent === true` and `privacyVersion === privacyInForce()`; dedupe with an Idempotency-Key or on email+message within a time window.
- [ ] **M4 (Medium):** the schedule dialog swallows narrative errors (`components/content/EditorExtras.tsx:160`). Fix: show the other field errors and close the dialog.
- [ ] **M5 (Medium):** a scheduled publication that fails validation stays "scheduled" forever (`content.js:500`). Fix: move it back to `approved`, clear `publishAt`, and audit `schedule_failed`.
- [ ] **M6 (Medium):** no translated message for `sample_narrative_needs_sample_figures`, and the error is hidden when figures are approved. `narrative_needs_approved_figures` is mapped by field, not by code (`EntryEditor.tsx:854-875`). Fix: add `Editor.errorNarrativeFigures` and `Editor.errorSampleNarrative` in 5 catalogs, map by code, always render.
- [ ] **M7 (Medium):** the approve-figures dialog doesn't say that it switches off the public sample story (`content.js:445`), and `figuresBanner` is outdated. Fix: reword `Editor.approveFiguresImpact` and `figuresBanner` in 5 catalogs.
- [ ] **M8 (Medium):** moderators can't see an idea's submitter, source or sample comments (`store/api.ts:306-330`). A merge moves votes but not comments (`content.js:484-490`). The comment "form sends nothing yet" (`api.ts:316`) is stale. Fix: show the submitter (masked) and the comments read-only, merge comments, and update the comment.
- [ ] **M9 (Low):**
  - `defaults.js:20-21` hard-codes 2026-10-05 / 2026: use `now()`.
  - Copies replace a localized `sampleLabel` with English (`content.js:258`).
  - Publishing doesn't require `image.src` for cases and articles.
  - The template picker uses the filtered list (`EntryList.tsx:389`).
  - `sampleNarrativeHelp` shows up to 3 times (`EntryEditor.tsx:870-890`).
  - Restore gives a 403 only after confirming: pre-check it.
  - Stale comment at `content.js:373`.
  - `seed/source-overrides.mjs` has about 20 `String.replace` calls that silently no-op: make them throw on no match.
  - The board scroll region has no accessible name (`source-overrides.mjs:56`).
  - The legal 0.2 date doesn't match.
  - `pg_signUp` has an empty description.
  - Pausing forms doesn't stop contact leads (`wm.js:356`).

## 3. Bugs: website `cms/connect` (`orgtik-website/landing-directions/`)
- [ ] **W1 (High):** Roadmap ideas ignore the forms mode and fall back to `http://localhost:4007/v2` (`src/content/forms.js:8,42-44`). A build without `VITE_CMS_API` fails every submission. Fix: gate on `formsLive()`; require `VITE_CMS_API` for live mode.
- [ ] **W2 (High):** no privacy notice or consent where the Roadmap form (and Contact) collects name and email, yet each record claims `privacyVersion 0.2`. This conflicts with D-041. Fix: keep delivery off until the owner approves a notice and consent control.
- [ ] **W3 (High):** the payment radios have an empty `aria-describedby`. `src/reference/PurchaseCheckout.jsx:521` calls the deleted message `PurchaseCheckout:36`. Fix: ``aria-describedby={`purchase-method-${method.id}-description`}``.
- [ ] **W4 (High):** code values are editable CMS messages: `purchase-adapter.js:11` (storage key), `:43` (currency "CHF"), `PurchaseCheckout.jsx:305` ("ORG-{0}"), `CaseStudy.jsx:843` ("ResizeObserver"). Fix: make them literals again, exclude them in `tools/site/connect-strings.mjs`, regenerate seed and snapshot, then run `verify-regeneration.mjs`.
- [ ] **W5 (High, decided: match GitHub):** the Roadmap differs from owner `main` in English. Owner PR #41 restored the cinematic header, hero, ticker and preview note; ours has:
  - the commerce SiteHeader
  - a compact "Product roadmap" intro
  - a sample notice
  - reworded community and success texts
  - no preview note
  - a Comments section with 31 "Sample reader" comments
  - a custom board scrollbar
  - a focusable board
  - CMS idea delivery

  Fix: revert all of it to owner `main`, keeping only the content swap (step-by-step in §7 W5). Record it as D-050.

  **Effect on other items:**
  - W1, W2 and W9 no longer apply to the Roadmap: the owner's form sends nothing. They still apply to Contact (W2) and to `forms.js`.
  - W6 (Roadmap part), W7 (Roadmap lines) and W8 must be re-checked on the reverted file, because the line numbers change.
  - M3 and M8 become low priority: no public idea submissions arrive while the site doesn't send them.
- [ ] **W6 (Medium):** the "All" filters break once the label is edited or translated (`Roadmap.jsx:531-532,573`, `Work.jsx:637`). Fix: use an internal `"all"` value; the message is only the label.
- [ ] **W7 (Medium):** hard-coded English remains in:
  - `Roadmap.jsx:569`: Past/Now/Next
  - `Roadmap.jsx:588-590,660`: plural nouns
  - `Roadmap.jsx:2573,2605,2638`: form labels
  - `Work.jsx:467,636-638,817,1871,2428`
  - `SignIn.jsx:1274,1309`
  - `forms.js:54` `SEND_FAILED`
  - `src/content/index.js:26-32`: status and period labels
  - "Made in Switzerland" in 10 footers
  - Home `footSoftware`

  Fix: route them through copy/strings.
- [ ] **W8 (Medium):** the restored Roadmap isn't mirrored for Arabic. `mirror.mjs --dry` finds 16 physical keys in `Roadmap.jsx`, including 1188/1249 (select chevron), 1372/1382 (timeline rail), 1531 and 1589. Fix: run `tools/site/mirror.mjs`, add a `[dir=rtl]` rule for the rail gradient, then check `/ar/roadmap` with `mirror-review.mjs`.
- [ ] **W9 (Medium):** idea submit can hang forever with the button disabled: there is no timeout (`Roadmap.jsx:761-766`). Fix: a 15 s AbortController timeout, then show the error.
- [ ] **W10 (Low):**
  - `Work.jsx:795`: `"-g" + i + 1` should be `(i + 1)`.
  - `SiteHeader.jsx:150`: remove `data-menu-toggle` from the close button.
  - The Home mobile menu "Home" became `/` instead of `#top`.
  - Dead hero, ticker and header-scroll code in Roadmap (240-265, 521-564).
  - Add a null guard to the focus trap (`Roadmap.jsx:16-24`).
  - The SiteHeader ProjectLink should use `gl_header` (WP2.7).

## 4. Remaining work (not bugs)
- [ ] **R1, decisions:** mark D-048 superseded; the projects were restored and the redirects removed in b61cba2. Add **D-049** (restored projects + the `sampleNarrativePublished` model), **D-050** (the Roadmap follows owner `main`; ideas are local-only like the owner's; this supersedes D-047's local preview-voting and delivery parts) and **D-051** (the auth success screen stays, only on successful sign-in). Update `decisions/README.md`.
- [ ] **R2, plan:** add **A10: website `dc7735f`** to `plan.md` (restored Roadmap and Work, sample-narrative model, recovery points, evidence). Correct the A9 follow-up sentence about the "eight permanent redirects".
- [ ] **R3, full-site parity against the new owner baseline:** there is no `repo-dc7735f` capture yet.
  1. Capture a clean worktree of `origin/main` with `capture.mjs --label repo-dc7735f`.
  2. Capture `cms/connect` on the dev server and on the build (`SITE_URL=http://localhost:4280`).
  3. Run `diff.mjs`. **Zero differences allowed, Roadmap included** (Q2).
- [ ] **R4, full flow suite after the 10-06 seed change:** the last full run is from 10-05 16:18. Under the lock, run `node tools/audit-kit/run-followup-flows.mjs` and `node tools/audit-kit/flows/wm-followup.mjs` (and `site-followup-production.mjs` against :4280). Commit the counts in `audits/wm/sync-20261006/`.
- [ ] **R5, Arabic review:** after W7 and W8, run `mirror-review.mjs` over every touched `/ar/` route at 1440 and 390: 0 overflow, 0 console errors.
- [ ] **R6, local `main`:** it is 4 commits behind `origin/main`. Run `git checkout main && git merge --ff-only origin/main` (local only), or record that it stays pinned.
- [ ] **R7, leftovers:**
  - Gitignore WM `AGENTS.md` and `CLAUDE.md`.
  - The untracked 10-03 parity folders in orgtik-program (`audits/website/parity/s5-*`, `s6-*`, `cms-s6-forms*`, `diff-c8be7fe-*`, `diff-cms-s3-*`, `audits/website/mirror/`): commit or delete them, the user's call.
  - Tell the Tasks owner that `audits/tasks/flows/*walks.json` were overwritten by a partial T9 run.
- [ ] **R8, after every fix batch:**
  - website: `npm run test:cart`, `node --test tests/roadmap-form.test.mjs tests/cms-purchase.test.mjs`, `npm run format:check`, `npm run build` (nothing else using `dist`)
  - parity: `node tools/qa/content-parity.mjs --base dc7735f`
  - WM: `npx tsc --noEmit`
  - mock: `node --test apps/wm/content-followup.test.js`
  - catalogs: the 5 WM catalogs keep identical key sets

## 5. Out of scope (blocked on others)
- **D8:** the owner's sign-off on Arabic mirrored. **Translators** for DE/FR/IT/AR (PM Q-007c). Public languages stay English only.
- **Live production forms:** need a privacy policy, a retention period and a consent control (D-041).
- **Lifting noindex:** needs a content approver (Q-010b).
- **The catalog-words exception (A7).**
- **Retiring the legacy content dashboard (S7).**
- **Real payments, authentication, CRM and voting:** these need the backend.

## 6. Order of work
1. W5 (revert the Roadmap to GitHub), then A1 (success screen only on successful sign-in) and the rest of section 1.
2. M1, M2, W1, W2 (data and privacy; W1 and W2 now concern Contact and `forms.js`).
3. W3, W4, M4, M5, W6 (correctness).
4. W7, W8 (re-checked on the reverted Roadmap), M6, M7.
5. R1–R6 (records and proof).
6. W10, M9, M3, M8, R7.

## 7. How to fix: step by step for the High bugs
These are checked against the code on 2026-10-06. Line numbers can drift, so match on the quoted code, not the line.

### M1: translation revokes approval (`local-dev/apps/wm/content.js`, about line 365)
Current code:
```js
const figuresChanged = next.provenance && patch.fields && ["highlight", "results"].some((k) => k in patch.fields && !same(patch.fields[k], base.locales[patch.locale]?.[k]));
```
1. Figures are set in English only (other languages get the numbers through `copyNumbers`), so compare English with English:
   ```js
   const figuresChanged = next.provenance && patch.fields && patch.locale === "en" &&
     ["highlight", "results"].some((k) => k in patch.fields && !same(patch.fields[k], base.locales.en?.[k]));
   ```
2. If editors may also change *numbers* inside a translation, compare only the numeric values of `highlight` and `results`, not their labels. Ask the user if unsure.
3. Move the stale comment "Figures edited while approved…" (about line 373) above this block.
4. Add tests to `apps/wm/content-followup.test.js`:
   - approve figures → enable narrative → save a `de` tree copied from `en` → figures stay `approved` and `narrativePublished` stays `true`
   - change an English result number → approval revoked (the existing behaviour)
5. Run `node --test apps/wm/content-followup.test.js`.

### M2: idea submitter data without `leads:pii` (`local-dev/apps/wm.js`, about line 391)
Current code:
```js
const ideaOut = (x) => ({ ...x, history: x.history.map((h) => ({ ...h, by: person(h.by === "visitor" ? null : h.by) })) });
```
1. Reuse the lead masking. `ops.js` already has `mask` and `maskEmail` (lines ~39-40); export them from `ops.js` if they aren't exported yet.
2. Give `ideaOut` the request, and mask:
   ```js
   const ideaOut = (req, x) => ({
     ...x,
     ...(x.submitter ? { submitter: pii(req) ? x.submitter : { ...x.submitter, name: ops.mask(x.submitter.name), email: ops.maskEmail(x.submitter.email) } } : {}),
     history: x.history.map((h) => ({ ...h, by: person(h.by === "visitor" ? null : h.by) })),
   });
   ```
   `pii` is defined above, at about line 297. Move `pii` above `ideaOut` if needed. Update every `ideaOut(x)` call to `ideaOut(req, x)`.
3. Add `POST /v2/admin/ideas/:id/erase` (needs `leads:pii`, as the leads erase route at about line 349 does). It replaces `submitter` with `{ erased: true, privacyVersion }` and writes a history entry.
4. In the WM, the `Idea` type (`store/api.ts`) gets `submitter?: { name: string; email: string; privacyVersion: string; erased?: boolean }`. The moderation drawer shows it, plus an "Erase personal data" action for `leads:pii` holders. Add the 5 catalog keys.
5. Test: a `marketing:view` user without `leads:pii` gets masked values; a Marketing role user gets the real values.

### M3: idea consent and duplicates (`local-dev/apps/wm.js`, `POST /v2/public/ideas`, about line 422)
1. After the field checks, add the consent check:
   ```js
   if (b.consent !== true) fieldErrors.consent = "required";
   if (String(b.privacyVersion ?? "") !== ops.privacyInForce()) return fail(res, 409, "privacy_outdated", "The privacy notice changed; reload the page.");
   ```
   Use the same helper the leads route uses (`ops.js:104`); check its real name.
2. Dedupe: keep a `Map` keyed by `` `${email.toLowerCase()}|${message}` `` → timestamp. If the same key arrives within 10 minutes, return the existing id with 200 instead of creating a new idea. Also honour an `Idempotency-Key` header if one is present.
3. On the website, `sendIdea` must send `consent: true` only from a real consent control (W2), never hard-coded.

### W1: Roadmap form ignores the forms mode (`landing-directions/src/content/forms.js`)
> After W5 the Roadmap no longer calls `sendIdea`: the owner's form sends nothing. Still make `sendIdea` safe (steps 1, 3 and 4) so that no future caller can post in preview mode or to localhost. Skip step 2.

The server already refuses with 409 `forms_preview` when forms are paused, so today the visitor sees an error instead of the owner's preview behaviour.
1. Mirror `sendLead`:
   ```js
   export async function sendIdea({ name, email, message, topic, consent }) {
     if (!formsLive()) return { preview: true };
     return post("ideas", { name, email, message, topic, consent });
   }
   ```
2. In `Roadmap.jsx`, when the result is `{ preview: true }`, show the owner's original preview success. The owner's text "Frontend preview · nothing is sent." returns in preview mode only.
3. Stop silently falling back to localhost in production builds:
   ```js
   const API = import.meta.env?.VITE_CMS_API ?? (import.meta.env?.DEV ? "http://localhost:4007/v2" : null);
   ```
   In `post()`, throw at once if `API` is null, so the form shows `SEND_FAILED`.
4. Add a 15 s timeout here (it also fixes W9): create an `AbortController`, call `setTimeout(() => ctl.abort(), 15000)`, pass `signal` to `fetch`, and clear the timer in `finally`.
5. Extend `tests/roadmap-form.test.mjs` for three cases: preview mode → no request; no API in production → rejects; timeout → rejects.

### W2: no privacy notice or consent (Roadmap and Contact forms)
This is a design change on the owner's site, so the agent must **not** invent UI.
1. Set the Website Manager forms mode back to `preview` (mock `ops.site.formsMode`, seed `ops.js:151`) until the owner supplies the design. Both forms then behave like owner `main`.
2. Record the decision and the requirements in D-041's follow-up: an approved privacy line, a link to `/legal/privacy`, an explicit consent checkbox, and a retention period.
3. When the owner provides the design, wire the checkbox value into `consent` (see M3).

### W3: payment radios lose their description (`landing-directions/src/reference/PurchaseCheckout.jsx`, about line 521)
Replace:
```jsx
aria-describedby={msg("PurchaseCheckout:36", [method.id])}
```
with:
```jsx
aria-describedby={`purchase-method-${method.id}-description`}
```
Check that the element with that id still exists (search the same file for `-description`).

### W4: code values exposed as CMS messages
| Where | Current | Change to |
|---|---|---|
| `purchase-adapter.js` (about line 11) | `export const ORDER_SESSION_KEY = msg("purchase-adapter:1");` | `export const ORDER_SESSION_KEY = "orgtik.purchase-preview.v1";` |
| `purchase-adapter.js` (about line 43) | `currency: msg("purchase-adapter:5"),` | `currency: "CHF",` |
| `PurchaseCheckout.jsx` (about line 305) | `msg("PurchaseCheckout:19", [crypto.randomUUID()…])` | `` `ORG-${crypto.randomUUID().slice(0, 8).toUpperCase()}` `` (check the owner's original on `origin/main` and copy it exactly) |
| `CaseStudy.jsx` (about line 843) | `if (!(msg("CaseStudy:18") in window)) return;` | `if (!("ResizeObserver" in window)) return;` |

Then:
1. In `orgtik-program/tools/site/connect-strings.mjs`, add an exclusion so these never become messages again: storage keys, currency codes, id or reference templates, and `in window` checks.
2. Remove the 4 templates from `strings-templates.js` and the seed. Do this by regenerating: `$env:SEED_REF='main'; node apps/wm/seed/build.mjs` in local-dev (use the pinned `WEBSITE_REF`), then `node tools/site/regenerate-followup.mjs`, then `node tools/site/verify-regeneration.mjs`.
3. Run `content-parity.mjs --base dc7735f` and `npm run test:cart`.

### W5: revert the Roadmap to the owner's GitHub version (decided, D-050)
The current diff against the owner is about 1,400 changed lines in `Roadmap.jsx` plus 47 in `site.css`.
1. Make a backup branch in the website repo: `git branch backup/cms-before-roadmap-revert-20261006`.
2. Start from the owner's files:
   ```bash
   git show origin/main:landing-directions/src/reference/Roadmap.jsx > landing-directions/src/reference/Roadmap.jsx
   git checkout origin/main -- landing-directions/src/reference/site.css
   ```
   Check whether `site.css` had CMS-branch changes worth keeping, such as the S5 Arabic font stack or mirrored properties. If it did, re-apply only those.
3. Re-apply **only the content swap**, the same way the 10-05 sync did for the other pages:
   - Run `node tools/site/connect-copy.mjs` and `node tools/site/connect-strings.mjs` over `Roadmap.jsx`. They keep existing bindings and number the new ones.
   - Point `RM` / `IDEAS` at the existing adapters in `src/content/index.js`.
   - Keep the owner's idea form exactly as it is: local-only, "nothing is sent". Do **not** call `sendIdea`.
   - Run `node tools/site/mirror.mjs` on `Roadmap.jsx` (S5 Arabic logical properties; this also closes W8). Add the `[dir=rtl]` rule for the timeline rail.
4. Seed and mock:
   - Remove the sample comment threads (`commentPreview`, local-dev 048e10c) from the seed and the public adapter. The owner shows comment counts only, and those counts stay.
   - Point the Roadmap seed source at `dc7735f` (`seed/source-overrides.mjs`). Drop the transforms that inject the compact intro, the scrollbar and the delivery.
   - Regenerate in this order: the seed build, then `node tools/site/regenerate-followup.mjs`, then `node tools/site/verify-regeneration.mjs`.
5. Forms mode: Roadmap ideas no longer reach the CMS. Set the mock's default forms mode back to `preview`, unless the user wants Contact live (W2).
6. Website Manager: keep the Ideas moderation area (D-047), with a banner in 5 catalogs: "The website's idea form is a local preview; nothing arrives here yet". Remove the sample-comments UI, if there is one.
7. Proof:
   - `content-parity.mjs --base dc7735f` → equal.
   - `capture.mjs --exact /roadmap` on dev and on the build, diffed against `repo-dc7735f` (R3) → **0 differences**.
   - `tests/roadmap-form.test.mjs` updated to the owner's behaviour: no request is sent.
   - The `roadmap-delivery` and `roadmap-comments` flows retired, or rewritten to assert that nothing is sent.
   - `mirror-review.mjs` on `/ar/roadmap` → no overflow.
8. Write `decisions/D-050.md`. Correct the A9 follow-up and the 10-06 sync record, which both describe the reverted additions.

### A1 / A2: the auth success screen (decided: keep, only on success, D-051)
1. **Only on success.** Each app calls `confirm(...)` in exactly one place: after the session is verified and stored. Check every auth page listed in section 1. The error branches keep their existing `ErrorState` or form error and never call `confirm`:
   - `catch` blocks
   - 401, 403 and `expired` responses
   - a failed `/handoff/exchange`
   - network errors
2. **Test it.** Add three steps to each app's existing flow (`flows/<app>.mjs`):
   - A used or expired `?code=` shows the error state, and there is no `[data-auth-success]`.
   - An SOS login with a wrong password shows the form error, with no success screen.
   - A valid sign-in shows the success screen, then the destination loads.
3. **Once per sign-in** (the screen stays):
   - When SOS login hands off to another app, skip it in SOS and show it in the destination app's `/auth`.
   - When the person stays in SOS, show it in SOS.
   - Switching apps from the rail (`/go`) is not a sign-in, so don't show it there.
   - To tell the cases apart, add a flag like `?fresh=1` to hand-off URLs that come from login, or set a short-lived `sessionStorage` flag.
4. **Quality fixes** (the screen stays):
   - Add a visible "Continue" button that runs `onContinue` at once. Keep the timer as the fallback.
   - Remove the fake `Progress` bar and the `uppercase`.
   - Use either the heading focus or `aria-live`, not both.
5. **Copy**, in 5 languages and sentence case:
   - `authSuccessTitle`: "Signed in".
   - `authSuccessBody`: "Opening {app}…", with the app's name taken from the suite catalog.
   - Drop "credentials verified" (wrong for a code hand-off) and "dashboard".
6. **Release** (A4):
   1. Commit on a branch.
   2. Add a Storybook story covering light/dark and en/ar.
   3. Run `pnpm --filter docs build && pnpm --filter docs check`.
   4. Release `1.0.0-rc.13` with notes.
   5. Re-push with yalc to every app and run `typecheck` in each.
   6. Commit each app's auth change separately, with explicit paths.

## Definition of done
- [ ] D-050 (Roadmap = GitHub) and D-051 (success screen only on successful sign-in) written.
- [ ] Every High and Medium item ticked, with a commit per item or small group.
- [ ] R3 parity is clean with **zero** differences against `repo-dc7735f` (Roadmap included), and R4 flows are all green with their counts committed.
- [ ] Every app shows the success screen after a good sign-in, and never after an error (a flow step per app).
- [ ] R1 and R2 records written; nothing pushed.
