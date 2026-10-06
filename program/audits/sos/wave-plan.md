# SOS wave plan (wave 2: SOS → USR foundation, shell and SSO v1)

Gate A, 2026-10-01. Inputs: three code reads (people and roles; shell, hand-off, systems and profile; auth and i18n), the baseline sweep (2026-09-30), the hydration probe and the VS-1 baseline (`vs1/vs1-sos-before-*`: 0 of 20 clean renders on every signed-in route). The issue log is [issues.csv](issues.csv): 42 issues — 9 S1, 25 S2, 8 S3.

## What this wave is, and isn't

- **Is:** SOS's existing screens, on `@orgtik/ui`, in five languages and both themes. The suite shell v1 (USR-00 as far as SOS has the data). Sessions and the hand-off between apps made safe on the mock (D-017 as proposed). Fix specs that bring Login (USR-03), Home (USR-05) and My profile (USR-23) toward the spec where no open decision blocks them.
- **Isn't:** the new USR screens (My Tools, billing, workspaces, team for customers). They wait for D-011 (does USR grow out of SOS?), asked in PM packet 01 (Q-008), with a reply due around 2026-10-06. Chat isn't part of this wave either: D-018 proposes retiring SOS chat in favour of Chats. Until the PM answers, chat stays as it is, as a declared exception to the five-language definition of done.
- **Backend contracts** this wave proposes to the dev team (the mock implements them; the real API decides):
  - a one-time hand-off code instead of tokens in URLs
  - a server-side "exit impersonation"
  - a write-only CMS account password
  - one password policy (8 to 50 characters) on every endpoint that sets a password

## Fix specs

Each spec gives the problem, the decision, the library pieces it uses, and the check that accepts it.

| Spec | Issues | Screen | Decision | Library | Accepted when |
|---|---|---|---|---|---|
| FS-SOS-1 | 018, 021, 038, 004 | Shell | SuiteShell, like Files' adapter. The rail shows the person's apps with names (from the suite catalog). The sidebar has Home, People, Systems and Content (admins only) and Chat. The top bar has the UserMenu: profile, language, theme, sign out. Sign out appears once. The impersonation banner sits in the BannerRegion with `role="status"`. The Admin badge renders on the server too, so there's no hydration error. | SuiteShell, AppRail, Sidebar, TopBar, UserMenu, BannerRegion | VS-1 20/20 on every signed-in route; 0 uncaught |
| FS-SOS-2 | 001, 002, 005, 019 | Hand-off between apps | The launcher asks SOS for a **one-time code** (single use, 60 s), and the app's `/auth?code=` exchanges it for a session. No token ever goes in a URL. The receiving page replaces its URL at once and only follows same-origin paths in `redirect`. Links open synchronously, so popup blockers don't stop them. Done in SOS, Files and the Website Manager. The other apps keep sos-bar's token hand-off until their waves. | — (mock: `POST /api/auth/handoff`, `POST /api/auth/handoff/exchange`) | Opening Files from SOS leaves no token in history; `redirect=https://…` is ignored |
| FS-SOS-3 | 003, 004 | Impersonation | "Exit" asks the server (`POST /auth/exit-impersonation`, which already exists in the mock) for the admin's session, using the `impersonatedBy` claim. Nothing is kept in sessionStorage, so Exit works in every tab. The banner names who you are acting as and offers Exit. Since D-017, it is "View as": read-only and recorded (step 10). | BannerRegion, Button | View as someone, open a new tab, Stop viewing: back as yourself |
| FS-SOS-4 | 008, 009, 012, 023, 025, 027, 028, 029, 036, 037 | People | A DataTable in server mode with URL state: search, filters and page survive paging and reload, and a search starts from page 1. ListStates covers loading, error with retry, no-permission, "nobody yet" and "no match → clear filters". Each row has a named Menu: Edit, Change type, Manage access, Log in as, Deactivate/Activate, Delete. Deactivate and Delete are ConfirmDialogs that state the impact ("Aya loses access to every tool at once"). You can't deactivate or delete yourself. Tool names come from the suite catalog, and dates use the formatter. | DataTable, Menu, ConfirmDialog, ListStates, Avatar, Tag, FilterChips, Select | Paging keeps filters; axe 0 on /people in 5 languages × 2 themes |
| FS-SOS-5 | 013, 027 | A person's access | One Card per tool, with the person's roles as Tags that each have a named remove. Removing a role or a whole tool is a ConfirmDialog with its impact. "Add roles" is a MultiSelect. If only some roles are added, it says which ones failed. The page has its own not-found, no-permission and error states. | Card, Tag, MultiSelect, ConfirmDialog, ListStates | Partial failure is reported; every X has a name |
| FS-SOS-6 | 007, 014, 041 | Add or edit a person | A Field-based form that keeps the person's existing values and adds the time zone field. One password policy, shared with sign-in. No sample passwords as placeholders. | Field, Input, PasswordInput, Select, Combobox | Editing a person with a phone keeps the phone |
| FS-SOS-7 | 007, 016, 039, 034, 017 | Forgot, reset, invite, redirecting | All on the sign-in shell (AuthShell) and the library, translated. Forgot shows "check your email" with "Resend code" (cooldown 60 s). Reset confirms "Password changed — sign in". Invite shows the invitation and its expiry in the reader's language. Errors are role=alert and in the reader's language. Redirecting carries no token (FS-SOS-2). Deep links survive sign-in (`redirect` kept, validated). | Field, PasswordInput, OtpField, Button, ErrorState | Each auth flow runs in en and ar; no English left in ar |
| FS-SOS-8 | 015 | My profile | Personal details, Language (sets the cookie and flips direction at once), Time zone, Change password (current + new + confirm), Photo. Sessions and 2FA (USR-23) wait for backend endpoints: they're listed as a contract in the PM packet, not drawn as fake screens. | Field, Select, PasswordInput, Avatar, Card | Changing the language flips the app without a reload |
| FS-SOS-9 | 006, 019, 020, 040 | Systems, CMS accounts | Tables that fit the page. Status changes are confirmed with their impact. The CMS account password is write-only: an empty field means "unchanged". Titles use names, not ids. The members placeholder route goes. | DataTable, ConfirmDialog, Field, PasswordInput | No horizontal scroll at 1440 or 390; editing an account without a password keeps it |
| FS-SOS-10 | 010, 011, 023, 024, 026, 035 | Every screen | The Files pattern: `lib/api-feedback` (translated toasts per endpoint, errors by status, no doubles, no raw server text). baseApi never throws on network errors. Pages guard by role (no-permission state, not hidden links). A 404 page, and an error boundary for the signed-in area. | ListStates, NoPermissionState, ErrorState, toast | Stop the API, press Save: a translated "can't reach the server" toast and no crash |
| FS-SOS-11 | 021 | Home | USR-05, version 1: the person's apps as labelled cards (from the launcher's data). Admins also get Stat tiles from real numbers only (the fixed "System health 99.9%" goes). Change colours follow the sign, not the wording. | Card, Stat | Home lists the person's tools by name in 5 languages |
| FS-SOS-12 | 033, 034, 035, 036, 042, 022, 030, 031, 032, 040 | Cleanup | i18n of every remaining string (chat excepted, see above). Physical classes → logical. lucide, iconify, Radix, sonner, framer-motion and next-themes removed. Dead code and `/icons-test` go. | — | Counts reach 0 (hex, palette, physical, legacy imports); catalogs at parity |

## Order

1. **Foundations:** catalogs and namespaces, `lib/api-feedback`, the baseApi guard, ListStates, 404 and error boundary (FS-SOS-10).
2. **Shell** (FS-SOS-1).
3. **People** (FS-SOS-4), then **access** (FS-SOS-5), then **add or edit a person** (FS-SOS-6).
4. **Auth pages** (FS-SOS-7).
5. **My profile** (FS-SOS-8).
6. **Systems and CMS** (FS-SOS-9).
7. **Home** (FS-SOS-11).
8. **Hand-off and impersonation** (FS-SOS-2, FS-SOS-3), across SOS, Files and the Website Manager.
9. **Cleanup** (FS-SOS-12). Then the flows run in en and ar, VS-1 runs on every route, and the issues are closed.

## Golden flows (to become `flows/sos.mjs`)

- **S1 Sign in and open an app:** sign in → home → open Files from the launcher → signed in to Files, with no token in its history.
- **S2 Give someone access:** People → find Aya → Manage access → add a Task Manager role → it appears → remove it (confirmed).
- **S3 Deactivate and reactivate:** People → Aya's menu → Deactivate (confirm states the impact) → status Inactive → Activate.
- **S4 Edit a person:** keep their phone, change their job title → saved, phone intact.
- **S5 Forgot password:** request a code → reset → "Password changed" → sign in with the new password.
- **S6 My profile:** change the language to العربية → the app flips at once; change it back.
- **S7 View as and exit:** View as Aya → banner says read-only → a change is refused with the reason → a new tab → Stop viewing → back as Mona.

## Progress — done, 2026-10-01

Every step is in, on branch `wave1/vs-1` of `somion-sos-frontend-main` (not pushed, D-044):

| Step | Commit | What landed |
|---|---|---|
| 1–2. Foundations and shell | 223fd38 | Translated feedback (lib/api-feedback), guarded base query, crash/404/loading pages, role guards, SuiteFrame (rail, sidebar, user menu, acting-as banner), server-side "exit acting as" |
| 3. People, access, person | cf89a3a | Server DataTable with address state, named row menus, confirmed risky actions, access cards, roles in one request, the full-record edit form, one password policy |
| 4. Sign-in flows | d94b89a | Forgot/reset/invite/redirecting on the library, translated; safe redirects; deep links kept |
| 5. My profile | b4cf011 | Photo, details, language at once, time zone, change password |
| 6. Systems, CMS, Websites | 58225ad | Tables that fit, confirmed status changes, write-only CMS passwords, members, popup-safe opening |
| 7. Home | dc41754 | The person's apps as cards, three real figures for admins |
| 8. Hand-off | 053c1c8 | /go/<app> with a one-time code; Files (88847b5) and the Website Manager (d823fd0) take it |
| 9. Cleanup | 5c698af, b2e0d72, 93118de | Dead code and 25 dependencies removed; SOS chat retired in favour of Chats (D-018), and with it the last of the old kit and the shadcn bridge |
| 10. View as (D-017) | a500ba4; Files ac867dc; local-dev 9a130b4 | "Act as" became "View as this person": read-only, recorded under the admin's name (`GET /api/auth/view-as/log`), "Stop viewing" in the banner. A refused change says why in the reader's language, in SOS and Files. Tasks joined the one-time code. |

**Verification:**

- `node flows/sos.mjs` and `--locale ar`: 23 of 23 each (S1–S7, names from SOS's catalog; S7 now proves a change is refused while viewing).
- `vs1.mjs`: 20 of 20 clean on all 12 routes: `/`, `/people`, `/people/3/scopes`, `/profile`, `/systems`, `/systems/cms`, `/systems/cms/1/accounts`, `/content` and the four signed-out auth pages (re-run after 93118de).
- A missing address shows the translated 404 page; the only console entry is the 404 response itself.
- 0 hex colours, 0 default-palette classes, 0 physical-direction classes. The five catalogs have the same keys.
- `issues.csv`: 40 fixed, 1 partly (SOS-001: the other apps take the code in their waves), 1 open (SOS-005: httpOnly session cookies, a backend contract).

**Contracts for the backend** (the mock implements them; the real API decides):
- `POST /api/auth/handoff`, `POST /api/auth/handoff/exchange`
- `POST /api/auth/exit-impersonation`
- View as: a `readOnly` session claim; every change refused with 403 `read_only` (sign-out, refresh, hand-off and exit excepted); `GET /api/auth/view-as/log`
- CMS account passwords are write-only
- One password policy (8–50) everywhere
- `GET /api/users/:id` carries contact details
