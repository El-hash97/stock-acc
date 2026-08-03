import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Package,
  Receipt,
  Scan,
  Warning,
  WarningCircle,
} from '@phosphor-icons/react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useSessionStore } from '@/store/session'
import { useDashboardSummary, useLowStockProducts } from '@/hooks/useDashboard'
import { useTransactions } from '@/hooks/useTransactions'
import { getStockStatus, stockStatusLabel } from '@/lib/stock'
import { cn } from '@/lib/utils'
import type { Role, StockStatus } from '@/types'

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

const roleLabel: Record<Role, string> = {
  owner: 'Owner / Admin',
  kasir: 'Kasir',
  staff_gudang: 'Staff Gudang',
}

const statusBadgeClass: Record<StockStatus, string> = {
  aman: 'bg-status-aman-bg text-status-aman-fg',
  menipis: 'bg-status-menipis-bg text-status-menipis-fg',
  habis: 'bg-status-habis-bg text-status-habis-fg',
}

function formatWaktu(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export default function Beranda() {
  const currentRole = useSessionStore((s) => s.currentRole)
  const currentUserName = useSessionStore((s) => s.currentUserName)

  const { data: summary, isLoading: isSummaryLoading } = useDashboardSummary()
  const { data: lowStockProducts, isLoading: isLowStockLoading } = useLowStockProducts()

  const showActivity = currentRole === 'owner' || currentRole === 'kasir'
  const { data: recentTransactions, isLoading: isActivityLoading } = useTransactions(
    showActivity ? { limit: 5 } : undefined,
  )

  const role = currentRole ?? 'kasir'
  const lowStockCount = (summary?.produk_menipis ?? 0) + (summary?.produk_habis ?? 0)

  const showJualShortcut = role === 'owner' || role === 'kasir'
  const showStokShortcut = role === 'owner' || role === 'staff_gudang'

  return (
    <div className="px-4 py-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Halo, {currentUserName ?? 'Pengguna'}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{roleLabel[role]}</p>
      </div>

      {/* Primary action shortcuts */}
      <div className={cn('mt-5 grid gap-3', showJualShortcut && showStokShortcut && 'grid-cols-2')}>
        {showJualShortcut && (
          <Link
            to="/jual"
            className="flex items-center gap-3 rounded-xl border border-border bg-primary p-4 text-primary-foreground transition-colors active:bg-primary/90"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
              <Scan size={20} weight="bold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Scan &amp; Jual</p>
              <p className="text-xs text-primary-foreground/80">Transaksi baru</p>
            </div>
            <ArrowRight size={16} weight="bold" className="shrink-0 opacity-80" />
          </Link>
        )}
        {showStokShortcut && (
          <Link
            to="/stok"
            className={cn(
              'flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors active:bg-muted',
              !showJualShortcut && 'bg-primary text-primary-foreground active:bg-primary/90',
            )}
          >
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary',
                !showJualShortcut && 'bg-primary-foreground/15 text-primary-foreground',
              )}
            >
              <Package size={20} weight="bold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Kelola Stok</p>
              <p
                className={cn(
                  'text-xs text-muted-foreground',
                  !showJualShortcut && 'text-primary-foreground/80',
                )}
              >
                Produk &amp; stok
              </p>
            </div>
            <ArrowRight
              size={16}
              weight="bold"
              className={cn('shrink-0 opacity-60', !showJualShortcut && 'opacity-80')}
            />
          </Link>
        )}
      </div>

      {/* Summary stats (bento) */}
      <div className="mt-5">
        {role === 'staff_gudang' ? (
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Produk Menipis
                </p>
                <p className="text-3xl font-bold tracking-tight text-status-menipis-fg tabular-nums">
                  {isSummaryLoading ? '—' : (summary?.produk_menipis ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Produk Habis
                </p>
                <p className="text-3xl font-bold tracking-tight text-status-habis-fg tabular-nums">
                  {isSummaryLoading ? '—' : (summary?.produk_habis ?? 0)}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Card className="col-span-2">
              <CardContent className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Penjualan Hari Ini
                </p>
                <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                  {isSummaryLoading ? 'Memuat…' : formatRupiah(summary?.penjualan_hari_ini ?? 0)}
                </p>
              </CardContent>
            </Card>
            <Card className={cn(role !== 'owner' && 'col-span-2')}>
              <CardContent className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Transaksi Hari Ini
                </p>
                <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                  {isSummaryLoading ? 'Memuat…' : (summary?.transaksi_hari_ini ?? 0)}
                </p>
              </CardContent>
            </Card>
            {role === 'owner' && (
              <Card>
                <CardContent className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Laba Hari Ini
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-primary tabular-nums">
                    {isSummaryLoading ? 'Memuat…' : formatRupiah(summary?.laba_hari_ini ?? 0)}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Low stock alert */}
      {!isSummaryLoading && lowStockCount > 0 && (
        <Card className="mt-5 border-status-habis-fg/20 bg-status-menipis-bg">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <Warning size={20} weight="bold" className="mt-0.5 shrink-0 text-status-menipis-fg" />
              <div>
                <p className="text-sm font-semibold text-status-menipis-fg">
                  {lowStockCount} produk perlu restock
                </p>
                <p className="text-xs text-status-menipis-fg/80">
                  Segera cek dan lakukan pengisian stok.
                </p>
              </div>
            </div>

            {!isLowStockLoading && lowStockProducts && lowStockProducts.length > 0 && (
              <div className="flex flex-col gap-2 rounded-lg bg-background/60 p-2.5">
                {lowStockProducts.slice(0, 4).map((product) => {
                  const status = getStockStatus(product)
                  return (
                    <div key={product.id} className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm text-foreground">{product.nama}</p>
                      <Badge className={cn('shrink-0 border-0', statusBadgeClass[status])}>
                        {stockStatusLabel[status]}
                      </Badge>
                    </div>
                  )
                })}
                {lowStockProducts.length > 4 && (
                  <p className="text-xs text-muted-foreground">
                    +{lowStockProducts.length - 4} lainnya
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent activity */}
      {showActivity && (
        <div className="mt-5">
          <h2 className="text-sm font-semibold text-foreground">Aktivitas Terbaru</h2>
          <Card className="mt-2">
            <CardContent className="flex flex-col gap-0">
              {isActivityLoading ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Memuat…</p>
              ) : recentTransactions && recentTransactions.length > 0 ? (
                recentTransactions.map((tx, idx) => (
                  <div key={tx.id}>
                    {idx > 0 && <Separator />}
                    <div className="flex items-center gap-3 py-2.5">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                        <Receipt size={16} weight="bold" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {tx.no_nota}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatWaktu(tx.created_at)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-medium text-foreground">
                        {formatRupiah(tx.total)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <WarningCircle size={18} weight="bold" className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Belum ada transaksi hari ini.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
