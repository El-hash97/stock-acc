import type {
  Category,
  CreateTransactionInput,
  DashboardSummary,
  Product,
  StockMovement,
  Transaction,
  TransactionItem,
  User,
} from '@/types'
import {
  seedCategories,
  seedProducts,
  seedStockMovements,
  seedTransactionItems,
  seedTransactions,
  seedUsers,
} from './mockData'

/**
 * Mock backend layer shaped like future Supabase calls: every export is an
 * async function returning a Promise, accepting the kind of params a real
 * backend call would. Mutations actually mutate the in-memory store (backed
 * by localStorage) so the UI reflects changes for the rest of the session —
 * e.g. selling an item reduces its stok immediately.
 */

interface MockStore {
  categories: Category[]
  products: Product[]
  users: User[]
  transactions: Transaction[]
  transactionItems: TransactionItem[]
  stockMovements: StockMovement[]
}

const STORAGE_KEY = 'acc-konter:mock-store:v1'

function seedStore(): MockStore {
  return {
    categories: seedCategories.map((c) => ({ ...c })),
    products: seedProducts.map((p) => ({ ...p })),
    users: seedUsers.map((u) => ({ ...u })),
    transactions: seedTransactions.map((t) => ({ ...t })),
    transactionItems: seedTransactionItems.map((i) => ({ ...i })),
    stockMovements: seedStockMovements.map((m) => ({ ...m })),
  }
}

function loadStore(): MockStore {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw) as MockStore
    } catch {
      // Corrupted or unavailable storage — fall back to fresh seed data.
    }
  }
  return seedStore()
}

const store: MockStore = loadStore()

function persist() {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    } catch {
      // Storage full/unavailable — mutations still apply in-memory for this session.
    }
  }
}

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// --- Reads -------------------------------------------------------------

export async function getCategories(): Promise<Category[]> {
  return delay([...store.categories])
}

export async function getProducts(params?: {
  search?: string
  category_id?: string
}): Promise<Product[]> {
  let results = [...store.products]
  if (params?.category_id) {
    results = results.filter((p) => p.category_id === params.category_id)
  }
  if (params?.search) {
    const q = params.search.trim().toLowerCase()
    results = results.filter(
      (p) => p.nama.toLowerCase().includes(q) || p.barcode.includes(q),
    )
  }
  return delay(results)
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return delay(store.products.find((p) => p.id === id))
}

export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
  return delay(store.products.find((p) => p.barcode === barcode))
}

export async function getLowStockProducts(): Promise<Product[]> {
  return delay(store.products.filter((p) => p.stok <= p.stok_min))
}

export async function getUsers(): Promise<User[]> {
  return delay([...store.users])
}

export async function getTransactions(params?: { limit?: number }): Promise<Transaction[]> {
  const sorted = [...store.transactions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  return delay(params?.limit ? sorted.slice(0, params.limit) : sorted)
}

export async function getTransactionItems(transactionId: string): Promise<TransactionItem[]> {
  return delay(store.transactionItems.filter((i) => i.transaction_id === transactionId))
}

/** All transaction items across every transaction — used for report aggregation (top products, profit). */
export async function getAllTransactionItems(): Promise<TransactionItem[]> {
  return delay([...store.transactionItems])
}

export async function getStockMovements(productId?: string): Promise<StockMovement[]> {
  const sorted = [...store.stockMovements].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
  return delay(productId ? sorted.filter((m) => m.product_id === productId) : sorted)
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const today = new Date().toDateString()
  const todaysTx = store.transactions.filter(
    (t) => t.status === 'selesai' && new Date(t.created_at).toDateString() === today,
  )
  const penjualan_hari_ini = todaysTx.reduce((sum, t) => sum + t.total, 0)
  const laba_hari_ini = todaysTx.reduce((sum, t) => {
    const items = store.transactionItems.filter((i) => i.transaction_id === t.id)
    const cost = items.reduce((s, i) => {
      const product = store.products.find((p) => p.id === i.product_id)
      return s + (product?.harga_modal ?? 0) * i.qty
    }, 0)
    return sum + (t.total - cost)
  }, 0)
  const produk_menipis = store.products.filter((p) => p.stok > 0 && p.stok <= p.stok_min).length
  const produk_habis = store.products.filter((p) => p.stok === 0).length

  return delay({
    penjualan_hari_ini,
    transaksi_hari_ini: todaysTx.length,
    produk_menipis,
    produk_habis,
    laba_hari_ini,
  })
}

// --- Mutations -----------------------------------------------------------

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  if (input.items.length === 0) {
    throw new Error('Transaksi harus memiliki minimal 1 item')
  }

  const total = input.items.reduce((sum, item) => sum + item.harga * item.qty, 0)
  const nowIso = new Date().toISOString()
  const notaSeq = store.transactions.length + 1
  const datePart = nowIso.slice(0, 10).replace(/-/g, '')

  const transaction: Transaction = {
    id: generateId('trx'),
    no_nota: `INV-${datePart}-${String(notaSeq).padStart(3, '0')}`,
    user_id: input.user_id,
    total,
    metode_bayar: input.metode_bayar,
    dibayar: input.dibayar,
    kembalian: Math.max(input.dibayar - total, 0),
    status: 'selesai',
    created_at: nowIso,
  }
  store.transactions.push(transaction)

  for (const item of input.items) {
    const txItem: TransactionItem = {
      id: generateId('txi'),
      transaction_id: transaction.id,
      product_id: item.product_id,
      qty: item.qty,
      harga: item.harga,
      subtotal: item.harga * item.qty,
    }
    store.transactionItems.push(txItem)

    const product = store.products.find((p) => p.id === item.product_id)
    if (product) {
      product.stok = Math.max(product.stok - item.qty, 0)
    }

    const movement: StockMovement = {
      id: generateId('mov'),
      product_id: item.product_id,
      tipe: 'out',
      qty: item.qty,
      user_id: input.user_id,
      catatan: `Penjualan ${transaction.no_nota}`,
      created_at: nowIso,
    }
    store.stockMovements.push(movement)
  }

  persist()
  return delay(transaction)
}

function randomBarcodeCandidate(): string {
  const random = Math.floor(Math.random() * 1e10)
    .toString()
    .padStart(10, '0')
  return `899${random}`
}

/** Auto-assigns a 13-digit barcode guaranteed unique against current products. */
export async function generateBarcode(): Promise<string> {
  let barcode = randomBarcodeCandidate()
  while (store.products.some((p) => p.barcode === barcode)) {
    barcode = randomBarcodeCandidate()
  }
  return delay(barcode)
}

export interface CreateProductInput {
  barcode: string
  nama: string
  category_id: string
  harga_modal: number
  harga_jual: number
  stok: number
  stok_min: number
  user_id: string
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  if (store.products.some((p) => p.barcode === input.barcode)) {
    throw new Error(`Barcode "${input.barcode}" sudah digunakan produk lain`)
  }

  const product: Product = {
    id: generateId('prod'),
    barcode: input.barcode,
    nama: input.nama,
    category_id: input.category_id,
    harga_modal: input.harga_modal,
    harga_jual: input.harga_jual,
    stok: input.stok,
    stok_min: input.stok_min,
    foto_url: null,
    status: 'aktif',
  }
  store.products.push(product)

  if (input.stok > 0) {
    store.stockMovements.push({
      id: generateId('mov'),
      product_id: product.id,
      tipe: 'in',
      qty: input.stok,
      user_id: input.user_id,
      catatan: 'Stok awal produk baru',
      created_at: new Date().toISOString(),
    })
  }

  persist()
  return delay(product)
}

export interface CreateCategoryInput {
  nama: string
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const category: Category = { id: generateId('cat'), nama: input.nama }
  store.categories.push(category)
  persist()
  return delay(category)
}

export interface UpdateCategoryInput {
  id: string
  nama: string
}

export async function updateCategory(input: UpdateCategoryInput): Promise<Category> {
  const category = store.categories.find((c) => c.id === input.id)
  if (!category) {
    throw new Error(`Kategori dengan id "${input.id}" tidak ditemukan`)
  }
  category.nama = input.nama
  persist()
  return delay({ ...category })
}

export interface UpdateProductInput {
  id: string
  nama?: string
  harga_modal?: number
  harga_jual?: number
}

/** Edits product identity/pricing fields. Stock stays derived from stock_movements — use addStockMovement for stock changes. */
export async function updateProduct(input: UpdateProductInput): Promise<Product> {
  const product = store.products.find((p) => p.id === input.id)
  if (!product) {
    throw new Error(`Produk dengan id "${input.id}" tidak ditemukan`)
  }
  if (input.nama !== undefined) product.nama = input.nama
  if (input.harga_modal !== undefined) product.harga_modal = input.harga_modal
  if (input.harga_jual !== undefined) product.harga_jual = input.harga_jual

  persist()
  return delay({ ...product })
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
  const product = store.products.find((p) => p.id === input.product_id)
  if (!product) {
    throw new Error(`Produk dengan id "${input.product_id}" tidak ditemukan`)
  }

  const movement: StockMovement = {
    id: generateId('mov'),
    product_id: input.product_id,
    tipe: input.tipe,
    qty: input.qty,
    user_id: input.user_id,
    catatan: input.catatan ?? null,
    created_at: new Date().toISOString(),
  }
  store.stockMovements.push(movement)

  if (input.tipe === 'in') {
    product.stok = product.stok + input.qty
  } else if (input.tipe === 'out') {
    product.stok = Math.max(product.stok - input.qty, 0)
  } else {
    product.stok = Math.max(product.stok + input.qty, 0)
  }

  persist()
  return delay(movement)
}
