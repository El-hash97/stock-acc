# Graph Report - c:/Users/El/Documents/acc-konter  (2026-08-01)

## Corpus Check
- Corpus is ~23 words - fits in a single context window. You may not need a graph.

## Summary
- 38 nodes · 52 edges · 9 communities (6 shown, 3 thin omitted)
- Extraction: 96% EXTRACTED · 0% INFERRED · 4% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Fase 2 Roadmap Features
- Frontend/Backend Tech Stack
- Sales Reporting & Transaction Data
- Scan-to-Transaction Flow
- Product & Stock Data Model
- Roles & Access Control
- MVP Scope Prioritization
- Performance Requirement
- Out of Scope Items

## God Nodes (most connected - your core abstractions)
1. `Transaksi / POS (Must)` - 8 edges
2. `Fase 1 (MVP) Scope` - 8 edges
3. `Owner / Admin Role` - 6 edges
4. `Manajemen Stok (Must)` - 6 edges
5. `Dashboard & Laporan (Must)` - 6 edges
6. `products table` - 5 edges
7. `users table` - 5 edges
8. `Fase 2 Scope` - 5 edges
9. `Master Produk (Must)` - 4 edges
10. `Scan Barcode (Must)` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Owner / Admin Role` --conceptually_related_to--> `Dashboard & Laporan (Must)`  [EXTRACTED]
  PRD-Aplikasi-Monitoring-Penjualan-Stok-Aksesoris-v1.1.pdf → PRD-Aplikasi-Monitoring-Penjualan-Stok-Aksesoris-v1.1.pdf  _Bridges community 5 → community 2_
- `Owner / Admin Role` --conceptually_related_to--> `Manajemen Stok (Must)`  [EXTRACTED]
  PRD-Aplikasi-Monitoring-Penjualan-Stok-Aksesoris-v1.1.pdf → PRD-Aplikasi-Monitoring-Penjualan-Stok-Aksesoris-v1.1.pdf  _Bridges community 5 → community 3_
- `Kasir Role` --conceptually_related_to--> `Transaksi / POS (Must)`  [EXTRACTED]
  PRD-Aplikasi-Monitoring-Penjualan-Stok-Aksesoris-v1.1.pdf → PRD-Aplikasi-Monitoring-Penjualan-Stok-Aksesoris-v1.1.pdf  _Bridges community 2 → community 3_
- `Fase 1 (MVP) Scope` --shares_data_with--> `Autentikasi & User (Must)`  [EXTRACTED]
  PRD-Aplikasi-Monitoring-Penjualan-Stok-Aksesoris-v1.1.pdf → PRD-Aplikasi-Monitoring-Penjualan-Stok-Aksesoris-v1.1.pdf  _Bridges community 5 → community 6_
- `Master Produk (Must)` --shares_data_with--> `products table`  [EXTRACTED]
  PRD-Aplikasi-Monitoring-Penjualan-Stok-Aksesoris-v1.1.pdf → PRD-Aplikasi-Monitoring-Penjualan-Stok-Aksesoris-v1.1.pdf  _Bridges community 5 → community 4_

## Hyperedges (group relationships)
- **Three-Role Permission Matrix** — prd_aplikasi_monitoring_penjualan_stok_aksesoris_v1_1_owner_admin, prd_aplikasi_monitoring_penjualan_stok_aksesoris_v1_1_kasir, prd_aplikasi_monitoring_penjualan_stok_aksesoris_v1_1_staff_gudang [EXTRACTED 1.00]
- **Stock Source-of-Truth Flow (products ↔ stock_movements ↔ transactions)** — prd_aplikasi_monitoring_penjualan_stok_aksesoris_v1_1_tbl_products, prd_aplikasi_monitoring_penjualan_stok_aksesoris_v1_1_tbl_stock_movements, prd_aplikasi_monitoring_penjualan_stok_aksesoris_v1_1_tbl_transactions, prd_aplikasi_monitoring_penjualan_stok_aksesoris_v1_1_alert_stok [EXTRACTED 0.95]
- **Frontend Layer Stack (React+Vite, Tailwind, React Query, Zustand)** — prd_aplikasi_monitoring_penjualan_stok_aksesoris_v1_1_react_vite, prd_aplikasi_monitoring_penjualan_stok_aksesoris_v1_1_tailwind_css, prd_aplikasi_monitoring_penjualan_stok_aksesoris_v1_1_react_query, prd_aplikasi_monitoring_penjualan_stok_aksesoris_v1_1_zustand [EXTRACTED 1.00]

## Communities (9 total, 3 thin omitted)

### Community 0 - "Fase 2 Roadmap Features"
Cohesion: 0.25
Nodes (8): Backup Berkala (Should, Fase 2), Cetak Barcode (Should, Fase 2), Export PDF/Excel (Should), Fase 2 Scope, jsPDF, Manajemen Supplier (Could, Fase 2), Mode Offline / PWA (Should, Fase 2), NFR: Offline (PWA, sync)

### Community 1 - "Frontend/Backend Tech Stack"
Cohesion: 0.29
Nodes (7): Netlify / Vercel Hosting, NFR: Keamanan (hashed password, RLS, HTTPS), React Query, React + Vite (PWA, mobile-first), Supabase (Postgres, Auth/RLS, Realtime, Storage), Tailwind CSS, Zustand

### Community 2 - "Sales Reporting & Transaction Data"
Cohesion: 0.40
Nodes (6): Dashboard & Laporan (Must), Kasir Role, Recharts, transaction_items table, transactions table, users table

### Community 3 - "Scan-to-Transaction Flow"
Cohesion: 0.50
Nodes (5): html5-qrcode / zxing, Manajemen Stok (Must), NFR: Keandalan (auto-save, atomic tx, backup), Scan Barcode (Must), Transaksi / POS (Must)

### Community 4 - "Product & Stock Data Model"
Cohesion: 0.50
Nodes (4): Alert Stok (Should), categories table, products table, stock_movements table

### Community 5 - "Roles & Access Control"
Cohesion: 0.50
Nodes (4): Autentikasi & User (Must), Master Produk (Must), Owner / Admin Role, Staff Gudang Role

## Ambiguous Edges - Review These
- `Kasir Role` → `Dashboard & Laporan (Must)`  [AMBIGUOUS]
  PRD-Aplikasi-Monitoring-Penjualan-Stok-Aksesoris-v1.1.pdf · relation: conceptually_related_to
- `Staff Gudang Role` → `Master Produk (Must)`  [AMBIGUOUS]
  PRD-Aplikasi-Monitoring-Penjualan-Stok-Aksesoris-v1.1.pdf · relation: conceptually_related_to

## Knowledge Gaps
- **9 isolated node(s):** `categories table`, `Tailwind CSS`, `html5-qrcode / zxing`, `React Query`, `Zustand` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Kasir Role` and `Dashboard & Laporan (Must)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Staff Gudang Role` and `Master Produk (Must)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Dashboard & Laporan (Must)` connect `Sales Reporting & Transaction Data` to `Fase 2 Roadmap Features`, `Roles & Access Control`, `MVP Scope Prioritization`?**
  _High betweenness centrality (0.278) - this node is a cross-community bridge._
- **Why does `Export PDF/Excel (Should)` connect `Fase 2 Roadmap Features` to `Sales Reporting & Transaction Data`?**
  _High betweenness centrality (0.230) - this node is a cross-community bridge._
- **What connects `categories table`, `Tailwind CSS`, `html5-qrcode / zxing` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._