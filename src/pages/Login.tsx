import { useNavigate } from 'react-router-dom'
import { Storefront, Crown, Coins, Warehouse, CaretRight } from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { useSessionStore } from '@/store/session'
import type { Role } from '@/types'

interface RoleOption {
  role: Role
  name: string
  title: string
  description: string
  icon: Icon
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'owner',
    name: 'Budi Santoso',
    title: 'Owner / Admin',
    description: 'Akses penuh: kelola produk, transaksi, stok, laporan, dan pengguna.',
    icon: Crown,
  },
  {
    role: 'kasir',
    name: 'Sari Wulandari',
    title: 'Kasir',
    description: 'Proses transaksi penjualan dan lihat laporan penjualan harian.',
    icon: Coins,
  },
  {
    role: 'staff_gudang',
    name: 'Andi Prasetyo',
    title: 'Staff Gudang',
    description: 'Kelola stok barang: tambah, kurangi, dan sesuaikan inventori.',
    icon: Warehouse,
  },
]

export default function Login() {
  const navigate = useNavigate()
  const login = useSessionStore((s) => s.login)

  function handleSelect(option: RoleOption) {
    login(option.role, option.name)
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Storefront size={30} weight="fill" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Konter</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Monitoring Penjualan &amp; Stok Aksesoris
          </p>
        </div>

        <p className="mb-3 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Masuk sebagai
        </p>

        <div className="flex flex-col gap-3">
          {ROLE_OPTIONS.map((option) => {
            const OptionIcon = option.icon
            return (
              <button
                key={option.role}
                type="button"
                onClick={() => handleSelect(option)}
                className="flex min-h-[80px] items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 text-left transition-colors active:bg-muted hover:border-brand-light hover:bg-secondary/40"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <OptionIcon size={22} weight="bold" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{option.title}</p>
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    {option.description}
                  </p>
                </div>
                <CaretRight size={18} weight="bold" className="shrink-0 text-muted-foreground" />
              </button>
            )
          })}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Pemilihan peran ini sementara untuk pengembangan &mdash; akan diganti dengan
          login sesungguhnya.
        </p>
      </div>
    </div>
  )
}
