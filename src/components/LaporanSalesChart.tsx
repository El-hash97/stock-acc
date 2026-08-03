import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartLineUp } from '@phosphor-icons/react'

export interface LaporanSalesChartPoint {
  tanggal: string
  label: string
  total: number
}

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

function formatRupiahCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1_000) return `${Math.round(n / 1_000)}rb`
  return `${n}`
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { value: number; payload: LaporanSalesChartPoint }[]
}) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0].payload
  return (
    <div className="rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-sm">
      <p className="font-semibold text-popover-foreground">{point.label}</p>
      <p className="text-muted-foreground">{formatRupiah(point.total)}</p>
    </div>
  )
}

export function LaporanSalesChart({
  data,
  isLoading,
}: {
  data: LaporanSalesChartPoint[]
  isLoading?: boolean
}) {
  if (isLoading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Memuat grafik…</p>
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <ChartLineUp size={20} weight="bold" className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Belum ada transaksi selesai.</p>
      </div>
    )
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            stroke="var(--muted-foreground)"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={11}
            stroke="var(--muted-foreground)"
            tickFormatter={(value: number) => formatRupiahCompact(value)}
            width={40}
          />
          <Tooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltip />} />
          <Bar dataKey="total" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
