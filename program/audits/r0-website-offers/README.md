# Website offer adapter — local prototype evidence

The website reads the platform catalog matrix, requests a displayed server quote, confirms simulated payment through the platform, and links the immutable `{reference, claimToken}` order to the customer's workspace. Website Manager purchasing remains a managed service under D-059. Original terms, cart edits/Undo, payment choices, password setup and PR #5's website presentation remain in place.

## Verification and provenance

- The isolated PR checkout passes **49 cart/CMS tests** and **10 suite-session tests**, production build, Vercel configuration check, and the approved 19 pricing messages plus two commerce-slot regeneration checks. A read-only pull from the configured local CMS reports that the generated snapshot is current.
- The retained full browser report passed **66 checks** and generated 14 captures. It preceded the final first-explicit-4xx pending-attempt cleanup. The retained focused report passed **11 checks** with two captures and verifies that rejection/recovery boundary. Both used local mock services, unique guest references and accounts, plus the existing Nile Foods owner fixture.
- These browser runs did not record source hashes. `manifest.json` fingerprints the packaged source now; those hashes are **packaging provenance**, not retrospective proof of the original browser revision. The latest 49+10 tests exercise the packaged adapter, including both 403 recovery cases.
- Four inspected screenshots and the two unchanged original reports are tracked. Full capture metadata remains in each report; the other generated captures remain in their original local evidence directories and can be reproduced.
- No reset, clock advance, hosted action, live provider, saved password, session token or order claim is included in the reports. This is local prototype evidence, not a new hosted deployment or a public Arabic website launch.

The recorded CMS snapshot came from `http://localhost:4207/v2` at `2026-10-07T13:06:13.235Z`. Compared with the preserved PR #5 baseline, the content delta is exactly the 19-message `st_platformPricing` entry, the activation wording in `gl_commerce.purchaseCheckout-hero.p-5`, and the tax wording in `gl_commerce.purchaseCheckout-intro.p-3`, plus pull provenance. Seed regeneration now retains the same two approved slot values.

## Reproduce

Use the dedicated loopback `r0-local` mock sandbox with its clock configured externally to a frozen instant. Build this checkout with `VITE_SUITE_API=http://localhost:4200/api` and `VITE_SUITE_URL=http://localhost:3013`, and serve the build locally. Install the existing `program/tools/audit-kit` Playwright dependency if needed. From the repository root:

```powershell
$env:SUITE_ROOT = (Get-Location).Path
$env:WEBSITE_WEB = 'http://localhost:4173'
$env:WEBSITE_API = 'http://localhost:4200'
$env:WEBSITE_SOS = 'http://localhost:3013'
$env:WEBSITE_EVIDENCE_DIR = Join-Path $env:TEMP ('orgtik-website-full-' + [guid]::NewGuid().ToString('N'))
node program/audits/r0-website-offers/website-runner.cjs
$env:WEBSITE_EVIDENCE_DIR = Join-Path $env:TEMP ('orgtik-website-rejections-' + [guid]::NewGuid().ToString('N'))
node program/audits/r0-website-offers/website-runner.cjs --rejections
```

`WEBSITE_FIXTURE_PASSWORD` optionally overrides the documented mock fixture password. The portable runner retains the original browser flows and adds configurable paths, loopback/sandbox guards, safe reports and source fingerprints recorded before execution. Those packaging changes were syntax checked; the broad browser flows were not unnecessarily repeated during PR packaging. Each invocation creates local mock orders/accounts and may add one Files purchase to the Nile Foods workspace; it never resets data or changes the shared clock.
