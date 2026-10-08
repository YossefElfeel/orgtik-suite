# Shared Demo Panel — first UI increment

One shared panel is mounted by all nine existing app shells. It provides localized presentation persona/workspace selectors, six visual states, scenario descriptors, language/theme controls, a prototype label and local scene reset. The shell remains reachable while main content shows loading, empty, error/retry, no-access, read-only or simulated success. Read-only preview makes page content inert, including canvas/drag interactions; Restore and Demo controls remain available.

Persona/workspace/scenario choices are **presentation metadata** in this increment. They do not sign into another account, change workspace membership or fetch another tenant's data. `useDemoScene` is the shared adapter seam for feature-by-feature mock data work. This is not completion of persona-driven datasets, the full Demo Panel plan or the 72 feature register.

The flow passes 27 bounded checks with eight captures: EN/AR × light/dark × 1440/390. It covers the six states, retry, scene selection and client-only reset, and confirms existing published CMS content and business clock remain unchanged. Shared UI build and all 20 consumer type/catalog tasks pass. Library visuals/interactions are checked through the existing gate separately.

Enable in local development or with `NEXT_PUBLIC_DEMO_PANEL=1`; leave disabled in ordinary builds. Locale changes use each app's existing router/cookie bridge. Theme events keep Demo controls and UserMenu synchronized. No backend, auth, journal, clock, fault or resource configuration changed. No new mock/security tests were added. The future isolated `pnpm demo` launcher and data reset remain pending.

Representative [desktop panel](panel-en-light-1440.png) and [Arabic mobile panel](panel-ar-dark-390.png). Failures, private sessions and local data are excluded.
