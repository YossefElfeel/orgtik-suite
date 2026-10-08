# A24 — account presentation and reusable UI controls

2026-10-08. [D-073](../decisions/D-073.md) continues with an SOS **Account presentation** route and three reusable library components: `UsageMeter`, `AuditLogTable`, and `TwoFactorScreens`. The components have five-language UI copy and inherit existing tokens, states and controls.

The account scene shows sample usage/limits, a clickable onboarding checklist, searchable activity with actor attribution, explicit simulated data export, and a fixed-code verification/setup/recovery screen. These use only client state. They do not change sign-in, workspace settings, stored onboarding, usage accounting or existing audit history. Team, ownership and billing screens remain the existing reference flows. Invoice PDF and multiple billing contacts remain pending.

[Local evidence](../audits/account-presentation/README.md) covers one flow with eight EN/AR light/dark desktop/mobile captures, 29 bounded checks, no overflow and zero axe critical findings. Account type/catalog/build and all 20 library consumer type/catalog tasks pass. Existing shared-library acceptance passes 264 unchanged renders, zero axe critical/serious findings, zero console/overflow/font mismatches and all 10 interaction checks. Independent review corrections align the exported usage with the selected scene and keep verification state separate per persona. CI is recorded upon completion. No backend/security test program or provider implementation was added.

The launcher’s printed SOS sign-in path is corrected to `/auth/login`: SOS selects language through a cookie, not a URL prefix. Existing resources and other local runs are unchanged. Vercel stays paused.

Prior package integration: [PR23](https://github.com/YossefElfeel/orgtik-suite/pull/23), source `57c5a89`, merged main `e5bdc59` after [CI37752957866](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37752957866) and deployment-pause configuration `37752957765` succeeded. Tasks remains partial tool delivery; [A23](amendment-A23.md) retains its original pending-CI snapshot as history.

The parallel Chats and Files increments merged through [PR24](https://github.com/YossefElfeel/orgtik-suite/pull/24) and [PR25](https://github.com/YossefElfeel/orgtik-suite/pull/25), validated main `81cfa8f`. Chats source `e88bd8c` passed CI `37754870035` / pause `37754869977`; Files source `58214c7` passed CI `37755120778` / pause `37755120491`. Their [Chats](../audits/chats-presentation/README.md) and [Files](../audits/files-presentation/README.md) evidence distinguishes local UI simulation from connected/backend behavior. HR and Sales are the next independent streams.

بالمصري: شاشة الحساب الجديدة فيها الاستخدام وخطوات البداية وسجل نشاط وملف بيانات تجريبي، ومعاها عرض تحقق بكود ثابت. كلها محاكاة UI فقط؛ تسجيل الدخول والبيانات الموجودة لا تتغير. الفريق والملكية والفوترة بنعيد استخدام شاشاتهم الموجودة، وباقي المميزات والرحلات لسه مفتوحة.
