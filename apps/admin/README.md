# OrgTik Admin (ADM)

OrgTik's back office for its own staff (Phase E, spec OrgTik_02 ADM-01…33, D-011). Next 16, `@orgtik/ui` (yalc), next-intl with EN/AR/DE/FR/IT and RTL, light and dark, RTK Query. Frontend only, against the local platform mock.

- Web :3008 (`npm run dev`), API: the platform mock on :4008 (`local-dev/apps/admin.js`). Contract: `orgtik-program/phase-e/platform-api.yaml` (generated from the mock; `x-permission` on each route is what the mock enforces).
- Sign in through SOS: the launcher tile or `http://localhost:3013/go/platform_admin` hands over a one-time code (`/[locale]/auth?code=…`). The session is the `adm.token` cookie; a token never stays in an address (D-017).
- Staff roles (8, spec 02 matrix) come from `/v1/admin/me` as permissions `module:view|edit|full` (`services:edit:assigned` for the Service Team). `useCan()` answers them (`x:full` implies `x:edit`); the API checks again.
- ADM-27 (content) and ADM-28 (suggestions) are the Website Manager's (D-019, D-029): the navigation links there through SOS `/go/website_manager`.

## Conventions (every screen)

- **Files by area** so areas are built in parallel without touching one file:
  - endpoints in `store/<area>.ts` with `api.injectEndpoints` (base query, types and `me` in `store/api.ts`);
  - pages in `app/[locale]/(app)/<route>/page.tsx`, area components in `components/<area>/`;
  - messages in `messages/<locale>/<area>.json`, one top-level namespace per area (areas listed in `i18n/request.ts`). `common.json` holds the frame, `Common` words and roles: add to it only in the main session.
- **Every page is gated**: `<RequirePermission permission="module:view">`; edit controls show only with `useCan()("module:edit")`, otherwise the page says it is view-only (`Common.viewOnly`).
- **All states**: loading (skeleton or `aria-busy`), empty with what to do, error with retry (`ErrorState` + `refetch`), no permission, and the API's 409/422 answers shown where they happen (field errors on the field, `wrong_state` as a message). A toast only after a 2xx.
- **Library only**: `@orgtik/ui` components and tokens; no raw colours, no physical directions (`ms-`/`ps-`/`start-`/`text-start`), Phosphor icons, directional icons get `rtl:-scale-x-100`.
- **Lists** use `DataTable` from `@orgtik/ui/table`; filters and the page live in the URL (`?state=…&page=…`) so a link opens the same view.
- **Money and dates** through `useFormatter()` (`money(amount, currency)`, `date`, `number`); amounts keep their currency's decimals (KWD 3). People's and customers' names in `<bdi dir="auto">`; emails, codes and amounts `dir="ltr"`.
- **Confirmations** with `ConfirmDialog`, stating the impact ("Notifies 4 workspaces"); actions the audit log records ask for a reason.
- **Statuses** with `StatusBadge` where the status matrix has the entity, else `Badge` with a tone and words.
- **Copy**: short, plain, sentence case; no "successfully". Arabic is MSA (D-015). Digits Latin by default (D-016).

## Checks

- `npx tsc --noEmit`
- `node scripts/i18n-check.mjs` (5 catalogs in step, placeholders match, used keys exist)
- Flows: `orgtik-program/tools/audit-kit/flows/adm-*.mjs` (take `mock.lock`, reset the mock).
