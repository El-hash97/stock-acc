import type { ReactNode } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import AppShell from '@/components/AppShell'
import Login from '@/pages/Login'
import Beranda from '@/pages/Beranda'
import Jual from '@/pages/Jual'
import Stok from '@/pages/Stok'
import Laporan from '@/pages/Laporan'
import Profil from '@/pages/Profil'
import { useSessionStore } from '@/store/session'
import type { Role } from '@/types'

/** Layout route: any route nested under this requires a logged-in session. */
function RequireAuth() {
  const currentRole = useSessionStore((s) => s.currentRole)
  if (!currentRole) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

/** Enforces the PRD §6 tab/role visibility table at the route level too. */
function RequireRole({ allowed, children }: { allowed: Role[]; children: ReactNode }) {
  const currentRole = useSessionStore((s) => s.currentRole)
  if (!currentRole || !allowed.includes(currentRole)) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Beranda />} />
            <Route
              path="/jual"
              element={
                <RequireRole allowed={['owner', 'kasir']}>
                  <Jual />
                </RequireRole>
              }
            />
            <Route
              path="/stok"
              element={
                <RequireRole allowed={['owner', 'staff_gudang']}>
                  <Stok />
                </RequireRole>
              }
            />
            <Route
              path="/laporan"
              element={
                <RequireRole allowed={['owner', 'kasir']}>
                  <Laporan />
                </RequireRole>
              }
            />
            <Route path="/profil" element={<Profil />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-center" />
    </>
  )
}
