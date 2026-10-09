# Reviewed Windows 2025 reference pairs

These **50 explicitly enumerated images** reconcile system-font rasterization on the reviewed GitHub Windows renderer. The suite now has **276 default references**. Comparisons use pixelmatch threshold **0.1**, **zero changed pixels**, and **no masks**.

## Original reference review — 2026-10-07

The original source is commit `33bd33e35d176adc20f0beb9a65f26c78628d38e`, [CI run 37602899028](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37602899028), Windows Server 2025 build `10.0.26100`, runner image `windows-2025-vs2026` version `20260925.250.1`, Chromium `153.0.8010.12`, Cairo timezone, `en-US` browser locale, scale 1 and the fixed `2026-10-07T09:00:00.000Z` clock.

The corrected time-zone harness made the DateTime story exact. Residual differences cover seven stories: CalendarGrid month/week/many events, DataTable ready, Dates, semantic colors and type roles. Full review found **694 pixels total, 1–35 per image**, all inside glyphs `1`, `2`, `4`, `5` and `z` rendered by Arial or Cascadia Code. Every image has identical dimensions and unchanged component/style source. All 38 candidates reproduce across two CI runs at the unchanged comparison policy; the local Windows run still matches all 264 defaults exactly. Accessibility, console and overflow findings are zero.

`manifest.json` records the source/run/renderer, selected font metadata, dimensions, reviewed glyph evidence, default and candidate SHA-256 hashes, plus independent story text/control-state and pixel layout-anchor hashes. Changing an original paired reference invalidates the override until both are reviewed together. Corrupt/missing overrides fail. Changed text, layout or selected fonts fail independently of screenshot comparison.

Selection is **CI-only** and requires explicit `ORGTIK_VISUAL_REFERENCE_PROFILE=windows-2025-chromium-153` with the exact manifest renderer. Local checks use default references. An absent profile uses defaults; an unknown/requested mismatched profile fails clearly. The other 226 CI cases keep their default reference. New screenshots are never accepted automatically, and CI cannot use `--update`.

## Suite table refresh — 2026-10-09

The requested ten-row paging and distinct table headers intentionally change DataTable Ready, the pagination example, and the new specialized-table story. Their 18 default images were reviewed and updated; all 270 local renders then matched exactly with zero accessibility, console, or overflow findings.

[PR #45](https://github.com/YossefElfeel/orgtik-suite/pull/45) and [CI run 37853836926](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37853836926) provide the new Windows evidence at source merge revision `b91d73d7dc403b76a505f607e3f4797c8c914543` (head `e5608162b2e5ef15bff9336496e9ace0e44b4470`). Six existing DataTable pairs now match their updated defaults exactly. Six new specialized-table pairs differ by only 6 or 12 pixels at the two digit-1 vertical strokes of the page-11 button. The new pairs retain dimension, PNG hash, selected-font, text/control-state, and layout-anchor checks. The manifest records the refreshed provenance and exact reviewed pixel totals; the other 32 original pairs are unchanged.

These images are evidence from the reviewed run, not a bulk refresh. A browser/OS/font migration or an intentional change to a paired default requires a new bounded review; never relax tolerances to make it pass.

## DS v2 foundation refresh — 2026-10-09

The owner's “continue till finish” instruction authorizes proceeding through the design gates with evidence. P1 deliberately changes tokens, Plex fonts, control density and radius. All 276 defaults were captured with zero accessibility, console or overflow findings. The 44 enumerated pairs were then individually re-rendered on the exact declared Windows/Chromium/Cairo/locale/fixed-clock profile; each matched its new default pixel-for-pixel before the override, SHA-256, text/control-state, layout and selected-font metadata were updated together. `refresh-platform-references.mjs` refuses CI use, another renderer or a changed default render. Package CI independently validates these references; historical glyph-only reviews above remain history rather than evidence for the v2 styling.

The first P1 Windows run [37987861085](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37987861085), source `0636c3a`, retained 258 exact renders and found 18 small differences: 294 pixels total, 1–54 per image. Every changed pixel is inside the visible Cascadia Code annotations; dimensions, text/control state, layout anchors and selected fonts are unchanged. The six new Foundations v2 pairs each differ by four pixels at the digit-1 stroke of “100.” Twelve existing typography pairs and six new Foundation pairs were reconciled from the actual CI captures, bringing the enumerated total to 50. [The bounded review](../../../../program/audits/v3-p1/windows-ci-review.json) records each image. `reconcile-windows.mjs` verifies the renderer and these invariants before writing a pair; default references, threshold, zero-pixel rule and no-mask policy are preserved. The failed run remains failed history; a new CI run must pass.
