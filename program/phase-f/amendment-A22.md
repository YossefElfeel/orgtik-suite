# A22 — shared presentation controls

2026-10-08. The first UI increment under [A21](amendment-A21.md)/[D-073](../decisions/D-073.md) adds the shared Demo Panel to all nine existing `SuiteShell` hosts. It inherits OrgTik components, colors, typography and responsive shell behavior.

Presentation scene metadata, six visual states, local reset, language/theme controls and prototype/simulated labels now work. State projection reuses existing shared states; read-only locks custom surfaces as well as form controls. Theme controls synchronize through a small UI event. Actual sign-in, workspace data, permissions, clocks and persistent stores are unchanged. Persona/workspace mock adapters are the next layer; this increment does not claim that the selected persona owns the displayed existing data.

[Light evidence](../audits/demo-panel/README.md): one flow, eight EN/AR light/dark desktop/mobile captures, 27 bounded checks, shared build and 20 consuming-app type/catalog tasks. Existing shared-library visual/interaction acceptance and package CI are recorded separately when complete. Vercel remains paused.

P0 direction is maintained with 129 package IDs/72 commitments retained, 95 R2/R3/R4 delivery modes set to `ui_mock`, and 17 backend/hosted/normalization packages frozen with historical evidence. The isolated demo launcher, persona/workspace feature data adapters, remaining shared components, tool features and walkthrough guide remain unfinished.

Integration: [PR22](https://github.com/YossefElfeel/orgtik-suite/pull/22), source `466803f`, merged main `9827a72` after [CI37749884471](https://github.com/YossefElfeel/orgtik-suite/actions/runs/37749884471) and deployment-pause configuration `37749884339` succeeded, including Windows library visuals. [A23](amendment-A23.md) supplies the next launcher/Tasks increment; the pending list above describes this amendment's original scope.

بالمصري: أول نتيجة UI من الخطة الجديدة هي لوحة عرض مشتركة في التسع أدوات. الحالات الست واللغة والثيم وإعادة ضبط السيناريو بتشتغل، من غير تغيير للحسابات أو البيانات الموجودة. الشخصيات والمساحات هنا أوصاف للسيناريو لحد ربط بيانات كل ميزة. باقي الخطة لسه شغالين عليها، والنشر متوقف.
