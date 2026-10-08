# Prototype route retirement

UI-only, 2026-10-08. `route-map.json` lists17 Sales mappings and the SOS replacements. `source-report.json` records20 byte-exact original/archive SHA256 pairs. Old detail IDs route to replacement lists because IDs differ between legacy and canonical stores.

`ui-report.json`: old Sales invoices → loaded SOS customer invoice list, three actual UI checks. `staff-report.json`: existing launcher → mapped ADM Plans, five actual checks with explicit staff context, no overflow and unchanged clock. The locale is applied once by the destination router. Sales/SOS type/catalog checks passed. No dependency, backend, application or Vercel project deletion.
