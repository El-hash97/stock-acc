import type {
  Category,
  Product,
  StockMovement,
  Transaction,
  TransactionItem,
  User,
} from '@/types'

/**
 * Seed data for the in-memory mock store. Realistic Indonesian accessory-shop
 * catalog (phone cases, earbuds, cables, tempered glass, power banks, etc.)
 * with plausible Rupiah pricing. A few products are seeded below their
 * stok_min so the low/out-of-stock alert UI has something to show.
 */

export const seedCategories: Category[] = [
  { id: 'cat-1', nama: 'Casing & Case' },
  { id: 'cat-2', nama: 'Earphone & Headset' },
  { id: 'cat-3', nama: 'Kabel & Charger' },
  { id: 'cat-4', nama: 'Tempered Glass' },
  { id: 'cat-5', nama: 'Power Bank' },
  { id: 'cat-6', nama: 'Holder & Ring' },
  { id: 'cat-7', nama: 'Aksesoris Lainnya' },
]

export const seedUsers: User[] = [
  {
    id: 'user-owner',
    nama: 'Budi Santoso',
    username: 'budi.owner',
    password_hash: 'mock-hash-owner',
    role: 'owner',
    status: 'aktif',
    created_at: '2025-01-10T02:00:00.000Z',
  },
  {
    id: 'user-kasir',
    nama: 'Sari Wulandari',
    username: 'sari.kasir',
    password_hash: 'mock-hash-kasir',
    role: 'kasir',
    status: 'aktif',
    created_at: '2025-02-15T02:00:00.000Z',
  },
  {
    id: 'user-gudang',
    nama: 'Andi Prasetyo',
    username: 'andi.gudang',
    password_hash: 'mock-hash-gudang',
    role: 'staff_gudang',
    status: 'aktif',
    created_at: '2025-02-20T02:00:00.000Z',
  },
]

export const seedProducts: Product[] = [
  {
    id: 'prod-1',
    barcode: '8991002300011',
    nama: 'Casing Silikon iPhone 13',
    tipe: null,
    category_id: 'cat-1',
    harga_modal: 18000,
    harga_jual: 35000,
    stok: 24,
    stok_min: 10,
    foto_url: null,
    status: 'aktif',
  },
  {
    id: 'prod-2',
    barcode: '8991002300028',
    nama: 'Casing TPU Samsung A54',
    tipe: null,
    category_id: 'cat-1',
    harga_modal: 15000,
    harga_jual: 30000,
    stok: 8,
    stok_min: 10,
    foto_url: null,
    status: 'aktif',
  },
  {
    id: 'prod-3',
    barcode: '8991002300035',
    nama: 'Hardcase Bening Xiaomi Redmi Note 12',
    tipe: null,
    category_id: 'cat-1',
    harga_modal: 12000,
    harga_jual: 25000,
    stok: 3,
    stok_min: 10,
    foto_url: null,
    status: 'aktif',
  },
  {
    id: 'prod-4',
    barcode: '8991002300042',
    nama: 'TWS Earbuds Bluetooth 5.3',
    tipe: null,
    category_id: 'cat-2',
    harga_modal: 65000,
    harga_jual: 120000,
    stok: 15,
    stok_min: 5,
    foto_url: null,
    status: 'aktif',
  },
  {
    id: 'prod-5',
    barcode: '8991002300059',
    nama: 'Headset Kabel Jack 3.5mm',
    tipe: null,
    category_id: 'cat-2',
    harga_modal: 12000,
    harga_jual: 25000,
    stok: 0,
    stok_min: 8,
    foto_url: null,
    status: 'aktif',
  },
  {
    id: 'prod-6',
    barcode: '8991002300066',
    nama: 'Earphone Kabel Type-C',
    tipe: null,
    category_id: 'cat-2',
    harga_modal: 20000,
    harga_jual: 40000,
    stok: 12,
    stok_min: 6,
    foto_url: null,
    status: 'aktif',
  },
  {
    id: 'prod-7',
    barcode: '8991002300073',
    nama: 'Kabel Data USB-C 1M',
    tipe: null,
    category_id: 'cat-3',
    harga_modal: 10000,
    harga_jual: 22000,
    stok: 40,
    stok_min: 15,
    foto_url: null,
    status: 'aktif',
  },
  {
    id: 'prod-8',
    barcode: '8991002300080',
    nama: 'Kabel Data Lightning 1M',
    tipe: null,
    category_id: 'cat-3',
    harga_modal: 15000,
    harga_jual: 30000,
    stok: 18,
    stok_min: 15,
    foto_url: null,
    status: 'aktif',
  },
  {
    id: 'prod-9',
    barcode: '8991002300097',
    nama: 'Kepala Charger 20W PD',
    tipe: null,
    category_id: 'cat-3',
    harga_modal: 35000,
    harga_jual: 65000,
    stok: 6,
    stok_min: 8,
    foto_url: null,
    status: 'aktif',
  },
  {
    id: 'prod-10',
    barcode: '8991002300103',
    nama: 'Charger Mobil Dual USB',
    tipe: null,
    category_id: 'cat-3',
    harga_modal: 25000,
    harga_jual: 50000,
    stok: 9,
    stok_min: 6,
    foto_url: null,
    status: 'aktif',
  },
  {
    id: 'prod-11',
    barcode: '8991002300110',
    nama: 'Tempered Glass iPhone 14',
    tipe: null,
    category_id: 'cat-4',
    harga_modal: 8000,
    harga_jual: 20000,
    stok: 30,
    stok_min: 12,
    foto_url: null,
    status: 'aktif',
  },
  {
    id: 'prod-12',
    barcode: '8991002300127',
    nama: 'Tempered Glass Samsung A34',
    tipe: null,
    category_id: 'cat-4',
    harga_modal: 8000,
    harga_jual: 20000,
    stok: 2,
    stok_min: 12,
    foto_url: null,
    status: 'aktif',
  },
  {
    id: 'prod-13',
    barcode: '8991002300134',
    nama: 'Anti Gores Privacy Universal',
    tipe: null,
    category_id: 'cat-4',
    harga_modal: 9000,
    harga_jual: 22000,
    stok: 14,
    stok_min: 10,
    foto_url: null,
    status: 'aktif',
  },
  {
    id: 'prod-14',
    barcode: '8991002300141',
    nama: 'Power Bank 10000mAh',
    tipe: null,
    category_id: 'cat-5',
    harga_modal: 85000,
    harga_jual: 150000,
    stok: 7,
    stok_min: 5,
    foto_url: null,
    status: 'aktif',
  },
  {
    id: 'prod-15',
    barcode: '8991002300158',
    nama: 'Power Bank 20000mAh Fast Charging',
    tipe: null,
    category_id: 'cat-5',
    harga_modal: 140000,
    harga_jual: 230000,
    stok: 1,
    stok_min: 4,
    foto_url: null,
    status: 'aktif',
  },
  {
    id: 'prod-16',
    barcode: '8991002300165',
    nama: 'Ring Holder HP Metal',
    tipe: null,
    category_id: 'cat-6',
    harga_modal: 6000,
    harga_jual: 15000,
    stok: 22,
    stok_min: 10,
    foto_url: null,
    status: 'aktif',
  },
  {
    id: 'prod-17',
    barcode: '8991002300172',
    nama: 'PopSocket Motif',
    tipe: null,
    category_id: 'cat-6',
    harga_modal: 8000,
    harga_jual: 18000,
    stok: 16,
    stok_min: 8,
    foto_url: null,
    status: 'aktif',
  },
  {
    id: 'prod-18',
    barcode: '8991002300189',
    nama: 'Holder HP Mobil Jepit',
    tipe: null,
    category_id: 'cat-6',
    harga_modal: 20000,
    harga_jual: 40000,
    stok: 5,
    stok_min: 5,
    foto_url: null,
    status: 'aktif',
  },
  {
    id: 'prod-19',
    barcode: '8991002300196',
    nama: 'Stylus Pen Universal',
    tipe: null,
    category_id: 'cat-7',
    harga_modal: 15000,
    harga_jual: 32000,
    stok: 10,
    stok_min: 6,
    foto_url: null,
    status: 'aktif',
  },
  {
    id: 'prod-20',
    barcode: '8991002300202',
    nama: 'Cleaning Kit Layar HP',
    tipe: null,
    category_id: 'cat-7',
    harga_modal: 7000,
    harga_jual: 16000,
    stok: 13,
    stok_min: 8,
    foto_url: null,
    status: 'aktif',
  },
]

// --- Historical transactions (yesterday) -----------------------------------

const t1Items: Omit<TransactionItem, 'id' | 'transaction_id'>[] = [
  { product_id: 'prod-1', qty: 1, harga: 35000, subtotal: 35000 },
  { product_id: 'prod-11', qty: 1, harga: 20000, subtotal: 20000 },
]
const t2Items: Omit<TransactionItem, 'id' | 'transaction_id'>[] = [
  { product_id: 'prod-4', qty: 1, harga: 120000, subtotal: 120000 },
]
const t3Items: Omit<TransactionItem, 'id' | 'transaction_id'>[] = [
  { product_id: 'prod-7', qty: 2, harga: 22000, subtotal: 44000 },
  { product_id: 'prod-16', qty: 1, harga: 15000, subtotal: 15000 },
]

function buildTransaction(
  id: string,
  no_nota: string,
  user_id: string,
  items: Omit<TransactionItem, 'id' | 'transaction_id'>[],
  metode_bayar: Transaction['metode_bayar'],
  dibayar: number,
  created_at: string,
): { transaction: Transaction; items: TransactionItem[] } {
  const total = items.reduce((sum, item) => sum + item.subtotal, 0)
  const transaction: Transaction = {
    id,
    no_nota,
    user_id,
    total,
    metode_bayar,
    dibayar,
    kembalian: Math.max(dibayar - total, 0),
    status: 'selesai',
    created_at,
  }
  const fullItems: TransactionItem[] = items.map((item, index) => ({
    ...item,
    id: `${id}-item-${index + 1}`,
    transaction_id: id,
  }))
  return { transaction, items: fullItems }
}

const tx1 = buildTransaction(
  'trx-1',
  'INV-20260731-001',
  'user-kasir',
  t1Items,
  'tunai',
  60000,
  '2026-07-31T02:15:00.000Z',
)
const tx2 = buildTransaction(
  'trx-2',
  'INV-20260731-002',
  'user-kasir',
  t2Items,
  'qris',
  120000,
  '2026-07-31T05:40:00.000Z',
)
const tx3 = buildTransaction(
  'trx-3',
  'INV-20260801-001',
  'user-kasir',
  t3Items,
  'tunai',
  60000,
  '2026-08-01T01:05:00.000Z',
)

export const seedTransactions: Transaction[] = [
  tx1.transaction,
  tx2.transaction,
  tx3.transaction,
]

export const seedTransactionItems: TransactionItem[] = [
  ...tx1.items,
  ...tx2.items,
  ...tx3.items,
]

// --- Stock movements ---------------------------------------------------
// Every product's current stok is treated as having arrived via an initial
// 'in' movement, then the sales above create matching 'out' movements so
// stock_movements stays the source of truth that products.stok is derived from.

function initialInMovement(
  id: string,
  product_id: string,
  qty: number,
  created_at: string,
): StockMovement {
  return {
    id,
    product_id,
    tipe: 'in',
    qty,
    user_id: 'user-gudang',
    catatan: 'Stok awal',
    created_at,
  }
}

export const seedStockMovements: StockMovement[] = [
  ...seedProducts.map((product, index) =>
    initialInMovement(
      `mov-init-${index + 1}`,
      product.id,
      // Reconstruct a plausible "initial" qty: current stok + qty already sold below.
      product.stok +
        seedTransactionItems
          .filter((item) => item.product_id === product.id)
          .reduce((sum, item) => sum + item.qty, 0),
      '2025-07-01T01:00:00.000Z',
    ),
  ),
  // Sales-driven 'out' movements mirroring the seed transactions.
  ...seedTransactionItems.map((item, index) => ({
    id: `mov-sale-${index + 1}`,
    product_id: item.product_id,
    tipe: 'out' as const,
    qty: item.qty,
    user_id: 'user-kasir',
    catatan: `Penjualan ${item.transaction_id}`,
    created_at: seedTransactions.find((t) => t.id === item.transaction_id)!.created_at,
  })),
  // A manual stock adjustment example.
  {
    id: 'mov-adjust-1',
    product_id: 'prod-15',
    tipe: 'adjust',
    qty: -1,
    user_id: 'user-gudang',
    catatan: 'Koreksi stok fisik (barang rusak)',
    created_at: '2026-07-30T03:00:00.000Z',
  },
]
