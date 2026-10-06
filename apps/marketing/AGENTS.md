# Agent guidelines

Marketing is built on the suite design system, `@orgtik/ui` (wave 5, orgtik-program `audits/marketing/wave-plan.md`). It is in five languages (en, ar, de, fr, it; Arabic reads right to left) and two themes. These rules keep it that way.

## Components

- **Library first.** Use `@orgtik/ui` for every control and pattern:
  - the main entry
  - `@orgtik/ui/table` (DataTable)
  - `@orgtik/ui/charts` (charts with a table view)
  - `@orgtik/ui/rhf` (RHFField)

  There is no local `components/ui`. Don't add Radix, shadcn, sonner or another chart library.
- **Shared app pieces** live in `components/shared/`:
  - `MarketingStatus`: a status in words, with an icon and tone
  - `PlatformBadge` / `PlatformIcon`
  - `FormDialog`
  - `ButtonLink`
- **The shell** is `components/suite/` (SuiteFrame, ProjectSwitcher). Pages render inside it; they don't draw their own sidebar or header.
- **Layout:** one folder per screen under `components/pages/<area>/`. Helpers used by one screen sit beside it.

## Styling

- **Colour:** library tokens only, e.g.
  - surfaces: `bg-canvas`, `bg-raised`, `bg-sunken`
  - text: `text-fg`, `text-fg-muted`, `text-fg-subtle`, `text-fg-brand`
  - lines and accents: `border-line`, `text-danger`, `bg-brand-subtle`

  No hex values or palette classes (`bg-gray-100`, `text-[#101010]`).
- **Type:** the library scale (`text-title-sm`, `text-body`, `text-caption`, …). No `text-14` or `text-[14px]`.
- **Direction:**
  - Logical properties only: `ms-/me-/ps-/pe-/start-/end-/text-start`. Use `gap`, not `space-x`.
  - Don't force `dir="ltr"`, except `<bdi dir="ltr">` around ids, handles and codes, and URL inputs.
  - User text gets `dir="auto"`.
  - User text inside a translated sentence goes through `isolate()` (`lib/bidi.ts`).
- **Icons:** Phosphor only (`@phosphor-icons/react`).

## Words

- **Translate everything visible.** Every string, aria-label, placeholder and validation message goes through next-intl `useTranslations`.
- **Adding keys:** add them to all five catalogs at once. Write a file in `scripts/messages/NN-<area>.json` and run `python scripts/add-messages.py <file>`; it is safe when several agents run it. Never edit `messages/*.json` by hand.
- **Arabic:** Modern Standard Arabic. Plurals have all six forms.
- **Glossary:** use orgtik-program `glossary/glossary.csv`:
  - Project, not brand.
  - Delete when data is destroyed; Remove when nothing is.
  - Export, not Download, for data.
- **Formatting:** dates, numbers, money and percents come from `useFormatter()`. Use the project's `timeZone` and `currency` from `useProjectContext()` (`lib/project-context.ts`).

## Behaviour

- **Navigation:** `Link`, `useRouter` and `usePathname` from `@/i18n/routing`, so links keep the language. Put filters, tabs, the page number and the open item in the URL.
- **Roles:** `useMarketingRoles()` (`lib/permissions.ts`, matrix in `lib/roles.ts`).
  - Hide what a role can't do.
  - A page a role can't use shows NoPermissionState.
  - View as sessions change nothing.
  - The local mock enforces the same matrix (`local-dev/apps/marketing/roles.js`).
- **Feedback:** `redux/app/baseApi.ts` toasts every change's result in the reader's language, through `providers/api-feedback.tsx`. Don't add a second toast for the same thing. Reads show their own error state.
- **States:** every list and page has loading, error with Retry, empty with the next action, and "no match". Detail routes have not-found and no-access states.
- **Destructive and money actions** use ConfirmDialog. It names the item and the consequence, and stays busy until the request ends.
- **Groups of choices** use `<Field group>` or a fieldset/legend, so each option keeps its own name.

## Checks

From orgtik-program `tools/audit-kit`:

- `MSYS_NO_PATHCONV=1 node vs1.mjs --app marketing --route <route> --label <label>`: 5 languages × 2 themes × 2 widths, with axe, overflow and untranslated text.
- `node flows/marketing.mjs [--locale ar]`: the golden flows M1–M8.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
