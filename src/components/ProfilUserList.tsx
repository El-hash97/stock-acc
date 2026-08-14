import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UserCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getUsers, resetUserPassword } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { ActiveStatus, PublicUser, Role } from '@/types'

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
  const [resetTarget, setResetTarget] = useState<PublicUser | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  function toggleStatus(userId: string, current: ActiveStatus) {
    const next: ActiveStatus = current === 'aktif' ? 'nonaktif' : 'aktif'
    setStatusOverrides((prev) => ({ ...prev, [userId]: next }))
    toast(next === 'aktif' ? 'Pengguna diaktifkan' : 'Pengguna dinonaktifkan', {
      description: 'Perubahan ini hanya berlaku untuk sesi ini (belum tersambung ke backend).',
    })
  }

  function openResetDialog(user: PublicUser) {
    setResetTarget(user)
    setNewPassword('')
  }

  async function handleResetPassword() {
    if (!resetTarget) return
    if (newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter')
      return
    }

    setIsResetting(true)
    try {
      await resetUserPassword(resetTarget.id, newPassword)
      toast.success(`Password ${resetTarget.nama} berhasil direset`)
      setResetTarget(null)
      setNewPassword('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal reset password')
    } finally {
      setIsResetting(false)
    }
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
    <>
    <Card>
      <CardContent className="flex flex-col gap-0">
        {users.map((user, idx) => {
          const effectiveStatus = statusOverrides[user.id] ?? user.status
          const isSelf = user.nama === currentUserName
          return (
            <div key={user.id}>
              {idx > 0 && <Separator />}
              <div className="flex items-center gap-3 py-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
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
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => openResetDialog(user)}
                  >
                    Reset Password
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>

    <Dialog open={resetTarget !== null} onOpenChange={(open) => { if (!open) setResetTarget(null) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Atur password baru untuk {resetTarget?.nama}. User ini perlu login ulang memakai
            password baru.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="new-password"
            className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            Password baru
          </label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setResetTarget(null)}>
            Batal
          </Button>
          <Button type="button" disabled={isResetting} onClick={handleResetPassword}>
            {isResetting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
