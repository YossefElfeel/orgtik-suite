# Chats: design

Chats is OrgTik's chat, calls and virtual office. It uses the suite's design system, `@orgtik/ui`, and only HQ's own world — the office floor — keeps tokens of its own. This file replaces "The Lit Room" (DESIGN.md before the Chats wave) and `tokens.json`; both are in git history.

## Where things come from

| What | Source |
|---|---|
| Colour, type, radius, motion, light and dark themes | `@orgtik/ui` tokens (`--ot-*`), loaded by `app/globals.css` |
| Buttons, fields, dialogs, confirmations, badges, states, the suite shell | `@orgtik/ui` components; `components/ui/Primitives.tsx` and `Overlays.tsx` keep HQ's props on top of them |
| Language, direction, dates | The suite's `NEXT_LOCALE` cookie; `messages/<locale>.json`; `lib/time.ts` through Intl (Latin digits) |
| The office floor, furniture, daylight, presence, the data ramp | HQ's own tokens in `app/globals.css`, with a value for each theme |

## The bridge

Feature code reads HQ's semantic names (`--color-surface`, `--color-ink`, `--color-accent` …). Those names are kept and point at `--ot-*`, so the whole app follows the brand and the theme from one block in `app/globals.css`. Don't add raw colours to feature code: add a token there.

## Accent

The accent is the person's choice (D-046): **OrgTik** (the brand, the default), Rose, Orchid, Olive, Midnight or Graphite. A preset re-points seven brand steps; buttons, rings, the data ramp and the dark theme's lighter accent all derive from them.

## Presence

Six states, each with its own mark shape and label, so colour never works alone:

| State | Mark | Light | Dark |
|---|---|---|---|
| Available | solid | teal `#0c9083` | `#2dd4bf` |
| Busy | half | amber `#be7208` | amber-300 |
| Focus | ring | magenta `#be185d` | `#f472b6` |
| In a meeting | dot in a ring | blue `#2260e8` | `#7aa7ff` |
| Away | slash | mauve-500 | mauve-400 |
| Offline | hollow | mauve-600 | mauve-600 |

Focus moved off the brand violet in the Chats wave: it is 63° from the brand and 36° from the nearest preset.

## The floor

Rooms separate from the floor by value, not hue. Furniture is lit from above (top, body, side) and dims toward the night ramp in the dark theme. Daylight and window light are tints over the floor, never surfaces. Shadows use `--shadow-ink`, so they are warm plum in light and black in dark.

## Rules that keep it working

- **Text:** every visible string goes through `t(key, english)`. `node scripts/i18n-extract.mjs --check` fails on drift, and `node scripts/i18n-check.mjs ar de fr it` checks the translations.
- **Names:** people's, rooms' and channels' names are workspace content. Wrap them in `<bdi>`, and give message bodies `dir="auto"`, so they read right inside Arabic.
- **Direction:** use logical properties and classes only (`ms`, `pe`, `start`, `inset-inline-end`). Directional icons carry `rtl:-scale-x-100`.
- **Quiet mode:** `?__quiet=1` holds the simulator still for tests (`lib/quiet.ts`).
