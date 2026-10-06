---
title: Role-Based Sidebar and Route Protection
version: 1.0
date_created: 2026-08-13
last_updated: 2026-08-13
owner: Frontend
tags: [design, app, architecture, roles, sidebar, routing]
---

# Introduction

This specification defines how to implement **role-based sidebar navigation** and **route protection** for the Sales Dashboard, aligned with the Figma file **Salesman Dashboard Final design** (Admin, Manager, Sales Man, Customer pages).

The existing `useRole` hook (`hooks/useRole.ts`) and `AppRole` type (`types/role.ts`) are the **single source of truth** for the current user role. Sidebar filtering and route guards must consume the same role value (via `useRole` on the client; via `app_role` cookie when server-side checks are added later).

# 1. Purpose & Scope

## Purpose

- Render only the navigation items each role is allowed to see.
- Prevent direct URL access to routes a role should not use.
- Support **label overrides per role** where Figma uses different names for the same module (e.g. Projects vs Deals).
- Keep **one route per module** — no duplicate routes for naming aliases.

## In Scope

- Sidebar item filtering and label mapping per `AppRole`.
- Client-side route protection in the dashboard layout.
- Shared access configuration (paths, allowed roles, labels).
- Integration with existing `RoleSwitcher` for local/dev testing.

## Out of Scope (follow-up work)

- Real authentication / JWT integration (replace cookie dev switcher).
- API-level data scoping (department, own records) — documented here as notes only.
- Building missing pages (`/activity-feed`, `/commissions`).
- Per-page action guards beyond existing `isCustomer` / `isAdmin` patterns (can reuse same access config later).

## Assumptions

- All four roles live in the **same** Next.js app under `app/[locale]/(dashboard)/`.
- Figma **Projects flow is identical** for Admin and Manager (UI parity; data scope differs at API layer).
- **Naming aliases** refer to the same module and route:

| Figma label (role) | Canonical module | Route |
| ------------------ | ---------------- | ----- |
| Projects / Deals | Projects | `/projects` |
| Packages / Bundles | Packages | `/packages` |
| Loyalty / Rewards (customer) | Loyalty | `/loyalty` |

# 2. Definitions

| Term | Definition |
| ---- | ---------- |
| `AppRole` | One of: `admin`, `manager`, `salesman`, `customer` |
| `useRole` | Client hook reading/writing role from `app_role` cookie |
| Canonical route | The single Next.js path for a module (e.g. `/projects`) |
| Display label | Sidebar text shown to the user; may vary by role |
| Route protection | Redirect or block when role lacks access to pathname |
| Data scope | Which records a role sees (all / department / own) — backend concern |

# 3. Requirements, Constraints & Guidelines

## Sidebar

- **REQ-SB-001**: Sidebar MUST filter items based on `useRole().role`.
- **REQ-SB-002**: Sidebar MUST use a **central access config** — not ad-hoc `if` checks scattered in components.
- **REQ-SB-003**: Sidebar MUST support **per-role display labels** for alias modules (Projects/Deals, Packages/Bundles, Loyalty/Rewards).
- **REQ-SB-004**: Sidebar MUST update immediately when role changes via `RoleSwitcher` (same `useSyncExternalStore` subscription as `useRole`).
- **REQ-SB-005**: Breadcrumb (`components/shared/Breadcrumb`) MUST use the same filtered sidebar config so labels stay consistent.

## Route protection

- **REQ-RP-001**: Dashboard layout MUST redirect unauthorized roles away from protected paths.
- **REQ-RP-002**: Unauthorized access MUST redirect to `/` (dashboard home for that role), not show a broken page.
- **REQ-RP-003**: Route matching MUST support nested paths (e.g. `/plan-management/categories` inherits `/plan-management` access).
- **REQ-RP-004**: Route protection MUST read the same `AppRole` as `useRole` (cookie: `app_role`).
- **REQ-RP-005**: Routes that do not exist yet (e.g. `/activity-feed`) SHOULD still be in the access config but MAY show a placeholder or redirect until implemented.

## Architecture

- **CON-001**: Do NOT duplicate role logic — extend `types/role.ts` or add `lib/role-access.ts`; consume from sidebar and layout guard.
- **CON-002**: Do NOT add separate routes for Deals or Bundles.
- **CON-003**: Keep types in `@/types/` per project AGENTS.md (access types may live in `types/role.ts` or `types/navigation.ts`).
- **GUD-001**: Prefer `role` enum checks in config tables over long switch statements in components.
- **GUD-002**: Pages already using `useRole` for content (invoices, tickets, loyalty, etc.) remain unchanged; this spec covers **navigation and access** only.

# 4. Role Access Matrix (from Figma)

## Sidebar visibility

| Module | Route | Admin | Manager | Salesman | Customer | Notes |
| ------ | ----- | :---: | :-----: | :------: | :------: | ----- |
| Dashboard | `/` | ✅ | ✅ | ✅ | ✅ | All roles |
| Projects | `/projects` | ✅ | ✅ | ✅ | ✅ | Label: **Deals** for salesman |
| Plan Management | `/plan-management` | ✅ | ✅ | ❌ | ❌ | Includes sub-routes |
| Packages | `/packages` | ✅ | ✅ | ✅ | ❌ | Label: **Bundles** for salesman |
| Salesman | `/salesman` | ✅ | ✅ | ❌ | ❌ | Team management |
| Customers | `/customers` | ✅ | ✅ | ✅ | ❌ | Salesman: own customers only (data) |
| Subscriptions | `/subscriptions` | ✅ | ✅ | ❌ | ✅ | |
| User Management | `/user-management` | ✅ | ❌ | ❌ | ❌ | Admin only |
| Coupons | `/coupons` | ✅ | ✅ | ✅ | ❌ | |
| Loyalty | `/loyalty` | ✅ | ✅ | ❌ | ✅ | Label: **Rewards** for customer |
| Invoices | `/invoices` | ✅ | ✅ | ❌ | ✅ | |
| Offers | `/offers` | ✅ | ✅ | ❌ | ✅ | |
| Tickets | `/tickets` | ✅ | ✅ | ❌ | ✅ | |
| Activity Feed | `/activity-feed` | ✅ | ✅ | ❌ | ❌ | Page not implemented yet |
| Commissions | `/commissions` | ✅ | ✅ | ✅ | ❌ | Page not implemented yet |
| Profile | `/profile` | ✅ | ✅ | ✅ | ✅ | Header/settings; optional in sidebar |

## Data scope (API — not enforced by this spec)

| Role | Scope |
| ---- | ----- |
| Admin | Organization-wide |
| Manager | Department / team |
| Salesman | Own customers, own projects/deals |
| Customer | Own projects, subscriptions, invoices, tickets |

## Figma parity notes

- Admin dashboard: quick actions **New Salesman**, **New Project** — already partially implemented (`isAdmin` on dashboard).
- Manager dashboard: **Project Await To Approve**, **All Department Projects** — separate dashboard task; not part of sidebar spec.
- Salesman dashboard: **New Customer**, **New Deal** — partially implemented (`isSalesman`).
- Customer dashboard: subscription/invoice-focused stats — separate dashboard task.
- Admin + Manager **Projects screens are identical** in Figma; same routes and components, different data filters later.

# 5. Interfaces & Data Contracts

## 5.1 Extend types (`types/role.ts` or new `types/navigation.ts`)

```typescript
import type { AppRole } from "@/types/role";

export type NavItemConfig = {
  /** Canonical path used for routing and access checks */
  path: string;
  /** Default sidebar label */
  label: string;
  icon: string;
  /** Roles allowed to see this item and access this route */
  roles: AppRole[];
  /** Optional label override per role (Figma aliases) */
  labelsByRole?: Partial<Record<AppRole, string>>;
};

export type RouteAccessConfig = {
  path: string;
  roles: AppRole[];
  /** If true, also matches pathname.startsWith(`${path}/`) */
  matchPrefix?: boolean;
};
```

## 5.2 Navigation config (`lib/navigation.ts` — suggested location)

```typescript
export const NAV_ITEMS: NavItemConfig[] = [
  {
    path: "/",
    label: "Dashboard",
    icon: "solar:home-2-linear",
    roles: ["admin", "manager", "salesman", "customer"],
  },
  {
    path: "/projects",
    label: "Projects",
    icon: "solar:folder-linear",
    roles: ["admin", "manager", "salesman", "customer"],
    labelsByRole: { salesman: "Deals" },
  },
  {
    path: "/plan-management",
    label: "Plan Management",
    icon: "solar:chart-2-linear",
    roles: ["admin", "manager"],
  },
  {
    path: "/packages",
    label: "Packages",
    icon: "solar:box-linear",
    roles: ["admin", "manager", "salesman"],
    labelsByRole: { salesman: "Bundles" },
  },
  {
    path: "/salesman",
    label: "Salesman",
    icon: "solar:users-group-rounded-linear",
    roles: ["admin", "manager"],
  },
  {
    path: "/customers",
    label: "Customers",
    icon: "solar:user-linear",
    roles: ["admin", "manager", "salesman"],
  },
  {
    path: "/subscriptions",
    label: "Subscriptions",
    icon: "solar:refresh-circle-linear",
    roles: ["admin", "manager", "customer"],
  },
  {
    path: "/user-management",
    label: "User Management",
    icon: "solar:user-plus-linear",
    roles: ["admin"],
  },
  {
    path: "/coupons",
    label: "Coupons",
    icon: "solar:sale-linear",
    roles: ["admin", "manager", "salesman"],
  },
  {
    path: "/loyalty",
    label: "Loyalty",
    icon: "solar:cup-star-linear",
    roles: ["admin", "manager", "customer"],
    labelsByRole: { customer: "Rewards" },
  },
  {
    path: "/invoices",
    label: "Invoices",
    icon: "solar:bill-list-linear",
    roles: ["admin", "manager", "customer"],
  },
  {
    path: "/offers",
    label: "Offers",
    icon: "solar:document-text-linear",
    roles: ["admin", "manager", "customer"],
  },
  {
    path: "/tickets",
    label: "Tickets",
    icon: "solar:ticket-linear",
    roles: ["admin", "manager", "customer"],
  },
  {
    path: "/activity-feed",
    label: "Activity Feed",
    icon: "solar:graph-up-linear",
    roles: ["admin", "manager"],
  },
  {
    path: "/commissions",
    label: "Commissions",
    icon: "solar:wallet-money-linear",
    roles: ["admin", "manager", "salesman"],
  },
];
```

## 5.3 Helper functions (`lib/role-access.ts`)

```typescript
/** Resolve sidebar label for role (handles aliases) */
function getNavLabel(item: NavItemConfig, role: AppRole): string;

/** Filter NAV_ITEMS for sidebar */
function getSidebarItemsForRole(role: AppRole): SidebarNavItem[];

/** Check if role can access pathname (handles locale prefix strip) */
function canAccessRoute(role: AppRole, pathname: string): boolean;

/** First allowed route for role (fallback redirect target) */
function getDefaultRouteForRole(role: AppRole): string;
```

**Pathname normalization:** Strip locale prefix (`/en`, `/ar`) before matching, consistent with `@/i18n/routing`.

**Special case — `/`:** Exact match only; do not treat every path as matching `/`.

## 5.4 Update `useSidebarItems`

```typescript
export const useSidebarItems = () => {
  const pathname = usePathname();
  const { role } = useRole();
  const sidebarItems = useMemo(
    () => [{ title: "", items: getSidebarItemsForRole(role) }],
    [role],
  );
  // ... isActive, isActiveStartsWith unchanged
};
```

## 5.5 Route guard component

Add `components/layout/RouteGuard/index.tsx` (client component):

```typescript
"use client";

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!canAccessRoute(role, pathname)) {
      router.replace(getDefaultRouteForRole(role));
    }
  }, [role, pathname, router]);

  if (!canAccessRoute(role, pathname)) return null; // or loading skeleton

  return children;
}
```

Wrap in `app/[locale]/(dashboard)/layout.tsx`:

```tsx
<RouteGuard>
  {/* existing shell: Sidebar, Header, main */}
</RouteGuard>
```

## 5.6 Profile route

`/profile` is accessible to all roles but may not appear in sidebar (header avatar link). Add to route access config with all roles; omit from `NAV_ITEMS` if not shown in sidebar.

# 6. Implementation Plan

## Phase 1 — Shared config (foundation)

| Step | Task | Files |
| ---- | ---- | ----- |
| 1.1 | Add `NavItemConfig` / route access types | `types/navigation.ts` |
| 1.2 | Define `NAV_ITEMS` and route rules | `lib/navigation.ts`, `lib/role-access.ts` |
| 1.3 | Unit-test `canAccessRoute` for all roles × paths | `lib/role-access.test.ts` (optional) |

## Phase 2 — Sidebar

| Step | Task | Files |
| ---- | ---- | ----- |
| 2.1 | Refactor `useSidebarItems` to use `useRole` + config | `components/layout/Sidebar/useSidebarItems.ts` |
| 2.2 | Verify `RoleSwitcher` instantly updates sidebar | Manual QA |
| 2.3 | Confirm Breadcrumb still resolves labels | `components/shared/Breadcrumb/index.tsx` |

## Phase 3 — Route protection

| Step | Task | Files |
| ---- | ---- | ----- |
| 3.1 | Create `RouteGuard` client component | `components/layout/RouteGuard/index.tsx` |
| 3.2 | Wrap dashboard layout | `app/[locale]/(dashboard)/layout.tsx` |
| 3.3 | Handle locale-prefixed paths | `lib/role-access.ts` |

## Phase 4 — QA matrix

Test with `RoleSwitcher` for each role:

| Role | Should reach | Should NOT reach (redirect `/`) |
| ---- | ------------ | --------------------------------- |
| Admin | All sidebar routes | — |
| Manager | All except `/user-management` | `/user-management` |
| Salesman | `/`, `/projects`, `/customers`, `/coupons`, `/packages`, `/commissions` | `/plan-management`, `/user-management`, `/salesman`, … |
| Customer | `/`, `/projects`, `/subscriptions`, `/invoices`, `/loyalty`, `/offers`, `/tickets` | `/customers`, `/plan-management`, `/user-management`, … |

## Phase 5 — Follow-ups (separate tasks)

- Implement `/activity-feed` and `/commissions` pages (or temporary "Coming soon").
- Manager/customer dashboard variants (content, not navigation).
- Middleware-based guard reading `app_role` cookie for SSR hardening.
- Replace cookie dev switcher with real auth when API is ready.

# 7. Acceptance Criteria

- **AC-001**: Given role is `manager`, when sidebar renders, then **User Management** is not visible.
- **AC-002**: Given role is `salesman`, when sidebar renders, then Projects item label is **Deals** and path is `/projects`.
- **AC-003**: Given role is `customer`, when sidebar renders, then Loyalty item label is **Rewards** and path is `/loyalty`.
- **AC-004**: Given role is `customer`, when user navigates to `/user-management`, then user is redirected to `/`.
- **AC-005**: Given role is `admin`, when user navigates to any configured route, then access is allowed.
- **AC-006**: Given role changes via `RoleSwitcher`, when on a now-forbidden route, then user is redirected on next render.
- **AC-007**: Given pathname is `/en/plan-management/categories`, when role is `salesman`, then access is denied.
- **AC-008**: Given pathname is `/profile`, when role is any `AppRole`, then access is allowed.

# 8. Files to Create / Modify

## Create

| File | Purpose |
| ---- | ------- |
| `types/navigation.ts` | Nav and access types |
| `lib/navigation.ts` | `NAV_ITEMS` constant |
| `lib/role-access.ts` | `canAccessRoute`, `getSidebarItemsForRole`, helpers |
| `components/layout/RouteGuard/index.tsx` | Client route guard |

## Modify

| File | Change |
| ---- | ------ |
| `components/layout/Sidebar/useSidebarItems.ts` | Filter via `useRole` + config |
| `app/[locale]/(dashboard)/layout.tsx` | Wrap with `RouteGuard` |
| `components/shared/Breadcrumb/index.tsx` | Use resolved labels if needed |

## Do not modify (already correct)

| File | Reason |
| ---- | ------ |
| `hooks/useRole.ts` | Source of truth — consume only |
| `types/role.ts` | `AppRole` + cookie name |
| `components/layout/DashboardHeader/RoleSwitcher/index.tsx` | Dev/testing switcher |

# 9. Test Automation Strategy

- **Manual**: Role switcher × full sidebar visibility matrix × direct URL bar tests.
- **Unit** (recommended): `canAccessRoute` and `getSidebarItemsForRole` pure functions.
- **E2E** (optional): Playwright with cookie `app_role` preset per test.

# 10. Open Questions

| ID | Question | Default if unanswered |
| -- | -------- | --------------------- |
| OQ-001 | Should Manager access `/commissions`? | Yes (Figma shows Commissions text on Manager page) |
| OQ-002 | Redirect target when forbidden — `/` or first allowed route? | `/` |
| OQ-003 | Show `/profile` in sidebar for all roles? | No — header only |
| OQ-004 | Block `/demo` route? | Exclude from guard or admin-only |

---

## Quick reference — sidebar labels by role

| Route | Admin | Manager | Salesman | Customer |
| ----- | ----- | ------- | -------- | -------- |
| `/projects` | Projects | Projects | Deals | Projects |
| `/packages` | Packages | Packages | Bundles | — |
| `/loyalty` | Loyalty | Loyalty | — | Rewards |
