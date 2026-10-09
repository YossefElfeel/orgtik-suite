# V3 P2 — shared library, Shell and ecosystem primitives

2026-10-10. P1 is merged through PR47/main `8edd365` after green checks/configuration and the strict Windows reference run `37991406676`. The owner's continuation instruction remains active; deployment remains paused.

## Implementation

`@orgtik/ui` is now version `2.0.0-rc.1` in the repository. SuiteProvider/useSuite project the existing workspace context into tool access, seats, admin rights and connected-feature outcomes. Source access, target subscription/assignment, target write rights, disabled connections, role denial and billing/preview read-only remain distinct. No client state grants server authority.

SuiteFrame and one useSuiteApps registry provide adaptive Home visibility, owner Add tool, workspace context, sidebar collapse, breadcrumbs, one command palette/notification slot, banners and density/content-width tokens. The older presentation search/notification bridge is shown only on presentation routes; ordinary Shells no longer inject it.

The library adds Toolbar/FilterBar, saved views, column chooser, keyboard/pointer resizing, row actions, InlineEdit, TagInput, Slider, Kbd, AvatarGroup, SplitView/Inspector, ActivityTimeline, CommentThread with mentions, OnboardingChecklist, workspace switcher, SettingsLayout/ToolAdminLayout and request/connect/upsell cards. Existing FileField and Stat supply Dropzone/KpiCard with shared behavior; Stat supports a real-data sparkline and Badge supports a dot.

RichTextEditor now uses the existing pinned Tiptap stack with bold/italic/lists/quotes/code/undo/redo and controlled HTML or text. Legacy plain-text/format callers remain compatible while ordinary tool migrations adopt HTML. Import/toast/form handling remains in the existing shared systems. Two scoped migration helpers are supplied for kit imports and token aliases. Neutral/contrast/palette checks are now part of CI.

## Verification

- Library build and strict story TypeScript checks pass.
- Twenty retained/auth/access/pagination/connected-state unit checks pass. They are scoped library checks, not a new backend-security program.
- Twenty-five affected type/catalog/test/build tasks pass; the existing mock's 284 workspace checks are an included subset of its retained test chain, not additional acceptance totals.
- Sixty stories × six locale/theme combinations = 360 reviewed baseline renders: zero axe findings (including moderate/minor), console errors or page overflow.
- Fifteen new interaction checks pass: actual search, density, chooser, keyboard resize, inline edit, inspector, saved view, real rich-text marks/list structure, command-K keyboard selection, mark-all-read, sidebar width and promised request completion. Ten retained Board/Calendar interactions pass separately.
- Visual inspection of the actual Shell, table and AR/dark editor references confirms the committed direction. All 50 enumerated Windows pairs still match the hashes of their corresponding default references; P2 adds no tolerance/mask change.

PR48 source `2c40ac6` passed its checks and configuration jobs. Its first Windows run `37996377927` passed 355/360 images with no accessibility/console/overflow or reviewed semantic mismatches. The remaining five list-control images differ by 26 pixels total (2–8 each), wholly inside the visible Enter/Esc keyboard legends. The revision-specific reconciliation script verifies exact renderer, dimensions, fresh text/control/layout semantics, selected fonts and every changed pixel before adding those five pairs. [The recorded review](windows-ci-review.json) increases the enumerated Windows profile to 55 pairs; defaults, threshold 0.1, zero-pixel requirement and no-mask policy are unchanged. Final CI is pending the corrected profile commit.

## Limits

This is the reusable library/API layer. P3 must wire current-workspace feeds, connectors, requests, preferences and owner-domain cross-tool handlers; P4 must supply every ordinary tool screen and its real callbacks. Callback-driven stories are component demonstrations, not deployed backend acceptance. The new story data is isolated from business data. Tool-cycle work can start in separate streams after P2 integrates. Website markup/CSS, frozen session/journal internals and online deployment configuration remain unchanged.
