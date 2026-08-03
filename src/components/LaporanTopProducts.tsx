import { Trophy } from '@phosphor-icons/react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export interface LaporanTopProduct {
  productId: string
  nama: string
  qty: number
  omzet: number
}

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

const rankBadgeClass = [
  'bg-primary text-primary-foreground',
  'bg-secondary text-secondary-foreground',
  'bg-secondary text-secondary-foreground',
]

export function LaporanTopProducts({
  items,
  isLoading,
}: {
  items: LaporanTopProduct[]
  isLoading?: boolean
}) {
  if (isLoading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Memuat data…</p>
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <Trophy size={20} weight="bold" className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Belum ada produk terjual.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      {items.map((item, idx) => (
        <div key={item.productId}>
          {idx > 0 && <Separator />}
          <div className="flex items-center gap-3 py-2.5">
            <div
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold',
                rankBadgeClass[idx] ?? 'bg-muted text-muted-foreground',
              )}
            >
              {idx + 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{item.nama}</p>
              <p className="text-xs text-muted-foreground">{item.qty} terjual</p>
            </div>
            <p className="shrink-0 text-sm font-medium text-foreground">
              {formatRupiah(item.omzet)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
