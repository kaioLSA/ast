'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/store/auth.store'
import type { User } from '@/types/auth.types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore()

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
