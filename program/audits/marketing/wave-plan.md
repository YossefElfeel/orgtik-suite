# Marketing wave plan (wave 5: Digital Marketing)

Gate A, 2026-10-02. Runs in its own session, in parallel with HR in the main session (Sales comes last).

**Inputs:**
- Three code reads:
  - the shell, session and settings
  - campaigns, posts and media
  - integrations and insights
- The baseline sweep and dead-end run (2026-10-02): 38 dead ends, 65 broken links, and 10 dynamic routes the sweep never reached.
- The VS-1 baseline (`vs1/vs1-marketing-before-*`): 0 of 20 clean renders on every route checked (`/dashboard`, `/campaigns`, `/posts`, `/calendar`, `/gallery`, `/our-reports`, `/settings/teams`). Arabic, French and Italian don't exist. Every signed-in route has a hydration error.

The issue log is [issues.csv](issues.csv): **80 issues**, of which 22 are S1, 54 S2 and 4 S3. Nine duplicates between the reads were merged into one row each, and the `related` column names the merged rows.

**Starting point:**

| Count | Today |
|---|---|
| `@/components/ui/*` import lines | 347 |
| Files using lucide / iconify | 137 / 65 (iconify ids are fetched at runtime) |
| Physical direction classes | ~179 |
| Raw hex / palette classes | 237 / 876 |
| `text-NN` arbitrary sizes | 365 |
| Hard-coded English strings | ~1,230 (0 `useTranslations` calls) |
| Locales | en, de, fr, it routed, every catalog `{}`; `/ar` is a 404 |

**Wave exit:**
- Every count above is at 0, and the catalogs are at parity in en, ar, de, fr and it.
- All 80 issues are closed.
- The golden flows are green in en and ar.
- vs1 is clean on every route.

## What this wave is, and isn't

**Is:** every Marketing screen moves to `@orgtik/ui`, in five languages and both themes. It also covers:
- the suite shell
- SOS's one-time-code hand-off with the `/go/digital_marketing` return
- permissions from the `digital_marketing` scope
- the fixture screens wired to the analytics endpoints the mock already serves

**Isn't:**
- New features the spec doesn't ask for.
- Catalogue admin (campaign categories and types). The sidebar links to them, but the routes don't exist, and this belongs to the Admin dashboard (ADM).
- The chatbot. It has no route and isn't in the spec.
- People and roles management, which SOS owns.

**Decisions this plan takes as defaults** (changeable at Gate D):
- **Nav and dev pages.**
  - The three sidebar items with no route (`/campaign-categories`, `/campaign-types`, `/chatbot`) are removed from the nav (MKT-027). They are 63 of the 65 broken links.
  - `/demo` and the unused "Connect with platform" dialog are deleted (MKT-028).
- **Fixture screens show real data or say there's none** (MKT-021, 064–066, 074).
  - Dashboard, the report charts, Competitors and Our Audience read `/analytics/reports/*`, `/analytics/competitors` and `/audiences`.
  - A chart with no data shows an empty state. A chart never shows sample numbers.
- **Reports with no backend.** "Share › Send report" (MKT-069) and "Add competitor" (MKT-068) have no endpoint.
  - Send report becomes **Export** (CSV of the table the person is looking at; the glossary says Export for data). The fake send goes.
  - Competitors keeps the list the API returns, with working sort and filters on the client. Adding a competitor is a backend contract (below), so the button is not shown until then.
- **Money is shown in the ad account's currency** (MKT-011, 016).
  - The wizard's budget uses the selected ad account's currency (`resources[].currency`), shown read-only. The free currency picker goes.
  - Boost shows the total spend (daily × days) in that currency, and spends only after a confirmation that names the amount, the account and the post.
- **Schedules are in the brand's time zone** (MKT-014, 059).
  - A brand gets `timeZone` (mock: Africa/Cairo for all three brands). The fallback is the org time zone (`NEXT_PUBLIC_ORG_TIME_ZONE`, Africa/Cairo).
  - Every schedule picker says which zone it is, and sends an ISO instant.
- **Deleting a post** (MKT-017) defaults to "Remove from OrgTik only". Deleting from the platforms too is an explicit second choice, offered only for targets that were published.
- **Settings.**
  - **Settings › Teams** (MKT-034) shows the brand's members (`project.members`) and their Marketing role, read-only, with "Manage access in SOS" (`/go/sos?redirect=/systems`).
  - The roles, permissions, preferences and notifications stubs (MKT-035) are removed. Nothing in the spec asks for them here.
- **Who can do what.** The role matrix below is the app's and the mock's single source of truth.

### Roles (scope `digital_marketing`)

| Action | super_admin | marketing_manager | marketing_specialist | content_writer | client_reviewer |
|---|---|---|---|---|---|
| See the brand's screens | ✓ | ✓ | ✓ | ✓ | ✓ (own brands) |
| Create or edit a brand, delete one | ✓ / ✓ | ✓ / — | — | — | — |
| Connect or disconnect an integration, sync it | ✓ | ✓ | sync only | — | — |
| Campaigns: create, edit, publish | ✓ | ✓ | ✓ | — | — |
| Posts: create, edit, schedule | ✓ | ✓ | ✓ | ✓ | — |
| Approve or reject (when they are a reviewer) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Boost (spends money) | ✓ | ✓ | ✓ | — | — |
| Gallery: upload / delete | ✓ / ✓ | ✓ / ✓ | ✓ / own | ✓ / own | — |
| Labels, audience import | ✓ | ✓ | ✓ | — | — |
| Reports: view, download | ✓ | ✓ | ✓ | ✓ | ✓ |

View-as sessions (`readOnly` claim) see every screen and change nothing.

The mock enforces the matrix, answering 403 `{code:"forbidden"}` or `{code:"read_only"}`. The app hides what a role can't do, and the toast explains the 403 the mock still answers.

**Backend contracts this wave proposes** (the mock implements them, and the real API decides):
- `project.timeZone` (IANA) and `project.currency` (ISO 4217).
- `GET /integrations/oauth/state` → `{state}` is a single-use value bound to the session and the brand. The callback is accepted only when its `state` matches (MKT-018).
- `redirectUri` is server-side configuration. The client stops sending it (MKT-060).
- `POST /analytics/competitors` adds a competitor (later, not this wave).
- Writes answer 403 with a `code`, as above.

## Library requests

These go to the main session, which releases `@orgtik/ui` (next: rc.9). This session builds them on a worktree branch of `orgtik-ui` (`feat/stepper`), and the main session merges and releases.

### Stepper

The plan lists Stepper as Tier 3. It is needed now: the campaign wizard (6 steps), the post composer (3) and the connect-an-account wizard (3) are 24 of the 38 dead ends.

**Steps and state**
- Steps are `{ id, label, description?, state: "complete" | "current" | "upcoming" | "error", optional? }`.
- A reached step is a link or button. An unreached step isn't interactive, and says why (`aria-disabled` plus a Tooltip).
- Markup is an `<ol>`, and the current step has `aria-current="step"`. The step number and the state are in text, not only colour: "Step 2 of 6, Budget, has errors".

**Layout**
- Horizontal from md up. Below md it is vertical, or collapses to "Step 2 of 6 · Budget" with a Menu of the steps.
- In RTL it mirrors with logical properties.
- Sizes are sm and md. The library's strings (`stepOf`, `stepComplete`, `stepError`) come in all 5 languages.

**Not in it:** routing and saving. The app decides what clicking a step does.

### DateTimePicker `timeZone`

- `timeZone?: string` (IANA). The date and time are read and written in that zone, and the value stays an ISO instant.
- The note says the zone by name ("Cairo time (GMT+3)") instead of the browser's.
- Without the prop, behaviour stays as it is today.
- Needed for schedules in the brand's zone. HR shifts may want it too.

**Not requested** (composed in the app from library parts, because they are Marketing-only):
- the MediaPicker (Dialog + the `@somion/gallery` adapter re-skinned)
- PostPreview
- the approval chain (Avatar + StatusBadge list)
- the activity thread (the Tasks pattern)
- the keyword editor (Chips + Select for match type)
- the month picker (Select month + NumberField year)
- a timed calendar: CalendarGrid with chips that lead with the time, plus a day agenda list in a Sheet

Candidates to promote after the wave: PostPreview and the approval chain, if Content/WM needs them.

## Fix specs

Each spec gives the issues, the screen, the decision, the library pieces it uses, and the check that accepts it.

| Spec | Issues | Screen | Decision | Library | Accepted when |
|---|---|---|---|---|---|
| FS-MKT-1 | 007, 023, 024, 025, 029, 032, 040, 041, 077 | Every screen (foundations) | This is the Tasks pattern. <br>• **Locales:** five locales in routing, with ar RTL. `<html lang dir>` is set in `[locale]/layout`, with ThemeScript, OrgtikNextProvider and the library Toaster. Fonts are the library's, with Arabic coverage. <br>• **Store:** built per request, with the session read from server cookies, so there's no hydration error. <br>• **Feedback:** `lib/api-feedback` gives a translated toast per endpoint and status; no raw server text, no doubles. baseApi never throws. <br>• **Pages:** a translated 404 and error boundary with "Back to the dashboard". Each tab has a title. Links use next-intl's Link and router. | OrgtikNextProvider, ThemeScript, Toaster, ErrorState | vs1 has 0 uncaught errors and 0 hydration errors on every route. `/ar/dashboard` renders RTL. Stopping the API gives a translated toast |
| FS-MKT-2 | 006, 026, 027, 028, 033, 039, 078 | Shell | SuiteShell with the Tasks adapter (`components/suite/`). <br>• **Sidebar:** Dashboard, Campaigns, Posts, Calendar, Gallery, Insights (Reports, Competitors, Our audience), Integrations, Settings. Each item has `aria-current`, and items the role can't open are hidden. <br>• **Brand switcher:** a Select in the sidebar head. Switching resets the RTK cache (`api.util.resetApiState`) and goes to that brand's dashboard. <br>• **Top bar:** a Breadcrumb with names, and a UserMenu with language, theme and sign out. <br>• **Goes:** SoSBar, the iconify sidebar icons and `/demo`. | SuiteShell, Sidebar, TopBar, UserMenu, Breadcrumb, Select | vs1 20/20 on `/dashboard`. Switching brand shows no previous-brand rows (flow M7) |
| FS-MKT-3 | 001, 002, 003, 030, 031, 042 | Hand-off, session | `/auth` takes SOS's `?code=`, exchanged once (one shared promise), then replaces its URL. `?token=` stays until SOS lists Marketing in `CODE_APPS`. <br>• **Redirect:** same-origin paths only. Signed out → `/go/digital_marketing?redirect=<path>`, so the deep link survives. <br>• **Failures:** a failed code shows ErrorState with "Back to the suite". A 401 mid-session goes the same way. <br>• **Not-allowed page:** the paste-a-token page becomes "You don't have Digital Marketing", with a link to the suite. <br>• **Later:** the cookie stays JS-readable until the real API sets HttpOnly (contract, as TASKS-003). | ErrorState, NoPermissionState | M1 passes. `redirect=https://…` is ignored. A deep link survives sign-in |
| FS-MKT-4 | 004, 035, 049 | Permissions | Roles come from the `digital_marketing` scope only. A pure `lib/roles.ts` holds the matrix, and `lib/permissions.ts` has the hook, with `readOnlySession`. <br>• **Middleware:** checks only "signed in with the scope". Pages decide the rest, and show NoPermissionState in-app. <br>• **Posts:** post details honour the server's `actions.*` flags. <br>• **Mock:** enforces the same matrix. | NoPermissionState, Tooltip | M6 passes: Nour (client reviewer) approves a post and sees no Create, Delete or Boost. Hoda (writer) has no Campaigns create |
| FS-MKT-5 | 005, 036, 037, 038, 034 | Brands, settings | **Delete brand:** a ConfirmDialog that names the brand and what goes with it (posts, campaigns, integrations), for super_admin only. <br>• **Project Details:** saves with an empty description. Zod messages are translated. <br>• **Account:** has loading and error states, and an avatar upload failure says so. <br>• **Layout:** settings use one column on mobile, and the shell does the scrolling. <br>• **Teams:** read-only from members (see defaults). | ConfirmDialog, Field, FileField, ListStates | Delete is not offered to Karim. Deleting as Mona shows the impact and needs confirmation |
| FS-MKT-6 | 008, 009, 010, 011, 012, 043, 052, 053, 054, 059, 044, 058 | Campaign wizard and details | **Wizard state:** the campaign id comes from the URL only (`?id=`), and redux keeps no wizard state across visits. <br>• **Stepper:** reached steps are clickable. Each step saves on Next. Back with unsaved edits asks to save or discard. <br>• **Changing type** on a draft asks first, and says what is lost. <br>• **Google Search** publishes and saves drafts through the API (same as the others), and notes are kept. <br>• **Budget:** in the account's currency. Schedules are in the brand zone and validated (end after start, start not in the past). <br>• **Cancel** says "Your draft is saved". <br>• **Review:** a deep link to Review checks the earlier steps and lists what's missing, with links. <br>• **Approval:** Approve has a confirm. Reject requires a reason. Rollback has a ConfirmDialog. <br>• **Details:** campaign details show the next action for the status (Continue setup / Request approval / Publish), and not-found and error are separate states. <br>• **Choice cards:** selected state is shown by a check, not by colour alone. Enums use status-matrix labels. | Stepper (new), Choice/RadioGroup, MoneyField, DateTimePicker(timeZone), ConfirmDialog, Dialog, StatusBadge, ListStates | M2 passes: a Google Search campaign goes from New to Published, and survives a reload on step 4 |
| FS-MKT-7 | 013, 014, 017, 045, 046, 047, 048, 050, 051, 055, 022(no), 044 | Posts | **Composer:** Stepper with three steps (Content, Media, Schedule). Each step validates. "Publish now" calls `publish-now`, and "Schedule" needs a date and time in the brand zone. <br>• **Posts table:** a DataTable whose title is the link to the post. A named row Menu has View, Edit (opens the composer on that post), Duplicate and Delete. <br>• **Delete:** see defaults. <br>• **Approvers cell:** a real AvatarStack with the right `+N`. <br>• **Month picker:** filters the list, and the month is in the URL. <br>• **Post details:** content is editable when `actions.canEdit`. Save and Status really save. There are not-found and error states, and an unscheduled post says "Not scheduled". <br>• **Lists:** all use ListStates. | Stepper, DataTable, Menu, DateTimePicker(timeZone), ConfirmDialog, Avatar, ListStates, Textarea | M3 passes: a post to Facebook and Instagram is scheduled for tomorrow 10:00 Cairo, the reviewer approves it, and it shows on the calendar at 10:00 |
| FS-MKT-8 | 015 | Calendar | `/calendar` uses CalendarGrid with posts by scheduled day in the brand zone. Chips lead with the time and the platform, and each opens the post. A day opens an agenda Sheet. The debug placeholder and the unused component go. | CalendarGrid, Sheet, StatusBadge | M3's last step. Next month works by keyboard, and in ar the week starts on Saturday |
| FS-MKT-9 | 016 | Boost | The Boost dialog has a NumberField daily budget and a duration, and shows the total in the ad account's currency. "Boost for SAR 1,400" opens a confirmation. A failed boost shows an error toast and keeps the dialog open. | Dialog, MoneyField, NumberField, ConfirmDialog | M4 passes, including the mock fault: the failure is shown as a failure |
| FS-MKT-10 | 056, 057 | Media | One MediaPicker for the composer, the wizard and the gallery. It is a Dialog over the gallery adapter, re-skinned with library parts, and gets the locale. <br>• **Errors:** a fetch error shows ErrorState with retry, not "no media". <br>• **Filters and counts:** come from the server, not the current page. | Dialog, FileField, ListStates, Pagination | The gallery is Arabic in ar. Stopping the API on the gallery shows "Couldn't load media" with Retry |
| FS-MKT-11 | 018, 019, 020, 060, 061, 062, 063, 067, 070, 071 | Integrations | **OAuth:** the client gets a `state` from the API before it leaves, the callback is accepted only with a matching state, and `redirectUri` is not sent. <br>• **Callback route:** `/integrations/callback` does the exchange, then replaces its URL. <br>• **Wizard:** survives refresh, because the step comes from the API's connect session. Retry re-starts the connect instead of resending the used code. <br>• **Pages:** the integration detail hook order is fixed. Hub tabs are in the URL, and rows are links to details. <br>• **Pickers and confirms:** the resource picker uses Checkbox (one toggle, keyboard works). Destructive actions use ConfirmDialog, which stays open until the request finishes and is named for what it does. <br>• **Labels:** the edit dialog reloads its values, and row numbers continue across pages. | Stepper, Checkbox, Tabs, ConfirmDialog, DataTable, ListStates | M5 passes: Facebook connects, the page is picked, and finishing lands on the hub in the same locale. A forged `state` is refused |
| FS-MKT-12 | 021, 064, 065, 066, 068, 069, 072, 074, 022 | Dashboard, reports, competitors, audience | **Data:** every chart and KPI reads the API (see defaults), and the period filter sends days in the brand zone. <br>• **KPIs:** use Stat, with the delta's sign, colour and arrow from the value and a text label ("+4.2% vs previous 30 days"). <br>• **Report routes** use their `:id`. <br>• **Charts:** use `@orgtik/ui/charts`, each with a table view. <br>• **Competitors:** sort and filters work. <br>• **Our Audience:** follows the backend's model: audiences (named lists with counts) and segments, filled by CSV import (upload → map → commit, with counts). The fake single-contact form goes; there is no endpoint for one contact. <br>• **Send report** becomes Export. Recharts and the second chart library go. | charts, Stat, DataTable, DateRangePicker, FileField, ListStates | M8 passes. Nile Foods and Sahel show different numbers. vs1 clean on `/dashboard` and `/our-reports` |
| FS-MKT-13 | 073, 075, 076, 079, 080 | Accessibility, languages, cleanup | **Languages:** ar, fr and it at parity (Arabic in MSA, D-015, and glossary terms). Dates, numbers and percents come from the formatter. Physical classes become logical, and nothing forces `dir=ltr`. <br>• **Icons:** lucide and iconify go to Phosphor, with brand marks from Phosphor's logos. <br>• **Accessibility:** controls are named, the heading order is right, and no buttons wrap links. <br>• **Removed:** `components/ui/*`, sonner, Radix, framer-motion's blanket entrance animations and recharts, then the token bridge (D-020). tailwind-merge, clsx and cva stay at top level, because the library needs them under yalc. | — | Counts at 0. `glossary_check.py marketing` 0 rows. No English in the ar walk. axe 0 critical/serious in vs1 |

## Order

1. **Foundations** (FS-MKT-1): the yalc link was already done in 041a856, then the five locales.
2. **Shell** (FS-MKT-2).
3. **Hand-off and permissions** (FS-MKT-3, FS-MKT-4), with the mock's role checks. This step also asks the main session to add `digital_marketing` to SOS's `CODE_APPS`.
4. **Brands and settings** (FS-MKT-5).
5. **Integrations** (FS-MKT-11). A brand needs accounts before campaigns or posts make sense.
6. **Posts, calendar, boost and media** (FS-MKT-7, 8, 9, 10). The Stepper lands on the library branch first.
7. **Campaign wizard** (FS-MKT-6).
8. **Dashboard and insights** (FS-MKT-12).
9. **Languages and cleanup** (FS-MKT-13). Then the flows run in en and ar, vs1 runs on every route, and the issues are closed.

## Golden flows (to become `flows/marketing.mjs`)

| Flow | Who | Steps |
|---|---|---|
| M1 Open Marketing from the suite | Mona (super admin) | SOS → Digital Marketing → the dashboard, with no token in history. Back doesn't reopen the hand-off |
| M2 Run a Google Search campaign | Dina (specialist) | Campaigns → New → Google Search → settings, budget (in SAR, read-only), keywords, ad → reload on step 4 keeps everything → Review → Request approval → Karim approves → Published |
| M3 Schedule a post with approval | Hoda (writer) → Nour (reviewer) | Posts → New → text, media from the gallery, Facebook + Instagram, tomorrow 10:00 Cairo → submit → Nour approves with a note → the calendar shows it at 10:00 |
| M4 Boost a post | Dina | A published post → Boost → 200/day × 7 days → "Boost for SAR 1,400" confirm → running. With the mock fault: an error, and the dialog stays |
| M5 Connect a social account | Karim (manager) | Integrations → Connect Facebook → the mock's consent → pick a page → finish → the hub in the same locale. A forged `state` is refused |
| M6 Review as the client | Nour (client reviewer) | Only Nile Foods. Posts waiting for her → approve one, reject one with a reason. No Create, Delete, Boost or Integrations |
| M7 Switch brand | Karim | Nile Foods → Sahel Resorts: the lists, dashboard and integrations are Sahel's, with no Nile rows in between |
| M8 Monthly report | Karim | Reports → last month → overview and post performance → table view → Export CSV |

## Progress

- 2026-10-02: Gate A. Three reads, 80 issues, inventory, this plan. Baseline vs1 0/20 on 7 routes.
- 2026-10-02, steps 1–3 (app 79b9886, mock local-dev 8833046):
  - Foundations, shell and hand-off are done.
  - vs1 on `/dashboard`: lang/dir right in all 5 languages, 0 console and 0 hydration errors, 0 overflow. What remains is the dashboard's own content (English, contrast), which its area fixes.
  - Flows M1, M1b and M7 are 7/7 in en and ar. SOS lists Marketing in CODE_APPS (SOS ba8887e).
  - The mock's role guard and the project timeZone/currency/members are committed but not live until the shared mock restarts. That restart needs the user (it was refused in this session).
- **Decisions since Gate A:**
  - **UI word:** the UI says **Project** (the app's and the glossary's word); "brand" in this plan is descriptive.
  - **Stepper:** it lives in the app (`components/shared/Stepper.tsx`) with the API sent to the library (orgtik-ui feat/stepper 6437fee, with DateTimePicker `timeZone`). The import switches when rc.9 ships.
  - **Status labels:** Marketing statuses aren't in the status matrix, so `components/shared/MarketingStatus.tsx` maps each state to tone, icon and words.
- **Steps 4–8:** run as four parallel area agents (posts, calendar, boost and media; campaigns; connected accounts and settings; dashboard and insights), on one brief (rules, glossary, ownership).
- **Steps 4–8 (2026-10-02):** the four area agents' work was reviewed and committed per area:
  - connected accounts and settings: 2ca873b
  - dashboard and insights: 13f32ff
  - posts, composer, calendar, boost, media and labels: 7c76891
  - campaigns: ec288d9
- **Bugs the flows found, fixed:**
  - The OAuth code exchange was cancelled with its component, so a connect failed as "didn't confirm" (c0eca0d).
  - Media was labelled "Optional" while Instagram required it, and media limits lacked plurals (378b06a).
  - Radio groups inside a Field gave every option the field's name (156b644; library fix in rc.10 `Field group`).
  - The 404 lost the reader's theme (e85d956).
- **Step 9, cleanup (2f29e0d):**
  - Removed: components/ui, 15 legacy shared components, the token bridge, the gallery provider, sonner, public/ assets and 23 packages.
  - All counts are at 0. The catalogs are at parity (1,773 keys × 5).
- **Wave exit, 2026-10-02:**
  - Flows M1–M8: 31/31 steps green in en and ar (orgtik-program 41c170d).
  - vs1 final: 23 routes, 460/460 clean (773c3c9). On the 404 page, the only console entries are its own 404 status and a React dev warning.
  - Issues: 79 of 80 fixed. MKT-003 needs an HttpOnly session from the real API.
- **Mock (local-dev):**
  - role guard: 8833046
  - project timeZone, currency and members: 8833046
  - OAuth state opaque, single-use and owner-bound: 31bfe8a
  - campaign currency defaults: 9621fdf

## Backend contracts for the real API

The mock implements the first group. The rest are gaps the screens work around today.

**Implemented in the mock:**
- **Role checks:** writes answer 403 `{code:"forbidden"}` per the role matrix, or `{code:"read_only"}` for View as.
- **Project fields:**
  - `timeZone` (IANA) and `currency` (ISO 4217).
  - `members[]` with `{id, firstName, lastName, email, avatar, jobTitle, roles[]}`.
- **OAuth state:**
  - Opaque, single-use, bound to the person and platform, and valid for 15 minutes.
  - The callback answers 400 `{code:"invalid_state"}` otherwise.
  - The connect session id is opaque and checked against its owner on preflight and finish.
  - `redirectUri` is server configuration: `<web>/integrations/platform/{PLATFORM}/callback`.
- **Campaign currency:**
  - The Google Search budget follows the chosen account's currency.
  - Paid social defaults to the project's currency.

**Gaps the screens work around:**
- **Session:** an HttpOnly session cookie (MKT-003).
- **Audiences:**
  - The import commit needs `audienceId`, to add to an existing audience.
  - There is no delete or rename for audiences.
  - There is no endpoint that lists the contacts in an audience.
- **Analytics:**
  - `mentions`, `followers` and `post-performance` should take the profile and the period.
  - Competitors has no period and no add endpoint.
  - `topCountries` should be ISO codes, so the names can be translated.
- **Gallery:** `GET /galleries?type=` with `meta.counts {all,image,video}`, plus `mimeType` and `uploadedBy` per item (needed for "delete own uploads").
- **Boosts:**
  - `/ads/executions` items should carry `unifiedPostId`.
  - `budgetAmount` is the daily budget.
- **Posts:**
  - The posts list's month filter should use the project's zone.
  - The API shouldn't invent a "tomorrow 10:00" schedule.
- **Campaigns:**
  - The list needs viewer-review flags.
  - Messaging needs an endpoint that saves the audience on its own.
  - Activity comments and `providerError` should come as codes, so they can be translated.
