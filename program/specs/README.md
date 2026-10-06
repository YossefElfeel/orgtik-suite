# Spec register

Extracted from the PM's spec files (OrgTik_00–06, **v1.0 · 28 Sep 2026**) by `../tools/extract_spec.py`.

**When the PM sends a new version:** re-run the extractor, then diff the CSVs. Every changed row gets flagged in the gap matrix.

```sh
python tools/extract_spec.py            # reads ../OrgTik_0*.docx, writes specs/*.csv
```

The CSVs are UTF-8 with a BOM, so Excel shows the Arabic columns correctly.

| File | Rows | Contents |
|---|---|---|
| `spec-register.csv` | 260 | One row per traceable item (details below) |
| `screen-fields.csv` | 283 | Every field of every screen: EN/AR label, type, required, rules |
| `flow-steps.csv` | 73 | Every step of every flow: actor, EN/AR text, screen |
| `states.csv` | 48 | The 5 state tables in 06, plus USR-00's 7 tool states and 8 banners |
| `permission-matrix.csv` | 17 | Staff module × 8 roles (F / E / V) from file 02 |
| `terms.csv` | 12 | The pricing terms from file 03, a seed for the glossary |

## What `spec-register.csv` holds

| Kind | Count | IDs | Source |
|---|---|---|---|
| screen | 61 | ADM-01…33, USR-00…27 | 04, 05 |
| story | 87 | US-C-01…45 (60 Must, 25 Should, 2 Could across both files), US-A-01…42 | 01, 02 |
| flow | 12 | F-01…12 | 06 |
| state_table | 5 | ST-subscription-line-per-tool, ST-service-request, ST-invoice, ST-support-ticket, ST-workspace | 06 |
| gap | 32 | G-01…32: 23 Proposed, 6 Open, 2 Done, 1 Decided | 00 |
| rule | 63 | R03-*: price resolution steps, worked examples, and the price-change, currency-lock, seat/bundle/coupon/service, tax and gateway rules | 03 |

That's **197 core items** plus 63 pricing rules.

**Columns:** `id` · `kind` · `doc` · `group` (sidebar group, epic or area) · `title_en` · `title_ar` · `priority` · `status` · `refs` (what the item points at) · `referenced_by` (what points at it) · `summary_en` · `summary_ar` · `ac_count` · `field_count` · `step_count` · `state_count` · `doc_version`

## Findings from the extraction

- **84 of 87 stories are delivered by a screen or flow that cites them.** Three are cited by no screen or flow:
  - **US-C-06** "browse services, packages and past projects" (Should). This is the public website's Services and Portfolio, which the Website Manager now manages.
  - **US-C-38** "see only the tools I can use" (Must) and **US-C-39** "switch between workspaces" (Should). USR-00's layout text describes both, but doesn't cite them.

  The gap analysis confirms these links.
- **The 6 Open gaps** (G-04, G-12, G-18, G-21, G-24, G-28) are exactly the ones in PM packet 01, Q-009.
- **ADM-01 (staff login) isn't in the admin navigation table**, which is expected for a sign-in page.
- **Source:** every file says it's "Based on: OrgTik Requirements Document (Sep 22, 2026)", and that document isn't in the workspace (PM packet 01, Q-001).
