# Catalog multilingual API handoff

This document is the frontend contract for the multilingual catalog change.
It covers plans, packages, categories, and departments. The existing API
paths and response envelopes remain unchanged.

## Shared rules

### Supported languages

Only these language keys are accepted:

```ts
type SupportedLanguage = 'en' | 'de' | 'it' | 'fr';
type LocalizedText = Partial<Record<SupportedLanguage, string>>;
```

Example:

```json
{
  "en": "Growth Starter",
  "de": "Wachstumsstarter",
  "it": "Starter crescita",
  "fr": "Starter croissance"
}
```

Missing languages must be omitted. Do not send `null`, empty strings, or
unsupported keys such as `ar`, `es`, or `pt`.

### Request headers

Every localized catalog GET may send:

```http
Accept-Language: de
```

Language tags such as `de-DE` are accepted and resolved to `de`. If the
header is missing or unsupported, `en` is used as the requested language.

For non-admin responses, the server resolves each value in this order:

1. requested language;
2. `en`;
3. first available stored translation.

The response is a string for non-admin users, salesmen, and customers. Admin
responses on the same paths return the stored translation map.

### Response envelope

Single-resource responses keep the existing envelope:

```json
{
  "success": true,
  "message": "Plan retrieved",
  "data": {}
}
```

Paginated responses use:

```json
{
  "success": true,
  "message": "Plans retrieved",
  "data": {
    "items": [],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

## Write requests

The following fields are localized maps:

| Resource   | Localized fields      | Required on create                     |
| ---------- | --------------------- | -------------------------------------- |
| Plan       | `name`, `description` | both fields need at least one language |
| Package    | `name`, `description` | both fields need at least one language |
| Category   | `name`                | `name` needs at least one language     |
| Department | `name`                | `name` needs at least one language     |

Values are trimmed by the backend. A field containing only whitespace is
invalid. Other supplied languages are optional.

### Plan create

`POST /api/plans`

```json
{
  "name": {
    "en": "Creative Graphic Design",
    "de": "Kreatives Grafikdesign"
  },
  "description": {
    "en": "A complete creative design package.",
    "fr": "Une offre complète de design créatif."
  },
  "departmentId": "11111111-1111-4111-8111-111111111111",
  "categoryId": "22222222-2222-4222-8222-222222222222",
  "isActive": true,
  "featureIds": ["33333333-3333-4333-8333-333333333333"],
  "planDurationIds": ["44444444-4444-4444-8444-444444444444"],
  "installmentsEnabled": false,
  "zonePrices": [
    {
      "zoneId": "55555555-5555-4555-8555-555555555555",
      "basePrice": "329.00",
      "countryOverrides": []
    }
  ],
  "commission": { "type": "percentage", "amount": "10.00" }
}
```

### Package create

`POST /api/packages`

```json
{
  "name": {
    "en": "Growth Starter",
    "de": "Wachstumsstarter"
  },
  "description": {
    "en": "A bundled set of design services."
  },
  "planIds": ["11111111-1111-4111-8111-111111111111"],
  "zones": [
    {
      "zoneId": "22222222-2222-4222-8222-222222222222",
      "price": "999.00",
      "countryOverrides": [{ "countryCode": "AE", "price": "1099.00" }]
    }
  ]
}
```

### Category create

`POST /api/categories`

```json
{
  "departmentId": "11111111-1111-4111-8111-111111111111",
  "name": {
    "en": "UI/UX Design",
    "de": "UI/UX-Design"
  },
  "description": "User interface design and research."
}
```

`description` remains a scalar string for categories.

### Department create

`POST /api/departments`

```json
{
  "name": {
    "en": "Development",
    "de": "Entwicklung",
    "it": "Sviluppo"
  },
  "managerId": 42
}
```

### PATCH behavior

`PATCH /api/plans/:id`, `PATCH /api/packages/:id`,
`PATCH /api/categories/:id`, and `PATCH /api/departments/:id` merge supplied
language keys with the existing map.

For example, if the stored value is:

```json
{ "en": "Starter", "de": "Starterplan" }
```

and the request is:

```json
{ "name": { "fr": "Débutant" } }
```

the stored result becomes:

```json
{ "en": "Starter", "de": "Starterplan", "fr": "Débutant" }
```

Omitted fields remain unchanged. Sending an empty translation does not delete
a language; it returns `422`. Use the existing resource update behavior for
all non-localized fields and collections.

## Read responses

The following examples show the changed fields only. All existing IDs,
counts, prices, status fields, timestamps, and pagination metadata remain in
the response.

### Plans

Paths:

- `GET /api/plans`
- `GET /api/plans/grouped`
- `GET /api/plans/:id`

Non-admin list/detail example:

```json
{
  "id": "plan-id",
  "name": "Kreatives Grafikdesign",
  "description": "A complete creative design package.",
  "department": { "id": "department-id", "name": "Entwicklung" },
  "category": { "id": "category-id", "name": "UI/UX-Design" },
  "features": [{ "id": "feature-id", "name": "Logo Design" }]
}
```

Admin list/detail example:

```json
{
  "id": "plan-id",
  "name": {
    "en": "Creative Graphic Design",
    "de": "Kreatives Grafikdesign"
  },
  "description": {
    "en": "A complete creative design package.",
    "fr": "Une offre complète de design créatif."
  },
  "department": {
    "id": "department-id",
    "name": { "en": "Development", "de": "Entwicklung" }
  },
  "category": {
    "id": "category-id",
    "name": { "en": "UI/UX Design", "de": "UI/UX-Design" }
  }
}
```

`GET /api/plans/grouped` applies the same projection to the group `name` and
each nested plan `name`.

### Packages

Paths:

- `GET /api/packages`
- `GET /api/packages/:id`

Non-admin list example:

```json
{
  "id": "package-id",
  "name": "Wachstumsstarter",
  "description": "A bundled set of design services.",
  "planNames": ["Creative Graphic Design"],
  "prices": [
    {
      "zoneId": "zone-id",
      "zoneName": "Europe",
      "currencyCode": "EUR",
      "amount": "999.00",
      "countryOverrideCount": 1
    }
  ]
}
```

Admin detail example:

```json
{
  "id": "package-id",
  "name": { "en": "Growth Starter", "de": "Wachstumsstarter" },
  "description": { "en": "A bundled set of design services." },
  "category": { "en": "UI/UX Design", "de": "UI/UX-Design" },
  "department": { "en": "Development", "de": "Entwicklung" },
  "plans": [
    {
      "id": "plan-id",
      "name": { "en": "Creative Graphic Design" },
      "description": { "en": "A complete creative design package." },
      "category": {
        "id": "category-id",
        "name": { "en": "UI/UX Design" }
      },
      "department": {
        "id": "department-id",
        "name": { "en": "Development" }
      }
    }
  ],
  "planSummaries": [
    { "id": "plan-id", "name": { "en": "Creative Graphic Design" } }
  ]
}
```

### Categories

Paths:

- `GET /api/categories`
- `GET /api/categories/list`
- `GET /api/categories/grouped`
- `GET /api/categories/:id`

Non-admin category list item:

```json
{
  "id": "category-id",
  "name": "UI/UX Design",
  "description": "User interface design and research.",
  "department": { "id": "department-id", "name": "Development" },
  "planCount": 2,
  "featureCount": 3
}
```

Admin category detail localized fields:

```json
{
  "id": "category-id",
  "name": { "en": "UI/UX Design", "de": "UI/UX-Design" },
  "description": "User interface design and research.",
  "departmentId": "department-id",
  "departmentName": { "en": "Development", "de": "Entwicklung" },
  "plans": [
    {
      "id": "plan-id",
      "name": { "en": "Creative Graphic Design" },
      "description": { "en": "A complete creative design package." }
    }
  ]
}
```

The grouped response applies the same projection to `departmentName` and each
nested category `name`. The lightweight `/categories/list` response contains
only `{ id, name }`.

### Departments

Paths:

- `GET /api/departments`
- `GET /api/departments/list`
- `GET /api/departments/:id`

Non-admin department detail:

```json
{
  "id": "department-id",
  "name": "Entwicklung",
  "managerName": "Mike Chen",
  "categoryCount": 1,
  "categories": [
    {
      "id": "category-id",
      "name": "UI/UX-Design",
      "description": "User interface design and research.",
      "planCount": 2
    }
  ]
}
```

Admin department detail uses maps for `name` and nested category `name`:

```json
{
  "id": "department-id",
  "name": { "en": "Development", "de": "Entwicklung" },
  "categories": [
    {
      "id": "category-id",
      "name": { "en": "UI/UX Design", "de": "UI/UX-Design" },
      "description": "User interface design and research.",
      "planCount": 2
    }
  ]
}
```

The grouped department response applies the same projection to
`departmentName` and nested category values. `/departments/list` contains
only `{ id, name }`.

## Validation and errors

Frontend should display a validation error and preserve the user-entered
language map when the API returns `422` for any of these cases:

- no supported language was supplied for a required localized field;
- a translation is empty or whitespace-only;
- a translation exceeds the field limit;
- an unsupported language key was supplied;
- a localized name conflicts with an existing name in the same uniqueness
  scope and language.

The database migration backfills existing scalar values as `{ "en": value }`.
No frontend data migration is required. Existing records therefore remain
visible in English until additional translations are added.

## Frontend implementation checklist

- Send translation maps on create and update; do not send a scalar for the
  localized fields.
- Send `Accept-Language` on every catalog GET, including selector, grouped,
  nested, and detail requests.
- Treat localized response fields as `string | LocalizedText` when the current
  user may be an admin.
- For admin edit forms, populate only the languages returned by the API;
  missing languages are intentionally omitted.
- For non-admin screens, render the returned string directly; do not apply a
  second client-side fallback.
- Keep category `description` as a normal string.
- Do not introduce a `lang` query parameter; the header is the only locale
  input.

Related backend references:

- [Plans API](plans-api.md)
- [Packages API](packages-api.md)
- [Departments, Categories, and Features API](departments-categories-features-api.md)
- [Internationalization standard](../01-backend/i18n.md)
