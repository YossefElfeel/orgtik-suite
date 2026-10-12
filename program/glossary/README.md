# Glossary

**The rule:** one concept, one term per language.

**Why:**
- The specs use «باقة» for five different concepts: plan 89×, service package 13×, bundle 12×, custom plan 7×, tier 2×.
- They use «تجريبي» for both Beta and Test mode.
- The apps' catalogs have the same problem in every language (see "What the scan found").

## Files

| File | What it is | Made by |
|---|---|---|
| `glossary.csv` | **What's correct.** One row per concept: definition, the term in EN/AR/DE/FR/IT, forbidden synonyms, a usage rule, spec sources, status and review notes | By hand (v0, session 5) |
| `term-usage.md` / `.csv` | **What we have.** How every app names each concept today, per language, with counts | `python tools/term_usage.py` |
| `glossary-check.md` / `.csv` | **What to change.** Every catalog label that differs from the chosen term, with its app and message key: each app's terminology fix list for its wave | `python tools/glossary_check.py` |

**To regenerate:**
1. Edit `glossary.csv`.
2. Run `python tools/term_usage.py`, then `python tools/glossary_check.py`.

## Status of v0

Every row is **proposed**. Approval steps:
1. **You** review the concepts and English terms (G0).
2. **The PM** confirms the commercial terms (packet 01, Q-007).
3. **Native reviewers** check AR (MSA), DE, FR and IT at gate G1a. Rows whose `review_notes` say "Native review" have a specific doubt.

**Scope:** 80 concepts:
- the commercial model, including the 12 pricing terms from spec 03
- people and access
- work objects
- action labels

Statuses (Active, Pending, Cancelled …) are in `../status-matrix/`, because one English status needs different words per entity. For example, German says "Gekündigt" for a subscription, "Storniert" for an invoice and "Abgebrochen" for a task.

## What the scan found

- **Wrong meanings (bugs):**
  - Sales translates the price **Quote** as a text quotation in all four languages: *Zitat, Citation, Citazione, اقتباس*.
  - French Sales calls support tickets *Billets* (event tickets).
  - The French and Italian payroll labels contain the German word *Lohn*.
  - Sales puts a verb where the noun **Refund** belongs: *Erstatten, Rembourser, Rimborsa*.
- **One word, two concepts:**
  - French uses *Forfaits* for both plans and packages.
  - Arabic uses *الحزم* for both packages and bundles, and *مدير* for both admin and manager.
  - Italian uses *Permessi* for both permissions and leave.
  - German uses *Angebote* for deals, while *Angebot* is the natural word for a quote.
- **One concept, many words:**
  - **Save** (*Save* / *Save changes*)
  - **Create** (*New* / *Create* / *Add New*)
  - Arabic **zone** (*المنطقة* / *النطاق*)
  - Italian **department** (*Dipartimento* / *Reparto*)
  - Italian **leave** (*Permessi* / *Congedi* / *Ferie*)
  - English **customer** (*Customer* / *Client*)
  - The product's own name for a **tool**: app, system, module and dashboard are all used.
- **Coverage today:**
  - Arabic exists only in Sales.
  - SOS has no catalogs at all.
  - Marketing's four catalogs are empty.
  - Chats is English only.

## Register rules

- **Arabic:** plain Modern Standard Arabic. The Egyptian-dialect examples in the specs are never used as copy.
- **Buttons** use a verb or a verbal noun: «حفظ», «إضافة أداة», *Speichern*, *Enregistrer*, *Salva*.
- **Gender-neutral phrasing:** in Arabic, prefer forms that address the reader directly.
- **Latin digits** everywhere (D-016).
- **Delete vs Remove vs Archive:**
  - *Delete* destroys.
  - *Remove* takes out of a list; the item still exists.
  - *Archive* hides and can be restored.
  - A confirm dialog says which one it is.
- **Create vs Add:**
  - *Create* makes a new object with its own page.
  - *Add* puts an item into a list.
  - Never *Add New*.

## Decided at G0 (D-025)

1. **German register:** the generic forms (*Mitarbeiter*, *Benutzer*), as the catalogs use today.
2. **German plan:** *Tarif*.
3. **French plan:** *Formule*, so *Forfait* stays for service packages.
4. **"Save" everywhere**; "Save changes" is dropped.

The other rows stay proposed until the PM (packet 01, Q-007) and native reviewers (G1a) confirm them.
