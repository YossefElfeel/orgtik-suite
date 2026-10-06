# Spike: Base UI in RTL (for D-009)

**Question.** D-009 proposes Base UI as the one primitive layer, with React Aria only for dates.
- Do Base UI's keyboard interactions follow the reading direction under `DirectionProvider`?
- Does focus return correctly from nested overlays?
- Can a React Aria date picker live inside a Base UI dialog, or does the plan's rule ("never nest overlays from different libraries") apply here too?

**Answer: 33 of 33 checks pass.** Base UI handles RTL, and React Aria's date picker works inside a Base UI dialog.

## Setup

Code: `../../orgtik-spikes/base-ui-rtl/`, with `@base-ui/react` 1.8.0, `react-aria-components` 1.21.1 and React 19.2.
- `src/main.jsx` renders every case in RTL, under `DirectionProvider direction="rtl"` and React Aria's `I18nProvider locale="ar-EG-u-nu-latn-ca-gregory"` (Arabic, Latin digits, Gregorian). LTR copies of the directional cases serve as the comparison.
- `test.mjs` drives the page with the keyboard in Chromium, the way a keyboard user would. It checks each behaviour against the WAI-ARIA Authoring Practices.

## Results

| Area | Checked | RTL | LTR |
|---|---|---|---|
| Tabs | The first tab sits on the reading-start side; the arrow toward reading-end moves to the next tab; the opposite arrow moves back | ArrowLeft → next | ArrowRight → next |
| Menu with a submenu | The submenu opens on the reading-end side with that arrow and closes with the other; focus returns to the submenu's trigger; Escape returns focus to the menu's trigger | opens left, ArrowLeft | opens right, ArrowRight |
| Slider | The minimum sits on the reading-start side; the arrow toward reading-end increases | min on the right, ArrowLeft +1 | min on the left, ArrowRight +1 |
| Nested dialogs | Focus moves into the dialog. Escape closes only the top one, and focus returns to the button that opened it, at each level. | pass | — |
| React Aria date picker inside a Base UI dialog | The calendar opens and the dialog stays open. Escape closes only the calendar. Clicking a day picks it and keeps the dialog open (no false "outside click"). | pass | — |
| React Aria calendar inside a Base UI popover, inside a Base UI dialog | Opens. ArrowLeft moves to the next day. Clicking a day keeps both layers open. Escape closes only the popover, and focus returns to its trigger. | pass | — |

## What it means

- **D-009 holds.** Base UI 1.8's direction handling is correct for the interactions that usually break in Arabic. The library doesn't need its own RTL keyboard code for them.
- **Dates:** both ways work. The recommendation is the **one-family** version: React Aria's `Calendar` (not an overlay) inside the library's Base UI `Popover`. The overlay stack, Escape order, animations and styling then stay in one library, and React Aria contributes only what it's best at: calendars, locale formats and date maths.
- **The nesting rule stays for Radix.** This spike shows Base UI and React Aria can share an overlay stack. It doesn't show that for Radix and Base UI, which is the combination the migration will hit (a Radix dialog holding a Base UI select). Until a Radix app's overlay family migrates, it migrates as a whole (plan, Phase 1).

## Not covered

- Screen readers (NVDA, VoiceOver, TalkBack): a manual check at the component tests in Phase 1.
- Firefox and Safari: the library's visual and interaction tests run them.
- Touch: dragging the slider and scrolling inside popovers on phones.
