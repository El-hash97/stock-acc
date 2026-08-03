# Manual Barcode Entry — Design

**Date:** 2026-08-03
**Status:** Approved

## Problem

Some products already carry a physical barcode from the manufacturer/packaging. The current "Tambah Produk" dialog in `src/pages/Stok.tsx` only supports auto-generated barcodes, so there's no way to register a product using its existing printed barcode.

## Design

Add an **Otomatis / Manual** toggle above the barcode field in the Tambah Produk dialog.

- **Otomatis (default)**: unchanged behavior — read-only field, auto-generated 13-digit barcode on dialog open, "acak ulang" (regenerate) button.
- **Manual**: field becomes an editable numeric `<Input>`, empty by default, placeholder "Ketik barcode dari kemasan produk". Regenerate button hidden. No length restriction — digits only, must be non-empty.
- **Switching modes**: clicking "Manual" clears the current barcode value. Clicking "Otomatis" immediately generates a new barcode.
- **Submit validation**: unchanged pattern — submit button disabled while barcode is empty (in either mode). Duplicate-barcode detection already happens server-side in `createProduct` (`src/lib/api.ts`), which throws and surfaces via the existing toast error handling — no new duplicate-check logic needed.
- Nama, harga modal, harga jual remain manual entry as they are today — no changes.

## Scope

Frontend only, confined to the create-product dialog in `src/pages/Stok.tsx`. No API/type changes needed — `CreateProductInput.barcode` already accepts any string.
