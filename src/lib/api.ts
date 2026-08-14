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
