# Integrasi Backend acc-konter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ganti mock data layer (`src/lib/api.ts`, in-memory + localStorage) dengan backend sungguhan: Neon Postgres diakses lewat Vercel Functions, dengan auth username/password (bcrypt + JWT) dan otorisasi per-role sesuai matriks PRD §3 — tanpa mengubah UI/UX yang sudah ada.

**Architecture:** Browser → `fetch()` ke `/api/*` (Vercel Functions, Node runtime) → `@neondatabase/serverless` → Neon Postgres. `src/lib/api.ts` tetap satu-satunya modul yang dipanggil hooks/pages; isinya diganti dari mutasi in-memory jadi `fetch()`, signature fungsi tidak berubah. Setiap function memverifikasi JWT dan role sebelum query. Local dev dijalankan lewat `vercel dev --local` (satu proses untuk frontend + functions, tanpa perlu link ke akun Vercel).

**Tech Stack:** Neon Postgres (`@neondatabase/serverless`), Vercel Functions (`@vercel/node`), `bcryptjs`, `jsonwebtoken`, React Query (sudah ada, tidak berubah).

## Global Constraints

- Database: Neon project `acc-konter`, region `ap-southeast-1` (Singapore).
- Auth: JWT **HS256** (bukan RS256/JWKS), payload `{ sub, role, nama }`, expiry 8 jam.
- Semua endpoint balas JSON `{ error: "pesan bahasa Indonesia" }` dengan status code yang sesuai pada error; pesan error identik dengan yang ada di mock sekarang.
- `src/lib/api.ts` — nama & signature setiap fungsi ekspor **tidak berubah** dari kondisi sekarang (lihat file itu untuk daftar lengkap). Hooks (`src/hooks/*.ts`) dan halaman (`src/pages/*.tsx`) tidak boleh diubah, kecuali `Login.tsx`.
- Scope pass ini: backend jalan sungguhan di **local dev** (`vercel dev --local` + Neon). Deploy produksi ke Vercel **di luar scope**.
- Tidak ada test suite otomatis di repo — validasi lewat `tsc -b`, `oxlint`, dan smoke test manual (curl / UI) seperti didefinisikan di tiap task.

---

### Task 1: Provisioning Neon project & file env lokal

**Files:**
- Create: `.env.local` (tidak dicommit — sudah tercakup pola `*.local` di `.gitignore`)
- Create: `.env.local.example`

**Interfaces:**
- Consumes: Neon CLI (`neon`) sudah ter-autentikasi sebagai `purnomowidodo074@gmail.com`, org id `org-lingering-star-56008821`.
- Produces: `DATABASE_URL` dan `JWT_SECRET` di `.env.local`, dipakai oleh semua task berikutnya (migrasi DB & Vercel Functions).

- [ ] **Step 1: Buat project Neon baru**

Run:
```bash
neon projects create --name acc-konter --org-id org-lingering-star-56008821 --region-id aws-ap-southeast-1 --output json
```
Expected: JSON berisi `project.id`, dan `connection_uris[0].connection_uri` (connection string lengkap termasuk password).

- [ ] **Step 2: Simpan connection string ke `.env.local`**

Ambil nilai `connection_uri` dari output Step 1, lalu buat file:

```bash
cat > .env.local <<'EOF'
DATABASE_URL=postgresql://<isi-dari-connection_uri-step-1>
JWT_SECRET=<isi-dengan-hasil-step-3>
EOF
```

- [ ] **Step 3: Generate `JWT_SECRET` acak**

Run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Tempel hasilnya (string hex 64 karakter) sebagai nilai `JWT_SECRET` di `.env.local` dari Step 2.

- [ ] **Step 4: Buat template `.env.local.example` (tanpa secret)**

```
DATABASE_URL=postgresql://user:password@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=generate-with-node-crypto-randomBytes-32-hex
```

- [ ] **Step 5: Verifikasi koneksi database jalan**

Run:
```bash
node --env-file=.env.local -e "
import('@neondatabase/serverless').then(async ({ neon }) => {
  const sql = neon(process.env.DATABASE_URL)
  const rows = await sql\`select version()\`
  console.log(rows[0])
})
"
```
Expected: mencetak objek berisi versi Postgres (mis. `{ version: 'PostgreSQL 17...' }`). Kalau error `Cannot find module '@neondatabase/serverless'`, lanjut ke Task 2 dulu (install dependency) baru ulangi step ini.

- [ ] **Step 6: Commit**

`.env.local` tidak dicommit (sudah ter-ignore). Commit hanya template:

```bash
git add .env.local.example
git commit -m "chore: add Neon env var template

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Dependencies, konfigurasi Vercel & TypeScript untuk `api/`

**Files:**
- Modify: `package.json`
- Create: `vercel.json`
- Create: `tsconfig.api.json`
- Modify: `tsconfig.json`

**Interfaces:**
- Consumes: struktur `tsconfig.app.json` / `tsconfig.node.json` yang sudah ada (pola `moduleResolution: "bundler"`, flag lint yang sama).
- Produces: `npm run dev:full` (menjalankan `vercel dev --local`), `npm run db:migrate` (menjalankan `db/migrate.mjs`), `tsc -b` yang juga mem-typecheck folder `api/`.

- [ ] **Step 1: Install dependencies backend**

Run:
```bash
npm install @neondatabase/serverless bcryptjs jsonwebtoken
npm install -D @vercel/node @types/jsonwebtoken vercel
```

- [ ] **Step 2: Tambah script di `package.json`**

Edit bagian `"scripts"` jadi:

```json
"scripts": {
  "dev": "vite",
  "dev:full": "vercel dev --local",
  "build": "tsc -b && vite build",
  "lint": "oxlint",
  "preview": "vite preview",
  "db:migrate": "node --env-file=.env.local db/migrate.mjs"
},
```

- [ ] **Step 3: Buat `vercel.json`**

```json
{
  "framework": "vite"
}
```

- [ ] **Step 4: Buat `tsconfig.api.json`**

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.api.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "types": ["node"],
    "esModuleInterop": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["api"]
}
```

- [ ] **Step 5: Daftarkan `tsconfig.api.json` di root `tsconfig.json`**

Read `tsconfig.json` dulu, lalu ubah `"references"` jadi:

```json
"references": [
  { "path": "./tsconfig.app.json" },
  { "path": "./tsconfig.node.json" },
  { "path": "./tsconfig.api.json" }
]
```

- [ ] **Step 6: Verifikasi**

Run: `npx tsc -b`
Expected: sukses tanpa error (folder `api/` masih kosong, jadi tidak ada file untuk di-check — perintah ini hanya harus tidak gagal karena config salah).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vercel.json tsconfig.api.json tsconfig.json
git commit -m "chore: add backend deps and Vercel/TS config for api/

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Skema database (`db/schema.sql`) + script migrasi

**Files:**
- Create: `db/schema.sql`
- Create: `db/migrate.mjs`

**Interfaces:**
- Consumes: `DATABASE_URL` dari `.env.local` (Task 1).
- Produces: tabel `categories`, `users`, `products`, `transactions`, `transaction_items`, `stock_movements` di Neon — dipakai semua endpoint di Task 6–10.

- [ ] **Step 1: Tulis `db/schema.sql`**

```sql
-- Extension dipakai untuk crypt()/gen_salt() saat seeding password (Task 4)
-- dan gen_random_uuid() sebagai default id kolom (Postgres 13+ sudah punya
-- gen_random_uuid() built-in, tapi pgcrypto tetap dibutuhkan untuk crypt()).
create extension if not exists pgcrypto;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  nama text not null
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  username text not null unique,
  password_hash text not null,
  role text not null check (role in ('owner','kasir','staff_gudang')),
  status text not null default 'aktif' check (status in ('aktif','nonaktif')),
  created_at timestamptz not null default now()
);

create table if not exists products (
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

create table if not exists transactions (
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

create table if not exists transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions(id),
  product_id uuid not null references products(id),
  qty integer not null,
  harga integer not null,
  subtotal integer not null
);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  tipe text not null check (tipe in ('in','out','adjust')),
  qty integer not null,
  user_id uuid not null references users(id),
  catatan text,
  created_at timestamptz not null default now()
);

create index if not exists products_category_id_idx on products (category_id);
create index if not exists transaction_items_transaction_id_idx on transaction_items (transaction_id);
create index if not exists stock_movements_product_id_idx on stock_movements (product_id);
create index if not exists transactions_created_at_idx on transactions (created_at desc);
```

- [ ] **Step 2: Tulis `db/migrate.mjs`**

```js
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dir = path.dirname(fileURLToPath(import.meta.url))
const file = process.argv[2]

if (!file) {
  console.error('Usage: npm run db:migrate -- <schema.sql|seed.sql>')
  process.exit(1)
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Run via: npm run db:migrate -- <file>')
  process.exit(1)
}

const sql = neon(databaseUrl)

const rawText = readFileSync(path.join(dir, file), 'utf8')
// Strip whole-line comments first so a `;`-split chunk never starts with
// `--` while still containing real SQL on a later line.
const withoutComments = rawText
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')

const statements = withoutComments
  .split(';')
  .map((statement) => statement.trim())
  .filter((statement) => statement.length > 0)

for (const statement of statements) {
  const preview = statement.slice(0, 70).replace(/\s+/g, ' ')
  console.log(`Running: ${preview}...`)
  await sql.query(statement)
}

console.log(`Done. Ran ${statements.length} statements from ${file}.`)
```

- [ ] **Step 3: Jalankan migrasi schema**

Run: `npm run db:migrate -- db/schema.sql`
Expected: mencetak satu baris `Running: ...` per statement, diakhiri `Done. Ran 11 statements from db/schema.sql.` (1 extension + 6 create table + 4 create index), tanpa error.

- [ ] **Step 4: Verifikasi tabel dibuat**

Run:
```bash
node --env-file=.env.local -e "
import('@neondatabase/serverless').then(async ({ neon }) => {
  const sql = neon(process.env.DATABASE_URL)
  const rows = await sql\`select table_name from information_schema.tables where table_schema = 'public' order by table_name\`
  console.log(rows.map((r) => r.table_name))
})
"
```
Expected: `['categories', 'products', 'stock_movements', 'transaction_items', 'transactions', 'users']`

- [ ] **Step 5: Commit**

```bash
git add db/schema.sql db/migrate.mjs
git commit -m "feat: add Postgres schema and migration runner

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Seed data (`db/seed.sql`)

**Files:**
- Create: `db/seed.sql`

**Interfaces:**
- Consumes: tabel dari Task 3.
- Produces: 7 kategori, 3 user (password sementara **`konter123`** untuk ketiganya), 20 produk, 3 transaksi historis + item-nya, 21 baris `stock_movements` (1 "stok awal" per produk + 1 contoh "adjust"). Dipakai untuk smoke test di Task 6–13.

- [ ] **Step 1: Tulis `db/seed.sql`**

```sql
-- Kategori (id tetap/fixed supaya bisa direferensikan produk di bawah)
insert into categories (id, nama) values
  ('a0000000-0000-0000-0000-000000000001', 'Casing & Case'),
  ('a0000000-0000-0000-0000-000000000002', 'Earphone & Headset'),
  ('a0000000-0000-0000-0000-000000000003', 'Kabel & Charger'),
  ('a0000000-0000-0000-0000-000000000004', 'Tempered Glass'),
  ('a0000000-0000-0000-0000-000000000005', 'Power Bank'),
  ('a0000000-0000-0000-0000-000000000006', 'Holder & Ring'),
  ('a0000000-0000-0000-0000-000000000007', 'Aksesoris Lainnya');

-- User awal. Password sementara "konter123" untuk ketiganya (bcrypt via
-- pgcrypto, format hash kompatibel dengan bcryptjs.compare() di Node).
insert into users (id, nama, username, password_hash, role, status, created_at) values
  ('c0000000-0000-0000-0000-000000000001', 'Budi Santoso', 'budi.owner', crypt('konter123', gen_salt('bf')), 'owner', 'aktif', '2025-01-10T02:00:00Z'),
  ('c0000000-0000-0000-0000-000000000002', 'Sari Wulandari', 'sari.kasir', crypt('konter123', gen_salt('bf')), 'kasir', 'aktif', '2025-02-15T02:00:00Z'),
  ('c0000000-0000-0000-0000-000000000003', 'Andi Prasetyo', 'andi.gudang', crypt('konter123', gen_salt('bf')), 'staff_gudang', 'aktif', '2025-02-20T02:00:00Z');

-- Produk (katalog aksesoris HP contoh, beberapa sengaja di bawah stok_min
-- supaya UI alert stok menipis/habis punya data).
insert into products (id, barcode, nama, tipe, category_id, harga_modal, harga_jual, stok, stok_min, foto_url, status) values
  ('b0000000-0000-0000-0000-000000000001', '8991002300011', 'Casing Silikon iPhone 13', null, 'a0000000-0000-0000-0000-000000000001', 18000, 35000, 24, 10, null, 'aktif'),
  ('b0000000-0000-0000-0000-000000000002', '8991002300028', 'Casing TPU Samsung A54', null, 'a0000000-0000-0000-0000-000000000001', 15000, 30000, 8, 10, null, 'aktif'),
  ('b0000000-0000-0000-0000-000000000003', '8991002300035', 'Hardcase Bening Xiaomi Redmi Note 12', null, 'a0000000-0000-0000-0000-000000000001', 12000, 25000, 3, 10, null, 'aktif'),
  ('b0000000-0000-0000-0000-000000000004', '8991002300042', 'TWS Earbuds Bluetooth 5.3', null, 'a0000000-0000-0000-0000-000000000002', 65000, 120000, 15, 5, null, 'aktif'),
  ('b0000000-0000-0000-0000-000000000005', '8991002300059', 'Headset Kabel Jack 3.5mm', null, 'a0000000-0000-0000-0000-000000000002', 12000, 25000, 0, 8, null, 'aktif'),
  ('b0000000-0000-0000-0000-000000000006', '8991002300066', 'Earphone Kabel Type-C', null, 'a0000000-0000-0000-0000-000000000002', 20000, 40000, 12, 6, null, 'aktif'),
  ('b0000000-0000-0000-0000-000000000007', '8991002300073', 'Kabel Data USB-C 1M', null, 'a0000000-0000-0000-0000-000000000003', 10000, 22000, 40, 15, null, 'aktif'),
  ('b0000000-0000-0000-0000-000000000008', '8991002300080', 'Kabel Data Lightning 1M', null, 'a0000000-0000-0000-0000-000000000003', 15000, 30000, 18, 15, null, 'aktif'),
  ('b0000000-0000-0000-0000-000000000009', '8991002300097', 'Kepala Charger 20W PD', null, 'a0000000-0000-0000-0000-000000000003', 35000, 65000, 6, 8, null, 'aktif'),
  ('b0000000-0000-0000-0000-00000000000a', '8991002300103', 'Charger Mobil Dual USB', null, 'a0000000-0000-0000-0000-000000000003', 25000, 50000, 9, 6, null, 'aktif'),
  ('b0000000-0000-0000-0000-00000000000b', '8991002300110', 'Tempered Glass iPhone 14', null, 'a0000000-0000-0000-0000-000000000004', 8000, 20000, 30, 12, null, 'aktif'),
  ('b0000000-0000-0000-0000-00000000000c', '8991002300127', 'Tempered Glass Samsung A34', null, 'a0000000-0000-0000-0000-000000000004', 8000, 20000, 2, 12, null, 'aktif'),
  ('b0000000-0000-0000-0000-00000000000d', '8991002300134', 'Anti Gores Privacy Universal', null, 'a0000000-0000-0000-0000-000000000004', 9000, 22000, 14, 10, null, 'aktif'),
  ('b0000000-0000-0000-0000-00000000000e', '8991002300141', 'Power Bank 10000mAh', null, 'a0000000-0000-0000-0000-000000000005', 85000, 150000, 7, 5, null, 'aktif'),
  ('b0000000-0000-0000-0000-00000000000f', '8991002300158', 'Power Bank 20000mAh Fast Charging', null, 'a0000000-0000-0000-0000-000000000005', 140000, 230000, 1, 4, null, 'aktif'),
  ('b0000000-0000-0000-0000-000000000010', '8991002300165', 'Ring Holder HP Metal', null, 'a0000000-0000-0000-0000-000000000006', 6000, 15000, 22, 10, null, 'aktif'),
  ('b0000000-0000-0000-0000-000000000011', '8991002300172', 'PopSocket Motif', null, 'a0000000-0000-0000-0000-000000000006', 8000, 18000, 16, 8, null, 'aktif'),
  ('b0000000-0000-0000-0000-000000000012', '8991002300189', 'Holder HP Mobil Jepit', null, 'a0000000-0000-0000-0000-000000000006', 20000, 40000, 5, 5, null, 'aktif'),
  ('b0000000-0000-0000-0000-000000000013', '8991002300196', 'Stylus Pen Universal', null, 'a0000000-0000-0000-0000-000000000007', 15000, 32000, 10, 6, null, 'aktif'),
  ('b0000000-0000-0000-0000-000000000014', '8991002300202', 'Cleaning Kit Layar HP', null, 'a0000000-0000-0000-0000-000000000007', 7000, 16000, 13, 8, null, 'aktif');

-- Transaksi historis (untuk data Laporan & riwayat transaksi).
insert into transactions (id, no_nota, user_id, total, metode_bayar, dibayar, kembalian, status, created_at) values
  ('d0000000-0000-0000-0000-000000000001', 'INV-20260731-001', 'c0000000-0000-0000-0000-000000000002', 55000, 'tunai', 60000, 5000, 'selesai', '2026-07-31T02:15:00Z'),
  ('d0000000-0000-0000-0000-000000000002', 'INV-20260731-002', 'c0000000-0000-0000-0000-000000000002', 120000, 'qris', 120000, 0, 'selesai', '2026-07-31T05:40:00Z'),
  ('d0000000-0000-0000-0000-000000000003', 'INV-20260801-001', 'c0000000-0000-0000-0000-000000000002', 59000, 'tunai', 60000, 1000, 'selesai', '2026-08-01T01:05:00Z');

insert into transaction_items (id, transaction_id, product_id, qty, harga, subtotal) values
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 1, 35000, 35000),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-00000000000b', 1, 20000, 20000),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 1, 120000, 120000),
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000007', 2, 22000, 44000),
  ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000010', 1, 15000, 15000);

-- Riwayat stock_movements: satu "stok awal" per produk (qty = stok saat ini
-- di atas) + satu contoh penyesuaian manual. `stok` di atas adalah cache
-- independen (lihat db/schema.sql), jadi baris ini sengaja tidak direplay
-- untuk merekonstruksi nilai stok — cukup sebagai riwayat yang bisa dilihat
-- di UI Stok.
insert into stock_movements (id, product_id, tipe, qty, user_id, catatan, created_at)
select
  gen_random_uuid(),
  id,
  'in',
  stok,
  'c0000000-0000-0000-0000-000000000003',
  'Stok awal',
  '2025-07-01T01:00:00Z'
from products;

insert into stock_movements (id, product_id, tipe, qty, user_id, catatan, created_at) values
  (gen_random_uuid(), 'b0000000-0000-0000-0000-00000000000f', 'adjust', -1, 'c0000000-0000-0000-0000-000000000003', 'Koreksi stok fisik (barang rusak)', '2026-07-30T03:00:00Z');
```

- [ ] **Step 2: Jalankan seed**

Run: `npm run db:migrate -- db/seed.sql`
Expected: `Done. Ran 6 statements from db/seed.sql.` (categories, users, products, transactions, transaction_items, 2x stock_movements insert = 6 statement blocks), tanpa error.

- [ ] **Step 3: Verifikasi jumlah baris**

Run:
```bash
node --env-file=.env.local -e "
import('@neondatabase/serverless').then(async ({ neon }) => {
  const sql = neon(process.env.DATABASE_URL)
  for (const table of ['categories','users','products','transactions','transaction_items','stock_movements']) {
    const [row] = await sql.query(\`select count(*)::int as n from \${table}\`)
    console.log(table, row.n)
  }
})
"
```
Expected: `categories 7`, `users 3`, `products 20`, `transactions 3`, `transaction_items 5`, `stock_movements 21`.

- [ ] **Step 4: Commit**

```bash
git add db/seed.sql
git commit -m "feat: add seed data matching existing mock catalog

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Helper backend bersama (`api/_db.ts`, `api/_auth.ts`, `api/_http.ts`)

**Files:**
- Create: `api/_db.ts`
- Create: `api/_auth.ts`
- Create: `api/_http.ts`

**Interfaces:**
- Consumes: `DATABASE_URL`, `JWT_SECRET` dari env (Task 1); `Role` type dari `src/types/index.ts`.
- Produces: `sql` (query function) & `NeonDbError` dari `_db.ts`; `signToken`, `requireRole`, `ApiError`, `AuthPayload` dari `_auth.ts`; `sendError`, `readBody` dari `_http.ts` — dipakai oleh **semua** file di Task 6–10.

- [ ] **Step 1: Tulis `api/_db.ts`**

```ts
import { neon, NeonDbError } from '@neondatabase/serverless'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set')
}

export const sql = neon(databaseUrl)
export { NeonDbError }
```

- [ ] **Step 2: Tulis `api/_auth.ts`**

```ts
import jwt from 'jsonwebtoken'
import type { VercelRequest } from '@vercel/node'
import type { Role } from '../src/types'

const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret) {
  throw new Error('JWT_SECRET is not set')
}

export interface AuthPayload {
  sub: string
  role: Role
  nama: string
}

/** Thrown by request handlers; `_http.ts#sendError` maps it to the right HTTP status. */
export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, jwtSecret, { expiresIn: '8h' })
}

/** Verifies the Bearer token and checks the caller's role. Throws ApiError(401|403) on failure. */
export function requireRole(req: VercelRequest, allowedRoles: Role[]): AuthPayload {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Belum login')
  }

  const token = header.slice('Bearer '.length)
  let payload: AuthPayload
  try {
    payload = jwt.verify(token, jwtSecret) as AuthPayload
  } catch {
    throw new ApiError(401, 'Sesi tidak valid, silakan login ulang')
  }

  if (!allowedRoles.includes(payload.role)) {
    throw new ApiError(403, 'Anda tidak memiliki akses untuk aksi ini')
  }

  return payload
}
```

- [ ] **Step 3: Tulis `api/_http.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ApiError } from './_auth'

/** Maps a thrown error to an HTTP response. Call from the catch block of every handler. */
export function sendError(res: VercelResponse, err: unknown): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'Terjadi kesalahan tak terduga' })
}

/** Vercel parses JSON bodies into req.body automatically; this guards the rare string case. */
export function readBody<T>(req: VercelRequest): T {
  return (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as T
}
```

- [ ] **Step 4: Verifikasi typecheck**

Run: `npx tsc -b`
Expected: sukses tanpa error.

- [ ] **Step 5: Commit**

```bash
git add api/_db.ts api/_auth.ts api/_http.ts
git commit -m "feat: add shared backend helpers (db, auth, http)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Endpoint auth (`api/auth/login.ts`)

**Files:**
- Create: `api/auth/login.ts`

**Interfaces:**
- Consumes: `sql` dari `api/_db.ts`; `signToken` dari `api/_auth.ts`; `sendError`, `readBody` dari `api/_http.ts`.
- Produces: `POST /api/auth/login` — `{ token: string, user: { id, nama, role } }` pada sukses. Dipakai oleh Task 11 (`login()` di `api.ts`).

- [ ] **Step 1: Tulis `api/auth/login.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import bcrypt from 'bcryptjs'
import { sql } from '../_db'
import { signToken } from '../_auth'
import { sendError, readBody } from '../_http'
import type { Role } from '../../src/types'

interface LoginBody {
  username: string
  password: string
}

interface UserRow {
  id: string
  nama: string
  username: string
  password_hash: string
  role: Role
  status: 'aktif' | 'nonaktif'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metode tidak diizinkan' })
    return
  }

  try {
    const { username, password } = readBody<LoginBody>(req)
    if (!username || !password) {
      res.status(400).json({ error: 'Username dan password wajib diisi' })
      return
    }

    const rows = (await sql`
      select id, nama, username, password_hash, role, status
      from users
      where username = ${username}
    `) as UserRow[]
    const user = rows[0]

    if (!user || user.status !== 'aktif') {
      res.status(401).json({ error: 'Username atau password salah' })
      return
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      res.status(401).json({ error: 'Username atau password salah' })
      return
    }

    const token = signToken({ sub: user.id, role: user.role, nama: user.nama })
    res.status(200).json({
      token,
      user: { id: user.id, nama: user.nama, role: user.role },
    })
  } catch (err) {
    sendError(res, err)
  }
}
```

- [ ] **Step 2: Jalankan dev server**

Run (background/terminal terpisah): `npm run dev:full`
Expected: log mencetak `Ready! Available at http://localhost:3000` (atau port serupa).

- [ ] **Step 3: Verifikasi login sukses**

Run:
```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"budi.owner","password":"konter123"}'
```
Expected: JSON `{"token":"eyJ...","user":{"id":"c0000000-...-000001","nama":"Budi Santoso","role":"owner"}}`.

- [ ] **Step 4: Verifikasi login gagal (password salah)**

Run:
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"budi.owner","password":"salah"}'
```
Expected: `401`

- [ ] **Step 5: Commit**

```bash
git add api/auth/login.ts
git commit -m "feat: add login endpoint (bcrypt + JWT)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: Endpoint kategori & user (`api/categories.ts`, `api/categories/[id].ts`, `api/users.ts`)

**Files:**
- Create: `api/categories.ts`
- Create: `api/categories/[id].ts`
- Create: `api/users.ts`
- Modify: `src/types/index.ts` (tambah `PublicUser`)

**Interfaces:**
- Consumes: `sql`, `requireRole`, `ApiError`, `sendError`, `readBody` dari Task 5.
- Produces: `GET/POST /api/categories`, `PATCH /api/categories/:id`, `GET /api/users` — dipakai Task 11.

- [ ] **Step 1: Tambah `PublicUser` di `src/types/index.ts`**

Tambahkan setelah `export interface User { ... }`:

```ts
/** User shape safe to send to the client — omits password_hash. */
export type PublicUser = Omit<User, 'password_hash'>
```

- [ ] **Step 2: Tulis `api/categories.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db'
import { requireRole } from './_auth'
import { sendError, readBody } from './_http'
import type { Category } from '../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      requireRole(req, ['owner', 'kasir', 'staff_gudang'])
      const rows = (await sql`select * from categories order by nama`) as Category[]
      res.status(200).json(rows)
      return
    }

    if (req.method === 'POST') {
      requireRole(req, ['owner'])
      const { nama } = readBody<{ nama: string }>(req)
      if (!nama || !nama.trim()) {
        res.status(400).json({ error: 'Nama kategori wajib diisi' })
        return
      }
      const rows = (await sql`
        insert into categories (nama) values (${nama.trim()}) returning *
      `) as Category[]
      res.status(201).json(rows[0])
      return
    }

    res.status(405).json({ error: 'Metode tidak diizinkan' })
  } catch (err) {
    sendError(res, err)
  }
}
```

- [ ] **Step 3: Tulis `api/categories/[id].ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../_db'
import { requireRole, ApiError } from '../_auth'
import { sendError, readBody } from '../_http'
import type { Category } from '../../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'PATCH') {
      res.status(405).json({ error: 'Metode tidak diizinkan' })
      return
    }
    requireRole(req, ['owner'])

    const id = req.query.id as string
    const { nama } = readBody<{ nama: string }>(req)
    if (!nama || !nama.trim()) {
      res.status(400).json({ error: 'Nama kategori wajib diisi' })
      return
    }

    const rows = (await sql`
      update categories set nama = ${nama.trim()} where id = ${id} returning *
    `) as Category[]

    if (!rows[0]) {
      throw new ApiError(404, `Kategori dengan id "${id}" tidak ditemukan`)
    }

    res.status(200).json(rows[0])
  } catch (err) {
    sendError(res, err)
  }
}
```

- [ ] **Step 4: Tulis `api/users.ts`**

`password_hash` sengaja tidak di-select — mock lama mengembalikannya karena isinya cuma string dummy (`"mock-hash-owner"`), tapi sekarang itu bcrypt hash asli sehingga tidak boleh dikirim ke client.

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db'
import { requireRole } from './_auth'
import { sendError } from './_http'
import type { PublicUser } from '../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Metode tidak diizinkan' })
      return
    }
    requireRole(req, ['owner'])
    const rows = (await sql`
      select id, nama, username, role, status, created_at from users order by nama
    `) as PublicUser[]
    res.status(200).json(rows)
  } catch (err) {
    sendError(res, err)
  }
}
```

- [ ] **Step 5: Verifikasi dengan curl**

Login dulu untuk dapat token (pakai perintah Task 6 Step 3), simpan ke variabel, lalu:
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"budi.owner","password":"konter123"}' | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).token))")
curl -s http://localhost:3000/api/categories -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:3000/api/users -H "Authorization: Bearer $TOKEN"
```
Expected: array 7 kategori; array 3 user tanpa field `password_hash`.

- [ ] **Step 6: Verifikasi role terlarang dapat 403**

```bash
KASIR_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"sari.kasir","password":"konter123"}' | node -e "process.stdin.on('data', d => console.log(JSON.parse(d).token))")
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/users -H "Authorization: Bearer $KASIR_TOKEN"
```
Expected: `403`

- [ ] **Step 7: Typecheck & commit**

```bash
npx tsc -b
git add src/types/index.ts api/categories.ts "api/categories/[id].ts" api/users.ts
git commit -m "feat: add categories and users endpoints

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: Endpoint produk & barcode

**Files:**
- Create: `api/products/index.ts`
- Create: `api/products/[id].ts`
- Create: `api/products/barcode/[barcode].ts`
- Create: `api/products/low-stock.ts`
- Create: `api/barcode/generate.ts`

**Interfaces:**
- Consumes: helper Task 5.
- Produces: `GET/POST /api/products`, `GET/PATCH /api/products/:id`, `GET /api/products/barcode/:barcode`, `GET /api/products/low-stock`, `POST /api/barcode/generate` — dipakai Task 11.

- [ ] **Step 1: Tulis `api/products/index.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, NeonDbError } from '../_db'
import { requireRole, ApiError } from '../_auth'
import { sendError, readBody } from '../_http'
import type { Product } from '../../src/types'

/** Kasir tidak boleh melihat harga_modal/profit (matriks akses PRD §3). */
function stripCost(product: Product, role: string): Product {
  if (role === 'kasir') {
    return { ...product, harga_modal: 0 }
  }
  return product
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const payload = requireRole(req, ['owner', 'kasir', 'staff_gudang'])

      const search =
        typeof req.query.search === 'string' && req.query.search.trim()
          ? req.query.search.trim()
          : null
      const categoryId =
        typeof req.query.category_id === 'string' ? req.query.category_id : null

      const rows = (await sql`
        select * from products
        where (${categoryId}::uuid is null or category_id = ${categoryId}::uuid)
          and (
            ${search}::text is null
            or nama ilike ${'%' + (search ?? '') + '%'}
            or barcode like ${'%' + (search ?? '') + '%'}
          )
        order by nama
      `) as Product[]

      res.status(200).json(rows.map((p) => stripCost(p, payload.role)))
      return
    }

    if (req.method === 'POST') {
      const payload = requireRole(req, ['owner', 'staff_gudang'])
      const body = readBody<{
        barcode: string
        nama: string
        tipe?: string | null
        category_id: string
        harga_modal: number
        harga_jual: number
        stok: number
        stok_min: number
        foto_url?: string | null
      }>(req)

      if (!body.barcode || !body.nama || !body.category_id) {
        res.status(400).json({ error: 'Barcode, nama, dan kategori wajib diisi' })
        return
      }

      const productId = crypto.randomUUID()
      let product: Product

      try {
        const rows = (await sql`
          insert into products
            (id, barcode, nama, tipe, category_id, harga_modal, harga_jual, stok, stok_min, foto_url, status)
          values
            (${productId}, ${body.barcode}, ${body.nama}, ${body.tipe ?? null}, ${body.category_id},
             ${body.harga_modal}, ${body.harga_jual}, ${body.stok}, ${body.stok_min}, ${body.foto_url ?? null}, 'aktif')
          returning *
        `) as Product[]
        product = rows[0]
      } catch (err) {
        if (err instanceof NeonDbError && err.code === '23505') {
          throw new ApiError(409, `Barcode "${body.barcode}" sudah digunakan produk lain`)
        }
        throw err
      }

      if (body.stok > 0) {
        await sql`
          insert into stock_movements (id, product_id, tipe, qty, user_id, catatan, created_at)
          values (${crypto.randomUUID()}, ${productId}, 'in', ${body.stok}, ${payload.sub}, 'Stok awal produk baru', ${new Date().toISOString()})
        `
      }

      res.status(201).json(product)
      return
    }

    res.status(405).json({ error: 'Metode tidak diizinkan' })
  } catch (err) {
    sendError(res, err)
  }
}
```

- [ ] **Step 2: Tulis `api/products/[id].ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../_db'
import { requireRole, ApiError } from '../_auth'
import { sendError, readBody } from '../_http'
import type { Product } from '../../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = req.query.id as string

    if (req.method === 'GET') {
      requireRole(req, ['owner', 'kasir', 'staff_gudang'])
      const rows = (await sql`select * from products where id = ${id}`) as Product[]
      res.status(200).json(rows[0] ?? null)
      return
    }

    if (req.method === 'PATCH') {
      requireRole(req, ['owner', 'staff_gudang'])
      const body = readBody<{
        nama?: string
        tipe?: string | null
        harga_modal?: number
        harga_jual?: number
        foto_url?: string | null
      }>(req)

      const existingRows = (await sql`select * from products where id = ${id}`) as Product[]
      const existing = existingRows[0]
      if (!existing) {
        throw new ApiError(404, `Produk dengan id "${id}" tidak ditemukan`)
      }

      const nama = body.nama ?? existing.nama
      const tipe = body.tipe !== undefined ? body.tipe : existing.tipe
      const hargaModal = body.harga_modal ?? existing.harga_modal
      const hargaJual = body.harga_jual ?? existing.harga_jual
      const fotoUrl = body.foto_url !== undefined ? body.foto_url : existing.foto_url

      const rows = (await sql`
        update products
        set nama = ${nama}, tipe = ${tipe}, harga_modal = ${hargaModal},
            harga_jual = ${hargaJual}, foto_url = ${fotoUrl}
        where id = ${id}
        returning *
      `) as Product[]

      res.status(200).json(rows[0])
      return
    }

    res.status(405).json({ error: 'Metode tidak diizinkan' })
  } catch (err) {
    sendError(res, err)
  }
}
```

- [ ] **Step 3: Tulis `api/products/barcode/[barcode].ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../_db'
import { requireRole } from '../../_auth'
import { sendError } from '../../_http'
import type { Product } from '../../../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Metode tidak diizinkan' })
      return
    }
    requireRole(req, ['owner', 'kasir', 'staff_gudang'])
    const barcode = req.query.barcode as string
    const rows = (await sql`select * from products where barcode = ${barcode}`) as Product[]
    res.status(200).json(rows[0] ?? null)
  } catch (err) {
    sendError(res, err)
  }
}
```

- [ ] **Step 4: Tulis `api/products/low-stock.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../_db'
import { requireRole } from '../_auth'
import { sendError } from '../_http'
import type { Product } from '../../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Metode tidak diizinkan' })
      return
    }
    requireRole(req, ['owner', 'kasir', 'staff_gudang'])
    const rows = (await sql`
      select * from products where stok <= stok_min order by stok asc
    `) as Product[]
    res.status(200).json(rows)
  } catch (err) {
    sendError(res, err)
  }
}
```

- [ ] **Step 5: Tulis `api/barcode/generate.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../_db'
import { requireRole } from '../_auth'
import { sendError } from '../_http'

function randomBarcodeCandidate(): string {
  const random = Math.floor(Math.random() * 1e10)
    .toString()
    .padStart(10, '0')
  return `899${random}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Metode tidak diizinkan' })
      return
    }
    requireRole(req, ['owner', 'staff_gudang'])

    let barcode = randomBarcodeCandidate()
    let attempts = 0
    while (attempts < 10) {
      const rows = await sql`select id from products where barcode = ${barcode}`
      if (rows.length === 0) break
      barcode = randomBarcodeCandidate()
      attempts += 1
    }

    res.status(200).json({ barcode })
  } catch (err) {
    sendError(res, err)
  }
}
```

- [ ] **Step 6: Verifikasi dengan curl** (pakai `$TOKEN` owner dari Task 7 Step 5)

```bash
curl -s "http://localhost:3000/api/products?search=casing" -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:3000/api/products/low-stock -H "Authorization: Bearer $TOKEN"
curl -s -X POST http://localhost:3000/api/barcode/generate -H "Authorization: Bearer $TOKEN"
curl -s "http://localhost:3000/api/products/barcode/8991002300011" -H "Authorization: Bearer $TOKEN"
```
Expected: produk mengandung "Casing" pada request pertama; array produk dengan `stok <= stok_min` pada request kedua (termasuk yang stok 0); `{"barcode":"899..."}` 13-digit pada request ketiga; objek "Casing Silikon iPhone 13" pada request keempat.

- [ ] **Step 7: Verifikasi kasir tidak melihat `harga_modal`**

```bash
curl -s "http://localhost:3000/api/products" -H "Authorization: Bearer $KASIR_TOKEN" | node -e "process.stdin.on('data', d => console.log(JSON.parse(d)[0].harga_modal))"
```
Expected: `0`

- [ ] **Step 8: Typecheck & commit**

```bash
npx tsc -b
git add api/products api/barcode
git commit -m "feat: add product and barcode endpoints

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 9: Endpoint transaksi

**Files:**
- Create: `api/transactions/index.ts`
- Create: `api/transactions/[id]/items.ts`
- Create: `api/transaction-items.ts`

**Interfaces:**
- Consumes: helper Task 5; `CreateTransactionInput`, `Transaction`, `TransactionItem` dari `src/types`.
- Produces: `GET/POST /api/transactions`, `GET /api/transactions/:id/items`, `GET /api/transaction-items` — dipakai Task 11.

- [ ] **Step 1: Tulis `api/transactions/index.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql, NeonDbError } from '../_db'
import { requireRole, ApiError } from '../_auth'
import { sendError, readBody } from '../_http'
import type { CreateTransactionInput, Transaction } from '../../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      requireRole(req, ['owner', 'kasir'])
      const limitParam = typeof req.query.limit === 'string' ? Number(req.query.limit) : null

      const rows = (
        limitParam
          ? await sql`select * from transactions order by created_at desc limit ${limitParam}`
          : await sql`select * from transactions order by created_at desc`
      ) as Transaction[]

      res.status(200).json(rows)
      return
    }

    if (req.method === 'POST') {
      // user_id datang dari JWT (payload.sub), bukan dari body — client tidak
      // dipercaya untuk menentukan atas nama siapa transaksi dicatat.
      const payload = requireRole(req, ['owner', 'kasir'])
      const body = readBody<CreateTransactionInput>(req)

      if (!body.items || body.items.length === 0) {
        res.status(400).json({ error: 'Transaksi harus memiliki minimal 1 item' })
        return
      }

      const total = body.items.reduce((sum, item) => sum + item.harga * item.qty, 0)
      const dibayar = body.dibayar
      const kembalian = Math.max(dibayar - total, 0)
      const now = new Date().toISOString()
      const datePart = now.slice(0, 10).replace(/-/g, '')

      const countRows = (await sql`select count(*)::int as count from transactions`) as {
        count: number
      }[]
      const noNota = `INV-${datePart}-${String(countRows[0].count + 1).padStart(3, '0')}`
      const transactionId = crypto.randomUUID()

      const queries = [
        sql`
          insert into transactions (id, no_nota, user_id, total, metode_bayar, dibayar, kembalian, status, created_at)
          values (${transactionId}, ${noNota}, ${payload.sub}, ${total}, ${body.metode_bayar}, ${dibayar}, ${kembalian}, 'selesai', ${now})
        `,
      ]

      for (const item of body.items) {
        queries.push(
          sql`
            insert into transaction_items (id, transaction_id, product_id, qty, harga, subtotal)
            values (${crypto.randomUUID()}, ${transactionId}, ${item.product_id}, ${item.qty}, ${item.harga}, ${item.harga * item.qty})
          `,
        )
        queries.push(
          sql`update products set stok = greatest(stok - ${item.qty}, 0) where id = ${item.product_id}`,
        )
        queries.push(
          sql`
            insert into stock_movements (id, product_id, tipe, qty, user_id, catatan, created_at)
            values (${crypto.randomUUID()}, ${item.product_id}, 'out', ${item.qty}, ${payload.sub}, ${'Penjualan ' + noNota}, ${now})
          `,
        )
      }

      try {
        await sql.transaction(queries)
      } catch (err) {
        if (err instanceof NeonDbError && err.code === '23505') {
          throw new ApiError(409, 'Nomor nota bentrok, silakan coba lagi')
        }
        throw err
      }

      const transaction: Transaction = {
        id: transactionId,
        no_nota: noNota,
        user_id: payload.sub,
        total,
        metode_bayar: body.metode_bayar,
        dibayar,
        kembalian,
        status: 'selesai',
        created_at: now,
      }

      res.status(201).json(transaction)
      return
    }

    res.status(405).json({ error: 'Metode tidak diizinkan' })
  } catch (err) {
    sendError(res, err)
  }
}
```

- [ ] **Step 2: Tulis `api/transactions/[id]/items.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../_db'
import { requireRole } from '../../_auth'
import { sendError } from '../../_http'
import type { TransactionItem } from '../../../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Metode tidak diizinkan' })
      return
    }
    requireRole(req, ['owner', 'kasir'])
    const id = req.query.id as string
    const rows = (await sql`
      select * from transaction_items where transaction_id = ${id}
    `) as TransactionItem[]
    res.status(200).json(rows)
  } catch (err) {
    sendError(res, err)
  }
}
```

- [ ] **Step 3: Tulis `api/transaction-items.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db'
import { requireRole } from './_auth'
import { sendError } from './_http'
import type { TransactionItem } from '../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Metode tidak diizinkan' })
      return
    }
    requireRole(req, ['owner'])
    const rows = (await sql`select * from transaction_items`) as TransactionItem[]
    res.status(200).json(rows)
  } catch (err) {
    sendError(res, err)
  }
}
```

- [ ] **Step 4: Verifikasi list & riwayat item**

```bash
curl -s http://localhost:3000/api/transactions -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:3000/api/transaction-items -H "Authorization: Bearer $TOKEN"
```
Expected: 3 transaksi (seed Task 4); 5 item transaksi.

- [ ] **Step 5: Verifikasi buat transaksi baru mengurangi stok**

```bash
curl -s "http://localhost:3000/api/products/barcode/8991002300011" -H "Authorization: Bearer $TOKEN"
# catat nilai stok saat ini (seharusnya 24)

curl -s -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"user_id":"c0000000-0000-0000-0000-000000000001","metode_bayar":"tunai","dibayar":50000,"items":[{"product_id":"b0000000-0000-0000-0000-000000000001","qty":2,"harga":35000}]}'

curl -s "http://localhost:3000/api/products/barcode/8991002300011" -H "Authorization: Bearer $TOKEN"
```
Expected: response POST berisi `no_nota` baru (mis. `INV-<tanggal-hari-ini>-004`) dan `kembalian` 0 (karena 50000 < 70000, jadi kembalian dijamin tidak negatif lewat `Math.max`); `stok` produk turun dari 24 jadi 22 pada pengecekan kedua.

- [ ] **Step 6: Typecheck & commit**

```bash
npx tsc -b
git add api/transactions api/transaction-items.ts
git commit -m "feat: add transaction endpoints with atomic stock deduction

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 10: Endpoint stock movements & dashboard

**Files:**
- Create: `api/stock-movements.ts`
- Create: `api/dashboard-summary.ts`

**Interfaces:**
- Consumes: helper Task 5.
- Produces: `GET/POST /api/stock-movements`, `GET /api/dashboard-summary` — dipakai Task 11.

- [ ] **Step 1: Tulis `api/stock-movements.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db'
import { requireRole, ApiError } from './_auth'
import { sendError, readBody } from './_http'
import type { StockMovement } from '../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      requireRole(req, ['owner', 'kasir', 'staff_gudang'])
      const productId = typeof req.query.product_id === 'string' ? req.query.product_id : null

      const rows = (
        productId
          ? await sql`select * from stock_movements where product_id = ${productId} order by created_at desc`
          : await sql`select * from stock_movements order by created_at desc`
      ) as StockMovement[]

      res.status(200).json(rows)
      return
    }

    if (req.method === 'POST') {
      const payload = requireRole(req, ['owner', 'staff_gudang'])
      const body = readBody<{
        product_id: string
        tipe: StockMovement['tipe']
        qty: number
        catatan?: string
      }>(req)

      const existing = await sql`select id from products where id = ${body.product_id}`
      if (existing.length === 0) {
        throw new ApiError(404, `Produk dengan id "${body.product_id}" tidak ditemukan`)
      }

      const movementId = crypto.randomUUID()
      const now = new Date().toISOString()

      const [movementRows] = (await sql.transaction([
        sql`
          insert into stock_movements (id, product_id, tipe, qty, user_id, catatan, created_at)
          values (${movementId}, ${body.product_id}, ${body.tipe}, ${body.qty}, ${payload.sub}, ${body.catatan ?? null}, ${now})
          returning *
        `,
        sql`
          update products
          set stok = case
            when ${body.tipe} = 'in' then stok + ${body.qty}
            when ${body.tipe} = 'out' then greatest(stok - ${body.qty}, 0)
            else greatest(stok + ${body.qty}, 0)
          end
          where id = ${body.product_id}
        `,
      ])) as [StockMovement[], unknown]

      res.status(201).json(movementRows[0])
      return
    }

    res.status(405).json({ error: 'Metode tidak diizinkan' })
  } catch (err) {
    sendError(res, err)
  }
}
```

- [ ] **Step 2: Tulis `api/dashboard-summary.ts`**

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from './_db'
import { requireRole } from './_auth'
import { sendError } from './_http'
import type { DashboardSummary } from '../src/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Metode tidak diizinkan' })
      return
    }
    // created_at::date dibandingkan ke current_date pakai timezone server DB
    // (UTC di Neon) — sama seperti mock yang memakai timezone proses Node,
    // keduanya tidak diselaraskan ke timezone toko secara eksplisit (di luar
    // scope PRD untuk pass ini).
    const payload = requireRole(req, ['owner', 'kasir'])

    const penjualanRows = await sql`
      select
        coalesce(sum(total), 0)::int as penjualan_hari_ini,
        count(*)::int as transaksi_hari_ini
      from transactions
      where status = 'selesai' and created_at::date = current_date
    `

    const stokRows = await sql`
      select
        count(*) filter (where stok > 0 and stok <= stok_min)::int as produk_menipis,
        count(*) filter (where stok = 0)::int as produk_habis
      from products
    `

    const labaRows = await sql`
      select coalesce(sum(ti.subtotal - (p.harga_modal * ti.qty)), 0)::int as laba_hari_ini
      from transaction_items ti
      join transactions t on t.id = ti.transaction_id
      join products p on p.id = ti.product_id
      where t.status = 'selesai' and t.created_at::date = current_date
    `

    const summary: DashboardSummary = {
      penjualan_hari_ini: penjualanRows[0].penjualan_hari_ini,
      transaksi_hari_ini: penjualanRows[0].transaksi_hari_ini,
      produk_menipis: stokRows[0].produk_menipis,
      produk_habis: stokRows[0].produk_habis,
      laba_hari_ini: payload.role === 'kasir' ? 0 : labaRows[0].laba_hari_ini,
    }

    res.status(200).json(summary)
  } catch (err) {
    sendError(res, err)
  }
}
```

- [ ] **Step 3: Verifikasi stock-in menaikkan stok**

```bash
curl -s -X POST http://localhost:3000/api/stock-movements \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"product_id":"b0000000-0000-0000-0000-000000000005","tipe":"in","qty":10,"catatan":"Restock"}'

curl -s "http://localhost:3000/api/products/barcode/8991002300059" -H "Authorization: Bearer $TOKEN"
```
Expected: response POST adalah objek movement baru (`tipe: "in"`, `qty: 10`); pengecekan kedua menunjukkan `stok` produk (Headset Kabel Jack 3.5mm) naik dari 0 jadi 10.

- [ ] **Step 4: Verifikasi dashboard**

```bash
curl -s http://localhost:3000/api/dashboard-summary -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:3000/api/dashboard-summary -H "Authorization: Bearer $KASIR_TOKEN"
```
Expected: JSON dengan 5 field (`penjualan_hari_ini`, `transaksi_hari_ini`, `produk_menipis`, `produk_habis`, `laba_hari_ini`); permintaan kedua (kasir) punya `laba_hari_ini: 0`.

- [ ] **Step 5: Typecheck & commit**

```bash
npx tsc -b
git add api/stock-movements.ts api/dashboard-summary.ts
git commit -m "feat: add stock movement and dashboard summary endpoints

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 11: Ganti `src/lib/api.ts` dari mock ke fetch nyata

**Files:**
- Modify: `src/lib/api.ts` (rewrite penuh)

**Interfaces:**
- Consumes: seluruh endpoint Task 6–10; `useSessionStore` dari `src/store/session.ts` — kode ini mengasumsikan bentuk store baru dari Task 12 (field `token`, method `logout()` tanpa argumen — `logout()` sudah ada di store lama, `token` ditambahkan Task 12).
- Produces: seluruh fungsi ekspor `api.ts` (nama & signature identik dengan versi mock) + fungsi baru `login(username, password)`. Dipakai oleh semua `src/hooks/*.ts` (tidak berubah) dan `src/pages/Login.tsx` (Task 13).

- [ ] **Step 1: Tulis ulang `src/lib/api.ts`**

Ganti seluruh isi file dengan:

```ts
import type {
  Category,
  CreateTransactionInput,
  DashboardSummary,
  PublicUser,
  Product,
  Role,
  StockMovement,
  Transaction,
  TransactionItem,
} from '@/types'
import { useSessionStore } from '@/store/session'

/**
 * Real backend layer — every export talks to a Vercel Function under /api,
 * which in turn queries Neon Postgres. Signatures match the mock layer this
 * replaced exactly, so src/hooks/*.ts and src/pages/*.tsx needed no changes.
 */

const API_BASE = '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useSessionStore.getState().token
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    useSessionStore.getState().logout()
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? 'Terjadi kesalahan tak terduga')
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

// --- Auth ------------------------------------------------------------

export async function login(
  username: string,
  password: string,
): Promise<{ token: string; user: { id: string; nama: string; role: Role } }> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

// --- Reads -------------------------------------------------------------

export async function getCategories(): Promise<Category[]> {
  return request<Category[]>('/categories')
}

export async function getProducts(params?: {
  search?: string
  category_id?: string
}): Promise<Product[]> {
  const qs = new URLSearchParams()
  if (params?.search) qs.set('search', params.search)
  if (params?.category_id) qs.set('category_id', params.category_id)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return request<Product[]>(`/products${suffix}`)
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const result = await request<Product | null>(`/products/${id}`)
  return result ?? undefined
}

export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
  const result = await request<Product | null>(`/products/barcode/${barcode}`)
  return result ?? undefined
}

export async function getLowStockProducts(): Promise<Product[]> {
  return request<Product[]>('/products/low-stock')
}

export async function getUsers(): Promise<PublicUser[]> {
  return request<PublicUser[]>('/users')
}

export async function getTransactions(params?: { limit?: number }): Promise<Transaction[]> {
  const suffix = params?.limit ? `?limit=${params.limit}` : ''
  return request<Transaction[]>(`/transactions${suffix}`)
}

export async function getTransactionItems(transactionId: string): Promise<TransactionItem[]> {
  return request<TransactionItem[]>(`/transactions/${transactionId}/items`)
}

/** All transaction items across every transaction — used for report aggregation (top products, profit). */
export async function getAllTransactionItems(): Promise<TransactionItem[]> {
  return request<TransactionItem[]>('/transaction-items')
}

export async function getStockMovements(productId?: string): Promise<StockMovement[]> {
  const suffix = productId ? `?product_id=${productId}` : ''
  return request<StockMovement[]>(`/stock-movements${suffix}`)
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return request<DashboardSummary>('/dashboard-summary')
}

// --- Mutations -----------------------------------------------------------

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  return request<Transaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

/** Auto-assigns a 13-digit barcode guaranteed unique against current products. */
export async function generateBarcode(): Promise<string> {
  const result = await request<{ barcode: string }>('/barcode/generate', { method: 'POST' })
  return result.barcode
}

export interface CreateProductInput {
  barcode: string
  nama: string
  tipe?: string | null
  category_id: string
  harga_modal: number
  harga_jual: number
  stok: number
  stok_min: number
  user_id: string
  foto_url?: string | null
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  return request<Product>('/products', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export interface CreateCategoryInput {
  nama: string
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  return request<Category>('/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export interface UpdateCategoryInput {
  id: string
  nama: string
}

export async function updateCategory(input: UpdateCategoryInput): Promise<Category> {
  return request<Category>(`/categories/${input.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ nama: input.nama }),
  })
}

export interface UpdateProductInput {
  id: string
  nama?: string
  tipe?: string | null
  harga_modal?: number
  harga_jual?: number
  foto_url?: string | null
}

/** Edits product identity/pricing/photo fields. Stock stays derived from stock_movements — use addStockMovement for stock changes. */
export async function updateProduct(input: UpdateProductInput): Promise<Product> {
  return request<Product>(`/products/${input.id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export interface AddStockMovementInput {
  product_id: string
  tipe: StockMovement['tipe']
  /** Positive magnitude for 'in'/'out'; signed delta for 'adjust'. */
  qty: number
  user_id: string
  catatan?: string
}

export async function addStockMovement(input: AddStockMovementInput): Promise<StockMovement> {
  return request<StockMovement>('/stock-movements', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
```

Catatan: `CreateProductInput.user_id` dan `AddStockMovementInput.user_id` tetap ada di tipe (dan tetap dikirim di body oleh pemanggil yang ada, tidak ada perubahan di hooks) supaya signature tidak berubah, tapi backend (Task 8/10) mengabaikannya dan memakai `payload.sub` dari JWT untuk kolom `user_id` — konsisten dengan alasan keamanan yang sama seperti `createTransaction`.

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: sukses tanpa error. Kalau ada error field `token`/`logout` di `useSessionStore`, itu wajar — diselesaikan di Task 12 (langkah berikutnya), lanjutkan saja.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.ts
git commit -m "feat: replace mock api.ts with real backend fetch calls

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 12: Update `src/store/session.ts` untuk token & user asli

**Files:**
- Modify: `src/store/session.ts`

**Interfaces:**
- Consumes: `Role` dari `src/types`.
- Produces: `token: string | null`, `user: { id, nama, role } | null` (baru); `currentRole`, `currentUserName` (dipertahankan sebagai field turunan, diisi bareng `user`, supaya semua consumer lama — `App.tsx`, `AppShell.tsx`, `Beranda.tsx`, `Jual.tsx`, `Laporan.tsx`, `Profil.tsx`, `Stok.tsx` — **tidak perlu diubah**); `login(token, user)` (signature berubah dari `login(role, name)` — satu-satunya pemanggil adalah `Login.tsx`, diselesaikan Task 13); `logout()` (signature tidak berubah).

- [ ] **Step 1: Tulis ulang `src/store/session.ts`**

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '@/types'

interface SessionUser {
  id: string
  nama: string
  role: Role
}

interface SessionState {
  token: string | null
  user: SessionUser | null
  /** Derived from `user` at login-time — kept so existing consumers reading
   *  `currentRole`/`currentUserName` directly don't need to change. */
  currentRole: Role | null
  currentUserName: string | null
  login: (token: string, user: SessionUser) => void
  logout: () => void
}

/** Real auth session: JWT issued by POST /api/auth/login, persisted to
 * localStorage so a page refresh doesn't kick the user back to /login. */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      currentRole: null,
      currentUserName: null,
      login: (token, user) =>
        set({ token, user, currentRole: user.role, currentUserName: user.nama }),
      logout: () => set({ token: null, user: null, currentRole: null, currentUserName: null }),
    }),
    { name: 'acc-konter:session' },
  ),
)
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: error hanya tersisa di `src/pages/Login.tsx` (masih memanggil `login(role, name)` versi lama) — diselesaikan Task 13. Semua file lain (`App.tsx`, `AppShell.tsx`, dst.) harus lolos tanpa error karena `currentRole`/`currentUserName` masih ada.

- [ ] **Step 3: Commit**

```bash
git add src/store/session.ts
git commit -m "feat: store real JWT/user in session, keep currentRole/currentUserName for existing consumers

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 13: Form login sungguhan (`src/pages/Login.tsx`)

**Files:**
- Modify: `src/pages/Login.tsx` (rewrite penuh)

**Interfaces:**
- Consumes: `login(username, password)` dari `src/lib/api.ts` (Task 11); `useSessionStore().login(token, user)` dari `src/store/session.ts` (Task 12); `Input`, `Button` dari `@/components/ui/*` (sudah ada).
- Produces: halaman `/login` yang memanggil backend asli, tidak ada consumer lain.

- [ ] **Step 1: Tulis ulang `src/pages/Login.tsx`**

```tsx
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Storefront } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { login as loginRequest } from '@/lib/api'
import { useSessionStore } from '@/store/session'

export default function Login() {
  const navigate = useNavigate()
  const login = useSessionStore((s) => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!username.trim() || !password) {
      toast.error('Username dan password wajib diisi')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await loginRequest(username.trim(), password)
      login(result.token, result.user)
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal masuk')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Storefront size={30} weight="fill" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Konter</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Monitoring Penjualan &amp; Stok Aksesoris
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Username
            </label>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="mis. budi.owner"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="mt-2 h-11">
            {isSubmitting ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b`
Expected: sukses tanpa error di seluruh project.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: sukses tanpa error.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Login.tsx
git commit -m "feat: replace dev role-picker with real username/password login form

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 14: Verifikasi end-to-end per role

**Files:** tidak ada file baru — task ini murni verifikasi manual UI di atas semua task sebelumnya.

**Interfaces:**
- Consumes: seluruh stack yang dibangun Task 1–13.
- Produces: konfirmasi bahwa PRD §3 (matriks akses) dan §5 (user flow) benar-benar berjalan di atas data asli.

- [ ] **Step 1: Jalankan full stack**

Run: `npm run dev:full`
Buka `http://localhost:3000` di browser.

- [ ] **Step 2: Login sebagai Owner (`budi.owner` / `konter123`)**

Verifikasi:
- Beranda menampilkan ringkasan (penjualan/transaksi hari ini, produk perlu restock) dari data seed.
- Stok menampilkan 20 produk; beberapa dengan badge "menipis"/"habis" (mis. Headset Kabel Jack 3.5mm sebelum di-restock di Task 10, atau produk lain yang masih di bawah `stok_min`).
- Tambah kategori baru lewat CategoryManager → muncul di daftar.
- Tambah produk baru (barcode auto-generate) → tersimpan, muncul di daftar Stok.
- Edit harga produk existing → tersimpan.
- Barang masuk (stock-in) untuk satu produk → stoknya naik di UI.
- Laporan menampilkan grafik & angka (bukan kosong) dari 3 transaksi seed + transaksi baru dari Task 9 Step 5.
- Profil menampilkan daftar user (Budi/Sari/Andi) tanpa password.

- [ ] **Step 3: Logout, login sebagai Kasir (`sari.kasir` / `konter123`)**

Verifikasi:
- Tab Stok dan Laporan penuh tidak muncul/dibatasi sesuai UI yang sudah ada (perilaku UI existing, tidak diubah plan ini — cukup pastikan tidak crash).
- Jual: scan/pilih produk, checkout → transaksi baru tersimpan, stok produk berkurang, muncul nota baru.
- Produk yang ditampilkan **tidak** mengandung harga modal/profit di UI manapun yang menampilkannya untuk kasir.

- [ ] **Step 4: Logout, login sebagai Staff Gudang (`andi.gudang` / `konter123`)**

Verifikasi:
- Bisa membuka Stok, melakukan barang masuk & penyesuaian stok.
- Tidak bisa mengakses alur Jual (perilaku UI existing).

- [ ] **Step 5: Verifikasi sesi bertahan setelah refresh**

Refresh browser saat masih login sebagai staff gudang → tidak ter-redirect ke `/login` (token masih di localStorage, sesuai perilaku `persist` yang sudah ada sebelumnya untuk role dev-picker).

- [ ] **Step 6: Verifikasi build produksi bersih**

Run:
```bash
npx tsc -b
npm run lint
npm run build
```
Expected: ketiganya sukses tanpa error/warning baru.

- [ ] **Step 7: Commit (jika ada perbaikan kecil dari temuan verifikasi)**

Kalau Step 2–6 menemukan bug kecil, perbaiki lalu:
```bash
git add -A
git commit -m "fix: address issues found during end-to-end verification

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
Kalau tidak ada temuan, tidak perlu commit — plan selesai di commit terakhir Task 13.

---

## Ringkasan File Baru

```
db/
  schema.sql
  seed.sql
  migrate.mjs
api/
  _db.ts
  _auth.ts
  _http.ts
  auth/
    login.ts
  categories.ts
  categories/[id].ts
  users.ts
  products/
    index.ts
    [id].ts
    barcode/[barcode].ts
    low-stock.ts
  barcode/generate.ts
  transactions/
    index.ts
    [id]/items.ts
  transaction-items.ts
  stock-movements.ts
  dashboard-summary.ts
vercel.json
tsconfig.api.json
.env.local.example
```

## Ringkasan File Diubah

```
package.json          — dependencies + scripts
tsconfig.json          — tambah reference tsconfig.api.json
src/types/index.ts      — tambah PublicUser
src/lib/api.ts          — mock → fetch ke /api/*
src/store/session.ts     — role-picker → token/user asli
src/pages/Login.tsx      — role-picker UI → form username/password
```
