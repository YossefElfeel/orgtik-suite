# Agent guidelines

Sales (the suite's CRM) is moving to the suite design system, `@orgtik/ui` (wave 6, plan: orgtik-program `audits/sales/wave-plan.md`). It is in five languages (en, ar, de, fr, it; Arabic reads right to left) and two themes.

**Frozen modules.** The SaaS-admin modules move to the Admin app (D-011) and are frozen in this wave: plan-management, packages, subscriptions, coupons, invoices and tickets. Don't redesign them. Fix only what the wave plan lists for them. They keep the old kit (`components/ui`, the token bridge in `globals.css`) until they retire. Everything else follows the rules below.

## House structure (kept from the original guidelines)

1. **One component per file.** A component lives in its own folder with `index.tsx` and a default export. There is no `index.ts` inside a component folder, and no `components` folder inside a component folder.
2. **Types** live in `@/types/{resource}.ts`, not next to logic.
3. **Table columns** live in a `columns.tsx` beside the page or component that uses them.
4. **Pages:** a route's main logic stays in its `page.tsx`. Sub-components come from `@/components`.
5. **Forms** use react-hook-form with zod. Schemas live in `@/schemas/{resource}.ts`, without `.default()`. Messages are translated: build the schema with `t`.
6. **Dialogs** live in `@/components/dialogs/{page}/{Name}/index.tsx` and sheets in `@/components/sheets/{Name}/index.tsx`.
   - They take a `trigger` prop, or are controlled with `open`/`onOpenChange`.
   - For an update, they take the resource `id` and fetch their own data.
7. **No `as any`.** Run `npx tsc --noEmit` after every change.

## Components (CRM and shell)

- **Library first.** Use `@orgtik/ui`:
  - the main entry, plus `@orgtik/ui/table` (DataTable), `@orgtik/ui/charts` (charts with a table view), `@orgtik/ui/rhf` (RHFField for forms) and the dates (DatePicker, DateTimePicker with `timeZone`, CalendarGrid)
  - page headers: PageHeader
  - tabs: Tabs/TabsList, or SegmentedControl for view switches
  - filter chips: FilterChips
  - cards and stats: Card, Stat
  - dialogs: Dialog/Sheet/ConfirmDialog
  - the pipeline: Board
  - wizards: Stepper

  New CRM code uses neither the local `components/ui` nor `components/shared/{Table, MainHeader, PillTabs, BadgeFilter, SectionCard, StatCard}`.
- **Shared app pieces:**
  - `components/shared/SalesStatus.tsx`: `<SalesStatus kind="offer|project|contract|commission|access" value>` and `<LeadStatus value>` (the D-028 pipeline, from the library's status matrix)
  - `components/shared/FormDialog.tsx`
  - `components/shared/ButtonLink.tsx`
- **The shell** is `components/suite/SuiteFrame.tsx`. Pages render inside it; they don't draw their own sidebar or header.

## Styling

- **Colour:** library tokens only:
  - surfaces: `bg-canvas`, `bg-raised`, `bg-sunken`
  - text: `text-fg`, `text-fg-muted`, `text-fg-subtle`, `text-fg-brand`
  - lines and accents: `border-line`, `text-danger`, `bg-brand-subtle`
  - charts: `viz-1..8`

  No hex values or palette classes, and no faded ink (`text-fg/60`): it fails AA. Use `text-fg-subtle`.
- **Type:** the library scale (`text-title-sm`, `text-body`, `text-caption`, …). No `text-14` or `text-[14px]`.
- **Direction:**
  - Logical properties only (`ms-/me-/ps-/pe-/start-/end-/text-start`). Use `gap`, not `space-x`.
  - Never force `dir="ltr"`, except `<bdi dir="ltr">` around codes, emails, phone numbers and URL inputs.
  - User text gets `dir="auto"`.
  - User text inside a translated sentence goes through `isolate()` (`lib/bidi.ts`).
- **Icons:** Phosphor only (`@phosphor-icons/react`). No lucide or iconify.

## Words and formats

- **Translate everything visible** with next-intl. Use real keys only: `t(key, { fallback })` is not a next-intl feature.
- **Adding keys:** add them to all five catalogs at once. Write `scripts/messages/NN-<area>.json` and run `python scripts/add-messages.py <file>`. Never edit `messages/*.json` by hand.
- **Arabic:** Modern Standard Arabic. Plurals have all six forms.
- **Formatting:** money, numbers, dates and percents come from `useFormatter()` in the reader's locale:
  - money uses the record's currency, never a hard-coded `"en-US"`;
  - dates are in the organisation's time zone (`NEXT_PUBLIC_ORG_TIME_ZONE`, default Africa/Cairo).

## Behaviour

- **Navigation:** `Link`, `useRouter`, `usePathname` and `redirect` from `@/i18n/routing`. Keep filters, tabs, the page number and the open item in the URL.
- **Roles:** `useRole()` gives `role`, `isAdmin`, `isManager`, `isSalesman`, `isCustomer`, `readOnlySession` and `canEdit`.
  - The role comes from the `sales` scope.
  - Hide what a role can't do; follow the role matrix in the wave plan.
  - A View as session (`readOnlySession`) changes nothing.
- **View as:** "View as" for a person links to `${SOS_URL}/people?viewAs=<userId>` (SOS's read-only View as). Admins only. Sales has no impersonation of its own.
- **Feedback:** `redux/app/baseApi.ts` toasts every change's result in the reader's language, through `providers/api-feedback.tsx`.
  - Don't add a second toast.
  - Pass `{ skipSuccessToast: true }` when the screen shows the result itself.
  - Reads show their own error state.
- **States:** every list and page has loading, error with Retry, empty with the next action, and "no match". Detail routes have not-found and no-access states. Never an endless spinner.
- **Destructive and money actions** use ConfirmDialog. It names the item and the amount, and stays busy until the request ends.
- **Groups of choices** use `<Field group>` (radio groups, checkbox lists), so each option keeps its own name.

## Checks

From orgtik-program `tools/audit-kit`:

- `MSYS_NO_PATHCONV=1 node vs1.mjs --app sales --route <route> --label <label>`: 5 languages × 2 themes × 2 widths.
- `node flows/sales.mjs [--locale ar]`: the golden flows S1–S8.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
