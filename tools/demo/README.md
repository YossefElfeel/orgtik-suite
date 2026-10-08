# Local presentation sandbox

Install workspace dependencies with `pnpm install`, then run from the repository root:

```sh
pnpm demo                 # SOS + Tasks
pnpm demo tasks,files     # Selected tools + SOS
pnpm demo wm,website      # CMS and public website + SOS
pnpm demo all             # All current tools and the website; needs more memory
pnpm demo --list          # Addresses only; starts nothing
pnpm demo wm --dry-run    # Selected addresses; changes nothing
```

The launcher reserves web ports 3500–3509 (website 4597), API ports 7500–7509 and icons 7599. If any required port is occupied it exits before starting services. It never kills an existing service. Use the printed SOS sign-in link and an existing synthetic demo persona; use a separate private browser window because localhost cookies are shared across ports.

Each run copies the selected frontend source into ignored `tools/demo/.runtime/presentation-*`. Dependencies are reused except for a private copy of the legacy launcher package, whose URLs point at this run. Existing frontend build output, `.env` files and installed packages are untouched. Source edits made after startup need a restart to enter the staged prototype.

The unchanged mock backend gets its own sandbox, in-memory journal and accounts, and a frozen `2026-10-07T09:00:00Z` clock. Its existing session adapter writes metadata only inside that run's private folder. Remote storage/provider configuration is removed from the child environment. Configured resources, historical invoices, existing accounts and other instance clocks remain untouched.

Ctrl+C stops only processes spawned by this run. Restart the command for fresh seeded presentation data. Runtime folders are retained for diagnosis; this command does not delete them. The Demo Panel's **Reset scene** resets the presentation selectors; it does not reset backend data. Tasks' **Presentation workflow** uses its own disposable client dataset: workspace selects fixtures, persona supplies the assignee, and **Reset demo tasks** restores those fixtures. Other surfaces retain scene descriptions until their data adapter is connected.

The selected tools share a second memory-only presentation service on SOS API port + 77 (default7577). It holds only synthetic connected task/lead/search/notification records, separate from accounts, invoices, CMS content and journals. `Ctrl+K` opens suite presentation search; notification links and result links use the existing destination-scoped handoff. Scene workspace/persona, language, theme, digits and timezone travel as presentation metadata. App access is still decided by the existing signed session.

Chats message tasks and HR onboarding appear in Tasks. Marketing campaigns connect to WM forms and OrgTik Sales; won deals create simulated workspace receipts. Files exposes versioned packaged records to Tasks/Chats, including historical sample previews. Shared search and notifications open their exact presentation targets through the existing signed handoff. Standalone development without the runtime variables retains local simulated behavior.

Use `pnpm demo tasks,files,chats` for the collaboration walkthrough, `pnpm demo sales,marketing,wm` for campaign/CRM work, and `pnpm demo admin,hr` for staff/people flows. The nine tool screens,72 feature mappings and15 local walkthroughs are documented in `program/prototype-guide.md`. Their evidence records backend/provider/hosted limits separately.

The bridge reset endpoint affects only its synthetic records; it never advances the backend clock or resets business data. `node tools/demo/generate-contracts.cjs` maintains `contracts.json` from the16 route declarations. These contracts describe the local presentation transport; existing app admission remains separate. Local dev uses the installed CLI's supported Webpack option for Next16 linked staging; source stack configuration remains unchanged.

No online deployment is performed. Payments, mail, AI and external delivery remain simulated.

## Verification

The bounded launcher smoke checked syntax, list/dry-run output, rejection of an occupied port with exit code 1, an isolated SOS sign-in response (200), and the Tasks presentation route (200). The API status reported a memory journal, private `presentation-*` sandbox and the specified frozen clock. Ctrl+C stopped its owned services. The selected source copy's legacy launcher URLs changed while the installed package's constants stayed unchanged. Other tool selections have their environment variables wired from existing app contracts; their full presentation flows remain tool-by-tool acceptance work.
