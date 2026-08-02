import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCategory,
  createProduct,
  generateBarcode,
  getCategories,
  getProductByBarcode,
  getProductById,
  getProducts,
  updateCategory,
  updateProduct,
  type CreateCategoryInput,
  type CreateProductInput,
  type UpdateCategoryInput,
  type UpdateProductInput,
} from '@/lib/api'
import { dashboardKeys } from './useDashboard'

export const productKeys = {
  all: ['products'] as const,
  list: (params?: { search?: string; category_id?: string }) =>
    ['products', 'list', params ?? {}] as const,
  detail: (id: string) => ['products', 'detail', id] as const,
  byBarcode: (barcode: string) => ['products', 'barcode', barcode] as const,
}

export const categoryKeys = {
  all: ['categories'] as const,
}

export function useProducts(params?: { search?: string; category_id?: string }) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => getProducts(params),
  })
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(id ?? ''),
    queryFn: () => getProductById(id as string),
    enabled: Boolean(id),
  })
}

export function useProductByBarcode(barcode: string | undefined) {
  return useQuery({
    queryKey: productKeys.byBarcode(barcode ?? ''),
    queryFn: () => getProductByBarcode(barcode as string),
    enabled: Boolean(barcode),
  })
}

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: getCategories,
  })
}

/** Edits product identity/pricing (nama, harga_modal, harga_jual). Stock changes go through useAddStockMovement. */
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateProductInput) => updateProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      queryClient.invalidateQueries({ queryKey: dashboardKeys.summary })
      queryClient.invalidateQueries({ queryKey: dashboardKeys.lowStock })
    },
  })
}

/** Fetches a fresh, collision-free barcode — call again ("regenerate") for a new candidate. */
export function useGenerateBarcode() {
  return useMutation({
    mutationFn: () => generateBarcode(),
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all })
      queryClient.invalidateQueries({ queryKey: dashboardKeys.summary })
      queryClient.invalidateQueries({ queryKey: dashboardKeys.lowStock })
    },
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCategoryInput) => createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateCategoryInput) => updateCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}
