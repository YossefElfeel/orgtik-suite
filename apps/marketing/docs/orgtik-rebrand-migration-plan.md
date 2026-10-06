# Orgtik Minimal Migration Plan

Focused checklist for migrating a Somion frontend project to Orgtik: update the npm registry, bump `@somion/sos-bar`, swap logo assets, and change **only** the primary color.

**Do not change** (unless explicitly requested later):

- Dialog / sheet / popover backgrounds or theme tokens (`--background`, `--muted`, `--border`, etc.)
- Sidebar layout colors
- App metadata, copy, or favicon
- Global brand palette (`--brand-*`, body background, auth gradients)
- Hardcoded UI grays, upload-zone tints, or component-level styling beyond primary

Validated against **file-manager-dashboard** — the safe scope is registry + package + logo + primary.

---

## Overview

| Area | Before | After |
|------|--------|-------|
| npm registry | `https://sdk.somion.ch/` | `https://sdk.orgtik.org/` |
| `@somion/sos-bar` | `^3.11.1` | latest (e.g. `^3.11.2`) |
| Logo | `SomionSystemsLogo` / `Logo.png` / legacy SVGs | `OrgtikLogo` + `public/images/logo/*` |
| Primary color | `#593BF2` | `#8135CD` |

---

## Phase 1 — Registry & Package

### 1.1 Update `.npmrc`

Create or edit the project root `.npmrc`:

```ini
@somion:registry=https://sdk.orgtik.org/
```

> The `@somion` scope name stays the same; only the registry URL changes.

### 1.2 Update `@somion/sos-bar`

**Single project:**

```bash
npm i --legacy-peer-deps @somion/sos-bar@latest
```

**Multiple projects:**

Use `scripts/update-sos-bar.ps1` (copy from somion-sos or file-manager-dashboard). It updates `package.json` + `package-lock.json` on configured repos.

**Verify in `package-lock.json`:**

- `resolved` uses `https://sdk.orgtik.org/@somion/sos-bar/...`
- Version matches `package.json`

### 1.3 Reinstall if needed

If the lockfile still points to the old registry:

```bash
rm -rf node_modules
npm i --legacy-peer-deps
```

---

## Phase 2 — Logo Assets & Component

### 2.1 Copy assets into `public/images/logo/`

Copy the full set from somion-sos (or an already migrated project):

| File | Variant | Typical use |
|------|---------|-------------|
| `icon-logo.svg` | `icon` | Compact mark, favicon source, mobile |
| `icon-logo.png` | `icon` (PNG) | Email / non-SVG contexts |
| `text-logo.svg` | `text` | Text-only lockup |
| `text-logo.png` | `text` (PNG) | PNG fallback |
| `full-logo.svg` | `full` | Full stacked lockup |
| `full-logo.png` | `full` (PNG) | PNG fallback |
| `logo-horizontal.svg` | `horizontal` | Horizontal lockup on **light** backgrounds |
| `logo-horizontal-dark.svg` | `horizontal-dark` | Horizontal lockup on **light** backgrounds (dark ink) |

### 2.2 Create `OrgtikLogo`

Path: `components/shared/OrgtikLogo/index.tsx`

Support all variants via a `variant` prop:

```tsx
type OrgtikLogoVariant =
  | "icon"
  | "text"
  | "full"
  | "horizontal"
  | "horizontal-dark";

const LOGO_SRC: Record<OrgtikLogoVariant, string> = {
  icon: "/images/logo/icon-logo.svg",
  text: "/images/logo/text-logo.svg",
  full: "/images/logo/full-logo.svg",
  horizontal: "/images/logo/logo-horizontal.svg",
  "horizontal-dark": "/images/logo/logo-horizontal-dark.svg",
};
```

Recommended sizing:

| Variant | Suggested classes |
|---------|-------------------|
| `icon` | `size-8.5 shrink-0` |
| `text` | `h-8 w-auto object-contain` |
| `full` | `h-9 w-auto object-contain` |
| `horizontal` | `h-9 w-auto object-contain` |
| `horizontal-dark` | `h-9 w-auto object-contain` |

Props to support (match existing logo usage):

- `className`, `href`, `iconClassName`
- `disableLink` — static logo (no navigation)
- `variant` — one of the five variants above

### 2.3 Replace old logo usage

1. Search for legacy imports:

```bash
rg "SomionSystemsLogo|Logo\.png|somion-icon|somion-text" --glob "*.{tsx,ts}"
```

2. Swap each call site to `OrgtikLogo` with the right variant:

| Location | Recommended variant |
|----------|---------------------|
| Sidebar (light `#F7F9FB` bg) | `horizontal-dark` |
| Auth / marketing on white | `horizontal` or `full` |
| Mobile drawer header | `horizontal-dark` |
| Compact header / SOS bar adjacency | `icon` |
| Footer / co-brand strip | `text` |

3. Remove unused legacy assets after migration:

- `components/shared/SomionSystemsLogo/`
- `public/Logo.png`, `/somion-icon.svg`, `/somion-text.svg` (if present)

### 2.4 Do **not** change favicon unless asked

Keep existing `app/icon.png` (or current favicon). Logo SVGs can be used later if favicon update is requested separately.

---

## Phase 3 — Primary Color Only

Change the primary purple from Somion (`#593BF2`) to Orgtik (`#8135CD`). Leave all other CSS variables as they were.

### 3.1 Update `app/globals.css`

In `:root`, change **only**:

```css
--primary: #8135cd;
--ring: #8135cd;
--sidebar-primary: #8135cd;   /* only if the project uses sidebar-primary token */
```

Keep unchanged:

- `--primary-foreground: #ffffff`
- `--background`, `--muted`, `--border`, `--accent`, `--card`, etc.

### 3.2 Replace hardcoded old primary hex

Search for leftover Somion purple in components:

```bash
rg "#593[Bb][Ff]2|593bf2" --glob "*.{tsx,ts,css}"
```

Replace with `#8135cd`, or prefer `text-primary` / `border-primary` / `bg-primary` where Tailwind tokens already exist.

Common files in file-manager-dashboard:

- `components/dialogs/FileUpload/index.tsx`
- `components/layout/BackgroundUploadPanel/*`
- `components/pages/dashboard/Chart/chart-pie.tsx`
- `app/global-not-found.tsx`

### 3.3 Do **not** change

- Dialog / sheet `bg-background` or footer styles
- `--muted`, `--secondary`, `--accent` theme tokens
- Upload drop-zone background tints (`#F9F8FF`, `#F2F0FF`, etc.)
- `texture-button`, dropdown hover, or indigo utility classes
- Metadata strings ("Somion" → "Orgtik") unless explicitly in scope

---

## Phase 4 — Verification

### Registry & package

- [ ] `.npmrc` → `sdk.orgtik.org`
- [ ] `npm i --legacy-peer-deps` succeeds
- [ ] `npm run build` passes
- [ ] `package-lock.json` resolves sos-bar from orgtik registry

### Logo

- [ ] Sidebar shows `horizontal-dark` (or chosen variant) on light background
- [ ] No broken imports for deleted legacy logo
- [ ] All five variants render when tested in isolation

### Primary color

- [ ] Buttons and active sidebar item use `#8135CD`
- [ ] No remaining `#593BF2` in the codebase
- [ ] Dialogs/sheets still have **white** backgrounds (unchanged from pre-migration)

### Visual regression (should look the same as before)

- [ ] Dialog backgrounds are white, not pink/beige
- [ ] Sidebar background still light gray (`#F7F9FB`)
- [ ] Header greeting / layout unchanged

---

## Phase 5 — Commit Strategy

**Single commit (recommended for this scope):**

```
chore: point registry to orgtik, update sos-bar, logo, and primary color

- Set @somion registry to sdk.orgtik.org.
- Bump @somion/sos-bar to latest.
- Replace legacy logo with OrgtikLogo and horizontal variants.
- Update primary color from #593BF2 to #8135CD.
```

**Or split:**

1. `chore: point @somion registry to sdk.orgtik.org and update sos-bar`
2. `feat: swap to Orgtik logo variants and update primary color`

---

## Minimal Order of Operations

1. **`.npmrc`** → orgtik registry
2. **`npm i --legacy-peer-deps @somion/sos-bar@latest`**
3. **Logo assets** → `public/images/logo/*` (all 8 files)
4. **`OrgtikLogo`** → all five variants
5. **Swap logo imports** → pick variant per surface (sidebar → `horizontal-dark`)
6. **`globals.css`** → `--primary`, `--ring`, `--sidebar-primary` only
7. **Hardcoded `#593BF2`** → `#8135cd` or `primary` tokens
8. **Build + visual QA** (confirm dialogs/sidebar unchanged)
9. **Commit**

---

## Copy Artifacts From an Migrated Project

When starting a new repo, copy:

```
.npmrc
components/shared/OrgtikLogo/index.tsx
public/images/logo/*
scripts/update-sos-bar.ps1
```

Then apply Phase 3 primary-color changes to that project's `globals.css` and grep for `#593BF2`.

---

## Reference — file-manager-dashboard

What this project keeps after the minimal migration:

| Changed | Unchanged |
|---------|-----------|
| `.npmrc`, `package.json`, `package-lock.json` | Dialog/sheet/popover styling |
| `OrgtikLogo` + logo assets | `globals.css` background/muted/border tokens |
| Sidebar → `horizontal-dark` variant | Sidebar `#F7F9FB` layout colors |
| `--primary: #8135cd` | App metadata ("Somion File Manager") |
| Hardcoded primary hex in upload/chart UI | Auth layout, favicon, copy |
