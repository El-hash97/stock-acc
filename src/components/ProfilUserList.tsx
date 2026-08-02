import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UserCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getUsers } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { ActiveStatus, Role } from '@/types'

const roleLabel: Record<Role, string> = {
  owner: 'Owner / Admin',
  kasir: 'Kasir',
  staff_gudang: 'Staff Gudang',
}

const statusBadgeClass: Record<ActiveStatus, string> = {
  aktif: 'bg-status-aman-bg text-status-aman-fg',
  nonaktif: 'bg-secondary text-muted-foreground',
}

const statusLabel: Record<ActiveStatus, string> = {
  aktif: 'Aktif',
  nonaktif: 'Nonaktif',
}

interface ProfilUserListProps {
  /** Name of the currently logged-in user, used to flag "this is you". */
  currentUserName: string | null
}

/**
 * Owner-only user list for the Profil screen.
 *
 * There is no `updateUser` mutation in `@/lib/api` yet, and this component
 * is intentionally not allowed to add one. So the aktif/nonaktif toggle here
 * is implemented as local-only component state (an override map keyed by
 * user id) — it flips the badge for the rest of this session but is never
 * persisted to the mock store, and a toast makes that limitation explicit
 * each time a status is changed.
 */
export default function ProfilUserList({ currentUserName }: ProfilUserListProps) {
  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers })
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ActiveStatus>>({})

  function toggleStatus(userId: string, current: ActiveStatus) {
    const next: ActiveStatus = current === 'aktif' ? 'nonaktif' : 'aktif'
    setStatusOverrides((prev) => ({ ...prev, [userId]: next }))
    toast(next === 'aktif' ? 'Pengguna diaktifkan' : 'Pengguna dinonaktifkan', {
      description: 'Perubahan ini hanya berlaku untuk sesi ini (belum tersambung ke backend).',
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Memuat pengguna…
        </CardContent>
      </Card>
    )
  }

  if (!users || users.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Belum ada pengguna.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-0">
        {users.map((user, idx) => {
          const effectiveStatus = statusOverrides[user.id] ?? user.status
          const isSelf = user.nama === currentUserName
          return (
            <div key={user.id}>
              {idx > 0 && <Separator />}
              <div className="flex items-center gap-3 py-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-secondary text-primary">
                  <UserCircle size={18} weight="bold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium text-foreground">{user.nama}</p>
                    {isSelf && (
                      <span className="shrink-0 text-xs text-muted-foreground">(Anda)</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    @{user.username} · {roleLabel[user.role]}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Badge className={cn('border-0', statusBadgeClass[effectiveStatus])}>
                    {statusLabel[effectiveStatus]}
                  </Badge>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    disabled={isSelf}
                    onClick={() => toggleStatus(user.id, effectiveStatus)}
                  >
                    {effectiveStatus === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
