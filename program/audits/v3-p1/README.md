# V3 P1 — DS v2 foundations and ordinary-screen specimens

Owner instruction, 2026-10-09: “continue till finish.” P0 is merged through PR46/main `e82c1e9`. This package advances the adopted design direction and reviews its evidence locally without another intermediate approval pause. Online deployment stays paused.

## Implemented

- Low-chroma graphite surfaces/text, preserved `#6C3CAA` brand anchor/aubergine rail, five layered elevations, hybrid radii, spacing/content/z-index tokens and two density presets.
- Self-hosted IBM Plex Sans Latin/Latin-ext alongside Arabic and Montserrat, with the OFL license. Control heights 28/32/36/40, visible dark primary hover, press feedback, focus halo and reduced-motion-safe shimmer.
- Shared Toolbar; DataTable density/sticky header; PageHeader meta/tabs; live Tasks search/density at `/[locale]/my-tasks/lists`, actual HR leave Sheet at `/[locale]/attendance`, and Account Home with workspace context/new tool surfaces.
- Foundations v2 in Storybook, reviewed references and an explicit platform-pair refresh utility retaining renderer, pixel, text/layout/font guards.

## Verification

- `check-v2.mjs`: 46 neutral/brand/contrast checks; dark primary hover OKLab delta 0.0967. `check-viz.mjs` passes all eight series contrast and the first-four CVD separation gates.
- Three consuming apps: seven typecheck/catalog/build tasks pass; all five catalogs match. Sixteen retained UI auth/access/pagination regressions pass separately.
- [Ordinary specimens](report.json): 107 checks and 24 captures (Tasks/HR/Account × EN/AR × light/dark × 1440/390). Actual query search/density and HR Sheet are exercised; all captures have correct direction/theme, no document overflow, no critical/serious axe findings and no application runtime errors.
- Full Storybook update: 46 stories × six combinations = 276 renders, zero critical/serious or moderate/minor axe findings, console errors or overflow. The font-loading guard now checks Plex as well as Arabic/Montserrat.
- Forty-four enumerated Windows pairs match their new defaults exactly on the declared renderer, with hashes, text/layout and selected-font metadata refreshed together. No tolerance or mask changed; package CI remains an independent gate.
- The first Windows CI run has 258 exact/18 changed renders with 294 pixels wholly inside code annotations, no dimensions/text/layout/font changes and no axe/console/overflow findings. [The per-image review](windows-ci-review.json) reconciles the twelve typography pairs plus six new Foundation pairs from actual CI output. A new run is required; the failed run is not relabelled green.

The first setup attempted HR with the Tasks customer fixture, correctly receiving 403; HR uses its existing authorized OrgTik fixture. A transient local dependency-read failure interrupted Account startup, and a font request interrupted an earlier Storybook pass. Current-source serial reruns complete. Account checks use the selected workspace's actual name; an earlier timeout did not establish a product defect.

## Limits

These are real ordinary UI/mock specimens, not 72-feature or hosted acceptance. Account attention/activity and adaptive entry, shared Shell/notifications/search, ecosystem owner-domain handlers, remaining tool migrations and Tier B remain P2–P5 work. Existing website, session/journal internals and business records are unchanged. Prototype external mail/payment/AI/calls/signatures/regulatory behavior remains simulated or deferred.
