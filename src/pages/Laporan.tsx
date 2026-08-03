import { ChartBar, CurrencyCircleDollar, Package, TrendUp } from '@phosphor-icons/react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LaporanSalesChart, type LaporanSalesChartPoint } from '@/components/LaporanSalesChart'
import { LaporanTopProducts, type LaporanTopProduct } from '@/components/LaporanTopProducts'
import { useTransactions, useAllTransactionItems } from '@/hooks/useTransactions'
import { useProducts } from '@/hooks/useProducts'
import { useSessionStore } from '@/store/session'
import type { Product, Transaction, TransactionItem } from '@/types'

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

function buildLast7DaysSales(transactions: Transaction[]): LaporanSalesChartPoint[] {
  const points: LaporanSalesChartPoint[] = []
  const today = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateKey = d.toDateString()
    const total = transactions
      .filter((t) => t.status === 'selesai' && new Date(t.created_at).toDateString() === dateKey)
      .reduce((sum, t) => sum + t.total, 0)
    points.push({
      tanggal: dateKey,
      label: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      total,
    })
  }
  return points
}

function buildTopProducts(
  items: TransactionItem[],
  products: Product[],
  limit = 5,
): LaporanTopProduct[] {
  const map = new Map<string, { qty: number; omzet: number }>()
  for (const item of items) {
    const entry = map.get(item.product_id) ?? { qty: 0, omzet: 0 }
    entry.qty += item.qty
    entry.omzet += item.subtotal
    map.set(item.product_id, entry)
  }
  return Array.from(map.entries())
    .map(([productId, agg]) => ({
      productId,
      nama: products.find((p) => p.id === productId)?.nama ?? 'Produk tidak dikenal',
      qty: agg.qty,
      omzet: agg.omzet,
    }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, limit)
}

export default function Laporan() {
  const currentRole = useSessionStore((s) => s.currentRole)
  const isOwner = currentRole === 'owner'

  const { data: transactions, isLoading: isTxLoading } = useTransactions()
  const { data: items, isLoading: isItemsLoading } = useAllTransactionItems()
  const { data: products, isLoading: isProductsLoading } = useProducts()

  const salesData = buildLast7DaysSales(transactions ?? [])
  const totalOmzet7d = salesData.reduce((sum, d) => sum + d.total, 0)
  const totalTransaksi7d = (transactions ?? []).filter((t) => {
    if (t.status !== 'selesai') return false
    const days = (Date.now() - new Date(t.created_at).getTime()) / 86_400_000
    return days <= 7
  }).length

  const topProducts = buildTopProducts(items ?? [], products ?? [])

  const nilaiStok = (products ?? []).reduce((sum, p) => sum + p.stok * p.harga_modal, 0)
  const modalCost7d = (items ?? []).reduce((sum, item) => {
    const tx = (transactions ?? []).find((t) => t.id === item.transaction_id)
    if (!tx || tx.status !== 'selesai') return sum
    const days = (Date.now() - new Date(tx.created_at).getTime()) / 86_400_000
    if (days > 7) return sum
    const product = (products ?? []).find((p) => p.id === item.product_id)
    return sum + (product?.harga_modal ?? 0) * item.qty
  }, 0)
  const profit7d = totalOmzet7d - modalCost7d

  const isLoading = isTxLoading || isItemsLoading || isProductsLoading

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold tracking-tight text-foreground">Laporan</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isOwner
          ? 'Ringkasan penjualan, produk terlaris, dan profit toko.'
          : 'Ringkasan penjualan dan produk terlaris 7 hari terakhir.'}
      </p>

      <Tabs defaultValue="penjualan" className="mt-4">
        <TabsList className="w-full">
          <TabsTrigger value="penjualan">Penjualan</TabsTrigger>
          <TabsTrigger value="terlaris">Terlaris</TabsTrigger>
          {isOwner && <TabsTrigger value="profit">Profit &amp; Stok</TabsTrigger>}
        </TabsList>

        <TabsContent value="penjualan" className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Omzet 7 Hari
                </p>
                <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                  {isLoading ? 'Memuat…' : formatRupiah(totalOmzet7d)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Transaksi 7 Hari
                </p>
                <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                  {isLoading ? 'Memuat…' : totalTransaksi7d}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <ChartBar size={16} weight="bold" className="text-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Penjualan Harian</h2>
              </div>
              <LaporanSalesChart data={salesData} isLoading={isTxLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terlaris" className="mt-4">
          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <TrendUp size={16} weight="bold" className="text-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Produk Terlaris (7 Hari)</h2>
              </div>
              <LaporanTopProducts items={topProducts} isLoading={isItemsLoading || isProductsLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        {isOwner && (
          <TabsContent value="profit" className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Laba 7 Hari
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-primary tabular-nums">
                    {isLoading ? 'Memuat…' : formatRupiah(profit7d)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Nilai Stok (Modal)
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                    {isProductsLoading ? 'Memuat…' : formatRupiah(nilaiStok)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <CurrencyCircleDollar size={18} weight="bold" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Laba dihitung dari omzet dikurangi harga modal barang terjual dalam 7 hari
                  terakhir. Nilai stok dihitung dari stok saat ini dikali harga modal per produk.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Package size={18} weight="bold" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Export laporan ke PDF/Excel akan tersedia pada tahap berikutnya (Fase 2).
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
