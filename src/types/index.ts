/**
 * Domain types for Aplikasi Monitoring Penjualan & Stok Aksesoris.
 * Modeled from the PRD's ERD (categories, products, transactions,
 * transaction_items, stock_movements, users).
 */

/** User roles as defined in PRD §3 / §6 (role-based tab visibility). */
export type Role = 'owner' | 'kasir' | 'staff_gudang'

/** Generic active/inactive lifecycle status used by products and users. */
export type ActiveStatus = 'aktif' | 'nonaktif'

/** Derived stock-level status (not stored — computed from stok vs stok_min). */
export type StockStatus = 'aman' | 'menipis' | 'habis'

/** Payment methods accepted at the counter. */
export type MetodeBayar = 'tunai' | 'qris' | 'transfer' | 'kartu_debit'

/** Transaction lifecycle status. */
export type TransactionStatus = 'selesai' | 'dibatalkan'

/** Stock movement type — the append-only ledger that is the source of truth for stock. */
export type StockMovementType = 'in' | 'out' | 'adjust'

export interface Category {
  id: string
  nama: string
}

export interface Product {
  id: string
  barcode: string
  nama: string
  /** Free-text product type, e.g. "Original", "KW Super" — optional, separate from category_id. */
  tipe: string | null
  category_id: string
  harga_modal: number
  harga_jual: number
  /** Denormalized current stock, kept in sync with stock_movements. */
  stok: number
  stok_min: number
  foto_url: string | null
  status: ActiveStatus
}

export interface User {
  id: string
  nama: string
  username: string
  password_hash: string
  role: Role
  status: ActiveStatus
  created_at: string
}

export interface Transaction {
  id: string
  no_nota: string
  user_id: string
  total: number
  metode_bayar: MetodeBayar
  dibayar: number
  kembalian: number
  status: TransactionStatus
  created_at: string
}

export interface TransactionItem {
  id: string
  transaction_id: string
  product_id: string
  qty: number
  harga: number
  subtotal: number
}

export interface StockMovement {
  id: string
  product_id: string
  tipe: StockMovementType
  qty: number
  user_id: string
  catatan: string | null
  created_at: string
}

/** Convenience shape for building a transaction (used by createTransaction). */
export interface CreateTransactionItemInput {
  product_id: string
  qty: number
  harga: number
}

export interface CreateTransactionInput {
  user_id: string
  metode_bayar: MetodeBayar
  dibayar: number
  items: CreateTransactionItemInput[]
}

/** Dashboard summary shape returned by getDashboardSummary(). */
export interface DashboardSummary {
  penjualan_hari_ini: number
  transaksi_hari_ini: number
  produk_menipis: number
  produk_habis: number
  laba_hari_ini: number
}
