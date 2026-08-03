import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { UserCircle, SignOut, UsersThree, Info } from '@phosphor-icons/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getUsers } from '@/lib/api'
import { useSessionStore } from '@/store/session'
import type { Role } from '@/types'
import ProfilUserList from '@/components/ProfilUserList'

/** Human-readable role labels — kept local to this page per instructions. */
const roleLabel: Record<Role, string> = {
  owner: 'Owner / Admin',
  kasir: 'Kasir',
  staff_gudang: 'Staff Gudang',
}

export default function Profil() {
  const navigate = useNavigate()
  const { currentRole, currentUserName, logout } = useSessionStore()

  // Local query, scoped to this page — no shared hook file touched.
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: getUsers })

  // Approximate "current user" lookup: session store only persists the name,
  // not a user id, so match by nama against the seeded/mock user list.
  const currentUser = users?.find((u) => u.nama === currentUserName)

  const role = currentRole ?? 'kasir'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold tracking-tight text-foreground">Profil</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Informasi akun dan pengaturan aplikasi.
      </p>

      {/* Account card */}
      <Card className="mt-6">
        <CardContent className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
            <UserCircle size={22} weight="bold" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {currentUserName ?? 'Pengguna'}
            </p>
            <p className="text-xs text-muted-foreground">
              {roleLabel[role]}
              {currentUser?.username ? ` · @${currentUser.username}` : ''}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* User management — Owner only, per PRD §3 access matrix */}
      {currentRole === 'owner' && (
        <div className="mt-6">
          <div className="flex items-center gap-2">
            <UsersThree size={18} weight="bold" className="text-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Kelola Pengguna</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Daftar seluruh pengguna beserta peran dan status akun.
          </p>
          <div className="mt-3">
            <ProfilUserList currentUserName={currentUserName} />
          </div>
        </div>
      )}

      {/* Info footnote for non-owner roles, kept brief per MVP scope */}
      {currentRole !== 'owner' && (
        <div className="mt-6 flex items-start gap-2 rounded-xl border border-border bg-secondary/40 p-3">
          <Info size={16} weight="bold" className="mt-0.5 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Pengelolaan pengguna hanya dapat diakses oleh Owner / Admin.
          </p>
        </div>
      )}

      {/* Logout */}
      <div className="mt-8">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleLogout}
        >
          <SignOut size={18} weight="bold" data-icon="inline-start" />
          Keluar
        </Button>
      </div>
    </div>
  )
}
