import { create } from 'zustand'
import type { User, AuthSession } from '@/types/auth.types'
import { clearAuthStorage } from '@/lib/helpers/storage'

interface AuthStore {
  user: User | null
  session: AuthSession | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  setSession: (session: AuthSession) => void
  setUser: (user: User) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  setSession: (session) => {
    set({ session, user: session.user, isAuthenticated: true, error: null })
  },
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  logout: () => {
    clearAuthStorage()
    set({ user: null, session: null, isAuthenticated: false })
  },
}))
