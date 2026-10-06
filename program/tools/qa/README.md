# Website parity harness

This is the proof behind D-013: connecting the website to the Website Manager changes nothing anyone can see. Every website change is captured and compared with the **current baseline**: the latest approved website `main` (D-031). The first baseline was `pre-cms` (the website repo's tag on 30db536); the current baseline is `3a66678` (2026-10-05, plan amendment A9). `repo-3a66678` and `sync-3a66678` compare 49 logical routes at three widths: 147/147 identical. In EN, the two must be identical:
- pixels at threshold 0
- the visible text
- the headings
- the accessibility tree

The A9 follow-up explicitly restores `/roadmap` (D-047). Its 48 unaffected routes × three widths match **144/144** on both dev and production (`followup-dev`, `followup-production`, compared with `repo-3a66678 --exclude /roadmap`). Roadmap is captured separately at the same widths in `restored-roadmap-final`, repeated in `restored-roadmap-r2`, and compared with `restored-roadmap-production`. See `audits/wm/followup/README.md` for the complete commands and evidence. Its source datasets are compared with `c8be7fe`; the other adapters with `3a66678`.

## Setup

1. The website dev server must be on `http://localhost:4173`, from local-dev's `start-all.js`, or `npm run dev -- --host 127.0.0.1 --port 4173 --strictPort` in `orgtik-website/landing-directions`.
2. Install once in this folder:

```bash
npm ci
```

It shares Playwright's downloaded Chromium with the audit kit.

## Commands

```bash
node discover.mjs
```

It crawls the site's links into `../../audits/website/routes.json`:
- 50 routes: 11 pages, and the detail views the pages render from the URL fragment (`/services#/service/design/graphic-design`)
- views no link points to, as seeds: the legal documents and the plan builder
- the not-found view
- the **aliases**: one example of each legacy path (`/projects/x`, `/pricing/plans`, `/privacy`, …) and where the site sends it. That's the redirect map the Website Manager has to keep.

```bash
node capture.mjs --label pre-cms
```

Captures every route at 390, 768 and 1440 into `../../audits/website/parity/<label>/`:
- a full-page PNG
- a JSON snapshot with the text, headings, accessibility tree (without link URLs) and page title
- `manifest.json`, with the website commit and whether it had uncommitted changes

`--widths 1440` and `--only /services` narrow a run. `--only` matches by prefix: `/services` includes every service detail page, and `/` matches everything. In Git Bash, prefix route arguments with `MSYS_NO_PATHCONV=1`, or Bash rewrites `/software` into a Windows path and the run captures nothing.

```bash
node diff.mjs --base pre-cms --head self-check
```

Compares two captures and writes `parity/diff-<base>-vs-<head>.md`, plus a diff image for every changed screenshot. It exits 1 on any difference.

## Why a capture repeats to the pixel

These are the site's moving parts: scroll reveals on every page, a rotating hero word, auto-advancing process steps and module explorer, a custom cursor, and autoplay videos. Each capture:
1. Runs with **reduced motion**. The site's auto-advancing parts hold still under it. The module explorer runs on a Web Animation, i.e. on real time, which nothing else can stop.
2. Uses a **fake page clock**, paused. Timers, `requestAnimationFrame` and `Date` only move when the harness advances them.
3. Waits for the network in real time while the page clock stands still, then advances it in fixed steps. The page therefore mounts at the same page time in every run.
4. Scrolls through the page, so every reveal fires and every image loads, and waits for fonts and images.
5. Pauses the videos at frame 0 and waits for each seek to finish (without that wait, a video hero showed the poster in one run and frame 0 in the next: about 300K pixels, invisible to the eye). Then it advances the clock to exactly 15 s of page time after load, however long the page is.
6. Takes the screenshot with CSS animations finished and the caret hidden. The mouse never moves, so the custom cursor stays put.

A **self-check** (two captures of the same commit, then a diff) must report 0 differences before the harness is trusted with a real change.

## What may differ

Link URLs, head tags and the tab title may change (D-013): they're how the real paths, SEO and prerendered heads arrive. Links are dropped from the accessibility tree before comparing, and the head isn't compared. Everything visible or audible must match.

## Limits of v0

- **English only**, like the gate. DE/FR/IT/AR get their own baselines when they go public.
- **Reduced motion only.** A change that only shows while animating (for example the list of rotating hero words) is caught by the text and accessibility snapshots only if those words are in them. The motion variant comes in v1, if needed.
- **No interaction states yet:** open menus, the mobile menu, accordions, the plan builder's steps. These are v1, before slice S1 starts.
- **Dev and production:** `SITE_URL=http://localhost:4280` captures the production build served by `tools/site/host.mjs`, including permanent host redirects and real 404 responses. Unset `SITE_URL` to return to the default dev server at 4173.

## First findings

- The legal documents (`/legal#/privacy`, `#/terms`, `#/imprint`) have **no link pointing to them** anywhere on the site:
  - The legal page switches documents with tab buttons (`pickTab` in `Legal.jsx`).
  - Every footer links only the Sitemap.
  - Beyond the tabs, only the site's legacy redirects reach them (`/privacy` → `/legal#/privacy`).
  - So search engines can't follow them, and nobody can open them in a new tab. The Website Manager's sitemap and footer should give each its own linkable path (S3).

## When the website changes (D-031)

1. In `orgtik-website`: `git fetch origin && git pull --ff-only origin main`.
2. `node discover.mjs`: new, removed or renamed routes show up in the `routes.json` diff.
3. `node capture.mjs --label <short sha>`
4. `node diff.mjs --base <current baseline> --head <short sha>`: the changed captures must match what the change says it touches. Anything else is either harness noise (confirm by capturing the same commit twice) or an unannounced change for the owner.
5. Record the mapping to the content model, tokens and glossary as an amendment in `plan.md`, then use the new label as the baseline.
