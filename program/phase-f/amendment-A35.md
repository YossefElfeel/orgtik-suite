# A35 — owner-authorized Vercel prototype deployment

2026-10-08. The owner explicitly requested deployment, then approved four public prototype variables on the nine existing app projects. No billing, account-store or clock environment settings are changed. Native Git deployments remain disabled; the manual deployment workflow uses validated main, explicit existing-project keys and at most two concurrent builds. Retired Content and the owner's separate `orgtik-website` project are excluded.

The previously local presentation handler is packaged into the existing mock under `/presentation`. Its optional storage adapter uses a separate `orgtik:ui-presentation:v1:<sandbox>:<workspace>` namespace in the existing configured store; accounts, journals, invoices and the shared clock are never accessed by this adapter. The local launcher reuses the same handler. A client URL fix preserves this namespace prefix. Cold instances can share synthetic prototype records without configuring a new resource.

Deployment preparation retains existing protected backend/session modules. Local hosted-handler smoke checks isolated cross-instance records; existing20 artifact/runtime regressions pass and runtime source manifest/contracts remain current. Production baseline:20 GET endpoints reachable, current business clock uses real time. Post-deployment verification is non-destructive GET/auth/shell checking; preview reset/clock/golden runners are not run against production.

Deployment and hosted acceptance are pending this preparation commit's CI. The owner-authorized environment change was explicitly approved after automatic review rejected the earlier general-deployment authorization as insufficient for nine-project configuration. No rejected action was executed before that approval.
