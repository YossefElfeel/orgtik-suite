# Prototype route retirement

UI-only, 2026-10-08. `route-map.json` lists17 Sales mappings and the SOS replacements. `source-report.json` records20 byte-exact original/archive SHA256 pairs. Old detail IDs route to replacement lists because IDs differ between legacy and canonical stores.

`ui-report.json`: old Sales invoices → loaded SOS customer invoice list, three actual UI checks. Staff catalog navigation remains pending in this snapshot. Sales/SOS type/catalog checks passed. No dependency, backend, application or Vercel project deletion.
