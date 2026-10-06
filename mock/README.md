# OrgTik: run everything locally

Runs the seven OrgTik apps and the website on your machine against a local mock backend. Nothing talks to the online `sosback.orgtik.*`, `sos.orgtik.*`, app backends, or the Iconify icon API.

## Start

Double-click `start-local.cmd` in the project root, or:

```sh
cd local-dev
npm install        # first time only
npm start          # mock APIs + every app's dev server
```

Then open **http://localhost:3013/auth/login**, sign in with a test account below, and use the launcher bar on the left to open each app. **Chats** (Somion HQ) is the last tile; opened from there, it shows the same suite launcher as every other app (on desktop widths; on narrow screens HQ uses bottom tabs). The website needs no sign-in: open its URL directly. The launcher hands your session to the app; opening an app's URL directly without a session sends you back to the login.

Stop everything with Ctrl+C (or close the window).

| App | URL | Mock API |
| --- | --- | --- |
| SOS (login, people, chat) | http://localhost:3013 | http://localhost:4000 |
| Task Manager | http://localhost:3001 | http://localhost:4001 |
| File Manager | http://localhost:3002 | http://localhost:4002 |
| Sales | http://localhost:3003 | http://localhost:4003 |
| HR | http://localhost:3004 | http://localhost:4004 |
| Digital Marketing | http://localhost:3014 | http://localhost:4005 |
| Content Dashboard | http://localhost:3006 | http://localhost:4006 |
| OrgTik Chats / Somion HQ (chat, calls, virtual office) | http://localhost:3000 | none (built-in mock data) |
| Website (frontend only) | http://localhost:4173 | none |
| Local icon server | http://localhost:4099 | |
| *Reserved:* Website Manager (the new CMS) | http://localhost:3007 | http://localhost:4007 |
| *Reserved:* Admin back-office (ADM) | http://localhost:3008 | http://localhost:4008 |

The reserved ports belong to apps the program will build. `start-all.js` and `patch.js` skip them until those apps exist.

Run only some apps: `node start-all.js tasks,files` (SOS always starts, since it is the login).

## Test accounts

Every account uses the password **`Local@2026`** (local only, defined in `lib/identity.js`).

| Person | Email | What they are |
| --- | --- | --- |
| Mona Adel | mona.adel@orgtik.test | Super admin: every app, every screen |
| Karim Hassan | karim.hassan@orgtik.test | Manager (project manager in Tasks, manager in HR and Sales) |
| Salma Nabil | salma.nabil@orgtik.test | Employee / developer |
| Omar Farouk | omar.farouk@orgtik.test | Salesman (Sales), viewer (Tasks) |
| Nour Khaled | nour.khaled@nilefoods.test | Customer of Nile Foods (forwarded to the Sales customer portal) |
| Hany Samir | hany.samir@orgtik.test | Finance manager (HR) |
| Rana Saad | rana.saad@orgtik.test | HR specialist |
| Hoda Ashraf | hoda.ashraf@orgtik.test | Content writer (Content dashboard, Marketing) |

More staff (Youssef, Laila, Ahmed, Mahmoud, Dina, Tamer, Sherif, Aya) exist with the same password; see `lib/identity.js`. Forgot-password OTP is `123456` for any seeded email.

## Good places to start

- **SOS:** People (roles per app), Systems, Chat (1:1, real-time), "Login as" another user.
- **Tasks:** project boards (drag cards), My Tasks, Teams; sign in as Salma to see a developer's view.
- **Files:** folders, previews (PDF, Word, images, video), share links. Seeded public links are printed when the API starts.
- **Sales:** sign in as Nour to see the customer portal, as Omar for the salesman view.
- **HR:** attendance, time off, payroll runs (HR prepares → Mona approves → Hany pays).
- **Marketing:** posts and approvals for the Nile Foods brand, campaign wizards, a simulated social-account connect flow.
- **Content:** services, blogs (the code editor is served locally), projects, contact inbox.
- **Chats:** the virtual office, channels, calls. **Meet now** (on Meetings, or in a conversation's header) starts a meeting straight away; copy its link, open it in another tab of the same browser to join as a guest, and admit them from the first tab. HQ keeps its data in memory, so a reload starts fresh.

## Check that everything works

With the mocks and apps running:

```sh
node smoke.js           # APIs, web apps, and every test person's access
node smoke.js --no-web  # APIs and people only
```

It checks three things:
- Every mock API answers.
- Every web app responds. A redirect to its login page counts as up.
- Every test person signs in, loads their profile and launcher, and gets an answer from one real screen endpoint in each app their launcher shows.

It prints a person × app table and writes `logs/readiness.json`. The exit code is 1 if anything that should work doesn't.

## Test controls (for audits and screenshots)

Every mock API port answers these routes. The examples use the SOS port, 4000.

| Route | What it does |
|---|---|
| `POST /__mock/reset` | Rebuilds every app's data from its seed. Servers keep running, sign-ins stay valid, and open sockets reconnect by themselves. |
| `GET /__mock/clock` | Shows the mock time. |
| `POST /__mock/clock` `{"now":"2026-09-29T09:00:00+03:00","frozen":true}` | Sets the time (`"now":"real"` goes back to real time), then rebuilds the data for it. Add `"reset":false` to keep the data. |
| `POST /__mock/clock/advance` `{"days":1,"hours":2,"minutes":30}` | Moves the clock on and keeps the data. Use it to show "overdue" or "expires soon" states. |
| `GET /__mock/requests?since=&app=&user=&status=4xx&limit=` | Recent API calls: who, what, status and time. All calls also go to `logs/requests.jsonl`. |
| `POST /__mock/faults` `{"app":"hr","match":"/api/attendance","status":403,"times":2}` | Makes matching calls fail (`status`) or slow down (`delayMs`), to show loading, error and no-permission screens. `match` is part of the URL, or `re:<regex>`. `times` limits how often the rule applies. |
| `GET /__mock/faults`, `DELETE /__mock/faults[/<id>]` | List or remove the fault rules. |
| `POST /__mock/strict` `{"on":true}` | Strict access: each app's API refuses people whose launcher doesn't include that app, the way a real backend would. By default most mocks don't check this. |
| `GET /__mock/status` | Clock, data generation, strict mode, fault rules and ports. |

**Fixed time for screenshots.** Start the mocks with a frozen clock, and every date is the same on every run:

```sh
# PowerShell
$env:MOCK_NOW="2026-09-29T09:00:00+03:00"; $env:MOCK_CLOCK="frozen"; node start-all.js
# cmd
set MOCK_NOW=2026-09-29T09:00:00+03:00&& set MOCK_CLOCK=frozen&& node start-all.js
```

This covers seed dates, "3 days ago" labels and due dates. The web apps still read the browser's own clock, so the audit tooling freezes the browser to the same instant.

Other startup switches: `MOCK_STRICT_SCOPES=1` turns strict access on from the start. `MOCK_FAULTS=1` lets any request add `?__fail=500` or `?__delay=1500` to itself.

## How it works

- `server.js` starts one mock API per app from `apps/<app>.js`, with in-memory data. Changes you make last until the API restarts or someone calls `POST /__mock/reset`; then the seed data comes back.
- `lib/clock.js` is the mock clock: every date the mocks produce comes from it. `lib/requests.js` keeps the request log. Both survive a reset.
- `lib/identity.js` is the shared login: users, roles per app (scopes), and tokens. The launcher shows the apps a user has roles in.
- `patch.js` edits two installed packages in each app's `node_modules` so they call localhost: `@somion/sos-bar` (login and launcher URLs, and which launcher tile is "current") and `@iconify/react` (icons). It keeps a backup of every file. Undo with `npm run unpatch`. Run `npm run patch` again after any `npm install` / `npm ci` inside an app.
- It also turns off the on-disk Turbopack cache in the five Next 16 apps (`turbopackFileSystemCacheForDev`). That cache grows by hundreds of MB per app as routes compile, and it filled the disk during the audit sweeps. Without it, a dev server restart just recompiles.
- A few app source files were changed so hard-coded online URLs can be overridden from `.env.local` (the original URL stays as the fallback): Tasks (dev login URL, next.config images), Sales (redirect URL), HR (SOS API URL, task-manager link, next.config images), SOS (default avatar, next.config images), Content (blog "view live" links, local code editor, next.config images), Chats (whiteboard font location via `NEXT_PUBLIC_EXCALIDRAW_ASSET_PATH`; a new `/[locale]/auth` hand-off page and `lib/suite-session.ts` so the launcher can open it signed in; it now depends on `@somion/sos-bar` (via its own `.npmrc`) and shows that launcher when opened from the suite, otherwise its original prototype rail).
- Installing the apps: some lockfiles still point at the team's old package server `sdk.somion.ch`, which no longer answers. Install those apps with `npm ci --registry=https://sdk.orgtik.org/ --replace-registry-host=always`.
- Each app has a `.env.local` pointing it at its local API. Delete an app's `.env.local` to point it back at its normal configuration.
- Requests the mock doesn't handle return 404 and are logged to `logs/unhandled.log`.

## Data that survives restarts (the write journal, D-053)

By default the data lives in memory, as above. With a journal store, every successful change (POST, PUT, PATCH, DELETE) is recorded and replayed after the seed, so the data survives a restart and every Vercel instance shows the same data. Changes to the mock's own controls and anything about sign-in, passwords or tokens are never recorded.

| Setting | Effect |
|---|---|
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) | Upstash Redis. The Vercel Marketplace integration sets these on the mock project. |
| `MOCK_JOURNAL=file` | A file in `journal/<sandbox>.json`. Useful for trying a "cold start" locally. |
| `MOCK_JOURNAL=memory` | In this process only (tests). |
| `MOCK_SANDBOX=<name>` | Which data set (default `demo`). Each mock deployment uses one sandbox. |

- **How it stays identical:** the seed is built at the instant stored with the journal, and each change is replayed with its own recorded instant and random seed (`lib/clock.js` `runPinned`).
- **One request at a time:** while a journal is on, the mock answers one request at a time, so the order applied equals the order recorded. Changes go through a loopback HTTP server inside the process.
- **Status and reset:** `GET /__mock/status` shows `journal` (sandbox, store, entries, skipped). `POST /__mock/reset` starts a new journal and a fresh seed for that sandbox only. `skipped` above 0 after a cold start means a replay didn't reproduce; report it.
- **Limits:** 5,000 changes per sandbox (`MOCK_JOURNAL_MAX`), and request bodies up to 512 KB. Larger uploads still work, but they aren't recorded. A response header `x-mock-journal` says when a change wasn't recorded.
- **Test:** `node lib/journal.test.js` (cold starts in separate processes, 8 checks).

## Known issues that come from the apps themselves

These show up locally but are bugs in the app code, not in the mock:

- Some pages log React hydration warnings (greetings and avatars that differ between server and browser).
- Sales: a customer's invoices table stays empty (the page skips the request for customers).
- Tasks: real-time notifications don't connect (the app reads the token cookie in the wrong format).
- Marketing: "Edit campaign" always opens the Google Search wizard; Google Search campaigns stay in draft.

## Still online

- Google Fonts are downloaded by Next.js when a dev server starts; offline, the apps fall back to system fonts.
- A few decorative images in the apps' own code (stock avatars, a GIF on a 404 page) load from the internet.
