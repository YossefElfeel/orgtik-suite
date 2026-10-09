# A39 — UI v2 library and common Shell

2026-10-10. [P1/A38](amendment-A38.md) is merged as main `8edd365` through PR47 after successful CI `37991406676` and deployment-pause configuration `37991406662`. The earlier glyph-difference run remains failed history, with [its bounded correction](../audits/v3-p1/windows-ci-review.json) preserved.

P2 introduces the repository's `@orgtik/ui` `2.0.0-rc.1`, SuiteFrame/useSuite/one rail registry, ConnectedFeature, ToolAdminLayout and the shared list/input/communication/onboarding primitives. [Evidence](../audits/v3-p2/README.md) records 360 Storybook renders, 20 scoped library unit checks, 25 affected tasks, 15 new and 10 retained interactions. All local accessibility/console/overflow gates pass. G-DS2 is reviewed locally under the owner's “continue till finish” instruction; package CI remains an independent integration gate.

P3 will wire the existing workspace boundary/store to these contracts, separate CRM service ownership from Console software ownership, and verify website data parity. P4 migrates ordinary tool screens/administration/onboarding/Tier B in the approved order, with two or three separate streams after P2 merges. The library and mock ecosystem retain one owner. P5 completes consistency and the revised guide/journeys. Online deployment remains paused; no external package publication is performed.
