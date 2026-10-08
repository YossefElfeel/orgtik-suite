# A21 — presentation plan adopted after CMS completion

2026-10-08. Source: `C:/Users/yosse/.claude/plans/make-a-plan-as-splendid-crown.md`. The owner designated this as the next plan after CMS. CMS alignment and publishing now pass local acceptance and CI, and PR20/21 are merged into main `9bd6011092ed8eefdbb3589eba72196448fc1f30`. PR21 source `8cf4b72` passed CI37742158554/pause37742158662; its earlier packaging-manifest failure was corrected before merge.

[D-073](../decisions/D-073.md) establishes the current delivery scope: **UI/mock prototype for the PM and developers**, all 72 commitments across nine tools, six visible states, five languages and 15 journeys. Existing backend foundations are frozen; new backend hardening, production infrastructure and security work are outside scope. Existing required CI is retained, with no new backend/security gate program.

Delivery sequence from the supplied plan:

1. **P0:** record the direction and delivery modes; preserve old work and evidence.
2. **P1:** shared Demo Panel, prototype/simulated labels, existing-component reuse and coherent Nile Foods/OrgTik demo stories. One owner for shared UI/shell; the first visible deliverable is the Demo Panel.
3. **P2:** connected notifications/search, Chats, OrgTik CRM, preferences/catalog/trial and attribution as UI/mock journeys. Reuse completed CMS and Files/whiteboards.
4. **P3:** the 72 features, ordered Tasks → Files → Chats → HR → Sales → Marketing → WM → USR → ADM. Fold R4 presentation screens into USR/ADM and reuse shared components.
5. **P4:** suite terminology/navigation/state consistency, responsive/RTL/theme review and a focused accessibility pass. Hide obsolete surfaces through UI routing; do not delete projects or code.
6. **P5:** stakeholder guide and 15 walkthrough scripts, showing UI states, mock contracts and backend-pending responsibilities. Online publication remains subject to a direct deployment instruction.

Resolve stale source-plan notes using completed work: do not ask again about the former 16-file CMS UI package; it is merged and reviewed. A18/A19/A20 already exist and remain historical, so this adoption is A21. Worktree cleanup is not necessary to begin the new UI work and is not authorized by the attachment. Reset/time scenarios must stay in isolated demo data; no existing persistence conversion or shared-clock change is part of P0.

The package register retains its 129 IDs and 72 feature commitments. R2/R3/R4 delivery becomes `ui_mock`; backend-only acceptance/normalization tasks are `frozen_prototype` with their historical evidence retained. The original full SaaS roadmap remains reference history, rather than a presentation prerequisite.

بالمصري: CMS خلص واتدمج بعد CI ناجح. بنبدأ الخطة الجديدة كبروتوتايب UI/mock للـ PM والمطورين: ٩ أدوات، ٧٢ ميزة، الحالات الست و١٥ رحلة. الباك إند الموجود ثابت ومش هنكمّله أو نمسحه. أول نتيجة ظاهرة هي Demo Panel، وبعدها الربط والميزات أداة أداة. مفيش شغل أمن أو نشر أو مسح worktrees، والـ Reset خاص ببيانات عرض معزولة فقط.
