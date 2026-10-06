# P1 component scope: what `@orgtik/ui` builds first

Drafted in session 9; **approved at G0 as written (D-030)**. It sets the order in which the library's components are built.

**Inputs:**
- how the seven dashboards use their local primitives today (`audits/inventory/summary.json`: apps × import sites)
- the controls the specs need
- the VS-1 slice that proves the library before 1.0: SOS sign-in → the shell → the Files list, passing the screen definition of done in 5 languages × 2 themes

## How every component is built

- **API:** shadcn-like, with Base UI underneath (D-009, confirmed by the spike). Dates use React Aria's calendar inside the library's Base UI popover.
- **Built-in states:** loading, disabled, invalid, read-only and empty are variants of the component, not left to each screen.
- **RTL and both themes from the start:** logical properties only, and icons that point somewhere mirror. Tokens v0 are the only source of colour, type, radius and motion.
- **Done means:**
  - Storybook stories, and visual tests on 6 theme × direction combinations, plus a +35% pseudo-locale.
  - axe on each combination.
  - Keyboard tests in RTL and LTR, like the spike's.
  - Usage docs.
- **Shims keep today's import paths working** (`@/components/ui/button` and the rest), so the ~1,964 existing imports move without edits. Old variant names map onto the library's, for example shadcn's `destructive` → `danger`.

## P1a: the VS-1 slice (first)

| Component | Replaces today | Apps · import sites | Base UI part | Notes |
|---|---|---|---|---|
| Button (primary, secondary, ghost, danger, link, **brand** pill with arrow chip) | `button` | 7 · 569 | — | The brand pill is the signature; its arrow chip mirrors in RTL |
| IconButton | icon-only `button` | (inside the 569) | — | Its label is required by the type. The Files audit found 91 unnamed buttons. |
| Field (label, help text, error) + `createRHFField` adapter | `form`, `label` | 7 · 428 + 35 | Field | The `form` shim keeps react-hook-form's `FormField`/`FormItem` API |
| Input, PasswordInput | `input` | 7 · 99 | Input | Email, URL and number inputs stay LTR inside RTL |
| Checkbox, Switch | `checkbox`, `switch` | 7 · 38, 7 · 27 | Checkbox, Switch | |
| Select | `select` | 6 · 29 | Select | |
| Dialog + **ConfirmDialog** | `dialog`, `reusable-dialog` | 7 · 97, 4 · 22 | Dialog, AlertDialog | ConfirmDialog requires `impact` ("Used on 3 published pages"). Delete, Remove and Archive wording follows the glossary. |
| Sheet (drawer) | `sheet` | 7 · 17 | Dialog | |
| Menu | `dropdown-menu`, `context-menu` | 6 · 40, 3 · 2 | Menu, ContextMenu | Submenus open toward reading-end: spike-verified |
| Popover, Tooltip | `popover`, `tooltip` | 7 · 54, 6 · 13 | Popover, Tooltip | No hover-only actions |
| Badge, **StatusBadge** | `badge` | 7 · 113 | — | StatusBadge takes `entity` + `state` and reads label, tone and icon from the status matrix |
| Avatar | `avatar` | 7 · 59 | Avatar | Chats has its own (33 sites); it migrates in the Chats wave |
| Card | `card` | 6 · 59 | — | Cards by role only, not around every block |
| Skeleton, Spinner | `skeleton` | 6 · 43 | — | |
| Toast | `sonner` | 6 · 3 | — | Success only after a 2xx response |
| Tabs | `tabs` | 4 · 33 | Tabs | Spike-verified in RTL |
| Pagination | `pagination` | 6 · 10 | — | 25/50/100 rows. Four implementations exist today in the content app alone. |
| Breadcrumb, PageHeader | local headers | — | — | Breadcrumbs come from the route registry |
| Empty, Error, NoPermission, Loading, `ListStates` | ad hoc per screen | — | — | Every list's missing states (audit code MS) |
| **DataTable** (server or client mode, sort, selection, states) | hr's `Table`, local tables | — | — | Lifts HR's behaviour, not its styles |
| **SuiteShell** (rail, launcher, sidebar, TopBar, UserMenu with theme and language), **BannerRegion**, Logo | SoSBar, each app's layout | 8 apps | — | The sidebar goes on the right in RTL. BannerRegion shows one banner at a time, by the status matrix's priority. |

## P1b: the rest of Tier 1

| Component | Replaces or serves | Apps · sites | Notes |
|---|---|---|---|
| Textarea | `textarea` | 7 · 27 | |
| RadioGroup, SegmentedControl | `radio-group` | 5 · 8 | The active option exposes `aria-pressed`/`aria-checked`. The Files audit found 5 that don't. |
| Accordion, Collapsible | `accordion`, `collapsible` | 3 · 9, 5 · 3 | |
| ScrollArea, Separator | `scroll-area`, `separator` | 4 · 6, 2 · 3 | |
| Combobox, **MultiSelect** | `command` (3 · 4), ad hoc | — | For the spec's multi-choice fields |
| **NumberField, MoneyField, PercentField** | ad hoc inputs | — | For the spec's prices, seats and discounts. Money uses ISO minor units (KWD 3, SAR 2); Latin digits (D-016). |
| **LocalizedField** | sales' localized fields | — | Tabs with completeness badges, per D-014 |
| **Calendar, DatePicker, DateRangePicker** | `calendar` | 6 · 9 | React Aria calendar in a Base UI popover: spike-verified |
| Progress, Meter, **LimitMeter** | `progress` | 2 · 3 | LimitMeter's states: OK / 80% / Full / Over (spec) |
| Tag, FilterChips | ad hoc | — | |
| FileField | Files' upload | — | |

## Later (Tier 2 and 3, library 1.x)

- The chart kit on recharts 3 (D-021). `chart` is in 5 apps with 12 sites.
- RichText, on constrained Tiptap 3.
- OtpField, Stepper, AuditTrail, CopyField, Countdown, the PriceGrid cells, TagInput, CommandPalette.
- ToolState: the shell's seven tool states, once shell v2 needs them.

## Not in P1

- Chats' own component set (`Primitives`, `Overlays`, 960 inline styles) moves in the Chats wave, through one token bridge.
- The website doesn't adopt the library (D-012).

## Approved at G0 (D-030)

1. The P1a list as the VS-1 slice: nothing else ships before VS-1 passes.
2. StatusBadge, ConfirmDialog, DataTable and SuiteShell in P1a, even though they're bigger than the rest. Every screen of the pilot needs them.
3. P1b in the order above, unless the Files pilot shows a gap.
