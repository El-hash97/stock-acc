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
