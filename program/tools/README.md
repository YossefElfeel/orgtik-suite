# Program tools

| Tool | Session | What it does |
|---|---|---|
| `extract_spec.py` | 3 | Reads the OrgTik_00–06 .docx files and writes the registers in `../specs/`: spec items, screen fields, flow steps, states, the permission matrix and terms |
| `inventory_apps.py` | 3 | Walks every app's `page.tsx` files and `components/`, and writes `../audits/inventory/`: `routes.csv` (URL pattern, loading/error boundary, whether code links to it) and `components.csv` (with import counts) |
| `scan_static.py` | 4 | Counts per app: raw hex, arbitrary and default-palette colour classes, physical-direction classes, inline styles, icon imports, literal strings, tokens in URLs and hard-coded passwords. Writes `../audits/baseline-metrics.{csv,md}`; each count may only go down during the app's wave. |
| `audit-kit/` | 4 | Browser audits against local-dev: the route sweep (status, console and API errors, axe, structure checks, screenshots) and the dead-end detector. See `audit-kit/README.md`. |

Everything runs locally against `../../local-dev/`. Nothing calls an online API.
