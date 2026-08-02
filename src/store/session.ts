import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '@/types'

interface SessionState {
  currentRole: Role | null
  currentUserName: string | null
  login: (role: Role, name: string) => void
  logout: () => void
}

/**
 * Dev-only stand-in for real auth. Persists the "logged in" role/name to
 * localStorage so a page refresh doesn't kick the user back to /login —
 * this will be swapped out for real Supabase Auth later.
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      currentRole: null,
      currentUserName: null,
      login: (role, name) => set({ currentRole: role, currentUserName: name }),
      logout: () => set({ currentRole: null, currentUserName: null }),
    }),
    { name: 'acc-konter:session' },
  ),
)
