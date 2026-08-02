import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  House,
  ShoppingCartSimple,
  Package,
  ChartBar,
  UserCircle,
  SignOut,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { useSessionStore } from '@/store/session'
import type { Role } from '@/types'
import { cn } from '@/lib/utils'

interface TabDef {
  to: string
  label: string
  icon: Icon
  roles: Role[]
}

const TABS: TabDef[] = [
  { to: '/', label: 'Beranda', icon: House, roles: ['owner', 'kasir', 'staff_gudang'] },
  { to: '/jual', label: 'Jual', icon: ShoppingCartSimple, roles: ['owner', 'kasir'] },
  { to: '/stok', label: 'Stok', icon: Package, roles: ['owner', 'staff_gudang'] },
  { to: '/laporan', label: 'Laporan', icon: ChartBar, roles: ['owner', 'kasir'] },
  { to: '/profil', label: 'Profil', icon: UserCircle, roles: ['owner', 'kasir', 'staff_gudang'] },
]

const roleLabel: Record<Role, string> = {
  owner: 'Owner / Admin',
  kasir: 'Kasir',
  staff_gudang: 'Staff Gudang',
}

export default function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentRole, currentUserName, logout } = useSessionStore()

  const visibleTabs = TABS.filter((tab) => currentRole && tab.roles.includes(currentRole))
  const activeTab = TABS.find((tab) => tab.to === location.pathname)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-foreground">
            {activeTab?.label ?? 'Konter'}
          </span>
          {currentRole && (
            <span className="text-xs text-muted-foreground">
              {currentUserName} &middot; {roleLabel[currentRole]}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Keluar"
          className="flex size-11 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <SignOut size={20} weight="bold" />
        </button>
      </header>

      <main className="flex-1 pb-[calc(4.25rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]"
        aria-label="Navigasi utama"
      >
        <ul className="flex items-stretch justify-around">
          {visibleTabs.map((tab) => {
            const isActive = tab.to === location.pathname
            const TabIcon = tab.icon
            return (
              <li key={tab.to} className="flex-1">
                <button
                  type="button"
                  onClick={() => navigate(tab.to)}
                  className="relative flex w-full min-h-[56px] flex-col items-center justify-center gap-1 py-2 text-xs font-medium"
                >
                  {isActive && (
                    <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-primary" />
                  )}
                  <TabIcon
                    size={24}
                    weight={isActive ? 'fill' : 'bold'}
                    className={cn(isActive ? 'text-primary' : 'text-muted-foreground')}
                  />
                  <span className={cn(isActive ? 'text-primary' : 'text-muted-foreground')}>
                    {tab.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
