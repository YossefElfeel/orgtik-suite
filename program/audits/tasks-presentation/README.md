# Tasks presentation — first tool increment

The new `/[locale]/presentation` route consumes the existing suite shell and components. It holds disposable client-memory tasks, separate from existing projects. Workspace scene changes select the fixture dataset; all seven named personas can supply the assignee for new/bulk-assigned tasks. No real identity switch is claimed.

One [browser flow](flow.cjs) passes 26 bounded checks with eight captures across EN/AR, light/dark and 1440/390. It covers quick add, editing labels, simulated reminder recipients, search, selection/bulk completion, filtered CSV download, recurring-template completion, CSV mapping/review/result, isolated task reset and workspace fixture switching. The captures have zero page overflow and zero axe critical findings. These are scoped checks, not 26 journeys or completion of all Tasks commitments.

Tasks typecheck, all five catalog key/placeholder checks and production build pass. Independent read-only review found recurring editor completion, persona assignment and repeated CSV result navigation defects; all three were corrected. The shared Demo Panel's six states reuse [the shared flow evidence](../demo-panel/README.md).

Search is local to this dataset. Watchers/reminders provide a tagged preview; no notification is delivered. CSV imports text, not arbitrary binary files. One onboarding template is available. Files picking remains in the existing Tasks surface and is not duplicated here. Shared search/feed, broader templates/import and final tool walkthrough acceptance remain pending. No backend files or new backend tests were added. Vercel remains paused.

[English desktop](tasks-en-light-1440.png) · [Arabic dark mobile](tasks-ar-dark-390.png). Private run folders, credentials, session URLs, failures and logs are excluded.
