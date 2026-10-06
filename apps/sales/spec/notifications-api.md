# Notifications — Frontend Integration Guide

This is the complete reference for integrating with the notification system: the REST API, the real-time WebSocket gateway, notification preferences, and the higher-level Activity Feed presentation layer. All routes require authentication — there are no public notification endpoints.

There are **two APIs backed by the same underlying data**:

- **`/api/notifications`** — the raw notification store. Simple shape, filterable by status/type/read, good for a notification bell/dropdown.
- **`/api/activity-feed`** — a presentation-oriented layer over the same rows: adds category tabs, icons, tones, context labels, and deep-link targets. Good for a full "Activity" screen. See [activity-feed-api.md](./activity-feed-api.md) for its full reference; this doc covers it briefly in [§6](#6-activity-feed-the-presentation-layer) and focuses on what's shared (auth, sockets, data model).

Neither endpoint supersedes the other — both are intended to be used, for different UI surfaces, against the same notification rows.

## Contents

1. [Base URL, auth, response envelope](#1-base-url-auth-response-envelope)
2. [Data model & enums](#2-data-model--enums)
3. [REST endpoints](#3-rest-endpoints)
4. [Notification preferences](#4-notification-preferences)
5. [Real-time delivery (WebSocket)](#5-real-time-delivery-websocket)
6. [Activity Feed (the presentation layer)](#6-activity-feed-the-presentation-layer)
7. [What triggers a notification](#7-what-triggers-a-notification)
8. [Known gaps / things NOT to build against](#8-known-gaps--things-not-to-build-against)

---

## 1. Base URL, auth, response envelope

- Base URL: `{BASE_URL}/{API_PREFIX}` — locally `http://localhost:3000/api`. All paths below are relative to this (e.g. `/notifications` → `GET http://localhost:3000/api/notifications`).
- Auth: `Authorization: Bearer <token>` header, the same JWT issued by the auth service for any other API call. Every route is behind `AuthGuard` — there is no `@Public()` notification route.
- The same token is reused for the WebSocket handshake (§5) — no separate socket token.
- REST CORS: `origin: true, credentials: true` (reflects request origin). WebSocket CORS is locked to the single `FRONTEND_DOMAIN` env value — different (stricter) from REST CORS, so a websocket connection from an origin other than the configured frontend domain will fail even if REST calls from that origin work.

**Every successful response is wrapped:**

```json
{ "success": true, "message": "human-readable message", "data": {} }
```

**Errors** (thrown by the global exception filter):

```json
{ "success": false, "message": "...", "error": "...", "statusCode": 400 }
```

`401` is normalized to `{ message: "Authentication required", error: "Please provide a valid authentication token" }` regardless of the underlying auth failure reason.

---

## 2. Data model & enums

A notification (`NotificationEntity`, table `notifications`) has:

| Field                     | Type                                         | Notes                                                                                                                                                                         |
| ------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                      | `string` (uuid)                              |                                                                                                                                                                               |
| `userId`                  | `number`                                     | the recipient — matches the JWT's `user.id`                                                                                                                                   |
| `userType`                | `UserType`                                   | `admin` \| `salesman` \| `customer` — see gap note below                                                                                                                      |
| `type`                    | `NotificationType`                           | see table below                                                                                                                                                               |
| `priority`                | `NotificationPriority`                       | `low` \| `medium` \| `high` \| `critical`                                                                                                                                     |
| `title` / `message`       | stored as `{ en, de?, it?, fr? }` internally | **the API always returns a flattened, localized `string`**, not the raw object (see below)                                                                                    |
| `data`                    | `Record<string, any>` \| `null`              | free-form payload specific to the notification type — e.g. `{ invoiceId, invoiceNumber, amount, currency, ... }`. Used by the Activity Feed to derive deep-link targets (§6). |
| `channels`                | `NotificationChannel[]`                      | `in_app` \| `email` \| `websocket` — which channels this specific notification was dispatched on                                                                              |
| `status`                  | `NotificationStatus`                         | `pending` \| `sent` \| `failed` \| `read` — **there is no separate `unread` value; "unread" means `status !== 'read'`**                                                       |
| `isRead`                  | `boolean`                                    | derived: `status === 'read'` (REST response only, not a DB column)                                                                                                            |
| `readAt`                  | `Date \| null`                               |                                                                                                                                                                               |
| `expiresAt`               | `Date \| null`                               | expired notifications (`expiresAt < now`) are silently excluded from `GET /notifications` and the unread count                                                                |
| `createdAt` / `updatedAt` | `Date`                                       |                                                                                                                                                                               |

**Localization caveat:** although the backend stores title/message in 4 languages, the controller currently **hardcodes `'en'`** when flattening (`const acceptLanguage = 'en'; // Get from headers if needed`). Sending an `Accept-Language` header today has no effect — expect English-only text until this is wired up.

### `NotificationType` (19 values)

| Value                            | Fired when                                                                                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `project.created`                | a project is created                                                                                                                                     |
| `project.status_changed`         | a project's status changes                                                                                                                               |
| `project.priority_changed`       | a project's priority changes                                                                                                                             |
| `contract.created`               | a contract is created                                                                                                                                    |
| `contract.awaiting_confirmation` | _(enum exists; nothing in the codebase creates this notification today — email-only flow instead, see [§8](#8-known-gaps--things-not-to-build-against))_ |
| `contract.confirmed`             | customer confirms a contract                                                                                                                             |
| `contract.approved`              | admin approves a contract                                                                                                                                |
| `contract.rejected`              | admin rejects a contract                                                                                                                                 |
| `invoice.created`                | an invoice is created                                                                                                                                    |
| `invoice.due_soon`               | invoice due within 7 days (cron)                                                                                                                         |
| `invoice.overdue`                | invoice past due (cron)                                                                                                                                  |
| `invoice.paid`                   | invoice marked paid                                                                                                                                      |
| `custom_invoice.created`         | a custom invoice is created                                                                                                                              |
| `custom_invoice.paid`            | a custom invoice is paid                                                                                                                                 |
| `payment.received`               | a payment is captured (Stripe or manual)                                                                                                                 |
| `wallet.commission_added`        | commission credited to a salesman's wallet                                                                                                               |
| `wallet.commission_paid`         | commission paid out to a salesman                                                                                                                        |
| `customer.document_uploaded`     | a customer document is uploaded                                                                                                                          |
| `customer.meeting_scheduled`     | a customer meeting is scheduled                                                                                                                          |
| `customer.registered`            | _(enum exists; no call site today — dead)_                                                                                                               |

### `NotificationPriority`

`low` \| `medium` \| `high` \| `critical`

### `NotificationStatus`

`pending` \| `sent` \| `failed` \| `read`

### `NotificationChannel`

`in_app` \| `email` \| `websocket` — **no push (FCM/APNs/OneSignal) channel exists.** If a mobile/browser push capability is expected, it isn't implemented yet; plan around in-app + websocket + email only.

---

## 3. REST endpoints

All under `/notifications`, all require `Authorization: Bearer <token>`.

### `GET /notifications` — list, paginated

Query params (`GetNotificationsQueryDto`):

| Param    | Type                 | Default | Notes                                                                          |
| -------- | -------------------- | ------- | ------------------------------------------------------------------------------ |
| `page`   | number, min 1        | `1`     |                                                                                |
| `limit`  | number, 1–100        | `20`    |                                                                                |
| `status` | `NotificationStatus` | —       | exact match                                                                    |
| `type`   | `NotificationType`   | —       | exact match                                                                    |
| `isRead` | boolean              | —       | convenience filter; maps to `status = 'read'` / `status != 'read'` server-side |

There is **no date-range filter** (`from`/`to`) — don't build a date-picker filter against this endpoint; results are always ordered `createdAt DESC`.

```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "items": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "userId": 12345,
        "userType": "customer",
        "type": "invoice.created",
        "priority": "high",
        "title": "New Invoice Created",
        "message": "Your invoice #INV-001 has been created and is ready for payment.",
        "data": { "invoiceId": "...", "invoiceNumber": "INV-001" },
        "channels": ["in_app", "websocket", "email"],
        "status": "sent",
        "isRead": false,
        "readAt": null,
        "expiresAt": "2026-04-01T00:00:00.000Z",
        "createdAt": "2026-01-01T12:00:00.000Z",
        "updatedAt": "2026-01-01T12:00:00.000Z"
      }
    ],
    "meta": {
      "total": 42,
      "page": 1,
      "limit": 20,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### `GET /notifications/unread-count`

```json
{
  "success": true,
  "message": "Unread count retrieved successfully",
  "data": { "count": 7 }
}
```

Good for a bell-icon badge; poll this or, better, use the websocket `notification` event (§5) to increment locally and avoid polling.

### `PATCH /notifications/:id/read`

Marks one notification (owned by the caller) as read. Idempotent — calling it again on an already-read notification just returns it unchanged. `404` if the id doesn't exist or isn't owned by the caller. Returns the full updated `NotificationResponseDto`.

### `PATCH /notifications/read-all`

Marks **all** of the caller's non-read notifications as read in one call. Returns `data: null`. There is no bulk "mark these N ids as read" endpoint — only single and all-at-once.

There is **no delete endpoint** and **no client-side create endpoint** — notifications can only be created server-side by internal business logic (§7).

---

## 4. Notification preferences

Per-user, per-notification-type channel opt-in/opt-out.

### `GET /notifications/preferences`

Returns the caller's saved preferences. If the user hasn't customized anything yet, returns the **computed system defaults** instead (one row per `NotificationType`, each flagged `isDefault: true`) rather than an empty array — the frontend never needs to separately fetch "what are the defaults."

```json
{
  "success": true,
  "message": "Default preferences retrieved successfully",
  "data": [
    {
      "notificationType": "invoice.created",
      "enabledChannels": ["in_app", "websocket", "email"],
      "isDefault": true
    }
  ]
}
```

Once the user saves custom preferences, subsequent calls return the saved rows instead (with `id`, `userId`, `userType`, `createdAt`, `updatedAt`, no `isDefault` flag):

```json
{
  "success": true,
  "message": "Preferences retrieved successfully",
  "data": [
    {
      "id": "...",
      "userId": 12345,
      "userType": "customer",
      "notificationType": "invoice.created",
      "enabledChannels": ["in_app", "email"],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### `PATCH /notifications/preferences`

Body:

```json
{
  "preferences": [
    {
      "notificationType": "invoice.created",
      "enabledChannels": ["in_app", "email"]
    },
    {
      "notificationType": "wallet.commission_added",
      "enabledChannels": ["in_app"]
    }
  ]
}
```

`enabledChannels` must be a non-empty array of valid `NotificationChannel` values. Returns the full updated preference list (same shape as the saved-rows example above).

> **Validation gap:** each item in `preferences` is not currently deep-validated (`@ValidateNested()` is missing on the array), so a malformed item inside the array may not be rejected as strictly as the DTO annotations suggest. Send well-formed payloads regardless — don't rely on the API to reject bad shapes here.

---

## 5. Real-time delivery (WebSocket)

Namespace: **`/notifications`** (Socket.IO default transport path `/socket.io`, standard client behavior — you don't need to set `path` explicitly unless your Socket.IO client config requires it).

### Connecting

```js
import { io } from 'socket.io-client';

const socket = io(`${SOCKET_BASE_URL}/notifications`, {
  auth: { token: accessToken }, // same JWT used for REST Authorization header
});
```

Token resolution order on the server: `handshake.auth.token` → `handshake.query.token` → `handshake.headers.authorization` (`Bearer <token>`). Prefer `auth.token` — it's checked first and is the cleanest with the `socket.io-client` API. A `Bearer ` prefix is stripped automatically if present in `auth.token`/`query.token`.

The server **validates the full token against the remote auth service on every connection** (not a local JWT decode) and disconnects immediately — with no error event — if the token is missing or invalid. So: listen for `disconnect` after connecting and treat an immediate disconnect as an auth failure (e.g. expired token → refresh and reconnect).

On success, the server auto-joins the socket to a room scoped to that user (`user:{userId}`) and emits:

```js
socket.on('connected', (payload) => {
  // payload: { message: 'Connected to notifications', userId: 12345 }
});
```

### Events

| Event          | Direction       | Payload                                                   | Notes                                                                                                                                                                                                       |
| -------------- | --------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connected`    | server → client | `{ message: string, userId: number }`                     | ack on successful auth                                                                                                                                                                                      |
| `notification` | server → client | `{ id, type, title, message, data, priority, createdAt }` | fired whenever a new notification is created for this user _and_ its `channels` include `websocket`. `title`/`message` are already-flattened English strings (same caveat as REST — no locale support yet). |
| `ping`         | client → server | —                                                         | keep-alive                                                                                                                                                                                                  |
| `pong`         | server → client | `{ timestamp: Date }`                                     | reply to `ping`                                                                                                                                                                                             |

```js
socket.on('notification', (n) => {
  // n: { id, type, title, message, data, priority, createdAt }
  // Recommended: prepend to your local list AND bump the unread count locally,
  // rather than re-fetching /notifications/unread-count on every event.
});
```

**Do not rely on a `notification.read` socket event.** The gateway has a listener/emitter wired for it, but nothing in the codebase actually fires it — marking a notification read via `PATCH /notifications/:id/read` or `PATCH /notifications/read-all` produces **no real-time push** to the user's other open tabs/devices today. If you need cross-tab read-state sync, poll or re-fetch on focus; don't build against a socket event that never arrives.

**Scaling note (not a frontend concern, but explains a possible symptom):** the gateway tracks connected sockets in an in-process `Map`, not Redis-backed. If the backend runs multiple instances behind a load balancer without a Socket.IO Redis adapter, a client connected to instance A won't receive events triggered by a request handled on instance B. If you notice sporadic missed real-time events in a multi-instance deployment, this is why — falling back to periodic polling of `/notifications/unread-count` as a safety net is reasonable.

---

## 6. Activity Feed (the presentation layer)

`/api/activity-feed` wraps the same notification rows with UI-ready fields: category tabs, `icon`/`tone` for consistent styling, a human `contextLabel`, and a `target { resource, id }` for deep-linking — so you don't have to re-derive any of that client-side. Full reference: [activity-feed-api.md](./activity-feed-api.md).

Quick orientation:

- `GET /activity-feed?category=&includeRead=&page=&limit=` — same pagination shape as `/notifications`, plus a fixed, always-complete `tabs` array (`all`, `subscriptions`, `projects`, `customers`, `invoices`, `commissions`, `salesman`, `tickets`, `offers`) with per-tab counts, and `groups` bucketed by UTC date.
- `PATCH /activity-feed/:id/read`, `PATCH /activity-feed/read-all` — mirror the raw endpoints, operating on the same rows.
- `POST /activity-feed/seed` (non-production only, `403` in prod) — generates demo timeline data for UI development before all event sources are wired up.

**Important: real-time delivery for the Activity Feed is not a separate socket event.** The `notification` websocket event (§5) delivers the _raw_ shape only (`id, type, title, message, data, priority, createdAt`) — no `category`, `icon`, `tone`, `contextLabel`, or `target`. To keep an Activity Feed screen live, either:

- treat an incoming `notification` event as a signal to refetch `GET /activity-feed` (simplest, recommended), or
- re-derive the presentation fields client-side using the same rules documented in activity-feed-api.md (category-from-type map, priority→icon/tone rules, `data` key → target-resource scan) — more work, only worth it if you need to avoid a refetch round-trip.

Two gaps worth knowing before you build tab-based UI: `wallet.commission_paid` is not mapped to the "Commissions" tab (only `wallet.commission_added` is) and falls back to the "All" tab with a generic `bell` icon and `"Notification"` label. And three tabs (`subscriptions`, `tickets`, `offers`) currently have no event source at all — they'll always render as empty/zero-count, by design, not a bug.

---

## 7. What triggers a notification

Reference for building expectations into your UI (e.g. "will the customer see something here?") — none of this is invokable directly by the frontend.

| Event                               | Type                         | Recipient(s)                                  |
| ----------------------------------- | ---------------------------- | --------------------------------------------- |
| Project created                     | `project.created`            | creator (admin/salesman)                      |
| Project status changed              | `project.status_changed`     | project creator                               |
| Project priority changed            | `project.priority_changed`   | project creator                               |
| Contract created                    | `contract.created`           | salesman                                      |
| Contract confirmed by customer      | `contract.confirmed`         | salesman                                      |
| Contract approved                   | `contract.approved`          | customer **and** salesman (two notifications) |
| Contract rejected                   | `contract.rejected`          | customer **and** salesman                     |
| Invoice created                     | `invoice.created`            | customer                                      |
| Invoice due in 7 days               | `invoice.due_soon`           | customer                                      |
| Invoice overdue                     | `invoice.overdue`            | customer                                      |
| Invoice paid                        | `invoice.paid`               | customer                                      |
| Custom invoice created              | `custom_invoice.created`     | customer                                      |
| Custom invoice paid                 | `custom_invoice.paid`        | customer                                      |
| Payment received (Stripe or manual) | `payment.received`           | customer                                      |
| Commission credited                 | `wallet.commission_added`    | salesman                                      |
| Commission paid out                 | `wallet.commission_paid`     | salesman                                      |
| Customer document uploaded          | `customer.document_uploaded` | customer                                      |
| Customer meeting scheduled          | `customer.meeting_scheduled` | customer                                      |

All notification creation is fire-and-forget on the backend — a failure to create a notification never blocks or rolls back the underlying business action. Don't infer that an action succeeded/failed from whether a notification arrived.

---

## 8. Known gaps / things NOT to build against

- **No push notifications.** No FCM/APNs/OneSignal integration exists. Channels are strictly `in_app`, `websocket`, `email`.
- **No locale support yet**, despite the data model storing 4 languages — all title/message text is hardcoded English on both REST and websocket. Don't wire up an `Accept-Language` header expecting different output yet.
- **No `notification.read` real-time event** — read-state changes don't propagate over the socket. See §5.
- **`contract.awaiting_confirmation` and `customer.registered`** exist as enum values (and `contract.awaiting_confirmation` has a full default-channel/priority config) but have no code path that creates them today. Don't build UI that assumes these will appear.
- **No date-range filter** on `GET /notifications` (`from`/`to` etc. don't exist).
- **No bulk-by-ids mark-as-read** — only single (`:id/read`) and all (`read-all`).
- **No delete/dismiss endpoint** for notifications.
- `wallet.commission_paid` isn't mapped into the Activity Feed's "Commissions" tab (falls back to "All"). Confirm with backend if you need this fixed before shipping a Commissions-tab-dependent UI.
- The notification-preferences DB schema (Postgres enum) reserves space for ~30 notification types (e.g. `subscription.*`, `payment.failed`, `payment.refunded`) that don't exist in the current `NotificationType` TS enum or trigger table above — these are placeholders for future work, not active types.
