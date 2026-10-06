---
title: "Migrate user.scopes — Breaking Change: string[] → IUserScope[]"
version: "1.0"
date_created: "2026-06-14"
last_updated: "2026-06-14"
owner: "somion-task-manager front-end team"
tags: ["process", "architecture", "app", "auth", "rbac"]
---

# Introduction

The `@somion/sos-bar` shared package changed `IUser.scopes` from a flat `string[]`
to a structured `IUserScope[]` that preserves the per-scope role relationship.
This specification defines every change required inside the `somion-task-manager`
Next.js dashboard to correctly consume the new shape, prevent privilege-escalation
bugs, and maintain TypeScript type safety throughout the codebase.

---

## 1. Purpose & Scope

### Purpose
Adapt every layer of the dashboard — types, Redux state, middleware, auth callbacks,
UI components, and utilities — to the new `IUser.scopes: IUserScope[]` contract.

### Scope
All files inside `a:/Projects/somion-task-manager/` that either:
- Import `IUser` or `IUserRole` from `@somion/sos-bar`, or
- Read, store, or render `user.scopes` / `user.roles` at runtime.

### Audience
Front-end engineers implementing the migration. Assumes familiarity with
Next.js 14 App Router, Redux Toolkit, and the `@somion/sos-bar` package API.

### Assumptions
- The auth service already returns `scopes: IUserScope[]` at runtime even though
  the installed `node_modules` type declaration still shows `scopes: string[]`.
- The package will eventually ship `IUserScope` as an exported type; until then
  a local fallback definition is required.
- `user.roles: IUserRole[]` remains a flat deduplicated array across all scopes
  and is **not** removed — it is retained for legacy compatibility only.
- The target scope identifier for this dashboard is `"task_manager"`.

---

## 2. Definitions

| Term | Definition |
|---|---|
| **`IUserScope`** | New type: `{ scope: string; roles: IUserRole[] }`. Represents one scope the user belongs to, together with the roles they hold exclusively within that scope. |
| **`IUserRole`** | Union type `"super_admin" \| "developer" \| "viewer" \| "project_manager"`. Unchanged. |
| **`user.scopes`** | The new `IUserScope[]` field on `IUser`. Previously `string[]`. |
| **`user.roles`** | Flat deduplicated `IUserRole[]` across all scopes. Unchanged but logically risky for cross-scope users. |
| **`flat roles`** | The old pattern of reading `user.roles` directly for authorization decisions. |
| **`scope-narrowed roles`** | The new correct pattern: reading roles only from the relevant scope entry in `user.scopes`. |
| **`scopeGuard`** | A utility function that checks whether a user belongs to a given scope. |
| **`task_manager` scope** | The scope identifier this dashboard lives under. All dashboard routes require this scope. |
| **`USER_COOKIE`** | Browser cookie holding the serialized `IUser` object (minus `permissions`). |
| **`sos-bar`** | Short for `@somion/sos-bar` — the shared auth/UI package. |
| **`UnifiedSidebar`** | The local copy of the sidebar component at `components/special-shared/UnifiedSidebar/`. |

---

## 3. Requirements, Constraints & Guidelines

### New Type — Local Fallback

- **REQ-001**: A local `IUserScope` interface **must** be defined in `types/user.ts` as a fallback until the package exports it:
  ```ts
  export interface IUserScope {
    scope: string;
    roles: IUserRole[];
  }
  ```
- **REQ-002**: Once the package exports `IUserScope`, the local definition must be removed and replaced with the package import. A `// TODO: remove when sos-bar exports IUserScope` comment must mark the local definition.

### State & Type Alignment

- **REQ-003**: `IAuthState.user` in `types/user.ts` must be updated so the inferred `scopes` field resolves to `IUserScope[]`. Because `IUser` from the package still declares `scopes: string[]`, a local type override or module augmentation must be used until the package is updated.
- **REQ-004**: The `setUser` Redux action payload type must accept `scopes: IUserScope[]` without casting to `any`.
- **REQ-005**: The user object persisted to `USER_COOKIE` must include the full `IUserScope[]` array so the middleware can read it.

### Scope Guard Utility

- **REQ-006**: A `scopeGuard` utility function must be created at `lib/scope-guard.ts`:
  ```ts
  import { IUserScope } from "@/types/user";

  export function hasScope(scopes: IUserScope[], scopeName: string): boolean {
    return scopes.some((s) => s.scope === scopeName);
  }

  export function getRolesForScope(
    scopes: IUserScope[],
    scopeName: string
  ): string[] {
    return scopes.find((s) => s.scope === scopeName)?.roles ?? [];
  }
  ```
- **REQ-007**: All scope membership checks across the codebase must use `hasScope` or `getRolesForScope` — never `user.scopes.includes(...)` or `user.scopes[i]` treated as a string.

### Middleware

- **REQ-008**: `middleware.ts` must add a `task_manager` scope guard immediately after parsing the user cookie. Users who are authenticated but do not have `"task_manager"` in their scopes must be redirected to `SOS_URL` (the same redirect already used for unauthorized routes).
- **REQ-009**: The middleware must parse `userData?.scopes` as `IUserScope[]` (not `string[]`) when reading from the cookie.
- **REQ-010**: The existing `hasAccessToRoute` and `getDefaultRedirectPath` functions may continue to use the flat `userRoles` array because they operate on roles, not scopes. They must not be changed in a way that breaks existing role-based routing.
- **CON-001**: The scope guard in the middleware must run **before** the role-based route check, not after.

### Auth Callbacks

- **REQ-011**: In `app/[locale]/auth/page.tsx`, the `onSuccess` callback's `data` parameter must be typed — replace `{ user: any; token: string }` with a typed interface that correctly types `user.scopes` as `IUserScope[]`.
- **REQ-012**: The `permissions` destructure/omit in `onSuccess` must continue to strip `permissions` before dispatching. The `scopes: IUserScope[]` field must pass through to the Redux store without transformation.

### Dev Login Mapper (`not-allowed/page.tsx`)

- **REQ-013**: `mapApiUserToAuthUser` must be updated to explicitly map `scopes` from the raw API response:
  ```ts
  const scopes: IUserScope[] = Array.isArray(apiUser.scopes)
    ? (apiUser.scopes as IUserScope[])
    : [];
  return { ...rest, roles, scopes } as Omit<IUser, "userRoles" | "permissions">;
  ```
- **REQ-014**: The raw `scopes` field must be destructured out of `apiUser` (alongside `userRoles` and `permissions`) to prevent it being spread into `rest` with the wrong type.
- **CON-002**: The dev login endpoint (`DEV_AUTH_LOGIN_URL`) may or may not return the new `IUserScope[]` shape. The mapper must handle both: if entries are strings, coerce to `{ scope: string, roles: [] }`; if already objects, use as-is.

### Sidebar — Scope-Narrowed Role Extraction

- **REQ-015**: `components/layout/Sidebar/index.tsx` must replace the flat `user?.roles || []` extraction with scope-narrowed extraction:
  ```ts
  const userRoles = getRolesForScope(user?.scopes ?? [], "task_manager");
  ```
  This ensures sidebar items are filtered only by roles the user holds within the `task_manager` scope.
- **REQ-016**: The `userRole` prop passed to `<UnifiedSidebar>` must be the scope-narrowed array, not the global flat `user.roles`.
- **GUD-001**: If `getRolesForScope` returns an empty array (user has no `task_manager` scope), the sidebar must render no items — the middleware scope guard (REQ-008) should have already redirected the user away.

### PermissionsWrapper — Scope Prop

- **REQ-017**: `components/shared/PermissionsWrapper/index.tsx` must accept an optional `scope?: string` prop.
- **REQ-018**: When `scope` is provided, the role check must be performed against `getRolesForScope(user?.scopes ?? [], scope)` instead of the flat `user.roles`.
- **REQ-019**: When `scope` is **not** provided, the existing behavior using `user.roles` must be preserved for backwards compatibility.
- **GUD-002**: All new call-sites of `PermissionsWrapper` added after this migration must supply the `scope` prop.

### TypeScript Audit

- **REQ-020**: A full TypeScript compilation (`tsc --noEmit`) must pass with zero errors after all changes.
- **REQ-021**: The following files must be individually reviewed for type errors caused by the `scopes` shape change:

  | File | Risk |
  |---|---|
  | `types/tasks.ts` | Imports `IUser` — used in task assignee types |
  | `types/chat.ts` | Imports `IUser` — used in chat message author types |
  | `hooks/use-comments.ts` | Imports `IUser` — may surface `scopes` in comment author |
  | `components/shared/SetUserOnline/index.tsx` | Imports `IUser` |
  | `components/shared/SetUserNotifications/index.tsx` | Imports `IUser` |
  | `components/shared/comments/CommentInput/index.tsx` | Imports `IUser` |
  | `components/shared/comments/CommentItem/index.tsx` | Imports `IUser` |
  | `components/shared/comments/FullCommentsDialog/index.tsx` | Imports `IUser` |
  | `components/shared/comments/MentionSuggestions/index.tsx` | Imports `IUser` |
  | `components/pages/team/team-details/TeamDetailsSheet/index.tsx` | Imports `IUser` |
  | `components/pages/team/team-details/TeamDetailsSheet/HeadersDetails.tsx` | Imports `IUser` |
  | `components/dialogs/teams/EditUserRoleDialog/index.tsx` | Imports `IUser`, `IUserRole` |
  | `components/dialogs/teams/InvitePeopleDialog/index.tsx` | Imports `IUserRole` |
  | `redux/features/users/usersApi.ts` | Imports `IUser`, `IRole` |
  | `redux/features/auth/authApi.ts` | Imports `IUser` |

### Cookie Size Risk

- **REQ-022**: `logCookieSize` (already called in `authSlice.ts`) must remain in place. If the serialized user cookie exceeds **3 KB**, a console warning must be emitted.
- **CON-003**: `IUserScope[]` is larger than `string[]`. Avoid storing `roles` details redundantly. If the cookie exceeds 4 KB, strip `scopes[*].roles` from the persisted object and re-derive them from the token on page load instead.

### Forbidden Patterns

- **PAT-001**: **Never** use `user.scopes.includes(scopeName)` — `scopes` is no longer `string[]`.
- **PAT-002**: **Never** access `user.scopes[i]` and treat the result as a `string`.
- **PAT-003**: **Never** use the flat `user.roles` for access decisions in new code. Use `getRolesForScope` instead.
- **PAT-004**: **Never** bypass the `hasScope` utility with inline `.some(s => s.scope === ...)` — all scope checks must go through the shared utility for consistency.

---

## 4. Interfaces & Data Contracts

### `IUserScope` (local fallback until package update)

```ts
// types/user.ts
// TODO: remove when @somion/sos-bar exports IUserScope
export interface IUserScope {
  scope: string;
  roles: IUserRole[];
}
```

### Updated `IAuthState`

```ts
// types/user.ts
export interface IAuthState {
  user: (Omit<IUser, "userRoles" | "permissions" | "scopes"> & {
    scopes: IUserScope[];
  }) | null;
  token: string | null;
}
```

### `scopeGuard` utility (`lib/scope-guard.ts`)

```ts
import type { IUserScope } from "@/types/user";

export function hasScope(scopes: IUserScope[], scopeName: string): boolean {
  return scopes.some((s) => s.scope === scopeName);
}

export function getRolesForScope(
  scopes: IUserScope[],
  scopeName: string
): string[] {
  return scopes.find((s) => s.scope === scopeName)?.roles ?? [];
}
```

### Middleware Scope Check (pseudocode)

```ts
// middleware.ts — insert after userData is parsed from cookie
import { hasScope } from "@/lib/scope-guard";

const userScopes: IUserScope[] = (userData?.scopes as IUserScope[]) ?? [];
const hasDashboardAccess = hasScope(userScopes, "task_manager");

if (
  isAuthenticated &&
  !hasDashboardAccess &&
  !isPublicRoute &&
  !isTokenValidationPage
) {
  const redirectParam = encodeURIComponent(request.url);
  const sosUrl = new URL(SOS_URL);
  sosUrl.searchParams.set("redirect", redirectParam);
  sosUrl.searchParams.set("scope", "task_manager");
  return NextResponse.redirect(sosUrl);
}
```

### Updated Sidebar Role Extraction

```ts
// components/layout/Sidebar/index.tsx
import { getRolesForScope } from "@/lib/scope-guard";

const userRoles = getRolesForScope(user?.scopes ?? [], "task_manager");
// Pass userRoles (scope-narrowed) to <UnifiedSidebar userRole={userRoles} />
```

### Updated PermissionsWrapper Props

```ts
interface PermissionsWrapperProps {
  roles?: IUserRole[];
  excludeRoles?: IUserRole[];
  scope?: string;          // NEW — narrows role check to this scope
  children: ReactNode;
}
```

### Dev Login Mapper

```ts
function mapApiUserToAuthUser(apiUser: {
  userRoles?: { role?: { name: string } }[];
  scopes?: unknown;         // explicit — was spread into rest before
  permissions?: unknown;
  [key: string]: unknown;
}): Omit<IUser, "userRoles" | "permissions"> & { scopes: IUserScope[] } {
  const { userRoles, permissions: _omitPerms, scopes: rawScopes, ...rest } = apiUser;

  const roles: IUserRole[] =
    userRoles?.map((ur) => ur.role?.name).filter((n): n is IUserRole => !!n) ?? [];

  const scopes: IUserScope[] = Array.isArray(rawScopes)
    ? rawScopes.map((s) =>
        typeof s === "string"
          ? { scope: s, roles: [] }   // coerce legacy string shape
          : (s as IUserScope)
      )
    : [];

  return { ...rest, roles, scopes } as any;
}
```

---

## 5. Acceptance Criteria

- **AC-001**: Given a user authenticated in the `task_manager` scope with role `developer`, when they navigate to `/projects`, then they are granted access and the sidebar shows only items allowed for `developer`.
- **AC-002**: Given a user authenticated **without** the `task_manager` scope (e.g. only `sales` scope), when they hit any dashboard route, then the middleware redirects them to `SOS_URL` with `scope=task_manager`.
- **AC-003**: Given a user with `super_admin` in `task_manager` and `developer` in `sales`, when `PermissionsWrapper scope="task_manager"` checks for `super_admin`, then access is granted; when checking without a scope, `user.roles` (flat) is used as before.
- **AC-004**: Given the old pattern `user.scopes.includes("task_manager")` anywhere in the codebase, when `tsc --noEmit` is run, then a TypeScript error is produced (because `scopes` is `IUserScope[]`, not `string[]`).
- **AC-005**: Given the `setUser` action is dispatched with a user object whose `scopes` is `IUserScope[]`, when the cookie is read back in the middleware, then `JSON.parse` produces the correct `IUserScope[]` structure.
- **AC-006**: Given the dev login flow on `/auth/not-allowed`, when an account with the new `IUserScope[]` API response logs in, then the user is stored in Redux with the correct `scopes` shape and the middleware does not redirect them.
- **AC-007**: Given the dev login flow receives a legacy API response with `scopes: string[]`, when `mapApiUserToAuthUser` processes it, then each string is coerced to `{ scope: string, roles: [] }` without throwing.
- **AC-008**: Given `tsc --noEmit` is run after all changes, then zero type errors are reported.
- **AC-009**: Given `logCookieSize` is called after `setUser`, when the serialized user object exceeds 3 KB, then a console warning is visible in the browser dev tools.
- **AC-010**: Given `<PermissionsWrapper roles={["super_admin"]} scope="task_manager">`, when the user has `super_admin` only in the `sales` scope (not `task_manager`), then the children are **not** rendered.

---

## 6. Test Automation Strategy

- **Test Levels**: Unit (utility functions), Integration (Redux slice + middleware logic), Manual E2E (browser auth flow).
- **Unit Tests**:
  - `lib/scope-guard.ts` — `hasScope` and `getRolesForScope` with: empty array, scope present, scope absent, scope present but empty roles.
  - `mapApiUserToAuthUser` in `not-allowed/page.tsx` — new shape, legacy string shape, mixed, empty.
  - `PermissionsWrapper` — with and without `scope` prop, with `excludeRoles`.
- **TypeScript Compilation**:
  - `npx tsc --noEmit` must pass as part of CI.
- **Manual E2E**:
  - Login via `/auth` with a token from an account that has `task_manager` scope → should land on dashboard.
  - Login via `/auth` with a token from an account that lacks `task_manager` scope → should redirect to SOS.
  - Login via `/auth/not-allowed` dev login with the new API shape → should work.
- **Coverage**: Utility functions in `lib/scope-guard.ts` must reach 100% branch coverage.

---

## 7. Rationale & Context

The previous `string[]` for `user.scopes` discarded which roles a user held in which scope. A user with `developer` in `task_manager` and `super_admin` in `sales` would have the flat `user.roles = ["developer", "super_admin"]`, effectively granting `super_admin` privileges inside the task manager dashboard. The new `IUserScope[]` structure allows each dashboard to evaluate only the roles relevant to its own scope, eliminating cross-scope privilege escalation.

The flat `user.roles` is preserved solely for backwards compatibility with existing components that have not yet been migrated. All new authorization code must use scope-narrowed role lookups.

---

## 8. Dependencies & External Integrations

### External Systems
- **EXT-001**: `@somion/sos-bar` — shared auth/UI package. The `IUser.scopes` type must eventually export `IUserScope`; until then a local fallback is used.
- **EXT-002**: Auth service (`devauthservice.somion.ch`) — already returning `scopes: IUserScope[]` in responses.

### Third-Party Services
- **SVC-001**: SOS (Single Sign-On service at `SOS_URL`) — redirect target for users lacking the `task_manager` scope.

### Infrastructure Dependencies
- **INF-001**: Browser cookies — must remain under the 4 KB browser cookie limit after storing `scopes: IUserScope[]`.

### Technology Platform Dependencies
- **PLT-001**: Next.js 14 App Router middleware (`middleware.ts`) — scope guard runs in the Edge runtime; only Web APIs and lightweight imports are permitted (no Node.js-only modules).
- **PLT-002**: TypeScript strict mode — all new code must be free of `any` casts except where explicitly justified and commented.

### Compliance Dependencies
- **COM-001**: Scope-based access control — users must only receive the privileges of their roles within the `task_manager` scope, not their global accumulated roles.

---

## 9. Examples & Edge Cases

### Correct Scope Check

```ts
// ✅ Check scope membership
const hasAccess = hasScope(user.scopes, "task_manager");

// ✅ Get roles for this dashboard only
const roles = getRolesForScope(user.scopes, "task_manager");

// ✅ Check a specific role within this scope
const isAdmin = roles.includes("super_admin");

// ✅ Get all scope names (replaces old string[] usage)
const scopeNames = user.scopes.map((s) => s.scope);
```

### Forbidden Patterns

```ts
// ❌ BROKEN — scopes is IUserScope[], not string[]
user.scopes.includes("task_manager");

// ❌ BROKEN — scopes[i] is an object, not a string
if (user.scopes[0] === "task_manager") { ... }

// ❌ RISKY — flat roles include roles from other scopes
if (user.roles.includes("super_admin")) { ... }
```

### Edge Case — User With No `task_manager` Scope

```ts
getRolesForScope([], "task_manager");
// → []

getRolesForScope([{ scope: "sales", roles: ["super_admin"] }], "task_manager");
// → []

hasScope([], "task_manager");
// → false
```

### Edge Case — Legacy Dev Login Response (string scopes)

```ts
// API returns: { scopes: ["task_manager", "sales"] }
// mapApiUserToAuthUser coerces to:
// [{ scope: "task_manager", roles: [] }, { scope: "sales", roles: [] }]
```

### Edge Case — Cookie Size Overflow

If a user belongs to many scopes with many roles, the serialized object may grow large.
Apply the following mitigation in `authSlice.ts` before calling `setCookie`:

```ts
const userForCookie = {
  ...lightWeightUser,
  scopes: lightWeightUser.scopes.map(({ scope, roles }) => ({ scope, roles })),
  // Omit any large nested fields not needed by the middleware or sidebar
};
```

---

## 10. Validation Criteria

- [ ] `tsc --noEmit` exits with code 0
- [ ] `hasScope` and `getRolesForScope` have unit tests covering all branches
- [ ] `user.scopes.includes(` does not appear anywhere in `*.ts` / `*.tsx` (verify with grep)
- [ ] `user.scopes[` followed by `=== "` or `!== "` does not appear anywhere (verify with grep)
- [ ] Middleware correctly redirects a user with no `task_manager` scope — manually verified
- [ ] Sidebar renders only the roles available within `task_manager` scope — manually verified
- [ ] Cookie size is logged and does not exceed 4 KB in tested accounts
- [ ] Dev login at `/auth/not-allowed` works for both new (`IUserScope[]`) and legacy (`string[]`) API shapes
- [ ] `PermissionsWrapper` with `scope="task_manager"` correctly restricts users that hold the role in another scope only

---

## 11. Phased Execution Order

Execute changes in this order to avoid intermediate broken states:

| Phase | Action | Files |
|---|---|---|
| 1 | Define local `IUserScope` + update `IAuthState` | `types/user.ts` |
| 2 | Create `scopeGuard` utility | `lib/scope-guard.ts` *(new)* |
| 3 | Update middleware scope gate | `middleware.ts` |
| 4 | Update auth callback typing | `app/[locale]/auth/page.tsx` |
| 5 | Update dev login mapper | `app/[locale]/auth/not-allowed/page.tsx` |
| 6 | Update Redux `authSlice` cookie serialization | `redux/features/auth/authSlice.ts` |
| 7 | Update Sidebar role extraction | `components/layout/Sidebar/index.tsx` |
| 8 | Update `PermissionsWrapper` scope prop | `components/shared/PermissionsWrapper/index.tsx` |
| 9 | TypeScript audit pass | All files in REQ-021 table |
| 10 | Run `tsc --noEmit` + validate all acceptance criteria | — |

---

## 12. Related Specifications / Further Reading

- [spec-design-comment-file-attachments.md](file:///a:/Projects/somion-task-manager/spec/spec-design-comment-file-attachments.md) — existing spec in this repo
- `@somion/sos-bar` source: `src/types/user.ts`, `src/utils/user-mapper.ts`
- Next.js Edge Middleware constraints: https://nextjs.org/docs/app/building-your-application/routing/middleware
