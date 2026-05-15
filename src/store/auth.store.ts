import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, AuthSession } from '@/types/auth.types'
import { STORAGE_KEYS } from '@/lib/constants/app'
import { setLocalStorage, clearAuthStorage } from '@/lib/helpers/storage'

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

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      setSession: (session) => {
        setLocalStorage(STORAGE_KEYS.AUTH_TOKEN, session.accessToken)
        setLocalStorage(STORAGE_KEYS.REFRESH_TOKEN, session.refreshToken)
        set({ session, user: session.user, isAuthenticated: true, error: null })
      },
      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      logout: () => {
        clearAuthStorage()
        set({ user: null, session: null, isAuthenticated: false })
      },
    }),
    {
      name: 'startsette-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
)
