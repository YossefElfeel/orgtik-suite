# HR wave plan (wave 4: HR)

Gate A, 2026-10-02.

**Inputs:**
- two code reads (design system; UX, flows, i18n and accessibility);
- the baseline sweep and dead-end run (2026-09-30);
- VS-1 before: `vs1/vs1-hr-before-*`, 0 of 20 clean renders on `/`, `/employees`, `/time-off` and `/payroll`.

**Issue log:** [issues.csv](issues.csv), 31 issues: 9 S1, 19 S2, 3 S3.

**Split with the parallel session (D-043, extended):** this session does HR; the other does Marketing; Sales comes last, because it overlaps with ADM.

## What this wave is, and isn't

- **Is:**
  - HR's existing 31 screens on `@orgtik/ui`, in five languages (Arabic and RTL are new) and both themes, inside the suite shell.
  - The S1 security and money fixes.
  - The payroll, leave and add-employee flows made safe and complete.
  - The patterns already proven in SOS, Files and Chats: one-time-code hand-off; translated API feedback (`lib/api-feedback`); `RequireRole` with a no-permission state; tables that keep their state in the address; and confirmations that state their impact.
- **Isn't:**
  - New HR features.
  - Hiring rebuilt: the hiring screens get the same library and language treatment, but no new flows.
  - Server-side changes. HttpOnly sessions remain the backend's contract, as for SOS-005.

## Fix specs

| Spec | Issues | Area | Decision | Library | Accepted when |
|---|---|---|---|---|---|
| FS-HR-1 | 001, 028 | Hygiene | The not-allowed page becomes a translated "No access" state with the way back to OrgTik. The dev accounts move to `local-dev` docs, where the kit already holds them. `@reduxjs/toolkit` and `react-redux` are declared. | NoPermissionState | No credentials in the bundle (grep of `.next`) |
| FS-HR-2 | 002, 003, 016 (contrast), 024, 025 | Session, tokens and theme | `/[locale]/auth?code=` exchanges SOS's one-time code (shared promise, address cleared, same-origin `redirect` only); `hr_system` joins SOS's `CODE_APPS`. No token in logs. A missing session or a 401 goes to SOS `/go/hr_system?redirect=<path>` (SOS 9a8b34e). Token bridge: shadcn variables → `--ot-*` (`--secondary` becomes a text alias, `--gray*` become surface and ink aliases). Library fonts. `<html lang dir data-theme>`. Dark mode. | ThemeScript, OrgtikNextProvider | Opening HR from SOS leaves no token in history; a signed-out deep link comes back to its page |
| FS-HR-3 | 011, 012, 013, 021, 030 | Every screen | The SOS pattern: `lib/api-feedback` (translated toasts per endpoint, errors by status, no doubles, no raw server text), a base query that never throws, `RequireRole` with NoPermissionState instead of a blank page, translated 404, error and loading pages, and locale-aware links and redirects (the i18n router). | ListStates, NoPermissionState, ErrorState, toast | Stop the API, press Save: one translated "can't reach the server" toast |
| FS-HR-4 | 014, 015, 016, 027, 031 | Primitives and shell | The SuiteShell with the AppRail (suite apps via SOS `/go`), HR's sidebar sections and the UserMenu; sos-bar goes. `components/ui/*` become shims over the library, one overlay family at a time. Icon buttons are `IconButton` with a name. Toggles carry `aria-pressed`. No links wrapping buttons. | SuiteShell, IconButton, Menu, Dialog, Sheet, Tabs, SegmentedControl | axe 0 critical on every route |
| FS-HR-5 | 017, 018, 019, 020 | Languages | Arabic is added (MSA, D-015) and `dir` set; the missing `sidebar.Finance` key; it at parity; values still in English translated; the ~300 strings outside `t()` moved in, zod messages included. Dates and money through the library formatter (Latin digits, CHF with the right minor units). | useFormatter | Catalogs at parity ×5; no English left in ar (VS-1); 0 MISSING_MESSAGE |
| FS-HR-6 | 004, 022, 023, 031 | Data safety | Ticket messages are sanitised (an allow-list of tags) before rendering. Every delete is a ConfirmDialog naming the thing and its impact, awaited before closing. Lists keep page, filters and search in the address; search is debounced and returns to page 1; payroll rows use their real ids. | ConfirmDialog, DataTable (server mode) | A `<script>` in a ticket renders as text; reload keeps page 3 |
| FS-HR-7 | 005, 006, 010, 029 | Payroll | "Start run" is the button alone, and "go to …" navigates. Pay, Freeze, Re-open and Approve all are ConfirmDialogs that state the money and the people ("Pay 14 people CHF 86,420.00"), are awaited, and say when they fail. Admin Review opens the review. The dev copy and the typo go. | ConfirmDialog, Stat, formatter | Pay can't happen in one click; a failed Pay says so |
| FS-HR-8 | 007 | Leave | The decision starts unset, and Submit stays disabled until Approve or Reject is chosen. super_admin can act. | SegmentedControl, Field | Submitting without a choice is impossible; super_admin approves |
| FS-HR-9 | 008, 009, 010, 029 | Employees | The wizard stays one sheet: its step lives in the sheet, and the edit sheet opens only from the edit action. Post codes follow the country (CH 4 digits, DE 5, …). Export downloads the filtered list (UTF-8 CSV with a BOM, formula-injection guard). The success message says "created" or "updated" correctly. | Sheet, Field, Select | Adding an employee shows one sheet; 8001 Zürich is accepted |
| FS-HR-10 | 026, 027 | Cleanup | Hex → tokens, default palette → semantic classes, `text-NN` → type roles, physical → logical, lucide/iconify → Phosphor (D-008), framer-motion and tw-animate out, the shadcn bridge out. | — | Counts reach 0 (hex, palette, physical, legacy imports) |

## Order

1. **FS-HR-1** and **FS-HR-2**: the S1 security fixes first, then the bridge, fonts and `<html>`.
2. **FS-HR-3**: feedback, guards and pages.
3. **FS-HR-4**: the shell, then the primitive shims.
4. **FS-HR-7, 8, 9**: the money and people flows.
5. **FS-HR-6**: data safety and lists.
6. **FS-HR-5**: languages. The extraction runs alongside steps 3–5; the Arabic catalog comes last.
7. **FS-HR-10**: cleanup. Then the flows run in en and ar, VS-1 runs on every route, and the issues are closed.

## Golden flows (to become `flows/hr.mjs`)

- **H0 Open from the suite:** SOS → HR from the rail → signed in, no token in history; a signed-out deep link comes back to its page.
- **H1 Add an employee:** the wizard with a Swiss address (4-digit post code) → one sheet throughout → the employee appears; success says "created".
- **H2 Request leave:** Add Time Off → Submit Request → it's pending.
- **H3 Decide leave:** open the request → Submit is disabled until a decision → Approve → approved.
- **H4 Payroll run:** Start run → freeze (confirmed) → submit to admin → approve all (confirmed, impact stated) → Pay (confirmed with the amount).
- **H5 Payslip:** my payslips → preview → download.
- **H6 Delete a department:** the confirm names it and states the impact → it's gone.
- **H7 No access:** a manager opens payroll → a no-access state, not a blank page.

## Progress: done, 2026-10-03

**Issues:** 35 in the register (`issues.csv`): **32 fixed**, 1 blocked on the backend (HR-003: an HttpOnly session needs the real API to set it, as MKT-003), 1 deferred to the suite cleanup (HR-027: `components/ui` is still a local copy over the tokens; moving it onto the library is plan step 4/8), 1 superseded (HR-035: subscriptions belong to the customer dashboard).

**Commits** (somion-hr-dashboard-main, `wave4/hr`, local): 23cfc74 step 1 (security, one-time code, bridge) · e2a0762 step 2 (feedback, RequireRole, 404/error) · FS-HR-4 ab6a464, 1ced843, 94f35d7 (shell, IconButton, calendar, Phosphor) · FS-HR-7 3d125cc · FS-HR-8 40f2cb6 · FS-HR-9 4051c07 · 34e3357 (date pickers) · FS-HR-6 80f38af · FS-HR-5 2e787b4 (Arabic, RTL, every string) · FS-HR-10 686753a (tokens, dark, type roles, four packages gone) · close-out 845926b, 963842d. Library: @orgtik/ui rc.7–rc.12.

**Evidence:**
- Flows `node flows/hr.mjs [--locale ar]`: **34/34 in en and in ar** (H0, H1, H1b, H3, H3b, H4a–c, H6, H6b, H7, H8).
- VS-1 (5 languages × light/dark × 390/1440): **20/20 on every checked route** (`vs1/fix-*.md`, 22 routes; the `final-*` run before the close-out fixes is kept as the "before").
- axe on 27 routes: **critical 0, serious 0** in en·light, en·dark, ar·light and ar·dark (from 157 critical / 117 serious).
- Dead ends (`audits/deadends-closeout-final.csv`): **0 dead ends, 0 broken links** on 30 pages, 228 presses (from 15 and 189; the SOS `/go/:scope` route joined the inventory).
- A list that fails to load shows the library's error with a retry (checked by failing a request, en and ar).

**Carried out of the wave:** HR-027 (adopt the library's components for `components/ui`, with every other app in the suite cleanup); the editor's inserted signature/quick-style HTML is English content (a content decision); Subscriptions' Delete and status switch stay stubs until the page is retired.
