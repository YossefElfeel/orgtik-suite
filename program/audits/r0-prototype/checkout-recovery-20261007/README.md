# Checkout recovery — local prototype evidence

The final recovery run `muy6ry59-ad886e` passed **65 checks** and generated seven captures. The edge run `muy6q5s6-3c426e` passed **14 checks** and generated two captures on 2026-10-07. Reports are preserved verbatim. Three inspected representative images are tracked; all nine capture metadata records remain in the JSON reports.

The server completed a simulated CHF120 payment before the browser lost its response. Reloading with a different plan/cycle address recovered the same server quote, request body, nonce, workspace and paid invoice. The invoice count increased exactly once. Billing name, card selection, cycle and coupon controls stayed locked; current owner permission remained required. Another authenticated account could not view the original billing/card/total or send a new payment. A known decline remained editable. A first expired quote required a new displayed quote and an explicit confirmation; unavailable session storage prevented sending any payment request.

English/Arabic, light/dark and 390/1440-pixel states passed without page overflow or runtime errors. Fixtures were newly registered local customers. No reset, shared-clock change, hosted action, real provider or saved authentication credential was used.

These runs exercised the primary workspace draft before this PR existed. The packaged source was copied byte-for-byte from that draft and typechecked here. `manifest.json` records packaging hashes, not retrospective run revisions. The earlier [406-check finance run](../finance-clean-20261007/README.md) predates held subscription quotes and the uncertainty correction; its results must not be represented as a full rerun of this PR or added to these checks as independent coverage. Hosted acceptance remains outstanding.

## Reproduce

Use a dedicated loopback mock sandbox named `r0-local`, externally configured to a frozen clock, with SOS at 3013 pointing to API4200. The existing audit-kit Playwright dependency must be installed. From the repository root:

```powershell
$env:SUITE_ROOT = (Get-Location).Path
node program/audits/r0-prototype/checkout-recovery-runner.cjs
node program/audits/r0-prototype/checkout-recovery-runner.cjs --edges
```

`RECOVERY_API` and `RECOVERY_WEB` override loopback HTTP origins. The runner checks its sandbox and clock before creating unique accounts/orders. It never resets data or advances the clock. Reports and new captures are written beneath the operating system's temporary directory. The portable copy changes only dependency/env paths and adds loopback/sandbox guards; assertions and flows are unchanged from the original recorded runner.

Recovery requires the original account and workspace with current owner permission. An unreadable record or an unresolved quote/context refusal directs the customer to invoice review rather than silently starting another attempt.
