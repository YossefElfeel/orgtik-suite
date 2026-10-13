# Local prototype gap roadmap implementation

Base: GitHub main `72a68708bf0f500f35b6c6f9b29f453969a83b1c`, rechecked on 2026-10-14. Branch: `feat/local-gap-roadmap`. The owner approved the roadmap on October 13 and authorized one PR, merge and hosted mock deployment on October 14.

## Delivered behavior

- Account Home is always available from the rail. Unavailable tools expose trial/access-request/workspace actions, invitation return paths are preserved, and Files-only onboarding omits Tasks. All six tool cards use the launcher's matching Phosphor icons.
- HR employee section edits open the existing wizard at the correct step. Employee errors distinguish failed loading, forbidden access and missing records. Payroll loan applications use the selected employee's active loan and balance; removing an application sets its applied amount to zero and preserves the loan obligation. Failed row saves stay editable. HR also has a daily overview and configured text/number/date/selection employee fields.
- CRM contact edit validation accepts the same optional fields as creation. Stage follow-up recipes use current CRM visibility and destination permissions, create Tasks and notifications once, and retain blocked outcomes for retry. CRM still owns contacts and service catalogs.
- Console catalog and Marketing UTM drafts survive selection changes and reloads with actor/workspace scoping. Publishing and save results are visible. Console readiness, tax empty states, connection descriptions and pay-link results are clearer.
- Eligible owners can enter the existing simulated payment flow directly from an open invoice. Issued invoice snapshots and payment recovery contracts remain unchanged.
- The approvals inbox combines current HR/Marketing approvals and workspace access requests with links to their source. Workspace settings include logo/default language/time zone; support tickets retain Files references. Source file permissions are checked on reads.
- Tasks supports rich descriptions, subtask assignment/dates, board column ordering and team/member/bookmark management. Unsupported binary controls were removed from team forms; Files remains the attachment owner.
- Local selected-file upload stores scoped binary assets and immutable references under the ignored mock data directory. Protected image/PDF/text previews and downloads reuse Files authorization. The capability is hidden outside the local file-backed prototype.
- Marketing segments combine canonical CRM tags, stage and actual simulated-delivery receipts with an audience preview. Unknown legacy memberships are not presented as invented matching counts.
- Chats keeps scoped unsent drafts, exports channel history and offers a multilingual searchable emoji list. Polling pauses in hidden tabs and prevents overlapping refreshes. Generated CSS names were replaced with readable names and logical direction properties.
- WM translation choices omit structural identifiers/assets, releases have search and a visible 20-item limit, and WM/Console have loading/error/not-found boundaries. Website language changes navigate, sign-in/sign-up preserve shopping intent, summary text wraps and removed refs are guarded.

## Engineering and verification

- All nine app type checks and all five message catalogs passed. All nine frontends and the website built in prebuilt local preview mode.
- Shared lint checks 1,979 active-app files with zero new diagnostics. The 340 existing diagnostics from main are explicit in `tools/ci/lint-baseline.json`; this is not a claim that legacy source is lint-clean.
- The full mock run covered 334 tests: 318 passed initially. Its 15 HR fixture failures were caused by the fixture manifest missing the new CSV dependency; all 15 passed after that declaration was added. The remaining concurrent-save failure occurred at disk exhaustion and passed on isolated rerun after cache cleanup. The new workflow/extension, session/router and service checks also passed.
- Owned module manifest and 990 API contracts match; 46 design-token checks and chart palette checks passed. The tracked source secret scan passed.
- Local preview and CI browser journeys verify Mona, tool icons, handoff paths, a team form retaining a failed save, Arabic mobile overflow, and a single-tool owner's Home link. The broader local visual matrix covers nine home surfaces in English/Arabic, both themes and mobile/tablet/desktop widths. Screenshot review and cloud verification are release checks; their final results are appended below.

## Performance evidence

HTTP measurements on the same isolated origin `127.0.0.1:3057`:

| Measurement | Development | Prebuilt preview |
| --- | ---: | ---: |
| First measured HR document | 13,731 ms | 1,123 ms |
| First measured Tasks document | 44,970 ms | 2,308 ms |
| Median warm HR document | 748 ms | 45 ms |
| Median warm Tasks document | 797 ms | 36 ms |
| Median warm public API | 106 ms | 51 ms |

Preview router startup was 2,365 ms and router RSS approximately 83 MiB at measurement time. These are HTTP timings, not complete browser hydration timings; router memory excludes frontend processes. The initial development startup was not instrumented, so no startup comparison is claimed.

Builds are serial; temporary compiler caches are removed after completion. A disk-space failure was resolved by removing only this worktree's interrupted dependency copy and disposable caches. Source, local data and the order-signing key were preserved. Use [the consolidated local guide](local-prototype.md).

## Review limits and legacy scope

The historical October 13 UX report is retained unchanged. Its 37 open findings have corresponding source repairs in this branch; the new matrix is representative validation, not a new audit of every screen and every state. Financial, source-access, session and replay regressions are reused.

Duplicated CSV implementations and opaque Chats CSS were cleaned up. Content seed data remains a WM dependency, and several apps still import legacy identity/logout contracts. D-055 removals requiring those migrations are not falsely marked as completed; replacement redirects remain. Existing financial records and country-specific production policies are preserved. The [future production roadmap](production-saas-roadmap.md) remains outside this prototype release.

## Release record

Local browser journeys passed on 2026-10-14, including the loaded 36-view matrix. Reserved ephemeral ports are rejected before starting Next; the discovered Chats startup failure has a focused regression. PR #84 passed source checks and customer/staff journeys. The library run rendered 366 combinations with zero accessibility, console or overflow findings; 24 intentional sidebar label-wrap changes were reviewed and re-rendered locally. All 24 local images match the CI candidates exactly, with changed pixels confined to the rail; their default references were updated. Merge and hosted verification remain the release steps.
