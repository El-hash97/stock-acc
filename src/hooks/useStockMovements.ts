import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addStockMovement, getStockMovements, type AddStockMovementInput } from '@/lib/api'
import { dashboardKeys } from './useDashboard'
import { productKeys } from './useProducts'

export const stockMovementKeys = {
  all: ['stock-movements'] as const,
  byProduct: (productId?: string) => ['stock-movements', productId ?? 'all'] as const,
}

export function useStockMovements(productId?: string) {
  return useQuery({
    queryKey: stockMovementKeys.byProduct(productId),
    queryFn: () => getStockMovements(productId),
  })
}

/** Stock-in/out/adjust mutates a product's stok, so this invalidates products + dashboard too. */
export function useAddStockMovement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AddStockMovementInput) => addStockMovement(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stockMovementKeys.all })
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      queryClient.invalidateQueries({ queryKey: dashboardKeys.summary })
      queryClient.invalidateQueries({ queryKey: dashboardKeys.lowStock })
    },
  })
}
