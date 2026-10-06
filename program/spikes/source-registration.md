# Spike: self-registering `@source`

**Question.** Tailwind v4 only generates the utilities it finds in its sources, and by default it doesn't look in `node_modules`. `@somion/sos-bar` falls into that trap today: its classes only exist in the one app that happens to scan it (hq). Can `@orgtik/ui` register itself, so that each app adds exactly one line, `@import "@orgtik/ui/tailwind.css"`, and gets the library's classes and tokens?

**Answer: yes, everywhere we need it.**

## Setup

Code: `../../orgtik-spikes/source-registration/`.

- `ui/` is a stand-in for `@orgtik/ui`:
  - `dist/index.js` is one component using two classes that appear nowhere else: `bg-ot-brand` (from a token) and `tracking-[0.0123em]` (an arbitrary value).
  - `tailwind.css` holds `@source "./dist";` (relative to that file) and `@theme { --color-ot-brand: … }`.
- It's installed into each consumer as a packed tarball (`npm pack`), the way the registry delivers it: a copy in `node_modules`, not a link.
- Each consumer's CSS is exactly:

```css
@import "tailwindcss";
@import "@orgtik/ui/tailwind.css";
```

## Result

| Consumer | Build | Dev server |
|---|---|---|
| Next 15.5.26, webpack | both classes generated | both classes generated |
| Next 15.5.26, Turbopack (`next build --turbopack`) | both classes generated | — |
| Next 16.3.7, Turbopack | both classes generated | both classes generated |
| Vite 8.3.1 with `@tailwindcss/vite` | both classes generated | — |

The token also arrives: `.bg-ot-brand{background-color:var(--color-ot-brand)}`, with `--color-ot-brand` defined.

## What it means for Phase 1

- The `@orgtik/ui/tailwind.css` entry carries `@source "./dist";` plus the tokens and theme. Apps never list the library in their own `@source`.
- `@source` paths resolve relative to the file that contains them, even when that file is imported from a package in `node_modules`. The library can therefore move its build folder without asking every app to change.
- Storybook (Vite) and the Vite-based tools get the same behaviour.
- The same fix applies to `@somion/sos-bar` while it lives (plan stage A): one `@source` line in each app that uses it, until the library's own `AppLauncher` replaces it.

Tested 2026-09-30 with tailwindcss and @tailwindcss/postcss 4.3.3, React 19.2.
