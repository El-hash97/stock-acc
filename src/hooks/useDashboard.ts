import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary, getLowStockProducts } from '@/lib/api'

export const dashboardKeys = {
  summary: ['dashboard', 'summary'] as const,
  lowStock: ['dashboard', 'low-stock'] as const,
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary,
    queryFn: getDashboardSummary,
  })
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: dashboardKeys.lowStock,
    queryFn: getLowStockProducts,
  })
}
