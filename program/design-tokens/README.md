# Design tokens v0 (session 7)

These are the raw material for `@orgtik/ui`'s tokens, built from the brand manual (ORGTIK.pdf p.8) and from what the new website actually uses. They're **proposed**; the visual language is decided at gate G1a. In Phase 1 they move into `orgtik-ui/packages/ui/tokens/` and generate CSS, TypeScript and the Figma variables (D-004, D-020).

| File | What it is | Made by |
|---|---|---|
| `inventory.md` / `.csv` | Every colour, type value, radius, shadow, easing, duration and breakpoint the website uses, with counts. Each colour is matched to its nearest brand colour. | `python tools/design_inventory.py` |
| `tokens.v0.json` | The tokens, in the W3C design tokens format: primitive ramps, semantic light and dark sets, radius, duration, easing, font stacks | `python tools/tokens_draft.py` |
| `contrast.md` | Every text and UI pair in both themes against WCAG 2.2. **76 of 76 pass.** | same |
| `swatches.csv` | Every ramp step with its OKLCH values and its contrast on white and on the site's night | same |

## What the website uses (from the inventory)

- **Colour:**
  - 201 distinct colours in 3,293 occurrences. 64% of them are exactly a brand or site base colour.
  - Most of the rest are lavender and mauve tints: the text colours on dark (`#CFC2DB`, `#B5A6C4`) and the accents (`#C9A0F3`, `#D4B7EC`).
  - There are about 20 slightly different translucent whites for lines and overlays (`#FFFFFF14`, `…12`, `…17`, `…2E`, …). They collapse into three line tokens.
- **Type:**
  - Headings are Montserrat; body text is **Arial** (159 uses).
  - Weights are mostly 600 and 500.
  - Text sizes are 12–18px, and big headings use `clamp()`.
  - Headings are tracked tight (`-.045em`); eyebrows are uppercase with wide tracking (`.16em`–`.24em`).
- **Shape:** the pill (`999px`, 246 uses) is the signature. Then circles, cards at 20–24px, and fields at 12–14px.
- **Motion:**
  - One easing dominates, `cubic-bezier(.22,1,.36,1)` (147 uses), with 300ms as the usual duration.
  - That's the website's pace. The dashboards use the shorter scale below, keeping the same easing.
- **Depth:** a violet glow (`#9458F4` at 28–55%) and deep plum-black drop shadows.
- **Breakpoints:** 700, 760, 900 and 1180px.

## How the ramps are built

Every brand colour and every colour the site leans on sits exactly on a step. The steps between are interpolated in OKLCH, so each ramp changes evenly to the eye.

| Ramp | Fixed steps | Source |
|---|---|---|
| plum | 950 `#190B25`, 800 `#3B1E59`, 600 `#6C3CAA`, 500 `#9458F4` | the manual |
| plum | 900 `#28123B` | the site's pill ink |
| plum | 300 `#C9A0F3`, 200 `#D4B7EC`, 100 `#EEE3F7` (the pill), 50 `#F6F1FA` | the site's lavenders |
| indigo | 950, 800, 600, 500 | the manual's four |
| mauve (neutrals) | the site's text and border colours | the website |
| night (dark surfaces) | `#0D0814`, `#120A1B`, `#1A0D27`, `#21132D` | the website |
| green, amber, red | red keeps the site's only error colours (`#A02544`, `#8A1F3A`) at 600 and 700 | generated on the same lightness curve as the others |

Plum 200 and 300 are closer in lightness than the other neighbours, because both are fixed by the site. That's a known unevenness, accepted so the site's colours stay exact.

## Semantic tokens

They follow the approved plan's table. The chrome (rail and sidebar) is plum in both themes.

The contrast work changed two things:

- **Controls get a stronger border than the site's lines.** The site's field border (`#FFFFFF2B` on `#0D0814`) is 1.58:1, below the 3:1 a control needs. `line-control` is `#FFFFFF66` (3.78:1) in dark and `#8E7FA0` in light.
- **Text on a status fill is its own token** (`success-on-solid`, …). The dark theme's fills are lighter, to stand out on dark surfaces, so their text turns dark; white on them would be 2.3–3.8:1.

Also confirmed: plum-500 `#9458F4` with white text is 4.23:1. It never carries small white text; it's for glows, accents and large type. The light theme's primary button, plum-600 `#6C3CAA` with white, is 7.33:1.

## Durations and radii

- **Durations** (dashboards): `instant` 90ms, `fast` 120ms, `base` 200ms, `slow` 300ms (the site's default), `reveal` 480ms. The easings are the site's two.
- **Radii:** `pill` 999px (buttons: the brand signature), `field` 12px, `card` 20px, `overlay` 16px, `panel` 24px.

## For G1a (open)

1. ~~The Arabic face~~: decided, IBM Plex Sans Arabic (D-010).
2. ~~Pills on every button~~: decided, yes (D-022).
3. The default theme: system (the plan's recommendation), or light.
4. The dark theme's status fills and their dark text: look at them in the specimen before approving.
