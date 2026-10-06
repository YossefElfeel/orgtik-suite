# Sidebar Collapse / Expand — Cross-Dashboard Implementation Spec

> **Purpose:** Give this file to an AI agent (or developer) in **any Somion dashboard** so it implements desktop sidebar collapse/expand **exactly the same way** as the reference implementation in `somion-task-manager`.
>
> **Reference repo:** `somion-task-manager`  
> **Do not change mobile behavior.** Mobile keeps the existing Sheet + hamburger toggle.

---

## Goal

| Viewport | Behavior |
|----------|----------|
| **Mobile (`< lg`)** | Sidebar opens/closes via **Sheet overlay** + hamburger trigger in the header. **No changes.** |
| **Desktop (`≥ lg`)** | Sidebar is always visible but can be **expanded** (full width) or **collapsed** (icon rail). User toggles with a chevron button. State persists in `localStorage`. |

---

## Architecture (must follow)

```
Dashboard layout (flex row)
├── Desktop sidebar wrapper  → hidden lg:flex
│   └── Sidebar component
│       └── UnifiedSidebar   ← ALL collapse logic lives here
└── Main content (flex-1)
    └── DashboardHeader
        └── Sidebar (mobile only, lg:hidden) → Sheet trigger only
```

**Rules:**
1. Implement collapse/expand inside **`UnifiedSidebar`** (shared component), not in layout or header.
2. Do **not** add a desktop toggle to `DashboardHeader`.
3. Do **not** use Redux for collapse state — use the `useSidebarCollapsed` hook + `localStorage`.
4. If the dashboard imports `UnifiedSidebar` from `@somion/sos-bar`, **switch to a local copy** and apply changes there (the npm package does not include collapse yet).
5. Keep existing styles: `bg-[#F7F9FB]`, `border-x`, primary hover/active classes, Iconify icons, Framer Motion for nested accordion.

---

## Prerequisites

The dashboard should already have:

- Next.js App Router layout with `body` or root using `flex`
- `UnifiedSidebar` component (local or from `@somion/sos-bar`)
- shadcn/ui: `Button`, `Sheet`, `Tooltip`, `Popover`
- `lucide-react` icons
- `@iconify/react`
- `framer-motion`
- Breakpoint: **`lg` (1024px)** separates mobile vs desktop

---

## Step 1 — Create the hook

**File:** `hooks/use-sidebar-collapsed.ts`

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sidebar-collapsed";

export function useSidebarCollapsed() {
  const [isCollapsed, setIsCollapsedState] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setIsCollapsedState(stored === "true");
    }
  }, []);

  const setIsCollapsed = useCallback((value: boolean) => {
    setIsCollapsedState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsedState((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return { isCollapsed, setIsCollapsed, toggleCollapsed };
}
```

**Constants (do not change):**
- Storage key: `"sidebar-collapsed"`
- Default state: `false` (expanded)

---

## Step 2 — Update `UnifiedSidebar`

**File:** `components/special-shared/UnifiedSidebar/index.tsx`  
(Adjust path if your project uses a different folder, but keep the component name.)

### 2.1 New imports

```tsx
import { ChevronDown, ChevronLeft, ChevronRight, Menu } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";
```

### 2.2 Desktop sidebar shell

Replace the fixed `w-64` desktop `<aside>` with:

```tsx
const { isCollapsed, toggleCollapsed } = useSidebarCollapsed();

<aside
  className={cn(
    "hidden lg:flex shrink-0 border-x flex-col bg-[#F7F9FB] max-h-screen overflow-x-hidden overflow-y-auto transition-[width] duration-300 ease-in-out",
    isCollapsed ? "w-[72px]" : "w-64",
    desktopClassName
  )}
>
  {/* Header: logo + toggle */}
  <div
    className={cn(
      "flex items-center border-b border-gray-200/60 shrink-0",
      isCollapsed ? "justify-center p-2" : "justify-between gap-2 p-4"
    )}
  >
    {!isCollapsed && <SidebarLogo logo={logo} className="p-0" />}
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleCollapsed}
      className="shrink-0 size-8 text-gray-500 hover:text-gray-700"
      aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      {isCollapsed ? (
        <ChevronRight className="size-4" />
      ) : (
        <ChevronLeft className="size-4" />
      )}
    </Button>
  </div>

  <TooltipProvider delayDuration={0}>
    <nav
      className={cn(
        "flex flex-col gap-2 overflow-y-auto flex-1",
        isCollapsed ? "p-2" : "p-4"
      )}
    >
      {filteredItems?.map((item, index) => (
        <MemoSidebarItem
          key={item.path || index}
          item={item}
          isActive={isActive}
          isActiveStartsWith={isActiveStartsWith}
          collapsed={isCollapsed}
        />
      ))}
    </nav>
  </TooltipProvider>
</aside>
```

**Exact widths (do not change):**
- Expanded: `w-64` (256px)
- Collapsed: `w-[72px]`
- Transition: `transition-[width] duration-300 ease-in-out`

### 2.3 Update `SidebarLogo`

Add optional `className` prop so padding can be controlled from parent:

```tsx
function SidebarLogo({
  logo,
  className,
}: {
  logo?: UnifiedSidebarProps["logo"];
  className?: string;
}) {
  // ... render logo inside <div className={cn("flex justify-start", className)}>
}
```

- Desktop expanded header: `<SidebarLogo logo={logo} className="p-0" />`
- Mobile sheet: `<SidebarLogo logo={logo} className="p-4" />`

### 2.4 Update `SidebarItemRenderer`

Add prop: `collapsed?: boolean` (default `false`).

Pass `collapsed={isCollapsed}` from desktop nav only. Mobile sheet items do **not** receive `collapsed` (always expanded inside Sheet).

#### Shared button classes

```tsx
const itemButtonClass = cn(
  "font-semibold transition-all text-gray-600",
  "hover:bg-primary/70 hover:text-white",
  active && "bg-primary text-white border border-primary",
  collapsed ? "w-full justify-center px-0 h-10" : "w-full justify-start gap-2 h-10"
);
```

#### Leaf items (no children)

```tsx
const wrapWithTooltip = (content: React.ReactNode, label: string) => {
  if (!collapsed) return content;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
};

// Render: icon only when collapsed, icon + label + badge when expanded
return wrapWithTooltip(
  <Link href={item.path} ...>
    <Button ... className={itemButtonClass}>
      {renderIcon(item.Icon, 20)}
      {!collapsed && (<> {item.label} {badge} </>)}
    </Button>
  </Link>,
  item.label
);
```

#### Parent items with children — collapsed mode

Use **Popover** (not accordion) when `collapsed === true`:

```tsx
if (collapsed) {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" className={itemButtonClass}>
              {renderIcon(item.Icon, 20)}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
      <PopoverContent side="right" align="start" className="w-56 p-2">
        <p className="px-2 py-1.5 text-sm font-semibold text-gray-700">
          {item.label}
        </p>
        <div className="flex flex-col gap-1">
          {/* map children as full label + icon links, same active styles as expanded */}
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

#### Parent items with children — expanded mode

Keep existing **accordion** behavior (ChevronDown + Framer Motion `AnimatePresence`). **Do not change.**

---

## Step 3 — Wire the app `Sidebar` component

**File:** `components/layout/Sidebar/index.tsx`

If currently importing from `@somion/sos-bar`, change to local:

```tsx
import {
  UnifiedSidebar,
  type SidebarItem,
} from "@/components/special-shared/UnifiedSidebar";
```

No other changes needed in this file — collapse is internal to `UnifiedSidebar`.

---

## Step 4 — Verify dashboard layout

**File:** `app/[locale]/(dashboard)/layout.tsx` (path may vary)

Expected structure:

```tsx
<>
  <SoSBarWrapper /> {/* if applicable */}
  <div className="hidden lg:flex">
    <Sidebar />
  </div>
  <div className="flex flex-col flex-1 bg-[#F8FAFB] overflow-hidden">
    <DashboardHeader />
    <main>...</main>
  </div>
</>
```

**Root layout** (`app/[locale]/layout.tsx`) should have `body` with `flex` so main content grows when sidebar shrinks:

```tsx
<body className="antialiased flex overflow-x-hidden min-h-screen">
```

**Do not** hardcode sidebar width on the layout wrapper — width is controlled inside `UnifiedSidebar`.

---

## Step 5 — Verify mobile header

**File:** `components/layout/DashboardHeader/index.tsx`

Mobile trigger only (unchanged):

```tsx
<div className="lg:hidden">
  <Sidebar />
</div>
```

The same `Sidebar` component renders:
- On desktop → only the `<aside>` (Sheet trigger is hidden via `lg:hidden` on default button)
- On mobile → only the Sheet trigger (aside hidden via `hidden lg:flex`)

---

## Mobile sidebar — DO NOT CHANGE

Keep existing Sheet implementation:

```tsx
<Sheet open={open} onOpenChange={setOpen}>
  <SheetTrigger asChild>
    {mobileTrigger ?? (
      <Button variant="ghost" size="icon" className="lg:hidden">
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle menu</span>
      </Button>
    )}
  </SheetTrigger>
  <SheetContent side="left" className="...">
    {/* Full expanded nav — no collapsed prop */}
  </SheetContent>
</Sheet>
```

---

## Visual & UX spec (must match)

| Element | Expanded | Collapsed |
|---------|----------|-----------|
| Sidebar width | `256px` (`w-64`) | `72px` (`w-[72px]`) |
| Logo | Visible in header | Hidden |
| Toggle icon | `ChevronLeft` | `ChevronRight` |
| Toggle position | Header row, right side | Header row, centered |
| Nav items | Icon + label + badge | Icon only, centered |
| Tooltips | None | `side="right"`, label text |
| Nested items | Inline accordion | Popover flyout to the right |
| Active state | `bg-primary text-white border border-primary` | Same |
| Animation | Width transition 300ms ease-in-out | Same |

---

## Acceptance checklist

Before marking done, verify:

- [ ] Mobile: hamburger opens/closes Sheet sidebar — **unchanged**
- [ ] Desktop: chevron toggles expanded ↔ collapsed
- [ ] Collapsed shows icons only; tooltips appear on hover
- [ ] Items with children open a Popover when collapsed
- [ ] Main content expands when sidebar collapses (flex layout)
- [ ] No horizontal overflow or layout jump on toggle
- [ ] Preference survives page refresh (`localStorage` key: `sidebar-collapsed`)
- [ ] `aria-label` on toggle button for accessibility
- [ ] TypeScript compiles with no errors

---

## Files touched (typical)

| Action | File |
|--------|------|
| **Create** | `hooks/use-sidebar-collapsed.ts` |
| **Modify** | `components/special-shared/UnifiedSidebar/index.tsx` |
| **Modify** | `components/layout/Sidebar/index.tsx` (import path only, if needed) |
| **Verify only** | `app/[locale]/(dashboard)/layout.tsx` |
| **Verify only** | `components/layout/DashboardHeader/index.tsx` |
| **Do not modify** | Redux / `dashboardSlice` (not used for this feature) |

---

## Agent instructions (copy-paste prompt)

```
Implement desktop sidebar collapse/expand following docs/sidebar-collapse-expand-spec.md exactly.

Requirements:
- Mobile Sheet toggle: leave unchanged
- Desktop: expand (w-64) / collapse (w-[72px]) with chevron toggle in sidebar header
- Persist state in localStorage key "sidebar-collapsed"
- Collapsed: icon-only nav + tooltips; nested items use Popover flyout
- All logic in UnifiedSidebar; use hooks/use-sidebar-collapsed.ts
- Switch from @somion/sos-bar UnifiedSidebar to local copy if needed
- Match reference implementation in somion-task-manager

Do not add desktop toggle to DashboardHeader.
Do not use Redux for collapse state.
Run typecheck when done.
```

---

## Reference implementation

Copy behavior from these files in **somion-task-manager**:

- `hooks/use-sidebar-collapsed.ts`
- `components/special-shared/UnifiedSidebar/index.tsx`
- `components/layout/Sidebar/index.tsx`

When in doubt, match the reference repo line-for-line for collapse behavior and only adapt import paths / locale lists if the target dashboard differs.
