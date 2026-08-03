# Modern Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the entire acc-konter app (Login, Beranda, Jual, Stok, Laporan, Profil) to a "Clean & vibrant" modern visual language, without changing navigation architecture or business logic.

**Architecture:** Redesign token values first in `src/index.css` (CSS variable *names* stay identical — only their hex values and `--radius` change, so every downstream page/component task keeps using the same Tailwind utility classes like `bg-primary`, `bg-status-aman-bg`, etc. with zero forward-reference risk). Then restyle shared shadcn/ui base components and the app shell once. Then roll the new look through each page in order, verifying in a running browser after each. Close with a whole-app consistency pass.

**Tech Stack:** React 19 + Vite + TypeScript, Tailwind CSS v4 (`@theme inline` token system), shadcn/ui (Radix primitives), Zustand, React Query, `@phosphor-icons/react`. No test runner exists in this repo (no vitest/jest) — verification per task is `npx tsc --noEmit -p tsconfig.app.json`, `npm run build`, and a manual browser check of the affected page(s) via the running dev server (`npm run dev`).

## Global Constraints

- Navigation architecture (bottom tab bar + sticky header in `src/components/AppShell.tsx`) does not change — visual refresh only.
- No changes to business logic, `src/lib/api.ts`, hooks, or data shapes anywhere in this plan.
- Accent color is free to change from the current blue (`#1565C0`) but must stay a single solid, bold color — no gradients, no glassmorphism.
- Both light (`:root`) and dark (`.dark`) theme blocks in `src/index.css` get updated together, from the same token set.
- Keep the existing "no heavy shadows" pattern (`box-shadow: 0 1px 2px rgba(0,0,0,0.04)` on card/dialog/sheet/select-content) — do not introduce heavy drop shadows.
- Stock-status semantic colors (`--status-aman-*`, `--status-menipis-*`, `--status-habis-*`) keep their pastel-bg/saturated-fg pattern, re-tuned to pair with the new accent.
- Page rollout order: Login → Beranda → Jual → Stok → Laporan → Profil.
- Spec reference: `docs/superpowers/specs/2026-08-03-modern-redesign-design.md`.

---

### Task 1: New design tokens in `src/index.css`

**Files:**
- Modify: `src/index.css:65-152` (the `:root` and `.dark` variable blocks)

**Interfaces:**
- Produces: the same CSS variable names already declared (`--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--border`, `--input`, `--ring`, `--chart-1`..`--chart-5`, `--sidebar*`, `--status-aman-bg`, `--status-aman-fg`, `--status-menipis-bg`, `--status-menipis-fg`, `--status-habis-bg`, `--status-habis-fg`, `--radius`), only their values change. Every later task consumes these by name via existing Tailwind classes — no new variable names are introduced.

- [ ] **Step 1: Invoke `design-taste-frontend` to determine the new token values**

  Use the Skill tool with `skill: "design-taste-frontend"` and this brief:

  > "Redesign the color/type/radius tokens for an existing Indonesian phone-accessory shop POS app (mobile-first, React+Tailwind+shadcn). Current tokens are in `src/index.css` (`:root` lines 65-111, `.dark` lines 113-152) — a blue brand palette (#1565C0) is being retired. Direction: 'Clean & vibrant', reference feel Linear/Stripe Dashboard/Revolut — bold typography, generous whitespace, flat bordered cards, ultra-subtle elevation only (no heavy shadows, no gradients, no glassmorphism), one bold solid accent color (any hue). Deliverable: exact hex values for both the `:root` (light) and `.dark` blocks, for every variable currently defined there, plus the three `--status-*-bg`/`--status-*-fg` pairs re-tuned to read as pastel-on-white in light mode and legible-on-dark in dark mode, paired with the new accent. Keep `--radius: 0.5rem` unless there's a strong reason to change it — state the reasoning either way."

  Record the returned hex values — they are this task's deliverable.

- [ ] **Step 2: Apply the new values to `src/index.css`**

  Replace the hex/rgba literals in the `:root` block (lines 65-111) and `.dark` block (lines 113-152) with the values from Step 1. Do not rename any variable. Do not touch the `@theme inline` block (lines 8-63) or anything below line 152.

- [ ] **Step 3: Typecheck**

  Run: `npx tsc --noEmit -p tsconfig.app.json`
  Expected: no output (clean pass).

- [ ] **Step 4: Build**

  Run: `npm run build`
  Expected: `vite build` succeeds (existing bundle-size warning is fine, ignore it).

- [ ] **Step 5: Browser check**

  Run `npm run dev` (background), open the app in a browser, log in, view `/` (Beranda) and `/stok` in both light and dark mode (toggle via whatever the app's theme control is, or by toggling the `.dark` class on `<html>` via devtools if no in-app toggle exists yet). Confirm: text stays legible against backgrounds, primary buttons show the new accent, status badges (aman/menipis/habis) are still visually distinct from each other, no invisible-on-invisible text in either theme.

- [ ] **Step 6: Commit**

  ```bash
  git add src/index.css
  git commit -m "style: replace blue brand tokens with new clean-vibrant palette"
  ```

---

### Task 2: Restyle shared base components and app shell

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/AppShell.tsx`

**Interfaces:**
- Consumes: CSS variables from Task 1 (`bg-primary`, `bg-status-*`, etc. — unchanged class names, new values).
- Produces: no new props/exports — same component APIs (`<Button>`, `<Card>`, `<CardContent>`, `<Badge>`, `<Input>`) used identically by every page task below.

- [ ] **Step 1: Read current implementations**

  Read `src/components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `input.tsx`, and `src/components/AppShell.tsx` in full before editing, to preserve every existing variant/prop (e.g. `Button`'s `variant`/`size` props, `Badge`'s usage with custom `className` overrides in pages).

- [ ] **Step 2: Restyle structural details**

  Adjust only Tailwind utility classes (never variable names) for a crisper, more confident feel consistent with the Task 1 direction: button font-weight/tracking and radius, card border/padding rhythm, badge shape/padding, input height and focus-ring treatment, and in `AppShell.tsx` the active-tab indicator and header polish. Keep every existing prop/variant name and component signature unchanged — this is a className-only pass.

- [ ] **Step 3: Typecheck**

  Run: `npx tsc --noEmit -p tsconfig.app.json`
  Expected: clean pass.

- [ ] **Step 4: Build**

  Run: `npm run build`
  Expected: success.

- [ ] **Step 5: Browser check**

  With `npm run dev` running, view `/` and `/stok` (which exercises Button, Card, Badge, Input, Dialog, and the AppShell nav together). Confirm buttons/cards/badges/inputs read as a cohesive set and the bottom nav's active-state indicator is clearly visible.

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/ui/button.tsx src/components/ui/card.tsx src/components/ui/badge.tsx src/components/ui/input.tsx src/components/AppShell.tsx
  git commit -m "style: restyle base components and app shell for new design system"
  ```

---

### Task 3: Login page refresh

**Files:**
- Modify: `src/pages/Login.tsx`

**Interfaces:**
- Consumes: `Button`, `Card`/`CardContent`, `Input`, `Label` from Task 2 — no prop changes needed, only layout/spacing/className edits.

- [ ] **Step 1: Read `src/pages/Login.tsx` in full**

- [ ] **Step 2: Apply visual refresh**

  Update spacing, typography scale, and card/button treatment to match the new system. Do not change the role-selection logic, form fields, or submit handler.

- [ ] **Step 3: Typecheck**

  Run: `npx tsc --noEmit -p tsconfig.app.json` — expect clean pass.

- [ ] **Step 4: Build**

  Run: `npm run build` — expect success.

- [ ] **Step 5: Browser check**

  View `/login` in the running dev server, confirm layout looks intentional at a mobile viewport width (375px) and that logging in with each of the three roles still works.

- [ ] **Step 6: Commit**

  ```bash
  git add src/pages/Login.tsx
  git commit -m "style: refresh Login page to new design system"
  ```

---

### Task 4: Beranda restructure (bento/stat cards)

**Files:**
- Modify: `src/pages/Beranda.tsx`

**Interfaces:**
- Consumes: `useDashboardSummary`, `useLowStockProducts`, `useTransactions`, `useSessionStore`, `getStockStatus`/`stockStatusLabel` — all unchanged, same return shapes as today (`src/hooks/useDashboard.ts`, `src/hooks/useTransactions.ts`).
- Produces: no exports consumed elsewhere — `Beranda` is only referenced by `src/App.tsx:6,40`.

- [ ] **Step 1: Generate a mobile mockup reference**

  Use the Skill tool with `skill: "imagegen-frontend-mobile"` and this brief:

  > "Mobile dashboard screen (375px width) for an Indonesian phone-accessory shop POS app, 'Clean & vibrant' style (bold type, flat bordered cards, one solid accent color, generous whitespace, no gradients/glassmorphism). Sections top to bottom: greeting header with user name and role; two shortcut buttons (Scan & Jual, Kelola Stok); a bento-style stat-card grid with large bold numerals and small labels (sales today, transactions today, profit today for owner role); a low-stock warning card listing a few products with status badges; a recent-activity list of transactions with time and amount."

  Save the reference image to the scratchpad directory for use as a visual target while implementing.

- [ ] **Step 2: Read `src/pages/Beranda.tsx` in full**

- [ ] **Step 3: Restructure the stat-card section into a bento layout**

  Replace the `grid grid-cols-2 gap-3` stat blocks (lines 124-172 currently) with a tighter bento treatment — larger, bolder numerals as the visual anchor, smaller uppercase-tracked labels, using the same `Card`/`CardContent` components from Task 2. Keep the exact same data bindings (`summary?.penjualan_hari_ini`, `summary?.transaksi_hari_ini`, `summary?.laba_hari_ini`, `summary?.produk_menipis`, `summary?.produk_habis`) and the same role-based branching (`staff_gudang` vs `owner`/`kasir` layouts). Restyle the shortcut links, low-stock alert card, and recent-activity card to match (className changes only — keep all `Link`, conditional-rendering, and data logic identical).

- [ ] **Step 4: Typecheck**

  Run: `npx tsc --noEmit -p tsconfig.app.json` — expect clean pass.

- [ ] **Step 5: Build**

  Run: `npm run build` — expect success.

- [ ] **Step 6: Browser check**

  View `/` logged in as each of the three roles (owner, kasir, staff_gudang) and confirm the correct stat cards show per role, the low-stock alert appears only when `lowStockCount > 0`, and layout holds at 375px width.

- [ ] **Step 7: Commit**

  ```bash
  git add src/pages/Beranda.tsx
  git commit -m "style: restructure Beranda into bento-style stat cards"
  ```

---

### Task 5: Jual page refresh

**Files:**
- Modify: `src/pages/Jual.tsx`

**Interfaces:**
- Consumes: existing hooks/state in `Jual.tsx` unchanged (cart state, `BarcodeScanner` component, transaction submission). No changes to any hook signature.

- [ ] **Step 1: Generate a mobile mockup reference**

  Use the Skill tool with `skill: "imagegen-frontend-mobile"` and this brief:

  > "Mobile POS sell screen (375px width), 'Clean & vibrant' style matching an existing dashboard screen (bold type, flat bordered cards, one solid accent, no gradients/glassmorphism). Sections: barcode-scan entry area at top, a scrollable cart list of line items (product name, qty stepper, price), a sticky bottom summary bar with total and a prominent checkout button, and a payment-method selector."

  Save the reference image to the scratchpad directory.

- [ ] **Step 2: Read `src/pages/Jual.tsx` in full**

- [ ] **Step 3: Apply the visual refresh**

  Restyle the scan entry, cart list, summary bar, and payment controls to match the new system and the mockup reference. Keep every state variable, mutation call, and validation branch (barcode lookup, qty stepper bounds, payment-method handling, submit) exactly as-is — className/layout changes only.

- [ ] **Step 4: Typecheck**

  Run: `npx tsc --noEmit -p tsconfig.app.json` — expect clean pass.

- [ ] **Step 5: Build**

  Run: `npm run build` — expect success.

- [ ] **Step 6: Browser check**

  View `/jual`, add at least one product to the cart (via search or manual barcode entry if scanning hardware isn't available), adjust quantity, and complete a checkout to confirm the full flow still works end to end.

- [ ] **Step 7: Commit**

  ```bash
  git add src/pages/Jual.tsx
  git commit -m "style: refresh Jual page to new design system"
  ```

---

### Task 6: Stok page refresh

**Files:**
- Modify: `src/pages/Stok.tsx`

**Interfaces:**
- Consumes: existing hooks/state unchanged, including the barcode auto/manual toggle added in the prior feature (`barcodeMode`, `switchBarcodeMode`) and `CategoryManager`, `BarcodeLabel` components.

- [ ] **Step 1: Generate a mobile mockup reference**

  Use the Skill tool with `skill: "imagegen-frontend-mobile"` and this brief:

  > "Mobile stock/inventory screen (375px width), 'Clean & vibrant' style matching an existing dashboard screen (bold type, flat bordered cards, one solid accent, no gradients/glassmorphism). Sections: search bar with category filter, horizontal status filter pills (Semua/Aman/Menipis/Habis), a scrollable product list with name/price/stock and a status badge per row, a floating or prominent 'Tambah Produk' action, and a bottom sheet product-detail view with stock-movement history."

  Save the reference image to the scratchpad directory.

- [ ] **Step 2: Read `src/pages/Stok.tsx` in full**

- [ ] **Step 3: Apply the visual refresh**

  Restyle the search/filter bar, status-filter pills, product list rows, product-detail sheet, and every dialog (movement, edit, barcode print, create — including the auto/manual barcode toggle) to match the new system. Keep all state, validation, and mutation logic (`handleSubmitCreate`, `handleSubmitEdit`, `handleSubmitMovement`, `switchBarcodeMode`, etc.) exactly as-is — className/layout changes only.

- [ ] **Step 4: Typecheck**

  Run: `npx tsc --noEmit -p tsconfig.app.json` — expect clean pass.

- [ ] **Step 5: Build**

  Run: `npm run build` — expect success.

- [ ] **Step 6: Browser check**

  View `/stok`, filter by a status pill, open a product's detail sheet, open the create-product dialog and toggle between Otomatis/Manual barcode modes to confirm both still render and validate correctly.

- [ ] **Step 7: Commit**

  ```bash
  git add src/pages/Stok.tsx
  git commit -m "style: refresh Stok page to new design system"
  ```

---

### Task 7: Laporan page refresh

**Files:**
- Modify: `src/pages/Laporan.tsx`
- Modify: `src/components/LaporanSalesChart.tsx`
- Modify: `src/components/LaporanTopProducts.tsx`

**Interfaces:**
- Consumes: existing report-aggregation hooks unchanged. `LaporanSalesChart`/`LaporanTopProducts` keep their current props — only internal chart colors (via `--chart-1`..`--chart-5`, already updated in Task 1) and layout classNames change.

- [ ] **Step 1: Read all three files in full**

- [ ] **Step 2: Apply the visual refresh**

  Restyle `Laporan.tsx`'s layout and any Recharts color references in `LaporanSalesChart.tsx`/`LaporanTopProducts.tsx` to pull from the `--chart-*` tokens (already updated in Task 1) rather than any hardcoded hex. Keep data-fetching and aggregation logic unchanged.

- [ ] **Step 3: Typecheck**

  Run: `npx tsc --noEmit -p tsconfig.app.json` — expect clean pass.

- [ ] **Step 4: Build**

  Run: `npm run build` — expect success.

- [ ] **Step 5: Browser check**

  View `/laporan`, confirm the sales chart and top-products list render with the new palette and remain readable.

- [ ] **Step 6: Commit**

  ```bash
  git add src/pages/Laporan.tsx src/components/LaporanSalesChart.tsx src/components/LaporanTopProducts.tsx
  git commit -m "style: refresh Laporan page and charts to new design system"
  ```

---

### Task 8: Profil page refresh

**Files:**
- Modify: `src/pages/Profil.tsx`
- Modify: `src/components/ProfilUserList.tsx`

**Interfaces:**
- Consumes: existing user-list/session hooks unchanged.

- [ ] **Step 1: Read both files in full**

- [ ] **Step 2: Apply the visual refresh**

  Restyle layout/spacing/card treatment to match the new system. Keep logout/session logic unchanged.

- [ ] **Step 3: Typecheck**

  Run: `npx tsc --noEmit -p tsconfig.app.json` — expect clean pass.

- [ ] **Step 4: Build**

  Run: `npm run build` — expect success.

- [ ] **Step 5: Browser check**

  View `/profil`, confirm layout and (if owner role) the user list render correctly.

- [ ] **Step 6: Commit**

  ```bash
  git add src/pages/Profil.tsx src/components/ProfilUserList.tsx
  git commit -m "style: refresh Profil page to new design system"
  ```

---

### Task 9: Whole-app consistency pass

**Files:**
- Potentially modify any file under `src/pages/` and `src/components/` touched in Tasks 1-8.

**Interfaces:**
- No new interfaces — this is a polish-only pass over the surface built by every prior task.

- [ ] **Step 1: Invoke `impeccable` for a cross-app audit**

  Use the Skill tool with `skill: "impeccable"` and this brief:

  > "Audit the just-redesigned acc-konter app (all 6 pages: Login, Beranda, Jual, Stok, Laporan, Profil, plus AppShell and shared ui components) for cross-page visual consistency — spacing rhythm, typography scale usage, color usage, icon weight consistency, empty/loading/error state treatment, and any remaining pre-redesign styling that slipped through. Fix what you find directly in the affected files. Do not change any business logic, hook, or API call."

- [ ] **Step 2: Typecheck**

  Run: `npx tsc --noEmit -p tsconfig.app.json` — expect clean pass.

- [ ] **Step 3: Build**

  Run: `npm run build` — expect success.

- [ ] **Step 4: Full click-through browser check**

  With `npm run dev` running, log in as each of the three roles and click through every visible tab/page for that role, in both light and dark theme, confirming no leftover old-palette styling and no layout breakage.

- [ ] **Step 5: Commit**

  ```bash
  git add -A
  git commit -m "style: whole-app consistency polish pass"
  ```
