import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTransaction,
  getAllTransactionItems,
  getTransactionItems,
  getTransactions,
} from '@/lib/api'
import type { CreateTransactionInput } from '@/types'
import { dashboardKeys } from './useDashboard'
import { productKeys } from './useProducts'

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (params?: { limit?: number }) => ['transactions', 'list', params ?? {}] as const,
  items: (transactionId: string) => ['transactions', 'items', transactionId] as const,
  allItems: ['transactions', 'all-items'] as const,
}

export function useTransactions(params?: { limit?: number }) {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: () => getTransactions(params),
  })
}

export function useTransactionItems(transactionId: string | undefined) {
  return useQuery({
    queryKey: transactionKeys.items(transactionId ?? ''),
    queryFn: () => getTransactionItems(transactionId as string),
    enabled: Boolean(transactionId),
  })
}

/** Used by Laporan to aggregate top products / profit across all transactions. */
export function useAllTransactionItems() {
  return useQuery({
    queryKey: transactionKeys.allItems,
    queryFn: getAllTransactionItems,
  })
}

/** Selling items reduces stock, so this invalidates products + dashboard too. */
export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTransactionInput) => createTransaction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      queryClient.invalidateQueries({ queryKey: dashboardKeys.summary })
      queryClient.invalidateQueries({ queryKey: dashboardKeys.lowStock })
    },
  })
}
