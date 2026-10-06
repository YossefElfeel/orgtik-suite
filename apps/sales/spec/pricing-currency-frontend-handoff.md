# Pricing & currency fixes — frontend handoff

**Date:** 2026-09-17
**Affects:** Plans, Features, Categories (feature lists)
**Breaking?** Yes, for two specific fields/flows — see [Action required](#action-required-read-this-first). Everything else is additive.

## Background

While investigating a pricing report (a manually configured Switzerland zone
price showing wrong when displayed in a different currency), we found and
fixed four separate, independently-confirmed bugs in the plans/features
pricing and currency-display layer. None of them were about `x-currency`
selecting the wrong region — that design is correct and unchanged. All four
were about **display conversion leaking into fields that must not be
converted**, and **one calculation that was silently incomplete**.

This document is the frontend contract for all four fixes. Two of them
require frontend changes; two are backend-only correctness fixes you should
just be aware of.

## Action required (read this first)

| #   | What changed                                                               | Why it matters to you                                                                                                                                                   | Action                                                                                                           |
| --- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | `priceUsd` no longer converts with `x-currency` — a new `price` field does | Anywhere you render `priceUsd` as "the price in the selected currency," it will now silently stop tracking the currency switcher                                        | Switch display to the new `price` field ([details](#2-priceusd-is-now-always-native-usd--use-price-for-display)) |
| 2   | `GET /plans/:id` and `GET /features/:id` support `?mode=edit`              | If your edit forms currently populate from a normal (display-converted) `GET`, saving the form can **permanently overwrite a native price with an FX-converted amount** | Use `?mode=edit` to populate edit forms ([details](#3-modeedit-for-plan-and-feature-edit-forms))                 |
| 3   | Installment `monthlyPayment` now includes the markup percentage            | If you were adding markup client-side to correct for this, you'd now double it                                                                                          | Remove any client-side markup compensation ([details](#1-installment-monthlypayment-now-includes-markup))        |
| 4   | Country-level `overridePrice` now converts with `x-currency`               | Previously it silently ignored `x-currency`; now it behaves like every other price field                                                                                | Nothing to change unless you had a workaround for this                                                           |

If none of your screens currently read `priceUsd` for display, don't use
plan/feature edit forms, and don't do client-side markup math, items 1–3 are
no-ops for you — read them anyway so you know the fields exist.

---

## 1. Installment `monthlyPayment` now includes markup

**Endpoints:** `GET /plans`, `GET /plans/grouped`, `GET /plans/:id`,
`POST /plans/pricing/preflight` — anywhere `pricingMatrix[].installments[]`
or preflight `durations[].installments[]` appears.

### Before (bug)

`monthlyPayment` was computed as `discountedTotal / months`, completely
ignoring `markupPercentage`. `isMarkupApplied` was hardcoded `false`
everywhere, even when `markupPercentage` was nonzero.

### After (fixed)

```text
markupAmount   = discountedTotal * markupPercentage / 100
payableTotal   = discountedTotal + markupAmount
monthlyPayment = payableTotal / months
isMarkupApplied = markupPercentage > 0
```

This is the exact same formula the Contracts billing path already used when
a deal is actually charged — the plan card and the contract now agree.

### Example

Zone base price `3500.00`, 1-month plan duration (no discount), 3-month
installment term at 5% markup:

| Field              |    Before |     After |
| ------------------ | --------: | --------: |
| `markupPercentage` |    `5.00` |    `5.00` |
| `monthlyPayment`   | `1166.67` | `1225.00` |
| `isMarkupApplied`  |   `false` |    `true` |

`1225.00` = `(3500 + 3500 * 0.05) / 3` = `3675 / 3`.

### What to check

- **If your frontend adds its own markup on top of `monthlyPayment`** (a
  workaround for the old bug), **remove it** — the number is now correct on
  its own, and stacking your own markup on top will double-charge it.
- `isMarkupApplied` is now trustworthy; you can use it directly (e.g. to show
  a "+5% installment fee" badge) instead of comparing `markupPercentage` to
  `0` yourself.

---

## 2. `priceUsd` is now always native USD — use `price` for display

**Endpoints:**

- `GET /plans`, `GET /plans/grouped`, `GET /plans/:id` — `features[]` and
  `allFeatures[]`
- `GET /features`, `GET /features/grouped`, `GET /features/:id`
- `GET /categories/:id` — feature list

### Before (bug)

`priceUsd` was, despite its name, converted by `x-currency` on GET requests.
Requesting `x-currency: CHF` returned a CHF amount under the `priceUsd` key.

### After (fixed)

`priceUsd` **always** returns the raw, native USD amount, regardless of
`x-currency` — exactly like `totalUsd`/`amountUsd` elsewhere in the API. A
new field, **`price`**, was added alongside it, carrying the same amount
**converted to the requested `x-currency`**.

### Example

Feature "Basic Static Pages", configured at `890.00` USD, requested with
`x-currency: CHF`:

Before — `priceUsd` silently holds a CHF amount under a USD-named key:

```json
{
  "id": "e0647d22-68e6-48f8-9f4d-30fe6ae84fb5",
  "name": "Basic Static Pages (Up to 5)",
  "priceUsd": "732.11"
}
```

After — `priceUsd` stays native USD; `price` carries the converted amount:

```json
{
  "id": "e0647d22-68e6-48f8-9f4d-30fe6ae84fb5",
  "name": "Basic Static Pages (Up to 5)",
  "priceUsd": "890.00",
  "price": "732.11"
}
```

### What to check

- Wherever you currently render `priceUsd` as "the feature price" in a
  currency-aware screen, **switch to `price`**.
- Keep using `priceUsd` only where you deliberately want the USD list price
  (e.g. an internal/admin-only column), and don't run it through your own
  currency conversion — it's the source-of-truth USD amount already.
- Both fields are always present together; there's no separate flag to check.

---

## 3. `?mode=edit` for plan and feature edit forms

**Endpoints:** `GET /plans/:id?mode=edit`, `GET /features/:id?mode=edit`

### The problem this solves

`GET /plans/:id` and `GET /features/:id` are also used to populate admin
**edit** forms — the form that lets someone change a zone's price or a
feature's price. Those forms need the **originally configured** value (e.g.
"this Swiss zone is priced at 3500 CHF") so that saving the form without
touching the price field doesn't change anything.

But the same endpoints also run `x-currency` display conversion. If an admin
had the currency switcher set to USD while opening the edit form, the
response would show the **converted** number (e.g. `4254.80` instead of
`3500.00`), and if that converted number got saved back, it would
**permanently overwrite the real 3500 CHF configuration with a USD-derived
number mislabeled as CHF.**

### The fix

Add `?mode=edit` to the request. When present, the endpoint **ignores
`x-currency` completely** and returns every field exactly as stored:

```http
GET /api/plans/{id}?mode=edit
x-currency: USD    ← ignored entirely in this mode
```

```json
{
  "zoneDetails": [
    {
      "id": "5763f648-ddc7-4e69-8bc0-1878b958aa34",
      "name": "Switzerland",
      "currencyCode": "CHF",
      "currencyName": "Swiss Franc",
      "currencySymbol": "CHF",
      "basePrice": "3500.00",
      "countries": [{ "countryCode": "CH", "overridePrice": null }]
    }
  ]
}
```

`currencyCode`/`currencyName`/`currencySymbol` also stay the zone's real
currency in this mode — they are not rewritten to match `x-currency` the way
they normally are on display GETs.

The same applies to `GET /features/:id?mode=edit`: `priceUsd` (and every
other field) comes back exactly as stored.

### What to check

- **Any screen that opens a plan or feature for editing must call the
  endpoint with `?mode=edit`.**
- **A normal (non-edit) `GET` must never be used to populate an edit form.**
  If the currency switcher happens to be on anything other than a field's
  native currency, the values silently won't round-trip correctly.
- Everything else about the response shape is unchanged in edit mode — same
  envelope, same fields, just unconverted.
- Normal display requests (list pages, plan detail pages, feature catalogs)
  are completely unaffected — don't add `?mode=edit` there; conversion keeps
  working exactly as documented in
  [currency-display.md](currency-display.md).

---

## 4. Country-level `overridePrice` now converts too

**Endpoint:** `GET /plans/:id` — `zoneDetails[].countries[].overridePrice`

Previously, a country-level manual price override (e.g. a specific price for
UAE inside a zone) was silently excluded from `x-currency` conversion — it
always showed in the zone's native currency, inconsistent with every other
price around it in the same response. It now converts like `basePrice` does.
In `?mode=edit`, it stays native, same as everything else in that mode.

No frontend change should be needed here unless you had a workaround (e.g.
converting it yourself client-side) — remove that if so.

---

## Affected endpoints summary

| Endpoint                        |   `priceUsd`/`price` split    | `?mode=edit` | Markup fix                        |
| ------------------------------- | :---------------------------: | :----------: | :-------------------------------- |
| `GET /plans`                    | ✅ (`allFeatures`/`features`) |      —       | ✅ `pricingMatrix[].installments` |
| `GET /plans/grouped`            |               —               |      —       | —                                 |
| `GET /plans/:id`                |              ✅               |      ✅      | ✅                                |
| `POST /plans/pricing/preflight` |               —               |      —       | ✅ `durations[].installments`     |
| `GET /features`                 |              ✅               |      —       | —                                 |
| `GET /features/grouped`         |              ✅               |      —       | —                                 |
| `GET /features/:id`             |              ✅               |      ✅      | —                                 |
| `GET /categories/:id`           |       ✅ (feature list)       |      —       | —                                 |

## Frontend implementation checklist

- [ ] Replace `priceUsd` with `price` anywhere a feature/plan-feature price is
      **displayed** to a user in their selected currency.
- [ ] Keep `priceUsd` only for genuinely USD-specific display (admin USD
      column); never convert it yourself.
- [ ] Point every plan and feature **edit form** load at `?mode=edit`;
      confirm the save flow round-trips the exact same `basePrice`/`priceUsd`
      value it received.
- [ ] Confirm normal (non-edit) plan/feature screens are unaffected — they
      should not send `?mode=edit`.
- [ ] Remove any client-side installment-markup calculation that was
      compensating for `monthlyPayment` previously excluding markup.
- [ ] If `isMarkupApplied` was ignored before (since it was always `false`),
      it's now safe to use directly.
- [ ] Remove any client-side conversion workaround for
      `zoneDetails[].countries[].overridePrice`.
- [ ] Spot-check one plan and one feature end to end: list view, detail view,
      edit view, in both USD and a non-USD selectable currency.

## Related backend references

- [Currency display conversion](currency-display.md) — the general
  `x-currency` contract (updated 2026-09-17 for the changes above).
- [Plans API](plans-api.md)
- [Departments, Categories, and Features API](departments-categories-features-api.md)
