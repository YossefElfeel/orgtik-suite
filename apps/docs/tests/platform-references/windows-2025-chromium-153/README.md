# Reviewed Windows 2025 reference pairs

These **38 explicitly enumerated images** reconcile system-font rasterization on the reviewed GitHub Windows renderer. All **264 default references remain unchanged**. Comparisons still use pixelmatch threshold **0.1**, **zero changed pixels**, and **no masks**.

The source is commit `33bd33e35d176adc20f0beb9a65f26c78628d38e`, [CI run 37602899028](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37602899028), Windows Server 2025 build `10.0.26100`, runner image `windows-2025-vs2026` version `20260925.250.1`, Chromium `153.0.8010.12`, Cairo timezone, `en-US` browser locale, scale 1 and the fixed `2026-10-07T09:00:00.000Z` clock.

The corrected time-zone harness made the DateTime story exact. Residual differences cover seven stories: CalendarGrid month/week/many events, DataTable ready, Dates, semantic colors and type roles. Full review found **694 pixels total, 1–35 per image**, all inside glyphs `1`, `2`, `4`, `5` and `z` rendered by Arial or Cascadia Code. Every image has identical dimensions and unchanged component/style source. All 38 candidates reproduce across two CI runs at the unchanged comparison policy; the local Windows run still matches all 264 defaults exactly. Accessibility, console and overflow findings are zero.

`manifest.json` records the source/run/renderer, selected font metadata, dimensions, reviewed glyph evidence, default and candidate SHA-256 hashes, plus independent story text/control-state and pixel layout-anchor hashes. Changing an original paired reference invalidates the override until both are reviewed together. Corrupt/missing overrides fail. Changed text, layout or selected fonts fail independently of screenshot comparison.

Selection is **CI-only** and requires explicit `ORGTIK_VISUAL_REFERENCE_PROFILE=windows-2025-chromium-153` with the exact manifest renderer. Local checks use default references. An absent profile uses defaults; an unknown/requested mismatched profile fails clearly. The other 226 CI cases keep their default reference. New screenshots are never accepted automatically, and CI cannot use `--update`.

These images are evidence from the reviewed run, not a bulk refresh. A browser/OS/font migration or an intentional change to a paired default requires a new bounded review; never relax tolerances to make it pass.
