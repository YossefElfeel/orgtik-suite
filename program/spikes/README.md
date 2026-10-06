# Spikes (P0 session 8)

Short experiments that answer an architecture question before Phase 1 builds on the answer. The code lives outside the program repo, in `../orgtik-spikes/`, and is throwaway. The results are recorded here.

| Spike | Question | Result |
|---|---|---|
| [Self-registering `@source`](source-registration.md) | Can `@orgtik/ui` make Tailwind generate its own classes, so an app adds one CSS line and nothing else? | **Yes.** Works in Next 15.5 (webpack and Turbopack), Next 16.3 (Turbopack) and Vite 8, in builds and in dev servers, with the library installed like a registry package |
| [Base UI in RTL](base-ui-rtl.md) | Do Base UI's keyboard interactions follow the reading direction under `DirectionProvider`, and does focus return correctly from nested overlays? Can a React Aria date picker live inside a Base UI dialog? | **Yes, 33 of 33 checks.** Tabs, submenus and the slider follow RTL; Escape and focus return work across nested dialogs; React Aria's date picker works inside a Base UI dialog. Recommended: React Aria's calendar inside a Base UI popover, so overlays stay in one library |
| [yalc and dev servers](yalc-and-fonts.md) | Does a library change reach a running Next dev server, including new Tailwind classes, through yalc? | **Yes.** Next 16 (Turbopack) and Next 15 (webpack) pick it up about 1s after `yalc push`, new classes included, with an automatic page reload |
| [Fonts from the library](yalc-and-fonts.md) | Can the library ship the fonts and their loading, or must each app load them? | **Yes, both ways.** `next/font` inside the library works on Next 15 and 16 (preload, size-matched fallback), and `@font-face` in its CSS works on Next and Vite. Each host uses one route, to avoid a double download |
| Arabic typefaces | Which Arabic face pairs with Montserrat (D-010)? | The specimen is published for review: https://claude.ai/artifact/7hp3zuDCpknVZvzuThLZZn |
