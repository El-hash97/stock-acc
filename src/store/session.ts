import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '@/types'

interface SessionUser {
  id: string
  nama: string
  role: Role
}

interface SessionState {
  token: string | null
  user: SessionUser | null
  /** Derived from `user` at login-time — kept so existing consumers reading
   *  `currentRole`/`currentUserName` directly don't need to change. */
  currentRole: Role | null
  currentUserName: string | null
  login: (token: string, user: SessionUser) => void
  logout: () => void
}

/** Real auth session: JWT issued by POST /api/auth/login, persisted to
 * localStorage so a page refresh doesn't kick the user back to /login. */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      currentRole: null,
      currentUserName: null,
      login: (token, user) =>
        set({ token, user, currentRole: user.role, currentUserName: user.nama }),
      logout: () => set({ token: null, user: null, currentRole: null, currentUserName: null }),
    }),
    { name: 'acc-konter:session' },
  ),
)
