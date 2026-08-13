# Integrasi Backend acc-konter — Design Spec

**Tanggal:** 2026-08-13
**Status:** Disetujui, siap masuk tahap perencanaan implementasi

## Latar Belakang

acc-konter (Aplikasi Monitoring Penjualan & Stok Aksesoris) saat ini adalah
frontend React + Vite murni. Semua data dilayani oleh `src/lib/api.ts`, sebuah
mock backend in-memory (di-persist ke `localStorage`) yang sengaja ditulis
"shaped like future Supabase calls" — tiap fungsi `async`, menerima parameter
seperti panggilan backend sungguhan. Login (`src/pages/Login.tsx`) adalah
role-picker dev-only, bukan autentikasi asli.

PRD (`PRD-Aplikasi-Monitoring-Penjualan-Stok-Aksesoris-v1.1.pdf`) §7–§9
merekomendasikan Postgres + backend-as-a-service dengan Auth berbasis
peran/RLS. Tujuan pekerjaan ini: **ganti mock layer dengan backend Postgres
sungguhan**, tanpa mengubah UI/UX yang sudah jadi.

Keputusan yang sudah dikonfirmasi bersama user:

| Keputusan | Pilihan |
|---|---|
| Database | Neon (Postgres serverless), project baru `acc-konter`, region `ap-southeast-1` (Singapore) |
| Lapisan akses data | Backend API tipis di **Vercel Functions** (bukan Neon Data API / RLS literal) |
| Auth | Custom, berbasis tabel `users` sendiri (bukan Neon Auth) — bcrypt + JWT HS256 |
| Scope | Local dev jalan dengan backend asli (`vercel dev` + Neon). Deploy produksi = langkah terpisah, di luar scope ini |

## Arsitektur

```
Browser (React SPA, Vite)
   │  fetch() ke /api/*  (Authorization: Bearer <JWT>)
   ▼
Vercel Functions (api/*.ts, Node runtime)
   │  @neondatabase/serverless — koneksi via DATABASE_URL (env var, server-only)
   ▼
Neon Postgres — project "acc-konter"
```

- Browser tidak pernah menyentuh Postgres atau connection string secara
  langsung — hanya lewat endpoint `/api/*`.
- `src/lib/api.ts` **tetap jadi satu-satunya modul yang dipanggil oleh
  hooks/pages** (`useProducts.ts`, `useTransactions.ts`, `useStockMovements.ts`,
  `useDashboard.ts`, dst.). Nama & signature setiap fungsi ekspor tidak
  berubah — isinya diganti dari mutasi in-memory menjadi `fetch()`. Ini
  berarti **hooks dan halaman tidak perlu diubah** kecuali `Login.tsx` dan
  `src/store/session.ts`.
- Local dev: `vercel dev` menjalankan frontend + functions di satu proses.
  `.env.local` (tidak commit) berisi `DATABASE_URL` dan `JWT_SECRET`.

## Skema Database

Persis mengikuti ERD PRD §7 — tidak ada perubahan struktural dari
`src/types/index.ts` yang sudah ada:

```sql
create table categories (
  id uuid primary key default gen_random_uuid(),
  nama text not null
);

create table users (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  username text not null unique,
  password_hash text not null,
  role text not null check (role in ('owner','kasir','staff_gudang')),
  status text not null default 'aktif' check (status in ('aktif','nonaktif')),
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  barcode text not null unique,
  nama text not null,
  tipe text,
  category_id uuid not null references categories(id),
  harga_modal integer not null,
  harga_jual integer not null,
  stok integer not null default 0,
  stok_min integer not null default 0,
  foto_url text,
  status text not null default 'aktif' check (status in ('aktif','nonaktif'))
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  no_nota text not null unique,
  user_id uuid not null references users(id),
  total integer not null,
  metode_bayar text not null check (metode_bayar in ('tunai','qris','transfer','kartu_debit')),
  dibayar integer not null,
  kembalian integer not null,
  status text not null default 'selesai' check (status in ('selesai','dibatalkan')),
  created_at timestamptz not null default now()
);

create table transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions(id),
  product_id uuid not null references products(id),
  qty integer not null,
  harga integer not null,
  subtotal integer not null
);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  tipe text not null check (tipe in ('in','out','adjust')),
  qty integer not null,
  user_id uuid not null references users(id),
  catatan text,
  created_at timestamptz not null default now()
);

create index on products (category_id);
create index on transaction_items (transaction_id);
create index on stock_movements (product_id);
create index on transactions (created_at desc);
```

`products.stok` tetap kolom denormalized (cache cepat-baca) yang selalu
diperbarui **dalam transaksi SQL yang sama** dengan insert `stock_movements`
— sumber kebenaran konsepnya tetap ledger `stock_movements`, sama seperti
perilaku mock sekarang.

Seed data: kategori & produk contoh dari `src/lib/mockData.ts` dipindahkan ke
migrasi seed SQL. Tiga user awal dibuat dengan username yang sudah ada di
mock (`budi.owner` / owner, `sari.kasir` / kasir, `andi.gudang` /
staff_gudang) dan password sementara acak yang dicetak sekali ke terminal
saat migrasi dijalankan, untuk diganti user setelah login pertama.

## Auth

- `POST /api/auth/login` `{ username, password }`:
  1. Cari `users` by `username`.
  2. Tolak (401) kalau tidak ada, `status != 'aktif'`, atau password tidak
     cocok (`bcrypt.compare`).
  3. Terbitkan JWT HS256 (`JWT_SECRET` di env Vercel), payload
     `{ sub: user.id, role, nama }`, exp 8 jam.
  4. Balas `{ token, user: { id, nama, role } }`.
- Client: `src/store/session.ts` menyimpan `{ token, user }` (ganti dari
  `currentRole`/`currentUserName` pilih-bebas). Fetch wrapper di
  `src/lib/api.ts` menyisipkan header `Authorization: Bearer <token>` di
  setiap panggilan; respons 401 memicu `logout()` + redirect ke `/login`.
- `src/pages/Login.tsx`: role-picker diganti form username + password biasa
  (dua input + tombol submit), memanggil fungsi `login(username, password)`
  baru di `api.ts`.

## API Surface

Satu function per resource (bukan satu file per operasi), method dibedakan
lewat HTTP verb:

| Endpoint | Method | Fungsi `api.ts` yang dipetakan | Role diizinkan |
|---|---|---|---|
| `/api/auth/login` | POST | `login` (baru) | publik |
| `/api/categories` | GET | `getCategories` | semua yang login |
| `/api/categories` | POST | `createCategory` | owner |
| `/api/categories/:id` | PATCH | `updateCategory` | owner |
| `/api/products` | GET | `getProducts` (query `search`, `category_id`) | semua (kasir tidak dapat `harga_modal`) |
| `/api/products/:id` | GET | `getProductById` | semua |
| `/api/products/barcode/:barcode` | GET | `getProductByBarcode` | semua |
| `/api/products/low-stock` | GET | `getLowStockProducts` | semua |
| `/api/products` | POST | `createProduct` | owner, staff_gudang |
| `/api/products/:id` | PATCH | `updateProduct` | owner, staff_gudang |
| `/api/barcode/generate` | POST | `generateBarcode` | owner, staff_gudang |
| `/api/users` | GET | `getUsers` | owner |
| `/api/transactions` | GET | `getTransactions` (query `limit`) | owner, kasir |
| `/api/transactions` | POST | `createTransaction` | owner, kasir |
| `/api/transactions/:id/items` | GET | `getTransactionItems` | owner, kasir |
| `/api/transaction-items` | GET | `getAllTransactionItems` | owner (dipakai agregasi laporan) |
| `/api/stock-movements` | GET | `getStockMovements` (query `product_id`) | semua |
| `/api/stock-movements` | POST | `addStockMovement` | owner, staff_gudang |
| `/api/dashboard-summary` | GET | `getDashboardSummary` | owner, kasir (kasir tidak dapat `laba_hari_ini`) |

Setiap function (kecuali login) memanggil helper `requireRole(req, [...roles])`
di awal — verifikasi & decode JWT, 401 kalau tidak ada/invalid, 403 kalau
role tidak diizinkan, sebelum menyentuh database.

`createTransaction` dan `addStockMovement` membungkus insert + update
`products.stok` dalam satu transaksi SQL (`BEGIN`/`COMMIT`, rollback kalau
error) — memenuhi kebutuhan "transaksi atomik" PRD §8.

## Error Handling

- Semua function balas JSON `{ error: "pesan bahasa Indonesia" }` dengan
  status code yang sesuai: 400 (validasi), 401 (tidak login), 403 (role
  tidak diizinkan), 404 (tidak ditemukan), 409 (konflik, mis. barcode
  duplikat), 500 (error tak terduga).
- Pesan error dijaga sama persis dengan yang sudah ada di mock sekarang
  (mis. `Barcode "..." sudah digunakan produk lain`, `Produk dengan id
  "..." tidak ditemukan`) supaya UI (toast via `sonner`) tidak perlu berubah.
- Client `api.ts` tetap `throw new Error(message)` untuk tiap respons
  non-2xx, sama seperti kontrak sekarang.

## Testing / Validasi

Tidak ada test suite otomatis di repo ini. Validasi dilakukan lewat:

- `tsc -b` dan `oxlint` (build & lint bersih).
- Smoke test manual via `vercel dev`: login sebagai tiap role, jalankan alur
  jual (Jual), barang masuk & penyesuaian (Stok), lihat Dashboard & Laporan,
  kelola produk/kategori, kelola user (Profil) — verifikasi data benar-benar
  tersimpan di Neon (bukan localStorage lagi).
- Coba akses endpoint yang dibatasi role dari akun yang salah (mis. kasir
  memanggil `/api/stock-movements` POST) — harus dapat 403.

## Di Luar Scope

- Deploy ke Vercel production (domain, env var produksi, dsb.) — langkah
  terpisah setelah backend lokal terverifikasi jalan.
- Mode offline/PWA + sinkronisasi (Fase 2 PRD).
- Neon Data API / Postgres RLS literal — didokumentasikan sebagai alternatif
  yang dipertimbangkan, tidak dipakai (lihat tabel keputusan di atas).
- Export PDF/Excel laporan, cetak barcode fisik, manajemen supplier (Fase 2
  PRD; cetak barcode di UI sudah ada di frontend, tidak berubah).
