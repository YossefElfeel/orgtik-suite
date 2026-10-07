# OrgTik Suite Program: design system, Website Manager (CMS), dashboard refactor, SaaS core

## الخلاصة بالمصري

- **أول حاجة:** هنبني مكتبة ديزاين سيستم واحدة اسمها **`@orgtik/ui`**.
  - الهوية جاية من الويبسايت الجديد: البرقوقي والبنفسجي، Montserrat، أيقونات Phosphor، والـ pills.
  - هيبقى فيها ثيم فاتح وثيم غامق، وخمس لغات (EN/AR/DE/FR/IT) مع RTL كامل.
  - وبعدين هنطلّع منها لايبرري على Figma.
- **بعدها:** هنبني **Website Manager**، وده CMS داخلي لفريق المحتوى والـ SEO والماركتنج.
  - هنوصّل الويبسايت بيه **من غير ما شكله يتغير ولا بيكسل**، وهنثبت ده بمقارنة screenshots.
  - هيدير **كل حاجة في الويبسايت**: كل صفحة، كل سيكشن، كل نص وصورة وفيديو ولينك، والهيدر والفوتر والـ CTAs والنصوص الصغيرة.
  - كل صفحة وكل عنصر ليه صفحة هيبقى ليه **slug وmeta data** بكل لغة، زي الـ content dashboard وأكتر:
    - meta title وdescription وkeywords
    - OG (صورة وعنوان ووصف)
    - canonical وrobots وsitemap وJSON-LD
- **بعد كده:** هنمشي على الداشبوردات واحد واحد، شاشة شاشة وflow بعد flow.
  - هنصلّح الـ dead ends والـ states الناقصة، ونوحّد الـ UI على المكتبة.
  - الترتيب: Files كـ pilot، وبعده SOS، وبعده Tasks مع Chats بالتوازي، وبعده HR، وبعده Marketing، وآخرهم Sales.
- **في الآخر:** هنبني الجزء الناقص من الـ SaaS اللي في دوكيومنتات الـ PM، وهو الـ Admin back-office والـ Customer dashboard.
- **قبل ما نبدأ:**
  - هنعمل gap analysis: اللي عندنا مقابل الصح حسب الدوكيومنتات.
  - هنعمل قاموس مصطلحات، لأن «باقة» مستخدمة لخمس معاني.
  - هنعمل جدول حالات موحّد.
  - هنبعت للـ PM أول دفعة أسئلة.

---

## Context

OrgTik has a new brand, embodied in the new website (`orgtik-website/landing-directions`).

The eight dashboards still carry the old Somion look, reached through a quick recolor (`#8135cd`, Geist/Rubik/Inter). They have also drifted apart:
- 8 drifted shadcn copies.
- Radix in 5 apps and Base UI in 2.
- Token meanings contradict each other across apps.
- About 890 raw hex values and about 1,200 physical-direction classes.
- No dark mode, and no RTL outside Sales.

The old content dashboard manages the *previous* Somion site. The new website isn't connected to any CMS: its content is hard-coded, detail pages sit behind hash routes, and it is `noindex` with no meta tags.

The PM's specs (OrgTik_00–06) describe a SaaS whose core doesn't exist yet: an Admin back-office (ADM-01…33) and a customer dashboard (USR-00…27).

**Intended outcome:**
1. One shared, brand-true design system in code and in Figma.
2. An internal CMS that manages **everything** on the real website (every page, section, string, asset and link, each page and entry with its own slug and metadata), plus SEO and marketing, with zero visual change to the website.
3. Every dashboard reworked flow by flow onto the library, with no dead ends.
4. The missing SaaS core built on the same foundation.

Frontend only for now, against the `local-dev/` mocks.

## Decisions locked (from you)

| # | Decision |
|---|---|
| D-001 | Languages: **EN, AR, DE, FR and IT from day one**, with full RTL. |
| D-002 | The CMS is **internal, for OrgTik's own team**: one site, replacing the old content dashboard. |
| D-003 | **Light and dark themes from day one.** |
| D-004 | **Code first.** The Figma library (variables and components) is generated from code. |
| D-005 | **Connect the website to the CMS in the same phase**, with zero visual change to the website. |
| D-006 | The library ships as a **private package `@orgtik/ui`** on sdk.orgtik.org and is linked locally during development. |
| D-007 | Scope: the **7 suite dashboards**, **Chats (HQ)**, and the **missing SaaS core** (ADM and USR). |
| D-008 | **Phosphor icons** everywhere. |
| D-000 | Constraints: we never change the website's design (its owner may, and the program follows: D-031); frontend only; I act as senior PO, PM, front-end engineer and UI/UX designer. |

---

## Baseline facts that shape the plan (verified)

**Size:** ≈191 routes, ≈1,370 component files, ≈209k TSX lines, and ≈1,964 imports of `@/components/ui/*`.

| App | Next | Routes | Notes |
|---|---|---|---|
| sos | 15.5 | 19 | |
| task | 15.5 | 18 | |
| file | 16.3 | 9 | |
| sales | 16.3 | 37 | Base UI |
| hr | 16.3 | 31 | Base UI plus react-aria |
| mkt | 16.3 | 34 | Its message files are empty `{}`. |
| content | 16.3 | 23 | To be replaced by the Website Manager. |
| hq | 15.5 | 20 | Inline styles over 99 CSS variables, and its own "Lit Room" design system. |

**Stack:**
- All apps use Tailwind v4 CSS-first (no config file), React 19, strict TypeScript, RTK Query (hq uses zustand), react-hook-form with zod, TanStack Table 8.21.3 and sonner.
- None is a monorepo. Only `somion-hq` and `orgtik-website` have git.

**Website** (Vite 6 + React 19, plain JS):
- There is no token layer: about 2,735 inline styles.
- Header and footer are copied into all 10 pages, and data is duplicated.
- There are about 2,000 translatable strings.
- It uses Montserrat Latin only, so it has no Arabic.
- Its brand palette comes from ORGTIK.pdf p.8: plum `#190B25 #3B1E59 #6C3CAA #9458F4` and indigo `#121649 #243089 #394BC6 #4157F7`.
- On the site, `#0D0814` is the base, `#EEE3F7` / `#28123B` is the primary pill, and `#EEE8F7` is the light surface.
- Motion easing is `cubic-bezier(.16,1,.3,1)` and `(.22,1,.36,1)`.

**`@somion/sos-bar` 3.11.2** (dist only; we don't have its source):
- It is styled three ways at once. Its Tailwind classes only get generated in hq.
- Its launcher links put the bearer token in the URL.

**Security leftovers (S1):**
- Plaintext dev passwords in:
  - `task-manager-front-main/app/[locale]/auth/not-allowed/page.tsx:21-26`
  - `somion-hr-dashboard-main/app/[locale]/auth/not-allowed/page.tsx:20-35`
  - `sales-dashboardv2-main/mock/dev-auth.ts:10-25`
- A hard-coded JWT in `content-dashboard-somion-main/app/[locale]/auth/not-allowed/page.tsx:7`.
- Tokens in URLs in SOS and Sales.

**Missing input:** the spec's source "Requirements Document (Sep 22)" is not in the workspace, so it goes to the PM as Q-001.

---

## Program structure

### New folders and repos (under `C:\Users\yosse\Projects\New sass`)

| Folder | What it holds |
|---|---|
| `orgtik-program/` | The program repo: decisions, glossary, status matrix, spec register, route inventory, gap matrix, audits, fix specs, and tools (`extract_spec.py`, the audit kit). |
| `orgtik-ui/` | The library repo, a pnpm workspace. `packages/ui` (`@orgtik/ui`), `packages/eslint-plugin` (`@orgtik/eslint-plugin`), `packages/codemods` (`@orgtik/codemods` plus the `orgtik-ui init` and `doctor` CLIs), `apps/docs` (Storybook), `apps/next-smoke-15` and `apps/next-smoke-16`, and `tools/{figma-sync, icon-map, contrast}`. |
| `orgtik-website-manager/` | The new CMS app (Next 16, TypeScript, RTK Query, next-intl). Web on :3007. |
| `local-dev/apps/wm.js` + `apps/wm/` | The CMS mock API v2 on :4007. A platform mock (pricing resolver, state machines) is added later for ADM/USR. |
| (later) `orgtik-admin/` | The new ADM back-office app. USR grows out of SOS. |

### Workstreams

| ID | Workstream | Depends on |
|---|---|---|
| A | Foundations: git baselines, local-dev readiness, audit kit, security triage | nothing (day 1) |
| B | `@orgtik/ui` and the Figma library | A, P0 decisions |
| C | Website Manager and the website connection | B up to UI-1, the website baseline |
| D | Suite dashboard waves | B 1.0, F shell v1 |
| E | SaaS core (ADM and USR) | G-xx decisions closed, F shell v2 |
| F | SSO, shell and unified suite navigation | B shell components |

### Critical path

1. P0 decisions
2. Tokens
3. Core components
4. VS-1 slice
5. ui 1.0
6. The CMS MVP, with website parity
7. Shell v1
8. Files
9. SOS → USR foundation
10. Tasks (Chats runs in parallel)
11. HR
12. Marketing
13. Sales
14. E1 → E2 → E3

Things that speed this up:
- ADM/USR design-ahead (E0) can run during the waves.
- Chats is loosely coupled.
- The G-xx questions go out in week 1.

---

## Phase 0: foundations and discovery close-out (gate G0)

1. **Git baselines** for the 7 folders extracted from zips.
   - Commit 1 is the pristine zip tree, with its SHA-256 in the message, tagged `upstream/zip-2026-09-29`.
   - The existing local-dev edits go on a separate `local-dev` branch.
   - Set `core.autocrlf=false`.
   - In `somion-hq`, commit the pending work (Meet now, suite session) to a branch.
2. **local-dev readiness:**
   - Every app boots through SOS, with a smoke test per identity.
   - Add `/__reset`, a frozen clock (`MOCK_NOW` plus clock advance), a request log and deterministic seeds.
   - Reserve ports for the CMS (3007/4007) and ADM.
3. **Registers:**
   - `spec-register.csv` (~197 items: ADM, USR, US-C, US-A, F, state tables, G) and `permission-matrix.csv`, extracted from the docx files with python zipfile.
   - `routes.csv` (191 routes) and the component inventory.
4. **Audit kit v0:** hq's `deadends.mjs`, `flows*.mjs` and `audit.mjs` generalised. It gives a login helper, a route sweep, dead-end detection, axe, console and 404 capture, and static scans (hex, physical classes, primitive imports, literal strings). Baseline metrics for every app.
5. **Website baseline** at commit `30db536`, tagged `pre-cms`:
   - 39 routes × 390/768/1440, plus interaction states.
   - Snapshots of DOM text, headings and the accessibility tree.
   - The parity harness v0 (`tools/qa/capture.mjs` and `diff.mjs`, Playwright plus pixelmatch at threshold 0).
6. **Governance seed:** glossary v1, the unified status matrix v1, the decision log (D-009…), and PM packet #1 (see "PM packet #1").
7. **Spikes:**
   - Base UI plus DirectionProvider with RTL keyboard behaviour.
   - An Arabic font specimen: Noto Kufi Arabic (recommended), Alexandria, IBM Plex Sans Arabic.
   - Self-registering `@source` on Next 15.5, Next 16.3 and Vite.
   - next/font loading from the package path.
   - yalc with npm, pnpm and Turbopack HMR.
8. **Quick wins** (no redesign):
   - A tailwind-merge `extendTailwindMerge` hotfix in all 7 apps. It fixes mkt's buttons losing their font size.
   - The S1 security fixes are scheduled for Wave 1, and credential rotation is requested now.

**G0 exit:** all apps boot and pass smoke tests; registers are generated; the glossary and status matrix are approved; the P1 component scope is approved; the spikes have answered their architecture questions.

---

## Phase 1: `@orgtik/ui` v1 and the Figma library (gates G1a and G1)

### Tokens

**Source:** W3C DTCG JSON in `packages/ui/tokens/`. Style Dictionary generates:
- `tokens.css`: `:root` primitives plus `[data-theme]` semantic blocks plus `[lang|=ar]` script tokens.
- `theme.css` with `@theme inline`.
- `tokens.ts`.
- `twmerge.config.ts`.
- `figma/variables.json`.

**Tiers:**
- Primitives, `--ot-color-{ramp}-{step}`, are not exposed as utilities. Ramps: plum 50–950, mauve neutrals, night (dark surfaces), and indigo from the manual.
- Semantic, `--ot-{category}-{role}`, e.g. `bg-surface-raised`, `text-fg-muted`, `border-line`.
- Component, `--ot-button-height-md` and similar.

**Naming rule:** no generic `primary`/`secondary`/`muted` names. They cause today's bugs, and avoiding them lets old and new names coexist during migration.

**Key semantic values (light / dark):**

| Token | Light | Dark |
|---|---|---|
| canvas | `#F6F1FA` | `#0D0814` |
| raised | `#FFFFFF` | `#1A0D27` |
| sunken | `#EEE8F7` | `#120A1B` |
| overlay | `#FFFFFF` | `#21132D` |
| **chrome** (rail/sidebar) | `#190B25` (plum chrome in light mode too) | `#120A1B` |
| fg | `#190B25` | `#F6F1FA` |
| fg-muted | `#4A3A57` | `#CFC2DB` |
| fg-subtle | `#6E6178` | `#B5A6C4` |
| fg-brand | `#6C3CAA` | `#C9A0F3` |
| action-primary | `#6C3CAA` on `#FFF` | `#EEE3F7` on `#28123B` |
| brand pill | `#190B25` / `#F6F1FA` | `#EEE3F7` / `#28123B`, with the arrow chip |
| focus | `#6C3CAA` | `#B98AF7` |
| line-control | `#8E7FA0` | `#FFFFFF66` |

The site's input border and focus colours fail WCAG 3:1 on light surfaces, so these values are corrected.

**Status tones** (the site has only an error colour):
- success is green, warning is amber, danger is the site's `#8A1F3A`/`#A02544`, info is the manual's indigo, and brand is violet.
- Every tone has fg, subtle and solid variants in both themes, all AA.
- A status always carries an icon plus a label.
- `#9458F4` never carries small white text (4.23:1).

**Data-visualization palette:** 8 CVD-validated slots (violet, teal, amber, indigo, magenta, green, sky, orange), plus a sequential plum ramp and a diverging indigo↔orange ramp.

**Shape, motion and size:**
- Radius: pill 999 (buttons, the brand signature), field 12, card 20, overlay 16, panel 24.
- Easings from the site; durations 90/120/200/300/480ms, all 1ms under reduced motion.
- Glass with an opaque fallback.
- Control heights 32/40/48/54.

**Themes:**
- `data-theme="light|dark"` plus `color-scheme`.
- The `ot-theme` cookie is shared across the suite.
- A blocking `<ThemeScript>` prevents flash, and `<ThemeScope>` supports scoped themes (e.g. dark chrome) together with portal containers.

### Typography, RTL and i18n

**Fonts:**
- `--ot-font-display` is the Arabic companion, then Montserrat, then Arial. `--ot-font-body` is the Arabic companion, then Arial.
- The Arabic font uses an Arabic-only `unicode-range`, so it loads only when Arabic text appears.
- Montserrat needs the **latin-ext** subset, because FR needs œ and DE needs ẞ.
- Next apps load fonts with `next/font/local`.

**Type roles:** `text-display`, `title-lg`, `title`, `title-sm`, `body-lg`, `body`, `body-sm`, `label`, `caption`, `eyebrow`, `micro`. Each role sets size, line height, tracking and weight together. Under `[lang|=ar]`, tracking goes to 0 and uppercase is disabled. Numbers use tabular numerals.

**Direction:**
- `OrgtikProvider` syncs `lang` and `dir` and flips instantly. It feeds Base UI's DirectionProvider and React Aria's I18nProvider.
- Layout uses logical properties only, enforced by lint.
- Icons marked `directional` mirror via CSS; logos never mirror.

**Bidi-safe inputs:** email, URL, number and money inputs are always `ltr`. User text is wrapped in `<Bdi>`. CSV export is UTF-8 with a BOM and guards against formula injection.

**LocalizedField:** side by side for 2 locales, tabs with completeness badges for 5. On error, focus moves to the first invalid locale. This replaces the spec's AR/EN side-by-side pattern and needs PM confirmation (D-014).

**Strings:** built-in typed catalogs of about 120 keys for 5 locales, with Arabic's 6 plural forms, overridable per app. There is **no next-intl dependency**. `useFormatter()` wraps Intl, with Latin digits by default via `ar-u-nu-latn` (D-016) and ISO minor units for currencies (KWD 3, SAR 2).

### Primitives: Base UI 1.6 behind the library API; React Aria only for dates (D-009, confirmed by a spike)

- Base UI covers the spec's number, money and percent fields, multi-select combobox, meter, field and form, drawer and OTP. Sales, the only app already running AR/RTL, already uses it.
- The library owns a shadcn-like public API, and apps are banned by lint from importing primitives directly.
- Radix apps get a **deprecated `asChild` shim** plus an `as-child-to-render` codemod.
- Rule: never nest overlays from different primitive libraries. Migrate a screen's overlay family together.

### Component inventory

**Tier 1 (foundations):**
- Actions: Button (`primary`, `secondary`, `ghost`, `danger`, `link`, and **`brand`**: the pill with an arrow chip that mirrors in RTL), IconButton (a label is required by its type), Link.
- Text: Input, PasswordInput, Textarea, Field.
- Choice: Select, Combobox, MultiSelect, Checkbox, RadioGroup, Switch.
- Numbers: NumberField, MoneyField, PercentField.
- LocalizedField.
- Display: Tag, Badge, StatusBadge, Avatar, Card, Skeleton, Spinner.
- Overlays: Tooltip, Popover, Menu, Dialog, Sheet, **ConfirmDialog** (with a required `impact`, and optional reason, acknowledgement or typed confirmation).
- Toast, Tabs, SegmentedControl, FilterChips, Accordion, Breadcrumb, Pagination.
- States: Empty, Error, NoPermission, Loading, and a `ListStates` switch.
- Logo.
- RHF adapters (`createRHFField`) and zod helpers that work with both zod 3 and 4.

**Tier 2 (shell and data):**
- Shell: **SuiteShell** (rail, launcher and sidebar, with the sidebar on the right in RTL), TopBar, PageHeader, UserMenu (with theme and language switches), **BannerRegion** (one banner at a time, by priority).
- **DataTable**: server or client mode, 25/50/100 rows, sort, column filters, column visibility, saved views, CSV export, selection with bulk actions, and all states.
- Stat and the chart kit (recharts ≥3), LimitMeter (OK / 80% / Full / Over), ToolState (7 states plus the CTA rules).
- Date pickers (React Aria), FileField, RepeaterField, ReadOnlyField, OtpField.
- RichText and LocalizedRichText (Tiptap 3, constrained).

**Tier 3 (v1.x):** CommandPalette, TagInput, AuditTrail, Stepper, PriceGrid cells, CopyField, Countdown.

**Lifted from the apps:** behaviour, not styles, taken from hr's Table, TableSkeleton, CustomPagination, ReusableDialog, TextFormEle, and sales' localized fields.

**Compatibility shims:** they stay at each app's existing import paths, so the 1,964 import sites don't change on day one. Examples: `LegacyDataTable` and `LegacyReusableDialog`.

### Packaging, quality and Figma

**Build and CSS:**
- The build is `tsc` per file, as ESM with `"use client"` preserved.
- CSS: apps add one line, `@import "@orgtik/ui/tailwind.css"`, which carries the tokens, the theme and a **self-registering `@source`**. This avoids the sos-bar pitfall.
- A prebuilt `styles.css` exists for non-Tailwind hosts.
- JS never imports CSS.

**Dependencies:**
- Peers: react 19, Phosphor, sonner, RHF, TanStack, recharts, Tiptap, zod, next (`>=15.5 <17`) and Tailwind 4, with the optional ones marked optional.
- The `@orgtik/ui/next` entry holds Link wiring, table URL state and server theme.
- The `doctor` CLI checks peers, since apps install with `--legacy-peer-deps`.

**Releases:**
- Versioning uses changesets, starting at 0.x, with a `next` canary tag.
- Local linking uses **yalc**.
- Publishing goes to `sdk.orgtik.org` with a CI token. Until we have publish rights, we ship `npm pack` tarballs.

**Quality:**
- Storybook with theme × locale/direction toolbars and a 2×2 matrix mode.
- Playwright visual regression on 6 combinations per story plus a pseudo-long locale.
- axe on every combination, interaction tests, and Vitest for logic.
- Contrast CI over the token pairs, and Next 15/16 smoke apps.

**`@orgtik/eslint-plugin`** has these rules, each tracked by a per-app count baseline that may only go down (a ratchet):
- `no-raw-color`, `no-default-palette`, `no-physical-direction`, `no-legacy-text-scale`
- `prefer-orgtik-imports`: bans lucide, iconify, Radix, direct Base UI imports and tw-animate.

**Codemods:** `icons-to-phosphor` (a reviewed map of about 550 icon ids), `hex-to-token`, `text-scale`, `as-child-to-render`, `physical-to-logical`, `tw-animate-removal`.

**Figma (one-way, from code):**
- `tools/figma-sync` uses the Figma MCP to create these collections:
  - Primitives
  - Semantic (Light and Dark)
  - Components
  - Typography (EN, AR, DE)
  - Direction (LTR and RTL)
- Component sets come from the cva variants plus a `*.figma.ts` anatomy file per component.
- Code Connect links the components back to code.
- A monthly job checks for drift.

**sos-bar:**
- **Stage A** (now, in every app still on v3):
  - Add the `@source` line.
  - Override its CSS variables and colours.
  - Pass `renderIcon`, so tiles use Phosphor.
- **Stage B** (the Tier 2 shell):
  - The library's `AppLauncher` owns the look.
  - The data and auth parts become a thin adapter behind each app's `SoSBarWrapper`.
  - The token hand-off is isolated in `buildScopeHref`.
  - Tokens are stripped from the URL after validation.

**VS-1 vertical slice:** SOS login → shell → the Files list. It must pass the screen definition of done in 5 locales × 2 themes before we call the library 1.0.

**Gates:**
- **G1a** (visual language): tokens, the Arabic font, pills in dense UI, and the default theme.
- **G1:** ui 1.0 is published, the Figma library is live, and VS-1 is green.

---

## Phase 2: Website Manager (CMS) and the website connection (gate G2)

### Product

- **Name:** "Website Manager · orgtik.ch".
  - It reuses the `website_manager` scope and SOS role.
  - The old content app moves to a `website_manager_legacy` scope, admins only, until it is retired.
  - Records store `siteId: "orgtik"`, so multi-site stays possible later.
- **Roles** use `module:view|edit|approve` permissions: Admin, Editor, SEO, Marketing, Approver and Viewer.
  - Special permissions: `legal:approve`, `claims:approve`, `pricing:edit`, `leads:pii`, `site:visibility`, `locales:enable`, `seo:custom-jsonld`.
  - They map to the spec's matrix: Content role → Editor plus Approver; Product Mgr → Editor plus `community:approve`; and so on.
  - Seeded test users: Mona (Admin), Karim (Approver), Hoda (Editor), Dina (Marketing), plus a new SEO user, u17.
- **Information architecture** (all under `app/[locale]`):

| Area | Routes |
|---|---|
| Overview | KPI cards and charts from mock analytics (parity with the old dashboard), plus a work queue: my drafts, needs review, scheduled, translation gaps, SEO issues, media issues, leads |
| Content | Services (families, services, packages, bundles) · Software (modules and plans) · Work · Insights (with categories) · Proof (testimonials and logos) · FAQs · Global (nav, footer, socials, closing CTAs, process steps, hero media) · Strings (ICU) · Legal (versions) |
| Pages | **Every page template** with its sections and its own SEO: Home, Services, Software, Work, About, Insights, Contact, Roadmap, Legal, Sitemap, Sign in / Sign up / Recovery, 404 and loading |
| Media | Library with alt text per locale, rights, focal point and usage |
| SEO | Health · pages · redirects · indexing (sitemap and robots) · structured data |
| Marketing | Leads (list and board) · roadmap and ideas moderation |
| Localization | Entry × locale matrix |
| Settings | Site · team (from SOS) · audit log |

- **Later** (none of these is on the website today): campaigns and a UTM builder, waitlist and newsletter, real analytics integrations, machine translation, landing-page templates, careers.

**UX standards** (these fix every class of issue found in the old dashboard):
- Every list is server-driven and URL-synced: 25 rows, saved views, CSV export, and all states.
- No hover-only actions; rows are reorderable by keyboard.
- A success toast appears only after a 2xx response.
- Breadcrumbs come from the route registry.
- A destructive confirm states the impact, e.g. "Used on 3 published pages".

### Content model v2

**Principles:**
- Stable IDs, separate from slugs.
- Entities are separate from pages: page slots reference entities and can override fields.
- Derived labels such as "save 12%" or numbering are computed, never stored as copy.
- The public API returns view-ready bundles.

**Shared field sets:**
- `Localized<T>` with a status per locale.
- `SeoBlock`: meta, OG, robots, canonical override, sitemap flag, JSON-LD template or override.
- `MediaRef`: alt per locale, caption, focal point, crops.
- `Provenance` for claims, testimonials, metrics and screenshots, with a placeholder label so today's copy renders unchanged.
- `PublishMeta`, `Placement` (showOnWebsite, order, featured), `Action` (CTA) and `Governance`.

**Entities, seeded from the site:**
- serviceFamily (5), service (11), engagementPackage (3), serviceBundle (3), serviceStory
- softwareModule (6, including `shortLabel`), planOption, billingDuration, workspacePlan, platformFlow
- caseStudy (5): one shared brief plus a block set per department (D-032), article (6) and articleCategory
- testimonial, clientLogo, faq
- roadmapItem (6) and idea (7)
- legalDocument (versioned and immutable)
- page and sectionInstance (fixed templates plus a schema-driven section editor plus typed editors where the UX needs one)
- navigation, footer, closingCta, heroMedia, contactConfig, string (~700), siteSettings, pricingDisplay
- Operational: lead, redirect, mediaAsset, version, auditEvent

**Pricing:** the CMS is not the price authority; the spec puts prices in ADM through a server resolver. A single `pricingDisplay` document holds today's CHF numbers, with `priceMode` = indicative, on_request or live. Editing numbers needs `pricing:edit` plus Admin approval.

### Full website coverage: the CMS manages everything

**Rule:** after S1 extraction, **no copy, media, link or head tag stays hard-coded** in the website's page files. Everything the website shows comes from the CMS: text, images, videos, posters, icons (from an allowed list), links, CTAs, form labels and messages, disclaimers, aria labels, tab titles and meta tags.

| Website area | Managed in | Editable | Slug / route | Own SEO |
|---|---|---|---|---|
| Header, nav, mobile menu | Global → Navigation | Link labels and targets, order, CTA label and target, "Sign in" label, menu labels | – | – |
| Language menu | Settings → Locales | Which locales show, and their labels | – | – |
| Footer | Global → Footer | Statement heading and accent, body, CTAs, link columns, socials (network, URL, show), taglines, copyright, "Back to top" | – | – |
| Home | Pages → Home | Hero (eyebrow, lines, rotating words, lead, 2 CTAs, desktop and mobile video and poster), ticker, the two gateway cards, client logos, selected work (references plus overrides), services accordion, software explorer, approach steps, testimonials scope, closing CTA | `/` | ✓ |
| Services overview | Pages → Services | Hero and side panel, headings, "View N more", builder labels, helper and disclaimer text, process, testimonials, closing | `/services` | ✓ |
| Service family ×5 | Content → Services | Name, short, kicker, title, intro, image, icon, service order, home teaser, complementary family | slug per locale | ✓ |
| Service ×11 | Content → Services | Name, outcome, summary, 3 capabilities, related work, stories | slug per locale | ✓ |
| Packages ×3, bundles ×3 | Content → Services → Packages & bundles | Names, notes, featured, recurring, features; bundle name and services (numbers are in `pricingDisplay`) | – | – |
| Software overview | Pages → Software | Hero, flow (6 steps, 12 context items), plan-builder labels, testimonials, closing | `/software` | ✓ |
| Software module ×6 | Content → Software | Every module field: title, short, description, 3 tasks, 3 highlights, 3 use cases, image, connects-to, short label | slug per locale | ✓ |
| Plans | Content → Software → Plans | Plan options, durations, workspace plans, quick bundles, product tiers (names, notes, features) | `/software/plans` (noindex) | ✓ |
| Work index | Pages → Work | Hero, filter labels, empty state, closing | `/work` | ✓ |
| Case study ×5 | Content → Work | Shared brief (client, timeline, team, challenge, goal, role, headline result, section titles and intros) · the department's blocks (D-032: journal, build log, runbook, performance report, service log, with steps, deliverables, metrics, charts, gauges, funnel, KPIs, tickets) · sample-figure labels until approved · gallery, testimonials, governance | slug per locale | ✓ |
| About | Pages → About | Hero, purpose (image, mission, 3 goals), journey ×4, capabilities ×4 with browser items and side links, testimonials, closing | `/about` | ✓ |
| Insights index | Pages → Insights | Hero, topic filter labels, popular reads (manual or automatic), empty state, closing | `/insights` | ✓ |
| Article ×6 | Content → Insights | Title, excerpt, date, reading time, cover, category, author, tags, 3 takeaways, body blocks, CTA, related items | slug per locale | ✓ (BlogPosting) |
| Article category ×4 | Content → Insights → Categories | Name, linked family | slug per locale | ✓ |
| Contact | Pages → Contact | Intro, 6 topics, 3 paths, form labels, placeholders, validation, success and error text, disclaimer, "What happens next" ×3, address, phone, email | `/contact` | ✓ |
| Roadmap | Pages → Roadmap, and Marketing → Roadmap | Hero, period filters, timeline items ×6, ideas ×7 (moderation), suggestion form copy and topics, dialog labels, demo notices | `/roadmap` | ✓ |
| Legal ×3 (+ refund and cookies later) | Content → Legal | Title, summary, sections, version, effective date | slug per doc | ✓ |
| HTML sitemap | Generated from the route registry; labels are editable | – | `/sitemap` | ✓ |
| Sign in / sign up / recovery | Pages → Account | Headings, labels, validation, notices | `/sign-in`, `/sign-up` | ✓ (noindex by default) |
| 404 and loading | Pages → System | 404 headline and link, loading text | – | noindex |
| Testimonials, client logos | Content → Proof | Quote, name, role, company, placements, provenance; logo, name, URL, order | – | – |
| FAQs | Content → FAQs | Question, answer, category, placements. Rendering them on the site needs design approval. | – | FAQPage JSON-LD once rendered |
| Closing CTAs (per-page variants) | Global → Closing CTAs | Eyebrow, lines, accent, body, 2 actions | – | – |
| Cursor labels, tickers, microcopy, aria labels | Content → Strings | Every remaining UI string, as ICU messages | – | – |
| Images, videos, posters, logos | Media | Files, alt per locale, focal point, rights, crops | – | used as OG images |
| Site-wide defaults | Settings → Site | Site name, title template, default OG image, theme-color, canonical host, organization data (address, phone), search visibility, locales, forms mode, price mode | – | global SEO defaults |
| Redirects, sitemap.xml, robots.txt | SEO | Redirects CRUD, sitemap configuration, robots rules | – | – |

### Metadata and slugs on everything (like the old dashboard, and more)

**Every page and every routable entry** has an SEO block **per locale**:
- **Slug:** auto-generated from the title, editable until first publish, validated and unique. A change after publishing creates 301s.
- **Meta:** title and description, with SERP preview and length counters.
- **Keywords:** a focus keyphrase plus a keyword list, as in the old dashboard. They feed the SEO checklist; the `<meta keywords>` output is off by default.
- **Social:** OG title, description and image, plus the Twitter/X card, with a social preview.
- **Indexing:** canonical (automatic, with an SEO-only override); robots index/follow; include in sitemap, with optional priority and change frequency. hreflang is automatic.
- **Structured data:** JSON-LD from the template, plus overrides, plus custom JSON.
- **Other:** a breadcrumb label and a last-modified date (automatic).

Static pages get the same block. Their top-level path is fixed by the template in EN (`/services`, …), while **localized paths are editable** (e.g. `/de/leistungen`) and every change auto-creates a redirect.

### Parity with the old content dashboard (nothing is lost)

| Old content dashboard | Website Manager |
|---|---|
| Overview analytics (KPIs, visits chart, top services and blogs) | Overview with KPIs and charts from the mock, plus the work queue |
| Contacts inbox (new/replied, notes) | Leads: pipeline, notes, owner, UTM and page context, CSV, PII rules |
| Gallery (upload, alt, delete) | Media library: alt per locale, rights, focal point, crops, usage, replace-in-place |
| Services → sub-services (title, description, slug and SEO ×4, keywords, images, tags, body, quote, features, how we work) | Service families → services, with the website's real fields plus slug, SEO and keywords per locale |
| Projects (title, description, tags, link, image) | Case studies with the full field set, slug and SEO, and governance |
| Blogs (title, excerpt, content, SEO title/description, slug, keywords, feature image, service, JSON-LD, visibility) | Insights articles: all of those, plus category, author, tags, takeaways, scheduling, versions and per-locale status |
| Reviews (client, title, content, rating, public) | Proof: testimonials with provenance and approval, plus client logos |
| Web content (every page's sections plus shared sections, schema-driven) | Pages (every template's sections), Global, and Strings |
| Page SEO (title, description, keywords) | An SEO block on every page and entry, plus SEO health, redirects, sitemap/robots and JSON-LD |
| "Sitemap" categories and blogs (SEO landing pages) | Migrated as archived drafts. The module returns when the website gets a landing-page template, which needs a design. |
| Jobs (a stub) | Only if the website gets a careers page |
| en/de/fr/it, all required | 5 locales including Arabic RTL, with partial translations and a status per locale |

### Workflows

- **Publishing:** draft → in review → approved → scheduled or published, with a separate public lifecycle of unpublished / published / archived.
  - Four-eyes review for legal, claims and pricing.
  - An SEO-only fast lane.
  - Blocking checks run before publish.
- **Locales:** every public locale must be READY, or the missing locales are explicitly acknowledged. This extends the spec's "single language" rule.
  - Missing locales drop out of listings, the sitemap and hreflang, and their URL redirects (302) to EN.
- **Localization:** not started → in progress → needs review → ready → published. Any source change marks the translation OUTDATED. There are no silent EN fallbacks on public pages.
- **Preview, versions and audit:**
  - Preview tokens show the real site in 390/768/1440 frames, with a fit check.
  - Every save is a revision, and diffs are per field and locale. Restore creates a new draft.
  - An append-only audit log.
  - Autosave, a route blocker, and ETag/If-Match conflict handling.
- **Slugs:** per locale, for every routable entry and every localized static-page path. They are validated (format, uniqueness, reserved words), and a change auto-creates 301s. Chains and loops are prevented.
- **Media:** alt text and rights are required before published use. Deleting an asset that is in use is blocked. Rights expiry produces warnings.
- **Leads:** NEW → CONTACTED → QUOTED → WON or LOST (a reason is required), plus SPAM and DUPLICATE. Leads carry page, bundle and UTM context. PII is masked without `leads:pii`, and erasure is audited.
- **Roadmap ideas:** PENDING → OPEN → PLANNED → IN_PROGRESS → SHIPPED (a link is required), plus DECLINED (with a reason), MERGED and HIDDEN.

### SEO and marketing

- SERP and social previews measured by pixel width, soft length counters, and a checklist per entry and locale (not a vanity score) that rolls up into an SEO health view.
- Canonical and reciprocal hreflang, generated from one registry.
- Per-locale sitemap index, and robots rules by environment. Search visibility stays at today's `noindex` until the content is approved (D6).
- **Redirects manager**, seeded with the legacy aliases from `navigation.js:20-60`, generating `vercel.json`.
- JSON-LD templates for Organization, WebSite, Breadcrumb, Service, SoftwareApplication, BlogPosting and CreativeWork. Monaco stays only for custom JSON-LD.
- UTM captured in memory without storage, so no consent banner is needed. Each lead stores the version of the privacy notice it was shown.

### Connecting the website with zero visual change

**Architecture:** the CMS talks to the WM mock (`/v2`). On publish, `content:pull` writes `src/content/snapshot/{locale}/*.json`, which is committed. Adapters rebuild the exact legacy data shapes, so the page render code doesn't change.
- Modes: `snapshot` (production default), `api` (local dev) and `preview`.
- The website does **not** adopt `@orgtik/ui` in this phase.

**S1 extraction** (one pull request per page, each with zero diffs):
- A Babel AST extractor pulls the class-field data (FAM, MODS, PLAN_*, INS/ART, RM/IDEAS, LG, …) into v2 entities, with a parity test per adapter.
- A strings codemod turns copy into ICU messages, including tagged accents and plurals. Typography must survive exactly.
- Duplicated data is merged into one source: families, modules, steps, nav, footer, socials.
- Removing the duplicated header/footer markup is optional and comes later.

**S3 real paths and SEO plumbing:**
- `/services/{family}/{service}`, `/software/{module}`, `/work/{slug}`, `/insights/{slug}`, `/legal/{doc}`.
- Old `#/…` hash links are rewritten on boot, and the host serves 301s for them. A real 404 page is added.
- `tools/prerender-heads.mjs` writes a per-route `index.html` containing only the head (lang, dir, title, description, robots, canonical, hreflang, OG, JSON-LD), plus the sitemaps, robots, 404 and `vercel.json`.
- Full SSG is deliberately postponed. The site reads `window` for breakpoints, so server rendering would change the first paint.

**S5 locales on the website:**
- DE/FR/IT are covered by Montserrat latin-ext.
- **Arabic means the same design mirrored.** That is an owner design sign-off (D8). It involves an Arabic `@font-face` with an Arabic `unicode-range`, `:lang(ar)` type rules, and a physical→logical codemod that is proven neutral in EN by the pixel diff.
- The language menu goes from 3 to 5 options only when each locale goes public (D7).

**Parity proof:**
- 150 screenshots (50 routes × 3 widths) plus interaction states, against the **current baseline**: the latest approved website `main` (D-031; now `d76ee3b`).
- Pixel diff at threshold 0 in EN on every pull request.
- DOM text, headings and accessibility tree must be identical.
- A round-trip identity test: `GET /v2/public/pages` must deep-equal the snapshot.
- Allowed differences: href values, head tags and tab titles.

**Precondition:** the website's `AGENTS.md` rules must be updated by the owner first (D3): today they forbid translation and direction changes and require forms to stay previews.

### Mock API v2 (`local-dev/apps/wm*`)

**Envelope:** success is `{data, meta}`; errors are `{error:{code, message, fieldErrors?, required?, requestId}}`. Status codes used: 400, 401, 403, 404, 409, 412, 422, 423, 429. Every endpoint has ETag and pagination (`page`, `pageSize=25`).

**Endpoints:**
- Admin: `/v2/admin/{me, schema/types, entries/:type…, transitions, versions, diff, preview-token, media…, seo…, redirects…, leads…, ideas/moderate, localization, audit, settings, overview}`.
- Public: `/v2/public/{pages/:key, global, routes, redirects, sitemap.xml, robots.txt, legal/:key/versions, leads, ideas}`.
- Preview: `/v2/preview/pages/:key`.
- Mock control: `/v2/__reset`, `/v2/__clock`, `/v2/__tick`, `?__delay` and `?__fail`, used to exercise every state.

**Seeds:** built from the S1 snapshot. `migrate-v1.js` imports the old DE/FR/IT content as NEEDS_REVIEW, converts contacts into leads and reviews into draft testimonials, and turns gallery items into media with unknown rights.

### From the old content dashboard

| Keep | Rebuild | Drop |
|---|---|---|
| The *idea* of the schema-driven section editor · the baseApi pattern, minus the automatic toast on every mutation · Tiptap, constrained · the SSO hand-off | gallery → the new media library · RoleGuard → `<Can>` · breadcrumbs · SeoForm → SEO block · language tabs → locale status | 4 pagination implementations · 6 keyword inputs · `handle-req-with-toaster` · somion.ch URLs · hard-coded JWT · hover-only actions |

"Sitemap blogs" (programmatic landing pages) and jobs are archived.

### Delivery slices (each ends in a working CMS → website flow)

| Slice | End-to-end exit |
|---|---|
| S0 | CMS shell in EN and AR/RTL, light and dark · SSO from the launcher · the mock's RBAC and 403 · the harness shows 0 diffs against itself |
| S1 | **All** website content is extracted: the coverage report shows 0 copy literals left in page files · the website runs from the snapshot with **0 pixel diffs** and identical DOM text |
| S2 | **Everything is editable.** Every entry type and every page section can be edited through registry-driven forms, each with its slug and SEO block, plus the publish workflow and preview. Services and Software get typed editors first. Exit: any visible text, image, link or meta field on any page can be changed, approved and published, then seen on the site, while everything else stays identical. |
| S3 | Real paths and head prerender (the SEO blocks now render in each route's HTML head), redirects, sitemap · a slug change creates a 301 · old hash links resolve |
| S4 | Typed editors for Insights, Work and Proof · Work's department block editors, with the series editor (charts, funnel, channels, gauges) and the palette editor (D-032) · the media library · claims gating (sample figures stay labelled until approved) · delete blocked while in use |
| S5 | 5 locales, the localization matrix, localized slugs and paths, `/de/…` with hreflang · an AR preview in RTL after sign-off |
| S6 | Leads with UTM and bundle context, idea moderation, typed editors for the remaining pages and global content |
| S7 | Legal versions, the audit screen, the parity table fully ticked, retirement of the old content dashboard |

**G2 exit criteria:**
- **100% coverage**, checked automatically: no copy literals left in page files; every route in every public locale has a published SEO record; every meaningful image has alt text in every published locale.
- The old dashboard's parity table is fully ticked.
- 0 pixel diffs in EN.

---

## Phase 3 onward: dashboard waves, screen by screen and flow by flow

### Order

| # | App | Why this slot |
|---|---|---|
| 1 | **Files (pilot)** | Smallest, and self-contained; it already has 4 locales and the closest style. Exercises the table/grid, dialogs, upload, preview and the public share route. |
| 2 | **SOS → USR foundation, plus shell and SSO v1** | The gateway. It gets a library already hardened by the pilot. i18n starts from zero. Candidates to freeze as superseded: systems/cms, chat, content, icons-test. |
| 3 | **Tasks** | Kanban drag and drop, calendar and realtime are the hardest RTL interactions, so they harden early. |
| 3∥ | **Chats (HQ)** | A token swap: one bridge file rebrands all 960 inline styles. It also needs a new world palette, presence hues moved off the brand violet, the accent presets removed, and "The Lit Room" DESIGN.md replaced. |
| 4 | **HR** | Radix, Base UI and react-aria merge into one. Heaviest hex debt (404). Money and approvals. |
| 5 | **Marketing** | No i18n at all today (all strings to extract), 365 legacy `text-NN` classes, wizard bugs, and the gallery adapter. |
| 6 | **Sales (CRM core)** | Last, so that about 17 routes the ADM/USR apps supersede (plan management, coupons, packages, subscriptions, invoices, tickets) are retired rather than refactored. |
| – | Content | Replaced in Phase 2 (re-skin only if it is still needed), then retired. |

**Wave template** (per app, each step shippable, no runtime flags):
1. **Align:** versions, install `ui`, 5 locales, lint rules in warn mode with a count baseline that may only go down.
2. **Audit** → Gate A.
3. **Fix specs,** plus Figma for flow changes → Gate D.
4. **Migrate:** golden flow first, then screen by screen.
5. **QA** against the definition of done.
6. **Release** the merge-request series; lint rules switch to errors → Gate R.

**Migration steps per app:**
0. Preflight.
1. Token bridge: old shadcn variables mapped to `--ot-*`; `--secondary` mapped per app from a usage report.
2. Fonts and base: `<html lang dir data-theme>`, the provider, the toaster.
3. SuiteShell.
4. `components/ui/*` rewritten as shims over the library, one overlay family per pull request.
5. DataTable adoption, with every DeleteDialog becoming a ConfirmDialog that carries impact copy.
6. Codemods until the lint counts reach 0.
7. Gates: zero raw colours enables dark; zero physical classes plus an AR catalog enables Arabic.
8. Cleanup: remove lucide, iconify, Radix, tw-animate, next-themes, the bridge and the shims.

### Audit method (same for every app)

- **Inventory:** `audits/<app>/inventory.md` lists routes (roles, spec IDs, states present, locales, endpoints), flows (actor, start → end, spec link, result) and components (library equivalent), plus baseline metrics.
- **Issue taxonomy:**

| Code | Meaning | Default severity |
|---|---|---|
| DE | Dead end | S1 on a golden path |
| BF | Broken flow | S1 |
| MS | Missing state | S2 |
| IC | Inconsistency | S3 |
| A11Y | Accessibility | S1/S2 |
| I18N/RTL | Language or direction | S2 |
| CPY | Copy | S3 |
| PERF | Performance | S2/S3 |
| SEC | Security | S1 |
| PERM | Permissions | S1/S2 |
| DATA | Money and formats | S1 for money |
| SPEC | Conflicts with the spec | Goes to the gap matrix |

- **Evidence for every issue:** route, identity, locale/theme/width, screenshot, file:line, repro steps, and console and network output. `local-dev/logs/unhandled.log` separates mock gaps from app bugs.
- **Flow tracing:**
  1. Reset the mock and freeze the clock.
  2. Walk the flow as the right identity in the browser, capturing each step.
  3. Probe cancel/back at every step, invalid input, empty data, no access, refresh, deep links, keyboard only, and the same flow in AR/RTL.
  4. The flow becomes a Playwright test, which becomes the regression gate.
- **Fix spec** (`FS-<APP>-<n>`): problem and evidence → design decision (Figma for S1/S2 flow changes) → library components (a missing component becomes a library request, never a local one-off) → message keys → all states → Given/When/Then acceptance criteria → test plan.

**Screen definition of done:**
- All states: loading, empty (with an action), error (with retry), no-permission, read-only, limit reached.
- All 5 locales at 100% keys; Arabic plurals; no overflow at +35%.
- RTL mirrored; light and dark verified.
- Keyboard and focus correct; AA contrast in both themes.
- Correct at 360/768/1024/1440.
- Lint clean (no hex, no physical classes, library components only).
- Glossary terms and status-matrix labels used; Arabic in MSA.
- Golden flows green; dead-end detector clean.
- Within the performance budget; no tokens in URLs; matches the role matrix.
- Visual baselines approved.

---

## Phase E: the missing SaaS core (ADM new app, USR grown from SOS)

- **Why a new ADM app:** it is a cross-tenant staff back office with mandatory 2FA and 8 staff roles.
- **Why USR grows from SOS:** SOS already owns identity, launcher data and per-tool roles.
- **Sales stays a CRM.** Its plan, zone and coupon modules are reference material, then retired. Its zone/currency model conflicts with spec 03.

| Stage | Scope |
|---|---|
| **E0** (design-ahead, from Wave 2) | Information architecture, Figma, a platform mock (the spec-03 price resolver, the spec-06 state machines, seats with G-04 as a switch, coupons, tax labels) and OpenAPI contracts for the backend team |
| **E1** Catalog → trial | ADM-01, 03–15, 29 · USR-00, 02–06, 08 · flows F-01/02/04/11 |
| **E2** Pay and renew | USR-07, 09–15 · ADM-16–21, 23 · needs G-04 and G-12 |
| **E3** Serve and support | USR-16–27 · ADM-02, 22, 24–28, 30–33 · the permission matrix enforced |

**Shell v2** (workstream F) adds the workspace switcher, tool states, one banner slot by priority, entitlement gates (read-only, hard/soft limit, not subscribed, no access), and an audited read-only "View as" that replaces "Login as" with a token in the URL.

---

## Gap-analysis deliverable ("what we have vs what's correct")

**Sources, in order of precedence:**
1. Your decisions
2. PM answers
3. Spec 00–06 v1.0
4. The Requirements Document (Sep 22), once received
5. Program standards
6. Current app behaviour, as evidence only

When two sources contradict each other, the row gets status **Conflicts** and a question goes to the PM.

**Files:**
- `orgtik-program/gap-analysis/gap-matrix.csv` is the source of truth.
- `gap-analysis.md` is generated from it.
- An **Artifact page** (EN matrix plus an Egyptian-Arabic readout) is regenerated at every gate.

**Matrix columns:** Gap ID · Spec ID · type/area · requirement · priority · future owner (ADM/USR/CMS/Shell/tool/website) · current app/route · evidence · **status** (Exists-OK / Exists-flawed / Partial / Missing / Conflicts / Superseded) · issues · decision dependency · backlog ID/size/wave · last verified.

**Sections:** a summary with coverage percentages, a forward matrix (spec → app), a reverse matrix (routes with no spec), a conflict register, cross-cutting gaps, open questions, and a backlog by wave.

**How it's produced:** extract → inventory → map (read the code and walk the flow in the browser as the right identity) → rate with evidence → review with you → PM packet → frozen at a gate.

**Turning it into backlog:**
- Missing → Build item
- Partial or Exists-flawed → Fix item in that app's wave
- Conflicts → a question plus a blocked item
- Superseded → Retire or redirect item

---

## Governance

- **Decision log** (`decisions/D-###.md`). Proposed seeds:
  - D-009 Base UI
  - D-010 Arabic typeface
  - D-011 ADM new app, USR from SOS, sales CRM-only
  - D-012 build-time snapshot, no library on the website
  - D-013 EN pixel parity; paths, prerender and noindex removal decided separately
  - D-014 LocalizedField pattern
  - D-015 MSA register
  - D-016 Latin digits
  - D-017 no tokens in URLs
  - D-018 SOS chat retired in favour of Chats
  - D-019 ADM-27 delivered by the Website Manager
  - D-020 namespaced tokens plus the bridge
  - D-021 one chart library (recharts)
- **Glossary:** one concept, one term per language. Proposal: «باقة» is used only for Service package. Plan = خطة, Tier = مستوى الخطة, Bundle = حزمة أدوات, Custom plan = خطة مخصصة, Seat = مقعد, Workspace = مساحة عمل.
- **Unified status matrix:** one row per entity and state: 5 labels, tone token, icon, next states, primary action. It covers the derived tool state, subscription line, invoice, service request, ticket, CMS content and roadmap, plus the banner priority order. It ships once, as status keys plus `<StatusBadge entity state>`.
- **PM packets:** weekly, EN plus AR, at most 10 questions, each with options, a recommendation, a needed-by date and what it blocks. After 5 working days without an answer, only reversible items become "Assumed"; never money, tax or legal.
- **Upstream repos:** we work codemod-first, and deliver reviewable merge-request series (or patch bundles) once we have GitLab access, with a re-sync every 2 weeks.
- **Library releases:** a minor every 2 weeks, patches any time, and majors only at phase boundaries with codemods. Each Figma version matches an npm minor.

**RACI:**
- You are Accountable for program and design decisions.
- The PM is Accountable for business and spec decisions.
- The dev team is Accountable for registry/CI, upstream merges and credential rotation.
- I am Responsible for plans, audits, fix specs, library, migrations, mocks and QA.

---

## Verification (end to end)

| Layer | Check | Gate |
|---|---|---|
| Static | tsc, the lint plugin (ratchet), i18n key parity across 5 locales, ICU validity, secrets/token-in-URL scan | 0 errors per commit |
| Library | Storybook visual regression (light/dark × EN/AR/DE plus pseudo-long), axe, interaction tests, Vitest, contrast CI, Next 15/16 smoke apps | 0 unapproved diffs · 0 serious axe issues |
| Screens | A risk-weighted visual set per route (en·light·1440, ar·dark·1440, ar·light·360, de·dark·768, fr·light·1024, it·dark·360, pseudo·360) plus axe in en-light and ar-dark | Baselines approved by you |
| Flows | Playwright against local-dev per role, the dead-end detector, back-navigation | 100% green |
| Website | 117 shots plus states at 0 pixel diff (EN), DOM/heading/accessibility parity, the interaction suite, SEO head/sitemap/hreflang/redirect tests, performance within ±5% | Stop the line on any diff |
| CMS | A role × action E2E matrix, state tests via `?__fail`, RTL and dark screenshots, round-trip identity, and a **coverage report** (copy literals left in page files, routes missing an SEO record, images missing alt) | Every slice's E2E passes · coverage 100% at G2 |
| Performance | First-load JS ≤ ~200 KB gz per route, LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 (calibrated after the pilot) | A regression over 10% blocks |

## Top risks

| Risk | Mitigation |
|---|---|
| Scope (191 routes, ~61 new screens, a CMS) | Waves; prune superseded work (content's 23 routes, ~17 sales and ~9 SOS routes); codemods and shims; re-plan after the Files pilot. |
| 5 languages × 2 themes blows up QA | Exhaustive combinations only at component level; risk-weighted at screen level; pseudo-locales; native reviewers only at gates. |
| Radix and Base UI coexisting | The primitive is hidden behind the library API; the overlay-family rule; nested-overlay tests. |
| Website zero-visual-change rule | Parity harness on every pull request; pure-refactor extraction; no CSS edits; no library on the website. |
| The website's design keeps changing during the program | The drift protocol (D-031) on every move of `main`: discover, capture, diff, map to the content model, promote the baseline. S1 extracts the most stable pages first; a changed page is re-extracted. |
| Open spec decisions block ADM/USR | Ask in week 1 with defaults; parameterised mock (G-04 as a switch). |
| No real backend | Contract-first OpenAPI and one mutation seam per app. |
| Upstream divergence | Baselines, re-syncs, freeze windows, re-runnable codemods. |
| Arabic typography | Specimen review with native readers; `size-adjust`; script-aware tokens. |

Indicative size: roughly 45–65 team-weeks end to end, re-baselined at G1 and after the pilot. Gates matter more than dates.

---

## Open decisions (for you or the PM)

| # | Decision | My recommendation | Needed by |
|---|---|---|---|
| 1 | Arabic font | Noto Kufi Arabic, after the specimen review | G1a |
| 2 | Pills everywhere, including dense tables | Yes for buttons; 12px fields | G1a |
| 3 | Default theme | System | G1a |
| 4 | LocalizedField instead of the spec's side-by-side AR/EN (PM) | Tabs with completeness; EN+AR required, others fall back in the UI | P1 |
| 5 | Arabic register (PM) | MSA everywhere | P0 |
| 6 | Digits in Arabic | Latin 0–9 | P1 |
| 7 | de vs de-CH (PM) | de-CH formats | P1 |
| 8 | Website `AGENTS.md` update (owner) | Allow the data layer, locales and a forms flag | S1 |
| 9 | `/software` vs `/platform` | Keep `/software`; 301 `/platform` | S3 |
| 10 | Website search visibility | Keep `noindex` until content is approved | S3 |
| 11 | Website Arabic = mirrored layout; FR/IT added to the menu | Same design, mirrored; each locale shown when it goes public | S5 |
| 12 | Price mode and who edits numbers | Indicative; Admin + `pricing:edit` | S2 |
| 13 | Forms go live (privacy notice, retention, Sales hand-off) | Stay in preview until approved | S6 |
| 14 | Pricing-override colour: orange (spec) vs brand violet | Brand violet | E0 |
| 15 | Remove Chats' accent presets; replace "The Lit Room" | Yes, one brand | Chats wave |
| 16 | ADM new app, USR from SOS, sales CRM-only (PM) | Yes | W1 |
| 17 | Retire SOS chat in favour of Chats (PM) | Yes | W1 |

**PM packet #1:**
- Q-001: the Requirements Document (Sep 22).
- Upstream repo URLs and branches, plus merge-request access.
- `@orgtik` publish rights on sdk.orgtik.org.
- **Urgent credential rotation.**
- The tool catalogue: 8 tools in the spec vs 6 products on the website vs the suite apps.
- CHF vs zone currencies.
- Who reviews the DE/FR/IT/AR copy.
- G-04, G-12, G-18, G-21, G-24 and G-28, with defaults.

---

## First 10 working sessions after approval

| # | Output |
|---|---|
| 1 | `orgtik-program/` skeleton · git baselines for the 7 apps · hq branch · PM packet #1 drafted (EN+AR) for you to relay |
| 2 | local-dev readiness: boot matrix per identity, `/__reset`, `MOCK_NOW`, request log · readiness report |
| 3 | Spec register (~197 items) and permission matrix · `routes.csv` (191) · component inventory |
| 4 | Audit kit v0 (from hq's scripts) · baseline metrics for every app |
| 5 | Glossary v0 · status matrix v0 · decisions D-009…021 drafted · review with you |
| 6 | Website baseline at `30db536` (routes × widths, states, DOM snapshots) · parity harness v0 at 0 diffs against itself |
| 7 | Token extraction onto the 8 brand colours · light/dark semantic sets with a contrast table · type and radius inventory |
| 8 | Spikes: Base UI RTL keyboard behaviour, 3 Arabic fonts in both themes, `@source` self-registration, yalc with Turbopack |
| 9 | Full audit dry run on Files (inventory, route sweep, 3 flow walks) · gap matrix skeleton · P1 component scope |
| 10 | **G0** with you: glossary v1, status matrix v1, decisions, order, P1 scope → P1 kickoff |

## Critical files

- **Brand source:**
  - `orgtik-website/landing-directions/src/reference/site.css`
  - `…/reference/Home.jsx`, `Software.jsx`, `Services.jsx`
  - `…/reference/navigation.js`
  - `…/src/App.jsx`
  - `…/reference/CaseStudy.jsx`, `case-studies.js`, `case-study.css` (department case studies, `d76ee3b`)
  - `orgtik-website/ORGTIK.pdf` (p.3–16)
  - `orgtik-website/orgtik-website-ia.md` (the future CMS field lists at L591, 705, 752, 1183, 1371, 1523)
- **Patterns to lift:**
  - `somion-hr-dashboard-main/components/shared/Table/`
  - `sales-dashboardv2-main/components/ui/form/localized-text-form-element.tsx`
  - `somion-sos-frontend-main/components/ui/reusable-dialog.tsx`
- **To bridge or replace:**
  - `somion-hq/app/globals.css`, `tokens.json`, `DESIGN.md`
  - `somion-sos-frontend-main/node_modules/@somion/sos-bar/dist/*`
  - each app's `components/shared/SoSBarWrapper`
  - `local-dev/patch.js`
- **Mocks and identity:**
  - `local-dev/apps/content.js`
  - `local-dev/apps/content/seed/site.js`
  - `local-dev/apps/sos/{cms.js, roles.js}`
  - `local-dev/lib/identity.js`
  - `local-dev/config.js`, `server.js`
- **Audit tooling to generalise:** `somion-hq/{deadends.mjs, flows*.mjs, audit.mjs}`
- **Specs:** `OrgTik_00…06_*.docx`, especially 04 "Common patterns" and 05 USR-00.

## Amendments

### A1 — Website update `d76ee3b`: department case studies (2026-09-30)

**What changed on the website.** PR #26 (`c530b51`, merged as `d76ee3b`) turns every project detail page (`/work#/project/{slug}`, 5 pages) into a full case study:
- Three new files: `src/reference/CaseStudy.jsx` (939 lines), `case-studies.js` (590, all content and figures), `case-study.css` (1,896).
- `Work.jsx` now renders `<CaseStudy>`. The old one-line transformation, facts strip and "The story" block are gone.
- The owner's `AGENTS.md` gains a "Department case studies" rule: keep figures in the data file, and keep the visible sample-figure labels until approved results arrive. Its other rules are unchanged. The language selector is still UI-only, so D3 is still pending.

**Measured with the parity harness (D-031 protocol):** the routes are unchanged (50, same aliases). **17 of 150** captures differ from `pre-cms`:
- **15 are the change itself:** the five `/work#/project/{slug}` pages at 390, 768 and 1440.
  - The pages grow from about 5,100 to 9,400–10,900 px tall at 390 (from about 4,400 to 6,800–7,300 at 1440).
  - The project status ("Mock project.", "Concept preview.", …) moves out of the h1 into the header's tag list, next to category and sector. The h1 is now the title alone.
  - A case study therefore joins two sources. The project record in `Work.jsx` holds slug, title, category, sector, status, service and gallery. `case-studies.js` holds the brief and the department blocks. The Website Manager's `caseStudy` merges them into one entity, and S1's parity test checks both.
- **2 are harness noise, not website changes:** `/` at 1440 (1 px) and `/software` at 1440 (318K px).
  - A second capture of the same commit matches `pre-cms` on both.
  - `/services` flickered the same way between two captures of one commit.
  - The cause is the video heroes. The harness paused and seeked each video but didn't wait for the seek to finish, so a capture showed either the poster or frame 0. `tools/qa/lib/site.mjs` now waits for every seek to finish, and three captures in a row are now identical.
  - The official `d76ee3b` baseline is captured with the fixed harness. Against `pre-cms` it differs in 16 captures: the 15 case-study captures, and `/software` at 1440 (300K px). The Software difference is the fix itself: the video now always sits at frame 0, where `pre-cms` caught the poster. `Software.jsx` isn't in the PR.
- Every other page is identical to `pre-cms`: pixels, text, headings and accessibility tree.

**What the plan changes:**

| Area | Change |
|---|---|
| Baseline | The parity baseline follows the website's `main` (D-031). It moves from `30db536` to `d76ee3b`. The drift protocol runs on every change: update, discover, capture, diff, map, promote. |
| Content model | `caseStudy` = one shared brief + a department block set (D-032). The brief covers client, timeline, team, challenge, goal, role, headline result, and the section titles and intros. The block set is design journal, build log, runbook, performance report or service log. The field list per department is in D-032. |
| Governance | Figures and charts are `Provenance` claims. The website's "Sample figure" labels stay until `claims:approve` confirms real results (four-eyes). New glossary terms: *Case study* (never "Project" in the Website Manager) and *Sample figure*. |
| S1 extraction | Easier than planned for Work. `case-studies.js` is already a data module and imports as-is; no AST extraction is needed. About 35 UI strings in `CaseStudy.jsx` (section titles, chart labels, alt text) go to the strings codemod. The component's chart palette is design, so it stays in code. Work detail pages are the newest-changed pages, so S1 extracts them last (D-031). |
| S4 editors | Two editor types are added. The **series editor** covers chart points with a cutover or baseline, the funnel, channel mix, gauges, and before/after KPIs. The **palette editor** covers name + hex swatches. Each has a live preview in the department's style. |
| Design system | The website's new colours all fall within about 0.06 OKLab of tokens-v0 primitives, so no colour token changes. One addition: `--ot-font-mono` (the site's system mono stack), for IDs, codes and logs in the dashboards. The inventory has been re-run at `d76ee3b`: 69 new values, all from `case-study.css`. The site's chart violets (plum-500, 700, 800) confirm the sequential plum ramp planned for the chart kit. |
| IA document | `orgtik-website-ia.md` describes case studies as one P17 layout. The website now has one brief and five presentations. The Website Manager follows the website (D-031, D-032). |
| Arabic (S5) | `case-study.css` adds 21 physical-direction properties to the mirroring codemod's scope. The Arabic font rule holds: the case studies use Arial, Montserrat and system mono. |

### A2: The Website Manager comes first (2026-09-30, D-034)

The owner moved Phase 2 ahead:
- The Website Manager and mock API v2 start now, on @orgtik/ui 1.0.0-rc.2 (P1a and P1b complete, VS-1 green).
- The Figma library (deferred by the owner) and publishing ui 1.0 no longer gate it. The dashboard waves wait.

**Order:**
1. S0: shell, SSO, RBAC and no-access.
2. S1 on the CMS side: the v2 content model and a mock seeded from the website's current source (at d76ee3b, read-only, with case studies per D-032). The Work area's case-study editor comes early.
3. Connecting the website (S1 extraction, S3). This changes the website repo, so it waits for the owner's go-ahead and the AGENTS.md update (D3).

**Deviation:** the SEO role goes to Laila (u8) instead of a new user u17, so the other apps' seeds and today's audit baselines don't move.

### A3: Pages and Global modelled from the website's markup (2026-09-30)

- **How the seed reads the site:** `local-dev/apps/wm/seed/copy.mjs` parses each page component (`@babel/parser`, read-only) and takes every literal string as a copy slot, grouped by region: the site header, a `<section>` by its id, `closing` for the closing call to action, and the footer.
- **Marks:** inline marks such as `<em>` and styled `<span>`s stay in a slot as tags (`<m1>…</m1>`). Empty decor marks are dropped for editing, and the original text stays in the layout as `source`. The mock refuses a save whose marks differ from English (422 `marks_changed`), which keeps the zero-visual-change rule enforceable.
- **Page data:** class-field data is included where it is copy: Home's rotating words, services and FAQs; Services' stories; Software's flow, context and plan steps; About's journey and capabilities; Contact's topics and paths. Tuples become named objects, and the website's adapter maps them back.
- **Global:** comes from Home. It holds the header and menu, the footer (with its Explore and Start here links), the social networks and the process steps (shared by Home and Services).
  - Each page's differences from Home are recorded in the seed (`duplicates`). At d76ee3b these are the logo link's aria-label outside Home, and Software's "Build a software plan" anchor to `#plan-builder`.
  - **Closing CTAs** stay on their page, because each page has its own variant, rather than a Global list as first planned.
- **Home's software explorer** repeats the six software modules word for word. It is not a second copy: the adapter will read the Software modules.
- **Not modelled yet:** packages, bundles and plans (pricing, S2), legal documents and their versions (S7), roadmap items and ideas (S6), and sign-in messages built from data.

### A4: Strings, Legal, Roadmap and Ideas (2026-09-30)

- **Strings:** `seed/strings.mjs` reads every message a page builds in code (view-model labels, concatenations, template literals) as one message with numbered parts, e.g. "Showing {0} of {1}". Anything that is already page copy or modelled data is left out.
  - There are 403 messages, grouped per page, plus a group for shared components and a "Shared" group for messages that 3 or more pages use word for word.
  - Each group is split into blocks by where the messages sit in the source, and each message keeps its usage context.
  - Placeholders are enforced like marks (422 `marks_changed`). Turning the suffix plurals (`product{1}`) into ICU plurals is left for the S1 codemod.
- **Legal:** the three documents become versioned entries.
  - Approving and publishing need `legal:approve` on top of `content:approve`.
  - Publishing needs a new version number and an effective date (422 `legal_version`).
  - Every published version is kept unchanged, and `/v2/public/legal/:key/versions` returns them all.
  - Today's wording is the site's own placeholder, imported as 0.1 with no date.
- **Roadmap:** items are content with language-neutral status, period, year and progress. Status and period are keys (the site used labels as keys), and their labels come from the status matrix and the messages.
- **Ideas:** a moderation queue following the status matrix `roadmap_idea`.
  - Actions: publish, plan, start, ship (link required), decline and hide (reason required), and merge (target required; votes move to the target).
  - Permissions: `marketing:edit` to moderate, `marketing:view` to see.
  - The public list only shows moderated ideas.
  - Three pending samples are seeded, because the site's form sends nothing yet.
- **Library:** `useStatusLabel` was added. The DataTable scroller is now a focusable region when it overflows.

### A5: Pricing, Media and SEO (2026-09-30)

- **Pricing** comes in two entries, service pricing and software pricing, holding the numbers the website hard-codes today.
  - Services: packages, bundles, the builder's unit prices and its discount tiers.
  - Software: module prices, bundle discounts, contract-length discounts, plan options, quick bundles and support plans.
  - The seed checks the discount rules against the source text, so a change there fails loudly.
  - Words are copy. Numbers, switches and the price mode need `pricing:edit` (Admin and Approver).
  - Approving and publishing need the new `pricing:approve` (Admin only), which gives four eyes on prices. Keyed lists (modules, packages, contract lengths) can't be added to or reordered.
  - `/v2/admin/pricing` is now computed from the published software pricing.
- **Media:**
  - The library holds the 22 files in `public/assets`, plus uploads (15 MB; webp, png, jpeg, svg, mp4, webm).
  - Each file has a description per language, rights (holder required for licensed, stock or client files, plus an expiry) and a focal point, with crop previews.
  - Usage is worked out live from the entries, and from the page code (the hero video, logos, `logo-ph-N`, the favicon in `index.html`). A file in use can't be deleted (409 `in_use`).
  - Issues: no description, rights unknown, rights expiring within 30 days, not used. The black logo files and one more are unused.
- **SEO:**
  - A health checklist per page and entry: title missing, too long or duplicated; description missing, too short or too long; no social image; main image without a description. At seed time 0 of 45 are clean.
  - Redirects are seeded from `navigation.js`: 12 aliases, rewritten in the browser today. They are validated for format, wildcards, duplicates, covering a real page, chains and loops.
  - Indexing: search visibility (noindex today) can be changed only with `site:visibility`, a reason and an acknowledgement. The sitemap is built from the published entries, and `robots.txt` follows the visibility.
- **Library changes:**
  - DataTable: scrolling region (A4).
  - LocalizedField: the language names now carry their own direction.
  - `useStatusLabel` (A4).

### A6: S3 on the website, and Preview (2026-09-30, D-035)

- **Real addresses.** Every view the site renders from its URL fragment now has a real address, on the local branch `cms/connect` (never pushed):
  - `/services/{family}` and `/services/{family}/{service}`
  - `/software/{module}` and `/software/plans/{mode}/{duration}/{modules}`
  - `/work/{project}`, `/insights/{article}` and `/legal/{document}`
  - The pages keep their own view routes. `navigation.js` translates between the two (`routeHash()`, `setRoute()`, `pageOf()`).
  - Old `#/` links and the legacy aliases are rewritten on load. Back and forward move between views without a reload.
- **Head tags from the Website Manager.** `npm run build` runs `scripts/prerender-heads.mjs`:
  - Each of the 49 addresses gets its own HTML. Its head (title, description, robots, canonical, hreflang, OG/Twitter, JSON-LD) comes from its SEO record, with the site settings filling any gaps (`src/content/heads.js`).
  - The build also writes `404.html` (a real 404 showing the existing not-found view), `sitemap.xml` and `robots.txt`.
  - JSON-LD types: Organization and WebSite on Home; Service; SoftwareApplication; BlogPosting; CreativeWork; BreadcrumbList.
  - A full server render is still deferred, because the pages read the window's size. Only the head differs, and the body is the same.
- **Redirects at the host.**
  - `scripts/content-pull.mjs` also pulls the public site settings (new endpoint `/v2/public/site`), the redirects and `robots.txt`, and writes `vercel.json` from the redirects.
  - The seed redirects now point at the real addresses. `/services/…` and `/insights/…` were aliases before; they are real addresses now, so they need no redirect.
  - `/pricing/plans` stays browser-handled, because its query string becomes the address.
- **A published address that changes keeps working.**
  - Publishing a new slug creates a 301 from the old address.
  - Existing redirects are re-pointed (no chains), and a redirect away from the new address is removed.
  - A slug a sibling already uses is refused (`slug_taken`), and the editor says where the old address will redirect.
- **Preview** (Website Manager `/preview`, and a Preview button on every editor):
  - The real site shows the drafts at 390, 768 and 1440 wide, with a fit check per frame.
  - The site opens with `?preview` inside the frame, asks its parent for a token by postMessage, and reads `/v2/preview/entries/:type` with a `Preview <token>` header. The token lasts 30 minutes, is read-only, and never appears in an address (D-017).
  - Outside a frame, `?preview` does nothing.
- **Site settings** gain a default description (from `index.html`), the fallback for any page without its own.
- **Evidence** (`tools/audit-kit/flows`):
  - `site-paths.mjs` (7/7): 38 views, 14 aliases, back and forward, anchors, not-found.
  - `site-heads.mjs`: every address's head against its record; 301s and 404s; sitemap and robots against the Website Manager; a slug change end to end.
  - `wm-preview.mjs` (9/9).
  - The parity harness compares the dev server and the built site (`SITE_URL` + `tools/site/host.mjs`, which serves the build the way `vercel.json` says).

### A7: Website update `c8be7fe`: plans, cart, checkout and the CRM handoff (2026-10-03)

**What changed on the website** (12 commits, 2026-10-01, `d76ee3b..c8be7fe`; 168 files, +14.3k/−6.2k lines): a purchasing journey.
- New views `/plans` (bundles & pricing), `/cart` and `/checkout` (simulated payment, then a CRM handoff through `purchase-adapter.js`, the mock boundary; see the website's `PURCHASING.md`).
- Services and Software rewritten around shared purchasing components (`PurchaseUI`, `PurchaseControls`, `CommerceLayout`, `PurchasePlans`, `PurchaseCart`, `PurchaseCheckout`).
- The data moved out of the pages into **purchasing catalogs**: `service-catalog.js` (families and services), `software-catalog.js` (products, modes, terms), `purchase-catalog.js` (sample CHF prices in minor units, bundles, savings), `plan-ladder.js`. The owner's `AGENTS.md`: "`purchase-catalog.js` is the purchasing source of truth".
- The builders keep their state in the query (`?services=…&duration=…&terms=…`).
- Eight components from the superseded "one plan system" are no longer imported (`CartSummary`, `PlanCompare`, `PlanPicker`, `PlanPromises`, `ServiceDepartmentFilter`, `ServiceDuration`, `ServicePlanFilter`, `ServicePlanPrice`): left to the owner to remove.

**Measured (D-031 protocol):** 53 routes (+`/cart`, `/checkout`, `/plans`; the 14 aliases unchanged). `discover.mjs` now drops the builders' state keys, or every selection reads as a new page. New baseline `c8be7fe`, self-checked: 159/159 identical to `c8be7fe-r2`.

**Owner's choice (2026-10-03): re-sync now; prices stay in the website's catalogs.**

| Area | Change |
|---|---|
| `cms/connect` | Rebuilt on `c8be7fe` (the old branch kept as `cms/connect-d76ee3b`, local, never pushed): the content layer re-applied, then copy, messages and real addresses regenerated by the tools (559 copy slots, 540 message places; keys follow the new source), then S3 heads and S6 forms. Proof: content parity equal to `c8be7fe`; **159/159 identical to `c8be7fe`** on the dev server and on the build; `site-paths` 7/7, `site-heads` 6/6; the owner's purchasing tests 31/31. |
| Content model | Service families, services, software products and Pricing are **read-only mirrors** of the catalogs in the Website Manager (`managedIn`: the file). The mock refuses changes to their words, numbers and visibility (423 `managed_in_website`); their slugs and SEO are still edited in the Website Manager. Pricing mirrors `purchase-catalog.js` (packages, bundles, duration and count savings). ADM is still the future price authority (plan: Pricing). |
| Coverage | The purchasing views' words are the Website Manager's "Purchasing" entries (Global: 75 copy slots; Strings: `st_commerce`). `/plans`, `/cart`, `/checkout` are pages with an address and SEO (cart and checkout out of search). Exception to G2 "100%": the catalogs' own words (service and product names, capabilities, bundle names), which the cart must show identically; they move to the Website Manager when the purchasing design settles and ADM resolves prices. |
| Sales wave | The CRM side of the handoff (accounts, onboarding, payments, invoices; D-028) is the Sales session's to read before freezing Sales' plan/package/invoice routes. |
| S5 (Arabic) | Builds on the rebuilt `cms/connect`. The purchasing views add their CSS (`cart.css`, `commerce.css`, `purchase.css`, `plans.css`, …, ~5k lines) to the mirroring codemod's scope. |

### A8: S5 on the website: Arabic mirrored, per-language addresses (2026-10-03, D-036, D-037)

Built on the rebuilt `cms/connect` (A7), English proved unchanged at every step (159/159 identical to `c8be7fe`):
- **Mirroring** (5987d92): 103 stylesheet declarations and 175 inline style keys/values from left/right to start/end, by `tools/site/mirror.mjs` (centring stays physical).
- **Typeface** (3ca42a0): IBM Plex Sans Arabic as "OrgTik Arabic" with an Arabic-only `unicode-range`, first in every text stack (235); `:lang(ar)` with no letter-spacing and no forced capitals.
- **Addresses** (76e565f): `/ar/…`, `/de/…`, `/fr/…`, `/it/…` keep their language through every link; `<html lang dir>`; words from the language's published copy, else English; head tags and the prerender take the language once it is public. A language outside `publicLocales` (all but `en`) shows only in development and in a Website Manager preview; the build has no such address. Directional arrows and hover nudges follow the reading direction.
- **Review set** for the owner (D8): every route at `/ar/…`, 1440 and 390, `tools/qa/mirror-review.mjs`: 104/104 ar/rtl, no overflow, no errors; published as a private review page.

**Open:** D8 sign-off on the mirrored layout; who translates (PM packet); localized slugs come with translations; the ambient glows and tickers keep their direction unless the owner wants them turned.

### A9: Website update `3a66678`: production content, accounts, cart return, durations and checkout (2026-10-05)

**Owner's choice:** combine the latest repository updates with the existing Website Manager integration, language addresses and SEO. `origin/main` moves from `c8be7fe` to `3a6667876e960469e073eda26c08d633d64cf32a` (through PR #40). The combined work stays on the local `cms/connect` branch; it is not pushed or deployed. The former CMS head `76e565f` is preserved on `backup/cms-before-sync-20261005`, with local files and the original seed/tools backed up in `../orgtik-sync-backup-20261005`.

The website now removes placeholder testimonials, client logos, case narratives and roadmap activity; keeps the supplied OrgTik identity project; shares customer identity through `AccountControl`; preserves the incoming page when returning from cart; offers conditional synthetic Card, TWINT and PayPal test checkout; and uses the owner's two-step builders, shared-duration switch, pill selectors and naturally growing sticky summaries.

| Area | Adaptation |
|---|---|
| Website | Latest React pages reconnected to CMS data, copy and messages, preserving real and localized addresses, heads, preview loading and configurable contact delivery. Localized sign-up correctly detects its mode. New commerce styles and account controls retain Arabic mirroring. |
| Extraction | Seed and copy/message tools include `SiteHeader`, `AccountControl` and `PaymentDetails`. Compact pages/components can own an intro copy region. Optional DOM calls are excluded from message extraction so selectors stay in code. |
| Approved content | Roadmap and published ideas are empty. Projects without approved narratives stay in the project catalog without becoming case-study narratives (`narrativePublished: false`). The format labels are retained separately in global `gl_caseFormats`. No existing published language/content overrides were present to migrate. |
| Purchasing | Catalogs remain the read-only website authority. Test checkout, authentication and CRM provisioning remain simulations; forms retain their existing Website Manager configuration. |
| Baseline and proof | Fresh untouched repository baseline `repo-3a66678`, compared with `sync-3a66678`: **147/147 identical**, 49 routes × 390/768/1440, including pixels at threshold 0, text, headings and accessibility. Detail routes map to their equivalent legacy hash views on the untouched baseline. **34 adapters equal `3a66678`**. |
| Functional proof | Purchasing tests 39/39 distinct (the earlier 78 count invoked the same imported suite twice); real-path checks 7/7 (34 views, 95 aliases, navigation/history/anchors/not-found); all three test payment methods complete with mixed terms and cart Back preserved; account identity persists across client navigation and resets on refresh. Arabic purchasing/account routes pass at 320px without overflow. |
| Build and SEO | Formatting and production build pass. All 48 generated page heads match CMS records; five checked redirects are permanent; unknown/unpublished locale addresses are 404/noindex; sitemap has the same 43 URLs and robots rules as the CMS. |

Evidence: `audits/website/parity/diff-repo-3a66678-vs-sync-3a66678.md`, paired capture manifests, `../orgtik-sync-backup-20261005/journey/`, and the website's `qa/cms-sync-20261005/README.md`. The new comparison is the current D-031 baseline; public locale/translation sign-off remains as recorded in A8.

### A9 follow-up: restored sample Roadmap and CMS authoring (2026-10-05, D-047, D-048)

The approved specification is `plans/2026-10-05-website-3a66678-wm-followup.md`. The public Roadmap again renders its timeline, filters, details, moderated idea board, configurable submission and page-local preview votes. Six updates and seven public ideas are explicitly examples; three pending examples stay private. Roadmap extraction alone uses `c8be7fe`; all other source content remains pinned to `3a66678`. Eight permanent redirects cover the four deleted projects at both `/work/...` and `/projects/...`.

Blank articles, roadmap items and case studies use shared schema defaults. Blank cases select a department and its current format; explicit copies retain their department and reset to sample figures with their narrative disabled. Narratives require approved figures and an approver. Figure changes revoke draft approval and disable the draft narrative without changing the published version. This is enforced on save, restore, publication and scheduled publication.

Payment, account and older Home/Sign-in copy is connected to CMS messages, including lazy payment translations. Synthetic card examples use locked, numbered placeholders; selectors and generated IDs stay in code. Commerce uses the shared header labels. Account focus return uses stable attributes and the panel aligns correctly in RTL. Sign-up has its own metadata record, shared Sign-in body copy, noindex and no sitemap entry. Legal 0.2 retains 0.1 history. All five WM catalogs include the restored Roadmap, blank creation, narrative and placeholder explanations.

Verification and recovery instructions are in `audits/wm/followup/README.md`. The final purchasing suite has 42 distinct tests (39 existing plus three regressions); shared model rules have 12 tests. Unaffected dev and production captures each match 144/144 against `repo-3a66678`. The restored Roadmap has its own repeatable baseline. Existing flows now create fixtures through the API, run serially under `mock.lock()`, and restore mock data, website snapshot and host configuration in cleanup. Public locales remain English-only; production form activation, real voting, authentication, payments and CRM remain outside this local follow-up.

### A10: Plan v2, monorepo and Vercel; suite-wide review (2026-10-07, D-052 to D-055)

The old plan's work is delivered. From 2026-10-07 the program follows `plan-v2.md`: `orgtik-suite` on GitHub is the only source of truth (branch, pull request, Vercel preview, checks; D-052), the hosted mock keeps its data in sandboxes (D-053), `@orgtik/ui` is a workspace package (D-054), and the legacy apps retire (D-055). Its product work is a review of the suite as one product: 15 cross-app journeys, suite-wide heuristics, a hosted re-check of every app, the gap matrix re-verified, a benchmark per tool, and a ranked backlog that Yossef approves before new features are built. Decisions D-001 to D-048, the definition of done and the audit method are unchanged. The open 2026-10-06 work order (D-049 to D-051) is finished inside the monorepo first; its uncommitted work was carried over as recorded in `migration/m0-drift.md`.

### A11: Revised hosted-mock execution roadmap and prototype gate (2026-10-07, D-063 to D-066)

Yossef approved the revised roadmap, asked for parallel delivery and clarified that the result is a senior UI/UX-quality **prototype**. `plan-v2-execution.md` is now the maintained roadmap, using `C:/Users/yosse/.claude/plans/we-have-old-plan-quiet-turing.md` as its historical source. The execution roadmap takes precedence over stale setup/order/production-reset instructions in `plan-v2.md` or that external source. The earlier evidence and decisions remain historical records.

The release order remains **R0 → R1 → R2 → R3 → R4**, with prerequisites brought forward: purchased-seat quantity/proration in R0; workspace access, sessions, invitation reservations, renewal/failure/recovery and HR lifecycle in R1; usage/limits, invoice PDF, audit retrieval and functional mock 2FA before their R3 dependants. All 72 tool commitments remain registered, with shared implementations built once, deterministic mock behavior identified and live providers/media/regulatory submission visibly deferred (D-063).

Website offers retain 1/3/6/12-month terms, existing renewal choices and greater-of duration/item savings, calculated by the platform. The platform records a simulated paid order before account linking; browser totals/receipts cannot mint paid invoices (D-064). Automatic mock visitor-region detection uses Switzerland as fallback with controlled test overrides; signed-in customers use workspace billing context and no new country selector is introduced (D-065). Files use packaged sample bytes with persistent scoped metadata, references, comments and versions; whiteboards save structured drawing state and expose a Files record with seeded previews. Arbitrary binary uploads remain deferred (D-066). D-059 continues to map website-management purchases to a managed service rather than internal CMS access.

**Readiness remains open:** historical failures at `64cd6c5` were Linux mock auth `ECONNRESET` and binary HLS `.ts` artifact verification. At `53562b9` the integration owner reports fresh loopback dispatch/explicit 503 errors and byte-preserving packaged asset fixes, with local auth17/journal8/transport-artifact6, Linux CI checks, mock deploy and hosted smoke passing. Full hosted authentication/layout acceptance and library visual acceptance are still pending; no R0–R4 completion is claimed. Existing Redis, credentials and project configuration are recorded rather than recreated. Verify the complete hosted desktop/mobile gate before R0. Preserve PR #1's D-059 reconciliation, PR #3/work-order work and foundation/review ancestors; extract auth/deployment changes from PR #4 rather than merging its combined integration diff.

`backlog/release-packages.csv` tracks coherent package dependencies, ownership, runtime consumer tests, status and evidence separately from the original ranked backlog. One PR per package, one owner for shared APIs/library/shell, affected-only deployments (at most two concurrent), and serialized preview verification apply. Tests follow runtime consumers even where those apps need no deployment. Green CI and preview acceptance precede merge; production deploys validated `main`.

Prototype acceptance means complete persona task journeys, useful loading/empty/error/permission/read-only states, honest feedback, existing `@orgtik/ui`, five locale catalogs, Arabic RTL, light/dark and responsive checks, with website visual identity preserved. Final verification runs all 15 journeys on an isolated hosted deployment built from the release revision. Production checks are non-destructive: no business-data reset, clock advancement, account loss or historical invoice rewriting. D-055 removals wait for replacement acceptance; Vercel project deletion remains a separate explicit user decision. Public Arabic website launch stays deferred. Update gap/benchmark/backlog/readout evidence at closure; this amendment records approval, not completion of the releases.
