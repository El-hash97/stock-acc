import type { Product, StockStatus } from '@/types'

/**
 * Derives the stock-level status used across the UI (badges, alerts, filters)
 * from a product's current stok vs its stok_min. Not persisted — always
 * computed on the fly from the source-of-truth stok field.
 */
export function getStockStatus(product: Pick<Product, 'stok' | 'stok_min'>): StockStatus {
  if (product.stok <= 0) return 'habis'
  if (product.stok <= product.stok_min) return 'menipis'
  return 'aman'
}

export const stockStatusLabel: Record<StockStatus, string> = {
  aman: 'Aman',
  menipis: 'Menipis',
  habis: 'Habis',
}
