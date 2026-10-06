# Orgtik Minimal Migration Plan

Focused checklist for migrating a Somion frontend project to Orgtik: update the npm registry, bump `@somion/sos-bar`, swap logo assets, update favicon and metadata, and change **only** the primary color.

**Do not change** (unless explicitly requested later):

- Dialog / sheet / popover backgrounds or theme tokens (`--background`, `--muted`, `--border`, etc.)
- Sidebar layout colors
- Global brand palette (`--brand-*`, body background, auth gradients)
- Hardcoded UI grays, upload-zone tints, or component-level styling beyond primary

**Note:** `@somion/sos-bar` package imports and backend hostnames in `next.config.ts` keep the `@somion` scope / domain for compatibility — they are not user-visible.

Validated against **file-manager-dashboard**.

---

## Overview

| Area | Before | After |
|------|--------|-------|
| npm registry | `https://sdk.somion.ch/` | `https://sdk.orgtik.org/` |
| `@somion/sos-bar` | `^3.11.1` | latest (e.g. `^3.11.2`) |
| Logo | `SomionSystemsLogo` / `Logo.png` / legacy SVGs | `OrgtikLogo` + `public/images/logo/*` |
| Favicon | `app/icon.png` (Somion) | `app/icon.svg` from `icon-logo.svg` |
| Metadata & copy | "Somion …" | "Orgtik …" |
| Primary color | `#593BF2` | `#8135CD` |

---

## Phase 1 — Registry & Package

### 1.1 Update `.npmrc`

```ini
@somion:registry=https://sdk.orgtik.org/
```

> The `@somion` scope name stays the same; only the registry URL changes.

### 1.2 Update `@somion/sos-bar`

```bash
npm i --legacy-peer-deps @somion/sos-bar@latest
```

For multiple repos, use `scripts/update-sos-bar.ps1`.

**Verify in `package-lock.json`:**

- `resolved` uses `https://sdk.orgtik.org/@somion/sos-bar/...`
- Version matches `package.json`

### 1.3 Reinstall if needed

```bash
rm -rf node_modules
npm i --legacy-peer-deps
```

---

## Phase 2 — Logo Assets & Component

### 2.1 Copy assets into `public/images/logo/`

| File | Variant | Typical use |
|------|---------|-------------|
| `icon-logo.svg` | `icon` | Compact mark, favicon source |
| `icon-logo.png` | `icon` (PNG) | PNG fallback |
| `text-logo.svg` | `text` | Text-only lockup |
| `text-logo.png` | `text` (PNG) | PNG fallback |
| `full-logo.svg` | `full` | Full stacked lockup |
| `full-logo.png` | `full` (PNG) | PNG fallback |
| `logo-horizontal.svg` | `horizontal` | Horizontal lockup on light backgrounds |
| `logo-horizontal-dark.svg` | `horizontal-dark` | Horizontal lockup (dark ink) on light backgrounds |

### 2.2 Create `OrgtikLogo`

Path: `components/shared/OrgtikLogo/index.tsx`

```tsx
type OrgtikLogoVariant =
  | "icon"
  | "text"
  | "full"
  | "horizontal"
  | "horizontal-dark";
```

| Location | Recommended variant |
|----------|---------------------|
| Sidebar (light `#F7F9FB` bg) | `horizontal-dark` |
| Auth / marketing on white | `horizontal` or `full` |
| Mobile drawer header | `horizontal-dark` |
| Compact header | `icon` |
| Footer / co-brand strip | `text` |

### 2.3 Replace old logo usage

```bash
rg "SomionSystemsLogo|Logo\.png|somion-icon|somion-text" --glob "*.{tsx,ts}"
```

Remove legacy assets when done:

- `components/shared/SomionSystemsLogo/`
- `public/Logo.png`, `/somion-icon.svg`, `/somion-text.svg`

---

## Phase 3 — Favicon

Replace the Somion favicon with the Orgtik icon mark.

```bash
cp public/images/logo/icon-logo.svg app/icon.svg
rm app/icon.png   # if present
```

Next.js App Router picks up `app/icon.svg` automatically. Verify the browser tab shows the Orgtik mark after rebuild.

---

## Phase 4 — Metadata & User-Facing Copy

Remove **all user-visible "Somion"** strings.

### 4.1 Root metadata

In `app/layout.tsx` or `app/[locale]/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: "Orgtik File Manager",           // was: Somion File Manager
  description: "Advanced file management system powered by Orgtik.",
};
```

Update every route-level `layout.tsx` that exports `metadata` (if the project has nested layouts).

### 4.2 Sweep user-facing copy

```bash
rg -i "somion" --glob "*.{tsx,ts,json,md}" --glob "!docs/**" --glob "!scripts/**"
```

Common replacements:

| Old | New |
|-----|-----|
| Somion File Manager | Orgtik File Manager |
| Somion | Orgtik |
| Somion Systems | Orgtik |

**Files often touched:**

- `app/[locale]/layout.tsx`
- `components/public-share/PublicShareHeader.tsx`
- `messages/*.json` (i18n strings)
- `README.md` (if user-facing)

**Intentionally unchanged (not user-visible):**

- `@somion/sos-bar` import paths
- `.npmrc` scope name `@somion`
- Backend hostnames in `next.config.ts`
- Internal script comments in `update-sos-bar.ps1`

---

## Phase 5 — Primary Color Only

Change primary from `#593BF2` to `#8135CD`. Leave all other CSS variables unchanged.

### 5.1 Update `app/globals.css`

```css
--primary: #8135cd;
--ring: #8135cd;
--sidebar-primary: #8135cd;   /* if used */
```

### 5.2 Replace hardcoded old primary hex

```bash
rg "#593[Bb][Ff]2|593bf2" --glob "*.{tsx,ts,css}"
```

Replace with `#8135cd` or Tailwind `primary` tokens.

---

## Phase 6 — Verification

### Registry & package

- [ ] `.npmrc` → `sdk.orgtik.org`
- [ ] `npm i --legacy-peer-deps` succeeds
- [ ] `npm run build` passes

### Logo & favicon

- [ ] Sidebar uses `horizontal-dark`
- [ ] Browser tab favicon shows Orgtik icon
- [ ] No broken legacy logo imports

### Metadata & copy

- [ ] Browser tab title says "Orgtik …"
- [ ] No user-visible "Somion" in UI strings
- [ ] Public share header / i18n messages updated

### Primary color

- [ ] Buttons and active nav use `#8135CD`
- [ ] No remaining `#593BF2`

### Visual regression (unchanged from pre-migration)

- [ ] Dialogs/sheets still white
- [ ] Sidebar still light gray (`#F7F9FB`)

---

## Phase 7 — Commit Strategy

```
chore: migrate to Orgtik registry, logo, favicon, metadata, and primary color

- Point @somion registry to sdk.orgtik.org and update sos-bar.
- Replace legacy logo with OrgtikLogo (all variants).
- Set favicon to Orgtik icon-logo.svg.
- Update metadata and user-facing copy from Somion to Orgtik.
- Update primary color from #593BF2 to #8135CD.
```

---

## Minimal Order of Operations

1. **`.npmrc`** → orgtik registry
2. **`npm i --legacy-peer-deps @somion/sos-bar@latest`**
3. **Logo assets** → `public/images/logo/*`
4. **`OrgtikLogo`** → all five variants; swap imports
5. **Favicon** → `app/icon.svg` from `icon-logo.svg`
6. **Metadata + copy** → grep/replace user-visible "Somion"
7. **`globals.css`** → primary color only
8. **Hardcoded `#593BF2`** → `#8135cd`
9. **Build + visual QA**
10. **Commit**

---

## Copy Artifacts From an Migrated Project

```
.npmrc
components/shared/OrgtikLogo/index.tsx
public/images/logo/*
app/icon.svg
scripts/update-sos-bar.ps1
```

Then apply metadata/copy sweep and primary color for the target project.

---

## Reference — file-manager-dashboard

| Changed | Unchanged |
|---------|-----------|
| `.npmrc`, `package.json`, `package-lock.json` | Dialog/sheet/popover styling |
| `OrgtikLogo` + all logo variants | `globals.css` background/muted/border tokens |
| Sidebar → `horizontal-dark` | Sidebar `#F7F9FB` layout colors |
| `app/icon.svg` (Orgtik favicon) | Backend hostnames in `next.config.ts` |
| Metadata: "Orgtik File Manager" | `@somion/sos-bar` import scope |
| Public share / UI copy → Orgtik | |
| `--primary: #8135cd` | |
