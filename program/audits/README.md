# App audits: screen by screen, flow by flow

Each app gets `audits/<app>/`:

| File | Contents |
|---|---|
| `inventory.md` | **Routes:** path, screen, nav location, roles and test identity, spec IDs, states present, locales, endpoints. **Flows:** actor, start → end, spec link, result. **Components:** local component → library equivalent. **Baseline metrics:** raw hex, physical classes, primitive imports, literal strings, axe violations, dead ends, console errors, unhandled mock calls. |
| `issues.csv` | One row per issue: ID, taxonomy code, severity, route, identity, locale/theme/width, evidence (screenshot, file:line), repro steps, related spec/gap |
| `flows/` | One file per walked flow, with a screenshot at each step |
| `fix-specs/FS-<APP>-<n>.md` | Problem and evidence → design decision (a Figma frame for S1/S2 flow changes) → library components → message keys → all states → Given/When/Then acceptance → test plan |

## Issue taxonomy

| Code | Meaning | Default severity |
|---|---|---|
| DE | Dead end: a control does nothing visible, or there is no way back | S1 on a golden path, else S2 |
| BF | Broken flow: can't reach its end state | S1 |
| MS | Missing state: loading / empty / error / no-permission / read-only / limit | S2 |
| IC | Inconsistent with the library, glossary, status matrix or sibling apps | S3 |
| A11Y | WCAG 2.2 AA failure | S1 for traps or no keyboard access, else S2/S3 |
| I18N/RTL | Literal strings, missing keys, plurals, formats, mirroring, bidi | S2 (S1 if Arabic is unusable) |
| CPY | Wrong term or register, unclear copy | S3 |
| PERF | Over budget, jank, layout shift | S2/S3 |
| SEC | Secrets, tokens in URLs, dev login | S1 |
| PERM | UI contradicts the role matrix | S1/S2 |
| DATA | Money, currency decimals, time zones, formats | S1 for money |
| SPEC | Behaviour conflicts with the spec | Goes to the gap matrix as a decision |

## Severity policy

| Severity | Rule |
|---|---|
| S1 (blocker) | Fixed before the app's release |
| S2 (major) | Fixed in the wave |
| S3 (minor) | Fixed when the screen is touched |
| S4 (polish) | Goes to the backlog |

## Walking a flow

1. Reset the mock. Freeze the clock only if the flow depends on dates. The Next servers keep real time, so with a frozen clock, pages that render the time on the server fail hydration (see `../tools/audit-kit/README.md`, "Clocks").
2. Pick the identity, locale and theme.
3. Walk the flow in the browser against `../../local-dev`.
4. Probe it:
   - cancel or back at every step
   - invalid input and empty data
   - no access, refresh, and deep links
   - keyboard only
   - the same flow in Arabic (RTL)
5. Turn the flow into a Playwright test. That test becomes its regression gate.
