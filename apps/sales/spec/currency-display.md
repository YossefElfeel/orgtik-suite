# Frontend integration: currency display conversion

## Purpose

The sales backend supports display-only currency conversion for monetary JSON
`GET` responses.

The frontend selects a currency from the currency catalog, sends that currency
in the `x-currency` request header, and receives the same API response in the
selected display currency.

This feature changes only the values returned by supported read APIs. It does
not change database values, entities, creation workflows, update workflows,
payment calculations, settlement calculations, or persisted currency data.

## Quick rule

For every supported money-bearing JSON `GET` request, send:

```http
x-currency: EUR
```

If the selected currency is unavailable, send `USD` or another currency marked
as selectable by the currency catalog.

The same `x-currency` header is also used by write/payment endpoints that
accept an operation currency. Its meaning is determined by the endpoint and
HTTP method.

## Currency source of truth

Use the currency module to populate the frontend currency selector:

```http
GET /api/currency/supported
```

The response contains supported country currencies and metadata, including:

- `code`: ISO currency code, for example `USD`, `EUR`, or `JPY`;
- `name` and `symbol`;
- `minorUnits`, which indicates display precision;
- `isSelectable`, which is `true` when the currency can currently be used;
- `usdRate` and `rateUpdatedAt`, when a cached rate exists.

The frontend should normally show currencies where `isSelectable === true`.
USD is always available. Other currencies require a current cached exchange
rate.

The currency catalog is the source of truth for supported codes. Do not hard-
code a currency list in individual screens.

## `x-currency` request header

### Header contract

| Header       | Required | Meaning                                                  |
| ------------ | -------: | -------------------------------------------------------- |
| `x-currency` |       No | Requested display currency for supported JSON `GET` APIs |

Rules:

1. If the header is missing, the backend uses `USD`.
2. Codes are case-insensitive. `eur`, `EUR`, and `Eur` resolve to `EUR`.
3. The header must contain one currency code, not a comma-separated list.
4. Unsupported codes return `400 Bad Request`.
5. Missing or stale rates return `503 Service Unavailable` when conversion is required.
6. The header is a display preference only and is never persisted.

Example:

```ts
const response = await api.get('/api/plans', {
  headers: {
    'x-currency': selectedCurrency.code,
  },
});
```

An Axios request interceptor is recommended so every supported `GET` request
uses the selected display currency automatically:

```ts
api.interceptors.request.use((config) => {
  if (config.method?.toLowerCase() === 'get') {
    config.headers = config.headers ?? {};
    config.headers['x-currency'] = currencyStore.selectedCode ?? 'USD';
  }

  return config;
});
```

The display interceptor only transforms supported `GET` responses. Write
handlers read `x-currency` explicitly when the operation accepts a currency.

## API groups affected

The following money-bearing JSON read APIs support `x-currency`.

### Catalog and pricing APIs

| API group  | Supported read routes                                                     |
| ---------- | ------------------------------------------------------------------------- |
| Plans      | `GET /api/plans`, `GET /api/plans/grouped`, `GET /api/plans/:id`          |
| Packages   | `GET /api/packages`, `GET /api/packages/:id`                              |
| Features   | `GET /api/features`, `GET /api/features/grouped`, `GET /api/features/:id` |
| Categories | `GET /api/categories`, `GET /api/categories/:id`                          |
| Contracts  | `GET /api/contracts`, `GET /api/contracts/:contractId`                    |
| Offers     | `GET /api/offers`, `GET /api/offers/:offerId`                             |
| Coupons    | `GET /api/coupons`, `GET /api/coupons/:id`                                |

Feature responses use the existing `priceUsd` contract. Because the property
name explicitly says USD, `priceUsd` remains USD even when `x-currency` is
another currency.

Regional plan, package, category, contract, and offer rows are converted from
their own source currency. Do not assume every nested row has the same source
currency.

### Customer and sales operations APIs

| API group   | Supported read routes                                                                                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Projects    | `GET /api/projects`, `GET /api/projects/customer/:customerId`, `GET /api/projects/:id`, `GET /api/projects/:id/summary`, `GET /api/projects/:id/plans`, `GET /api/projects/:id/pending-custom-plan`                 |
| Customers   | `GET /api/customers`, `GET /api/customers/profile`, `GET /api/customers/:id`                                                                                                                                        |
| Salesmen    | `GET /api/salesman`, `GET /api/salesman/profile`, `GET /api/salesman/me/contracts`, `GET /api/salesman/me/customers`, `GET /api/salesman/:id`, `GET /api/salesman/:id/contracts`, `GET /api/salesman/:id/customers` |
| Commissions | All commission JSON `GET` routes, including list, summary, own summary, and detail routes                                                                                                                           |
| Wallets     | All wallet and wallet-transaction JSON `GET` routes                                                                                                                                                                 |

Salesman notes, customer invites, customer meetings, and project contact notes
are not money display routes.

### Subscription and invoice APIs

| API group     | Supported read routes                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| Subscriptions | Customer/admin summaries, lists, duration/pricing details, and subscription details                              |
| Invoices      | `GET /api/invoices/customer/me`, `GET /api/invoices`, `GET /api/invoices/status`, `GET /api/invoices/:invoiceId` |

Invoice count-only routes do not need display conversion. PDF and binary
download routes do not use `x-currency`.

### Dashboard APIs

The following dashboard JSON responses support display currency:

- `GET /api/dashboard`;
- `GET /api/dashboard/overview`;
- `GET /api/dashboard/admin/finance-summary`;
- `GET /api/dashboard/admin/subscriptions-dashboard`;
- `GET /api/dashboard/admin/customers/:customerId`;
- `GET /api/dashboard/admin/salesmen/:salesmanId`.

`GET /api/dashboard/latest-projects` contains project table data without
currency-bearing totals and does not require the header.

## Response behavior

### Response shape does not change

The backend does not add display metadata. These properties are never added:

```json
{
  "_displayCurrency": "EUR",
  "_originalCurrency": "USD",
  "_exchangeRate": 0.91
}
```

Existing response wrappers, DTO property names, pagination metadata, and nested
object structure remain unchanged.

For example, a paginated response remains shaped like this:

```json
{
  "success": true,
  "message": "Plans retrieved",
  "data": {
    "items": [],
    "meta": {
      "total": 42,
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

Pagination counts and navigation fields are never converted.

### Monetary values

The backend:

- converts from the value's actual source currency;
- converts nested monetary values as well;
- rounds using the target currency's `minorUnits`;
- keeps string amounts as strings;
- keeps numeric amounts as numbers;
- preserves `null` values;
- leaves counts, percentages, identifiers, booleans, and dates unchanged;
- updates existing `currency`, `currencyCode`, `currencyName`, and
  `currencySymbol` fields when those fields are part of the response.

Example source response:

```json
{
  "currencyCode": "USD",
  "total": "100.00",
  "regionalPrice": {
    "currencyCode": "EUR",
    "amount": "50.00"
  },
  "count": 3,
  "percentage": 12.5,
  "createdAt": "2026-08-25T10:00:00.000Z"
}
```

Example response with `x-currency: CHF`:

```json
{
  "currencyCode": "CHF",
  "total": "90.50",
  "regionalPrice": {
    "currencyCode": "CHF",
    "amount": "45.25"
  },
  "count": 3,
  "percentage": 12.5,
  "createdAt": "2026-08-25T10:00:00.000Z"
}
```

The exact converted number depends on the current cached rates.

### Explicit source-labelled fields

A property whose name explicitly identifies its currency keeps that currency.
Examples include:

- `priceUsd`;
- `totalUsd`;
- `amountUsd`;
- `amountInUsd`.

The frontend must not interpret `priceUsd` as the selected display currency.
If a screen needs a display value, use a normal monetary property from the
same response or render the source-labelled value as USD.

No parallel fields such as `priceEur` or `convertedPrice` are added.

### Same-currency and USD behavior

- Requesting `x-currency: USD` returns USD display values.
- Requesting the same currency as a row's source currency leaves the amount
  unchanged while keeping the existing response property.
- USD does not require an exchange-rate record.
- A non-USD source or target requires a current cached rate.

## Error handling

Currency errors use the normal backend error wrapper:

```json
{
  "success": false,
  "message": "Unsupported currency code: ABC",
  "error": "Bad Request",
  "statusCode": 400
}
```

### `400 Bad Request`

Returned when `x-currency` is not a supported currency code.

Frontend behavior:

1. Remove the invalid code from local storage or application state.
2. Fall back to `USD` or the first selectable catalog currency.
3. Retry the read request once with the fallback currency.
4. Do not retry repeatedly with the same invalid value.

### `503 Service Unavailable`

Returned when the requested conversion needs a rate that is missing or stale.

Frontend behavior:

- show that current pricing is temporarily unavailable;
- use the currency catalog's `isSelectable` value to avoid selecting
  currencies without current rates;
- optionally retry after a short backoff;
- do not substitute a fake `1.0` rate in the frontend;
- do not silently display the original value as if it were converted.

## Write and payment APIs

For write operations where the submitted amount has an operation currency, use
the same header:

```http
x-currency: EUR
```

This header is used by payment/settlement workflows such as:

- checkout creation:
  - `POST /api/payments/checkout/:invoiceId`;
  - `POST /api/payments/checkout/bulk`;
- commission payout: `POST /api/commissions/:commissionId/pay`;
- wallet withdrawal: `POST /api/wallets/salesmen/:salesmanId/withdraw`;
- custom invoice update: `PATCH /api/invoices/:invoiceId/custom`;
- manual invoice payment: `POST /api/invoices/:invoiceId/mark-paid-manually`;
- invoice payment: `POST /api/invoices/:invoiceId/mark-paid`.

`POST /api/invoices/custom` continues to use the currency fields defined in
its request DTO. It does not use `x-currency`; use the DTO contract for that
creation workflow.

`POST /api/invoices/:invoiceId/void` may accept `x-currency` so its
returned invoice representation can use the requested operation/display
currency. The header does not change the void operation or persisted values.

The frontend should send the currency of the amount entered into the write
form. It should not reuse a display preference automatically unless the user
is intentionally entering the amount in that same currency.

Example checkout request:

```ts
await api.post(
  `/api/payments/checkout/${invoiceId}`,
  { paymentType: 'full_payment' },
  {
    headers: {
      'x-currency': paymentCurrencyCode,
    },
  },
);
```

Important distinctions:

| Concern                                                      | Header       |         Affects persistence/calculation? |
| ------------------------------------------------------------ | ------------ | ---------------------------------------: |
| Display values returned by JSON `GET`                        | `x-currency` |                                       No |
| Currency of an amount submitted to a payment/write operation | `x-currency` | Yes, within that explicit write workflow |

## Frontend implementation recommendations

### Store a display preference

Store only the selected ISO code, for example:

```ts
const currencyPreference = 'EUR';
```

The frontend does not need response metadata to know the selected display
currency because it already sent the header.

### Centralize API header injection

Use one HTTP client configuration instead of adding the header separately in
each component. Apply the header only to supported JSON `GET` requests.

### Avoid client-side second conversion

Do not convert monetary response values again after the backend has applied
`x-currency`. A second conversion will produce incorrect totals.

If a response contains both a converted value and an explicitly labelled field
such as `priceUsd`, render them according to their names and contracts; do not
convert `priceUsd` again.

### Keep display and write currencies separate

It is valid for the UI to display an invoice in EUR while submitting a payment
in CHF:

```http
GET  /api/invoices/:invoiceId    x-currency: EUR
POST /api/payments/checkout/:id  x-currency: CHF
```

### Handle refresh and retry safely

When a request returns `503`, show a rate-unavailable state instead of changing
field names or falling back silently to the original amount.

## What is not affected

The following remain unchanged:

- response DTO declarations and property names;
- response wrappers and pagination metadata;
- database schema and migrations;
- entity persistence;
- plan, contract, offer, invoice, subscription, wallet, and payment creation;
- update and delete workflows;
- payment and settlement calculations;
- PDF and binary document downloads;
- currency catalog and exchange-rate persistence workflows.

## Frontend migration checklist

- [ ] Load the currency selector from `GET /api/currency/supported`.
- [ ] Store the selected ISO currency code.
- [ ] Add `x-currency` to supported money-bearing JSON `GET` requests.
- [ ] Default a missing or unavailable local preference to `USD`.
- [ ] Handle `400` as an invalid currency selection.
- [ ] Handle `503` as a temporary rate-unavailable state.
- [ ] Remove any dependency on `_displayCurrency`, `_originalCurrency`, or
      `_exchangeRate`.
- [ ] Do not expect new converted response fields.
- [ ] Do not convert `priceUsd` or other explicitly source-labelled fields.
- [ ] Send `x-currency` when a write workflow accepts an operation currency.
- [ ] Do not convert monetary values a second time in the frontend.
- [ ] Verify list, detail, summary, and nested responses with USD and a
      selectable non-USD currency.
