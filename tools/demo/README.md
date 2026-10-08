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

No online deployment is performed. Payments, mail, AI and external delivery remain simulated.

## Verification

The bounded launcher smoke checked syntax, list/dry-run output, rejection of an occupied port with exit code 1, an isolated SOS sign-in response (200), and the Tasks presentation route (200). The API status reported a memory journal, private `presentation-*` sandbox and the specified frozen clock. Ctrl+C stopped its owned services. The selected source copy's legacy launcher URLs changed while the installed package's constants stayed unchanged. Other tool selections have their environment variables wired from existing app contracts; their full presentation flows remain tool-by-tool acceptance work.
