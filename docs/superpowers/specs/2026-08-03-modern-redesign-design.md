# Modern Redesign — Design

**Date:** 2026-08-03
**Status:** Approved

## Problem

The acc-konter app (Aplikasi Monitoring Penjualan & Stok Aksesoris) currently uses a "minimalist-ui" warm-monochrome/blue-brand editorial look, defined in `src/index.css`. The user wants the whole app modernized visually.

## Scope

**All pages**: Login, Beranda, Jual, Stok, Laporan, Profil.

**Color**: The current blue brand palette (`--brand-primary: #1565C0` etc., marked "hard constraint, do not change" in `src/index.css`) is released — a new accent may be chosen freely during implementation, driven by the `design-taste-frontend` skill's own direction-inference process. Constraint: solid, bold accent color — no gradients, no glassmorphism. Stock-status semantic colors (aman/menipis/habis pastel bg+fg pairs) are preserved as a pattern but re-tuned to stay consistent with the new accent.

**Style direction**: "Clean & vibrant" — bold typography, generous whitespace, flat bordered cards (no heavy shadows — the existing `box-shadow: 0 1px 2px rgba(0,0,0,0.04)` ultra-subtle-elevation rule in `index.css` fits this direction and should be kept/extended, not replaced with heavy shadows). Reference feel: Linear / Stripe Dashboard / Revolut.

**Theming**: Both light and dark themes (`:root` / `.dark` in `src/index.css`) are redesigned from the same new token system, not just light.

**Structure**: Navigation architecture is unchanged — the bottom tab bar (`src/components/AppShell.tsx`) plus sticky header stays as-is; this redesign is a visual-language refresh, not an IA change. Per-page scope:

- **Login**: visual refresh only, form structure unchanged.
- **Beranda**: summary cards restructured into a tighter bento/stat-card style (large numerals, small labels) — the one page getting a structural (not just visual) touch-up.
- **Jual, Stok, Laporan**: visual refresh of existing shadcn/ui components (Card, Button, Input, Badge, Dialog, Sheet) to the new token system; workflows/logic unchanged.
- **Profil**: visual refresh only.

No business logic changes anywhere — this is styling/token/component-appearance work only.

## Execution approach

Sequential, single working branch, page by page:

1. Establish the new design system first (color tokens, typography scale, spacing/radius, base component styles for Card/Button/Input/Badge/nav) using the `design-taste-frontend` skill to set direction, informed by an audit of the current app (per that skill's audit-first-on-redesigns behavior).
2. For visually complex pages (Beranda, Jual, Stok), generate mobile mockup references with `imagegen-frontend-mobile` before implementing, to have a concrete visual target.
3. Apply the new system page by page in this order: Login → Beranda → Jual → Stok → Laporan → Profil. Verify each page in a running browser before moving to the next (per this project's UI-change verification norm).
4. Close with an `impeccable` pass across the whole app for cross-page consistency and polish.

Rejected alternative: big-bang redesign of all pages in one batch — faster wall-clock but harder to review and more likely to regress the existing transaction flows (Jual, Stok) that have real business logic behind them.

## Out of scope

- Any change to business logic, API layer (`src/lib/api.ts`), hooks, or data shapes.
- Navigation/IA restructuring.
- Non-visual behavior changes.
