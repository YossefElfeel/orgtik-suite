# Gap analysis: what we have vs what's correct

**Planned files:**
- `gap-matrix.csv`: the source of truth.
- `gap-analysis.md`: generated from it.
- An Artifact page (the English matrix plus an Egyptian-Arabic readout), regenerated at every gate.

## What counts as "correct", in order of precedence

1. Owner decisions (`../decisions/`)
2. PM answers
3. Spec 00–06 v1.0
4. The Requirements Document (22 Sep), once received
5. Program standards (glossary, status matrix, definition of done)
6. Current app behaviour, which is evidence only and never the authority

When two sources contradict each other, the row gets the status **Conflicts** and a question goes to the PM.

## Matrix columns

`gap_id` · `spec_id` · `type` · `area` · `requirement` · `priority` · `future_owner` (ADM/USR/CMS/Shell/tool/website) · `current_app` · `current_route` · `evidence` (file:line, screenshot, flow) · `status` · `issues` · `decision_dependency` · `backlog_id` · `size` · `wave` · `last_verified`

## Status values

| Status | Meaning |
|---|---|
| Exists-OK | Every acceptance criterion passes |
| Exists-flawed | The intent matches, but there are defects |
| Partial | Some criteria, fields or states are missing |
| Missing | Nothing exists |
| Conflicts | It contradicts the spec or another source |
| Superseded | Another deliverable replaces it (e.g. ADM-27 → Website Manager) |

## Report sections

1. Summary, with coverage % by area and by app
2. Sources and versions
3. Forward matrix (spec → app)
4. Reverse matrix (routes with no spec)
5. Conflict register
6. Cross-cutting gaps
7. Open questions
8. Backlog by wave

## How rows become backlog items

| Status | Becomes |
|---|---|
| Missing | Build item |
| Partial / Exists-flawed | Fix item in that app's wave |
| Conflicts | A question plus a blocked item |
| Superseded | Retire or redirect item |
