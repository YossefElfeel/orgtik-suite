# Spikes: yalc with dev servers, and fonts shipped by the library

Code: `../../orgtik-spikes/source-registration/` (the stand-in `@orgtik/ui` and three consumers) and `../../orgtik-spikes/hmr/hmr-test.mjs`.

## yalc and dev servers

**Question.** While `@orgtik/ui` is being built, the real apps link it with yalc (D-006). Does a library change reach a running dev server without a restart, including a Tailwind class that didn't exist before?

**Answer: yes, on both Next versions, in about a second.**

With `yalc add @orgtik/ui`, the app's dependency becomes `file:.yalc/@orgtik/ui`, and `node_modules/@orgtik/ui` is a link into the project's own `.yalc` folder, which the dev server watches.

The test opened the page in a browser, then changed the component in the library (new text, plus a class no file had used), ran `yalc push` and waited:

| Consumer | After `yalc push` (1.8s) | New class in the CSS | How it arrived |
|---|---|---|---|
| Next 16.3, Turbopack dev | new text and letter-spacing within 1s | yes | automatic page reload |
| Next 15.5, webpack dev | new text and letter-spacing within 1s | yes | automatic page reload |

A change inside a package reloads the page rather than hot-swapping the component, which is expected for code outside the app. For library work, that's fine.

**For Phase 1:**
- Library developers run `pnpm build --watch` plus `yalc push` into the app they're checking.
- The apps' own repos never commit `.yalc` or `yalc.lock`: add both to each app's `.gitignore` in the first wave step.

## Fonts shipped by the library

**Question.** Can the library ship the brand fonts (Montserrat now, the Arabic face after D-010) and their loading, or must every app load them itself?

**Answer: the library can ship them, both ways, with the library installed as a normal copy in `node_modules` and no `transpilePackages` setting.**

| Route | Next 15.5 (webpack) | Next 16.3 (Turbopack) | Vite 8 |
|---|---|---|---|
| **A.** `next/font/local` called in the library (`@orgtik/ui/next/fonts`, shipped as source) | font emitted and preloaded; a size-matched Arial fallback generated (`size-adjust: 110.19%`) | same | not applicable |
| **B.** `@font-face` in the library's CSS, `url("./fonts/…")` relative to that file | font emitted, URL rewritten | same | same |

Route A is better for the Next apps. It preloads the font, and its generated fallback has matched metrics, so text doesn't jump when the font arrives. Route B is what Storybook and any non-Next host need.

**One catch:** with both routes active, Next emitted the same font twice under two names, so a page could download it twice. Each host uses exactly one route:
- `@orgtik/ui/next/fonts` for Next apps. The font's CSS variable feeds `--ot-font-display`.
- `@orgtik/ui/fonts.css` for everything else (Storybook, Vite tools).
- `@orgtik/ui/tailwind.css` keeps the tokens and `@source`, and no `@font-face`, so it's safe everywhere.

**For the Arabic face:** the same routes apply, restricted to Arabic characters. `next/font/local` accepts a `unicode-range` declaration, and `@font-face` takes it directly. Latin-only pages then never download it (plan, Typography).
