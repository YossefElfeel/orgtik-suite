# Orgtik Rebrand & SDK Migration Plan

Reusable checklist for migrating a Somion frontend project to Orgtik branding, updating the private npm registry, and bumping `@somion/sos-bar`.

Based on commit `14edfff` in **somion-sos** and related package-update commits (`eda5922`, `b03433c`).

---

## Overview

| Area | Before | After |
|------|--------|-------|
| npm registry | `https://sdk.somion.ch/` | `https://sdk.orgtik.org/` |
| `@somion/sos-bar` | `^3.11.1` | `^3.11.2` (or latest) |
| Logo component | `SomionSystemsLogo` | `OrgtikLogo` |
| Logo assets | `/somion-icon.svg`, `/somion-text.svg` | `/public/images/logo/*` |
| Brand CSS | `--somion`, indigo/blue palette | `--brand-*`, purple/mauve palette |
| App metadata | "Somion SOS" / "Somion Systems" | "Orgtik SOS" / "Orgtik" |
| Favicon | `app/icon.png` | `app/icon.ico` |

---

## Phase 1 — Registry & Package Update

### 1.1 Update `.npmrc`

Create or edit the project root `.npmrc`:

```ini
@somion:registry=https://sdk.orgtik.org/
```

> The `@somion` scope name stays the same; only the registry URL changes.

### 1.2 Update `@somion/sos-bar`

**Manual (single project):**

```bash
npm i --legacy-peer-deps @somion/sos-bar@latest
```

**Automated (multiple projects):**

Use `scripts/update-sos-bar.ps1` from somion-sos. It:

1. Iterates configured repos under `$SOMION_PROJECTS_ROOT` (default: parent of somion-sos)
2. Requires a clean git working tree on branch `dev`
3. Pulls `origin/dev`
4. Runs `npm i --legacy-peer-deps @somion/sos-bar@latest`
5. Commits `package.json` + `package-lock.json` with message: `Update sos-bar package automatically to {version}`
6. Rebases and pushes to `origin/dev`

**Verify in `package-lock.json`:**

- `resolved` URL uses `https://sdk.orgtik.org/@somion/sos-bar/...`
- Version matches `package.json`

### 1.3 Reinstall if needed

If the lockfile still points to the old registry:

```bash
rm -rf node_modules
npm i --legacy-peer-deps
```

---

## Phase 2 — Logo Assets

### 2.1 Add logo files

Copy into `public/images/logo/`:

| File | Usage |
|------|-------|
| `icon-logo.svg` | Header, auth layout, dashboard welcome |
| `icon-logo.png` | PNG fallback |
| `text-logo.svg` | Text-only branding |
| `text-logo.png` | PNG fallback |
| `full-logo.svg` | Full lockup |
| `full-logo.png` | PNG fallback |

### 2.2 Create `OrgtikLogo` component

Path: `components/shared/OrgtikLogo/index.tsx`

Key props (match existing usage):

- `className`, `href`, `iconClassName`
- `disableLink` — static logo (auth pages)
- `showAdminBadge` — toggle AdminBadge next to icon

Reference implementation from somion-sos:

```tsx
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import AdminBadge from "../AdminBadge";

function OrgtikLogo({ className, href = "/", iconClassName, disableLink = false, showAdminBadge = true }) {
  const content = (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/images/logo/icon-logo.svg"
        alt="Orgtik"
        width={50}
        height={50}
        className={cn("size-8.5 shrink-0", iconClassName)}
      />
      {showAdminBadge && <AdminBadge className="shrink-0 text-xs" />}
    </div>
  );
  return disableLink ? content : <Link href={href} className="inline-flex">{content}</Link>;
}
```

### 2.3 Remove old logo component & assets

- Delete `components/shared/SomionSystemsLogo/`
- Remove unused public assets: `/somion-icon.svg`, `/somion-text.svg` (if no longer referenced)
- Search and replace all imports:

```bash
# Find remaining references
rg "SomionSystemsLogo|somion-icon|somion-text"
```

### 2.4 Update favicon

- Replace `app/icon.png` with `app/icon.ico` (Next.js App Router favicon convention)
- Use the Orgtik icon asset as source

---

## Phase 3 — Brand Colors (CSS)

### 3.1 Add Orgtik palette to `app/globals.css`

Replace `--somion` and old primary colors with:

```css
:root {
  /* Core theme */
  --background: #f3ebea;
  --foreground: #09080d;
  --primary: #8135cd;
  --primary-foreground: #f3ebea;
  --secondary: #f3ebea;
  --secondary-foreground: #190b25;
  --muted: #f3ebea;
  --muted-foreground: #a06fb0;
  --accent: #a06fb0;
  --accent-foreground: #190b25;

  /* Sidebar */
  --sidebar: #190b25;
  --sidebar-foreground: #f3ebea;
  --sidebar-primary: #8135cd;
  --sidebar-accent: #a06fb0;

  /* Brand tokens */
  --brand-deep-purple: #190b25;
  --brand-mauve: #a06fb0;
  --brand-violet-accent: #8135cd;
  --brand-near-black: #09080d;
  --brand-off-white: #f3ebea;
  --orgtik: #8135cd;
}
```

### 3.2 Expose Tailwind color tokens

In the `@theme inline` block:

```css
--color-brand-deep-purple: var(--brand-deep-purple);
--color-brand-mauve: var(--brand-mauve);
--color-brand-violet-accent: var(--brand-violet-accent);
--color-brand-near-black: var(--brand-near-black);
--color-brand-off-white: var(--brand-off-white);
--color-orgtik: var(--orgtik);
```

Remove `--color-somion` / `--somion`.

### 3.3 Update utility classes

Example gradient button class:

```css
.bg-main-linear {
  @apply bg-gradient-to-tr from-brand-deep-purple via-brand-violet-accent to-brand-mauve text-brand-off-white hover:opacity-90;
}
```

### 3.4 Sweep hardcoded old colors

Search for and replace:

- `indigo-*`, `blue-*` auth backgrounds → `brand-off-white`, `brand-mauve`, `brand-violet-accent`
- `hover:bg-gray-50` on branded UI → `hover:bg-brand-mauve/10`
- `text-indigo-*` → brand tokens where appropriate

---

## Phase 4 — Component & Layout Updates

### 4.1 Logo swap (required files)

| File | Change |
|------|--------|
| `components/layout/DashboardHeader/index.tsx` | `SomionSystemsLogo` → `OrgtikLogo` |
| `app/auth/layout.tsx` | Logo + gradient background colors |
| `app/(dashboard)/page.tsx` | Welcome hero uses `icon-logo.svg` instead of text SVG |

### 4.2 Metadata (all `layout.tsx` files)

Update every route `metadata` export:

```tsx
export const metadata: Metadata = {
  title: "Dashboard - Orgtik SOS",        // was: Somion SOS
  description: "Welcome to the heart of Orgtik. ...",  // was: Somion Systems
};
```

**Files touched in somion-sos:**

- `app/layout.tsx` (root)
- `app/(dashboard)/layout.tsx`
- `app/(dashboard)/content/layout.tsx`
- `app/(dashboard)/icons-test/layout.tsx`
- `app/(dashboard)/people/layout.tsx`
- `app/(dashboard)/people/[userId]/scopes/layout.tsx`
- `app/(dashboard)/profile/layout.tsx`
- `app/(dashboard)/systems/layout.tsx`
- `app/(dashboard)/systems/somion/layout.tsx`
- `app/auth/forgot-password/layout.tsx`
- `app/auth/reset-password/layout.tsx`

### 4.3 User-facing copy

Search project-wide:

```bash
rg -i "somion systems|somion sos|join somion" --glob "*.{tsx,ts,md}"
```

Common replacements:

| Old | New |
|-----|-----|
| Somion SOS | Orgtik SOS |
| Somion Systems | Orgtik / Orgtik Systems |
| Join Somion Systems | Join Orgtik |

**Note:** Internal route paths like `/systems/somion` may stay for backward compatibility — only update display labels unless routing is also being renamed.

### 4.4 Minor UI polish (optional but done in somion-sos)

- `UserCard.tsx`: brand hover states, `DropdownMenuSeparator`, destructive variant for logout
- `dropdown-menu.tsx`: focus/highlight uses `brand-mauve/15`

---

## Phase 5 — Verification Checklist

### Build & install

- [ ] `.npmrc` points to `sdk.orgtik.org`
- [ ] `npm i --legacy-peer-deps` succeeds
- [ ] `npm run build` passes
- [ ] No import errors for deleted `SomionSystemsLogo`

### Visual

- [ ] Header logo renders on desktop and mobile drawer
- [ ] Auth pages show Orgtik logo (top-right, no link)
- [ ] Dashboard welcome section shows new icon
- [ ] Favicon updated in browser tab
- [ ] Primary buttons / gradients use purple palette
- [ ] Sidebar colors match brand (dark purple background)

### Content

- [ ] Browser tab titles say "Orgtik SOS"
- [ ] No "Somion" in user-visible strings (except intentional legacy routes)
- [ ] Invite/auth copy updated

### Package

- [ ] `package-lock.json` resolves sos-bar from `sdk.orgtik.org`
- [ ] sos-bar version is current for your org

---

## Phase 6 — Commit Strategy

Recommended commit message (matches somion-sos):

```
refactor: update branding and dependencies for Orgtik transition

- Changed npm registry for @somion to the new orgtik registry.
- Updated @somion/sos-bar dependency to latest.
- Replaced Somion branding with Orgtik in metadata and UI.
- Updated global CSS variables to Orgtik brand colors.
- Replaced SomionSystemsLogo with OrgtikLogo and new assets.
```

Or split into two commits if preferred:

1. `chore: point @somion registry to sdk.orgtik.org and update sos-bar`
2. `refactor: migrate UI branding from Somion to Orgtik`

---

## Quick Reference — somion-sos Commits

| Commit | Description |
|--------|-------------|
| `14edfff` | Full Orgtik rebrand: npmrc, package, logo, CSS, metadata (33 files) |
| `eda5922` | sos-bar 3.11.2 bump + initial update script |
| `b03433c` | Hardened `update-sos-bar.ps1` (error handling, git safety) |
| `c8d746d` | Earlier auth layout + SomionSystemsLogo integration (pre-rebrand) |

---

## Applying to a New Project — Minimal Order

1. **`.npmrc`** → new registry URL
2. **`npm i --legacy-peer-deps @somion/sos-bar@latest`**
3. **Logo assets** → `public/images/logo/`
4. **`OrgtikLogo` component** → swap all logo imports
5. **`globals.css`** → brand palette + Tailwind tokens
6. **Metadata + copy** → search/replace "Somion" → "Orgtik"
7. **Favicon** → `app/icon.ico`
8. **Build + visual QA**
9. **Commit & push**

---

## Optional: Copy Artifacts from somion-sos

When starting the next project, copy these directly:

```
.npmrc
components/shared/OrgtikLogo/index.tsx
public/images/logo/*
app/icon.ico
app/globals.css          (brand section only, merge with target theme)
scripts/update-sos-bar.ps1
```

Then run the verification checklist above.
