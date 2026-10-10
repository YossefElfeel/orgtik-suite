# D-074 operational update: resume managed Vercel deployment

2026-10-11. The owner explicitly requested: "resume deploy on vercel" after completed v3 work merged through PR49 at main `2f7aaa8`.

Resume the existing GitHub Actions deployment controller for the eleven existing suite projects: mock, SOS, Tasks, Files, HR, Sales, Marketing, Chats, WM, Admin and the suite website. Keep the controller's two-project concurrency and production validation. Native Git deployments remain disabled because GitHub Actions owns the build, packaged mock dependencies, aliases and verification; enabling both would create duplicate uncontrolled rollouts.

Retired Content is now excluded from the affected deployment selector and rejected from manual selection. Keep its project metadata for historical/runtime references. The separate owner website and other projects remain outside this suite manifest and are not deployment targets.

The current rollout uses validated merged main only. Unfinished Console, WM, Chats and Marketing follow-ups stay in their isolated worktrees. Preserve configured stores, namespaces, accounts, records, production clock and existing runtime variables. Do not reset or migrate hosted data or create replacement resources. Hosted deployment/smoke establishes availability, not full P5 acceptance or live providers.
