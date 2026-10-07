# R0 hosted-mock prototype — implementation and verification readout

2026-10-07 · **Merged prototype code at main `0ba265e`; hosted release acceptance remains open.** The owner authorized code merges before hosted acceptance and explicitly paused Vercel deployment. Final work-order source`2364841` passed [CI37650247042](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37650247042) and merged as`0ba265e`; prior main CI37649449943 also succeeded. R1–R4 remain planned.

## الخلاصة بالمصري

كود R0 الأساسي والواجهات اتدمجوا في `main 0ba265e` بعد CI ناجح. الـ mock suite النهائي نجح في **١٤٨ فحص**. دليل المالية التاريخي فيه **٤٠٦ فحوص** على API generation أقدم، وبعده **٧٩ فحص recovery** على السلوك المعدّل؛ ده مش إعادة كاملة على نفس revision، والأرقام مش بتتجمع كقبول إضافي. Native Git مقفول لكل الـ ١٢ مشروع وworkflow النشر disabled بطلب المالك. مفيش نشر Vercel جديد، وقبول الـ ١٥ رحلة على نسخة منشورة لسه مفتوح. PR #3/work order اتدمج بعد التصالح وCI ناجح، وR1–R4 والـ ٧٢ التزام لسه مفتوحين.

## Behavior in merged prototype code

- Scheduled prices wait for `effectiveAt`; repricing respects affected cells, country overrides and stored per-tool capacity. Notices persist once and use the first real renewal after the notice window, including paid website terms.
- Checkout validates explicit seat purchases and calculates eligible bundle → coupon → proration/unused-period credit → regional tax. Website terms/future prepaid value are credited on subscription changes; invoice ledgers agree with payment totals. New workspaces keep currency unlocked until their first successful paid purchase.
- Held subscription quotes preserve the server-priced snapshot for at most **900 seconds**, shortened at the relevant paid-period boundary. Confirmation checks workspace/actor, request fingerprint, billing/membership/line context and plan availability. Optional `Idempotency-Key` recovers the same paid receipt after current owner/read-only guards; changed input conflicts and a removed owner cannot reuse it.
- The UI describes a lost payment response as an unknown outcome. It retains the original quote/body/nonce/workspace across reloads and blocks another payment while unresolved. A known decline remains editable; an expired first quote requires review of a fresh total. Another account cannot recover the original billing details or retry its payment.
- D-067 allocates full-term quote prices per tool without multiplying again by seats or inventing a split. Acceptance prepares workspace-private plans; successful checkout creates active lines. Accepted quotes cannot be silently requoted or exposed to another workspace.
- Public website quotes preserve four-term greater-of savings and resolved mock region/currency. Server-confirmed immutable payment precedes `{reference, claimToken}` linking. Client totals/receipts cannot mint paid invoices. D-059 website management creates a managed-service request without an internal WM entitlement.
- Full snapshots and fenced/CAS persistence protect stored financial results. Missing/failed historical replay returns 503. These remain persistent mock services, with live providers deferred.
- HR salary/bank/history amounts use the record currency, preserve zero and avoid invented currency fallback. Chats warns that drawings are unsaved; Files-backed board state remains R2 work. Suite rails, finance and website interfaces preserve the established design system, five suite locales, RTL and responsive states.

## Checks and their limits

Counts overlap; subset counts and successive UI runs must not be added as independent coverage. This records completed local/code CI evidence, not all-journey hosted acceptance.

| Check | Recorded result | Evidence / reproduction |
|---|---|---|
| Final complete mock suite | **148 passed** on source `2364841`: auth17 + journal8 + pricing20 + Node103 | [CI37650247042](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37650247042); `pnpm --filter orgtik-local-dev test` |
| Earlier R0 source proof | **141 passed** on source `3d13cc4` before seven work-order cases | [CI37647486335](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37647486335); historical checkpoint |
| R0/public endpoints | **24 R0 + 20 public offer cases**, subsets of final mock148 | `node --test mock/apps/admin/r0.test.js mock/apps/admin/website-offers.test.js` |
| Pricing/lifecycle/term cases | **20 / 4 / 3**, subsets of mock141 | Pricing examples, lifecycle and proration-term test files linked below |
| Persistence endpoints | **6**, subset of mock141 | `node --test mock/lib/platform-persistence-endpoints.test.js` |
| Packaging/tooling | Six artifact guards; **22 foundation tooling regressions** passed | [Foundation CI 37643491731](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37643491731); binary HLS/frozen-byte safeguards and corrected trace bases |
| Finance UI matrix | **Historical 406 checks / 57 captures** | [Evidence and limits](finance-clean-20261007/README.md), [report](finance-clean-20261007/finance-qa.json). API generation 1 predates held quotes/uncertainty correction; not a full rerun of the final revision. |
| Later recovery UI | **65 recovery + 14 edge checks** | [Evidence](checkout-recovery-20261007/README.md), [recovery report](checkout-recovery-20261007/recovery-qa.json), [edge report](checkout-recovery-20261007/edge-qa.json). Nine capture metadata entries; three representative tracked images. |
| Immediate HR/Chats/rail package | Affected five-app types/catalogs passed; owner reported 77 local checks before extraction | [Copy CI 37642637117](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37642637117). No separate browser report is invented. |
| Finance and website code checks | Passed on named source heads | [Finance CI 37644363153](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37644363153), [website CI 37642581278](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37642581278) |
| Generated API contract | **102 paths / 120 operations / 40 schemas**, current source | `node program/phase-e/openapi.mjs --check`; `--json` provides countable contract data |

Local runners use dedicated loopback fixtures, preserve existing accounts/invoices, and do not reset data or advance the shared clock. The artifact READMEs distinguish recorded execution from later packaging hashes. Inspect those qualifications before reproducing or citing the reports.

Source: [mock suite wiring](../../../mock/package.json), [pricing cases](../../../mock/apps/admin/pricing.test.js), [endpoint cases](../../../mock/apps/admin/r0.test.js), [term/prepaid cases](../../../mock/apps/admin/proration-terms.test.js), [public offers](../../../mock/apps/admin/website-offers.test.js), [persistence endpoints](../../../mock/lib/platform-persistence-endpoints.test.js), and [generated contract](../../phase-e/platform-api.yaml).

## Merged stack and historical readiness

Foundation PR #10 (`e1d01c3 → 1f3d662`, CI37643491731), review PR #11 (`a651010 → d4e3f4a`, CI37646536091), focused runtime PR #4 (`a9f628c → a1bc0b8`, CI37644928271) and D-059 PR #1 (`df09d5d → a1b01b1`, CI37646357048) landed before the core/UI packages. The original combined PR #4 integration diff was not merged as a shortcut; its focused runtime source is equivalent to repaired `4fea6a4`.

R0 backend [PR #6](https://github.com/YossefElfeel/orgtik-suite/pull/6) merged `e1216c6` from `3d13cc4`; copy [PR #9](https://github.com/YossefElfeel/orgtik-suite/pull/9) merged `ccccbcf` from `bb9fc84`; finance [PR #12](https://github.com/YossefElfeel/orgtik-suite/pull/12) merged `087db6e` from `c60c92e`; website [PR #7](https://github.com/YossefElfeel/orgtik-suite/pull/7) merged `998d821` from `03bf11c`. Their successful runs are named above.

[Historical verification 37611824291](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37611824291) passed test code `993248a` against older mock/SOS `33bd33e` and website `b35f55c`. [CI 37612798844](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37612798844) passed Linux, 264 strict Windows visual comparisons and interactions. The reviewed renderer pairs retain the zero-pixel policy. This proves those named earlier builds, not current R0 hosted acceptance.

Historical `64cd6c5` auth `ECONNRESET`/HLS failures were repaired after `53562b9`. Build-only runs37638044509/37639070714 initially passed byte verification while logging48 HLS TypeScript diagnostics; repository/project-base glob repair `4fea6a4` supersedes that limitation. The daily100 deployment limit was reached earlier. The current owner's explicit deployment pause applies independently of quota: native Git is disabled for all12 projects and workflow377190291 is disabled. No Vercel workflow run occurred after its disable.

**PR #3/work order is code-accepted and merged:** source`2364841 → main0ba265e5a2fd0e8ce4960467862283c2e7d585c8` passed [CI37650247042](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37650247042) (Linux5m58s; strict Windows library15m18s) and pause configuration37650247008. The three overlaps are resolved, preserving the newer server-paid adapter. All implementation PRs are now merged. The final log confirms **148**, including seven content/idea cases added to prior source3d13cc4’s141. The22 tooling tests are separate; website49+10 are unique cases whose consumer rerun does not double their coverage. Hosted acceptance remains open.

## Still required before release acceptance

- Keep line-ending normalization a separate package after the accepted PR #3/work order.
- When the owner authorizes deployment again, verify all15 journeys on an isolated hosted release revision, with consuming-app flows, EN/AR, light/dark, responsive/error/no-access/read-only states and website visual parity.
- Complete/verify authoritative workspace/tool isolation, usage and read-only enforcement, sessions, reservations and HR lifecycle through the planned shared foundations. Current R0 code does not complete those R1/R3 journeys.
- Verify deployed persistence outages/retries, historical invoices/accounts and pricing endpoints; production smoke remains non-destructive.
- Keep all72 commitments and R1–R4 planned. Live payments/providers, arbitrary uploads, live call media, regulatory submission and public Arabic website launch remain deferred.

The [maintained roadmap](../../plan-v2-execution.md), [package evidence register](../../backlog/release-packages.csv), [gap matrix](../../gap-analysis/gap-matrix.csv) and [Arabic readout](../suite-review/readout.html) separate implementation evidence from release acceptance.