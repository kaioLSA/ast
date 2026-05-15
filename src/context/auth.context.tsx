'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { routes } from '@/config/routes'
import type { LoginCredentials } from '@/types/auth.types'

interface AuthContextValue {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  isLoggingIn: boolean
  loginError: string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { setSession, logout: storeLogout } = useAuthStore()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  const login = async (credentials: LoginCredentials) => {
    setIsLoggingIn(true)
    setLoginError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setLoginError(json.message ?? 'Email ou senha incorretos')
        return
      }
      setSession(json.data)
      router.push(routes.dashboard)
    } catch {
      setLoginError('Erro de conexão. Tente novamente.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    storeLogout()
    router.push(routes.auth.login)
  }

  return (
    <AuthContext.Provider value={{ login, logout, isLoggingIn, loginError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthContextProvider')
  return ctx
}
