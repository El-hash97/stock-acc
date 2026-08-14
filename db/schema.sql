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
