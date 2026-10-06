# Audit kit

Browser audits for the OrgTik suite, run against `../../../local-dev`: a route sweep and a dead-end detector. They share a sign-in helper, the page checks and the route inventory. Generalised from `somion-hq/{deadends,audit}.mjs`.

## Setup

1. Start local-dev: the mock (`node server.js`) and the app dev servers. `node smoke.js` in local-dev should report "No problems".
2. Install the kit once:

```bash
npm ci
```

Playwright needs its Chromium; if it isn't downloaded yet, run `npx playwright install chromium`.

Ports, apps and the test password all come from `local-dev/config.js` and `local-dev/lib/identity.js`, so nothing here needs editing when they change.

## Route sweep

```bash
node sweep.mjs
```

It visits every route in `../../audits/inventory/routes.csv` for every app, signed in as Mona (who can open every app), in EN at 1440×900.

| Option | Default | Meaning |
|---|---|---|
| `--apps files,tasks` | all | Only these apps |
| `--as <email>` | `mona.adel@orgtik.test` | Sign in as another test identity (see local-dev/README.md) |
| `--width` / `--height` | `1440` / `900` | Viewport |
| `--locale` | `en` | The locale prefix for apps whose routes carry one |
| `--label` | `baseline` | Name of the output files, e.g. `mobile`, `after-wave-1` |
| `--no-axe`, `--no-shots` | off | Skip axe, or skip screenshots |
| `--freeze` | off | Freeze the mock and browser clocks at `AUDIT_NOW` (see "Clocks") |
| `--min-free-mb` | `400` | Stop cleanly below this much free disk |

**How pages are reached:**
- Static routes first.
- Dynamic routes (`/projects/:id`) use a link found on a page already visited, but only a link that renders that route. Links are assigned the way the router picks: a static segment beats a parameter, which beats a catch-all, so `/auth` never stands in for the `/*rest` not-found page. If no page links to a route, it uses a sample built from the mock's seed, in `lib/samples.mjs` (for example the public share link). A root catch-all with neither is the app's not-found page, so it gets `/audit-missing-page`.
- Pages meant for people who aren't signed in come last, in a signed-out browser: sign-in pages, public share links and guest links (route groups `auth`, `share`, `guest`). That way they can't end the session the other routes run in.
- Each page is settled before it's checked: the Next.js dev badge is hidden, animations are finished, and fonts are loaded. Without this, a half-faded card fails contrast at random and the counts change from run to run.

**Output:**
- `../../audits/<app>/sweep-<label>.json`: full detail per route (console messages, failing API calls, axe rules).
- `../../audits/sweep-<label>.csv`: one row per route for all apps, rewritten after each app.
- `../../audits/<app>/shots/`: one full-page screenshot per route. Git ignores it; commit only the shots an issue cites as evidence.

| Column | Meaning |
|---|---|
| `session` | `signed-in` or `signed-out` |
| `status`, `final` | HTTP status of the page, and the path it ended on |
| `auth_redirect` | A signed-in visit ended on a sign-in or not-allowed page |
| `token_in_url` | The page kept a bearer token in its address. This is a SEC issue. |
| `console_errors`, `page_errors` | Console errors, and uncaught exceptions |
| `api_errors`, `api_error_sample` | Calls to the local mocks that returned 4xx/5xx |
| `axe_critical`, `axe_serious`, `axe_rules` | axe-core against WCAG 2.2 A/AA. Counts are **elements**, not rules. |
| `h1`, `unnamed_controls`, `img_no_alt`, `small_targets` | Structure checks. Small targets are buttons and links under 24×24. |

## Dead-end detector

```bash
node deadends.mjs
```

It takes every page the last `baseline` sweep loaded (`--from <label>` picks another sweep) and presses every control on it, each in a fresh browser tab signed in the same way. It records whether anything happened.

| Option | Default | Meaning |
|---|---|---|
| `--apps`, `--as`, `--locale`, `--min-free-mb` | | As for the sweep |
| `--from` | `baseline` | Which sweep's pages to use |
| `--label` | `baseline` | Name of the output files |
| `--max-controls` | `40` | Named controls pressed per page. Unnamed buttons are capped at half of this. |
| `--route <text>` | | Only routes containing the text. The output gets the label `<label>-subset`, so a full report is never overwritten. |

**What gets pressed:**
- Every enabled, named button, and every link that goes nowhere (`#` or `javascript:`). Names come from Playwright's accessibility snapshot, the same names its locators match.
- Buttons with no accessible name, located by their DOM path and labelled by their icon, e.g. `(unnamed: chevron-left)`.
- Duplicates are pressed once per page: the same name, or the same icon for unnamed buttons.
- Before each press, the mock data is fresh for that page.

**Not pressed:**
- Controls that destroy data or end the session: delete, remove, archive, sign out, leave, end call, pay, and the trash icon. The full list is `SKIP` in `deadends.mjs`. They're listed as `skipped`; their flows get dedicated tests.
- Controls that only accept clicks on hover.

**Links:** every link on the page, including links into other suite apps, is checked against the route inventory.

**Outcomes:**

| Outcome | Meaning | Issue |
|---|---|---|
| `navigated`, `opened`, `changed` | It answered. It went to another page; opened a dialog, menu, listbox, new tab, file chooser, download or native dialog; or changed the visible text, the DOM or its own state. | – |
| `dead end` | Nothing visible happened, even after a second look | DE |
| `copied silently` | It copied to the clipboard but showed no feedback | MS |
| `left the app` | It went back in browser history. Opened from a link, which is how every press starts, that lands on a blank tab. | DE |
| `sign-in wall` | Signed in, it sent the person to a sign-in or not-allowed page | PERM or BF |
| `broken link` | A link whose path matches no route in the inventory | BF |
| `not clickable` | The click failed. The detail says why, e.g. another element intercepts it. | Needs a look |
| `not found` | The control wasn't there after a reload. The page isn't deterministic. | Needs a look |
| `current page` | A nav item pressed on its own page. Correct, but it isn't marked `aria-current`. | A11Y (S3) |
| `active option` | The selected half of a toggle, such as Grid in Grid/List. Correct, but it isn't marked `aria-pressed` or `aria-selected`. | A11Y (S3) |
| `skipped` | Destructive or session-ending, or only reachable on hover | – |

`current page` and `active option` come from second looks at controls that first seemed dead:
- **Current page:** a control that leads to page X from other pages, but does nothing on X itself.
- **Active option:** press a neighbouring button in the same group first, then the control. If it answers then, it's the active option.

**Output:**
- `../../audits/<app>/deadends-<label>.json`: per page, the controls found and each outcome, plus a tally.
- `../../audits/deadends-<label>.csv`: one row per control. `where` holds the DOM path of unnamed buttons.

A press takes about 4 seconds, and Files (9 pages, 67 presses) takes about 4½ minutes.

## One app at a time

```bash
node baseline.mjs
```

It runs the whole baseline one app at a time, in wave order: Files, SOS, Tasks, Chats, HR, Marketing, Sales, Content. For each app it:
1. Starts only that app's dev server, with the same command as `local-dev/start-all.js`, and waits until it answers.
2. Runs the sweep, then the dead-end detector.
3. Stops the server.

Then it writes the report.

This needs far less memory than nine dev servers at once, and Windows grows its page file under memory pressure. With `--clean` it also deletes each app's `.next` before and after, so only one app's build is on disk at a time. That's for a nearly full disk; builds then compile from scratch.

| Option | Meaning |
|---|---|
| `--apps a,b` | Only these apps |
| `--label` | Output name (default `baseline`) |
| `--clean` | Delete each app's `.next` before and after its run |
| `--no-deadends` | Sweeps only |

The local-dev mock must be running, and no app in the run may have its own dev server running. The script stops rather than audit a server it didn't start. Dev server output goes to `local-dev/logs/devserver-<app>.log`.

The combined CSVs keep the rows of apps that weren't in a run, so apps can be re-run one at a time.

## Report

```bash
node report.mjs
```

It turns a sweep and a dead-end run with the same `--label` (default `baseline`) into per-app numbers. They go in `../../audits/runtime-metrics-<label>.md` and `.csv`, in the same metric × app layout as the code counts in `baseline-metrics.md`. The report also shows on how many routes each axe rule fails.

## Clocks

Clocks stay real by default. That's the only setup where the browser, the Next servers and the mock agree on "now". `--freeze` moves the mock and the browser to `AUDIT_NOW`, but it can't move the Next servers. So on a frozen run, anything a page renders from the time on the server (a relative date, a "today" marker) can fail hydration. Use `--freeze` for repeatable screenshots, and confirm any hydration error it reports with a real-clock run.

A real-clock hydration error is an app bug. For example, every signed-in Files page fails hydration because `WelcomeHeader` renders nothing on the server (the store has no user yet) and the greeting on the client.

## Known limits

- One level deep: the items inside a menu that a press opens aren't pressed.
- Unnamed buttons are located by DOM path. That's stable because the seed is deterministic, but a page with random or time-based order would show up as `not found`.
- If a dev server's Turbopack panics (`PoisonError` in its log, which happened once when the disk filled), every route it hasn't compiled yet returns 500. Restart that server; the sweep can't tell this apart from an app bug.
- The first visit to a route compiles it, so the first sweep after a restart is slower. `load_ms` only means something on a warm server.

## Adding a sample for a dynamic route

Nothing links to some routes. Public links reach people by email or chat, so their URLs never appear in a page. Add an entry to `SAMPLES` in `lib/samples.mjs` that builds the path from the mock's seed. The path has no locale prefix, and secrets in it are fine because the sweep masks `token`, `secret` and `password` values before writing anything.
