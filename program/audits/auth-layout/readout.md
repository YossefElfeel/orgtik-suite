# Vercel account and shell milestone — 2026-10-07

## Implemented

- Keep normal email/password sign-in. Store identity and salted password hashes separately from
  the business journal; rehydrate identities before replay, preserving account IDs and ownership.
- Keep accounts on business-data resets. Hosted handoff codes expire after 60 seconds and are
  consumed atomically. SOS keeps refresh tokens; temporary outages retain valid sessions.
- Contain accessibility labels inside the positioned main scroller. The shell remains at viewport
  height and overflowing navigation scrolls independently, with existing Arabic direction/styles.
- Validate hosted URL conventions before builds. Production and preview use separate mock
  sandboxes. The existing free Frankfurt Redis resource is connected to both mock projects.
- Configure affected-project Actions deploys, at most two at a time, with saved URLs and checks.

## Verification

- Authentication: 12 cold-start/persistence/error checks passed using disposable local files.
- Journal: 8 regression checks passed. Pricing: 16 checks passed. Website: 42 checks passed.
- Affected workspace check: 22 tasks passed (typecheck, catalogs and tests).
- Production SOS build passed, including the changed handoff route.
- English desktop: document height equals the 720px viewport; Ctrl+End leaves shell top at 0.
- Arabic desktop at 1595×767: document height 767, width 1595, no outer scrolling or blank area.
- Arabic mobile at 390×844: document width 390, height 844; navigation opens correctly.
- Production demo reset was explicitly requested; all 16 seeded account IDs and sign-ins were
  checked before and after the reset. No service build/deployment ran for that reset.

## Delivery findings

- The first Windows prebuilt preview function could not resolve Express after upload. Keep
  production on its existing deployment until the Linux Actions preview passes.
- The library visual gate has 0 accessibility violations, console errors or width overflow.
  Calendar/control references were stale: the original source already has 144px month cells and
  disables Today when visible (confirmed in initial commit `0b8d924`). Reconcile only those
  reference images; the shell stories did not change visually.
- Existing PRs and branch history are retained. No additional external services are needed.

## Release gate

Deploy and verify account sign-in and the scrolling fix on Vercel before starting R0–R4. Preserve
production accounts and do not reset production data without a new explicit request.
