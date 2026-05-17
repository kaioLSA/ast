'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { routes } from '@/config/routes'
import type { LoginCredentials } from '@/types/auth.types'

interface AuthContextValue {
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  changePassword: (newPassword: string) => Promise<void>
  isLoggingIn: boolean
  loginError: string | null
  requiresPasswordChange: boolean
  changePasswordError: string | null
  isChangingPassword: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { setSession, logout: storeLogout } = useAuthStore()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Password change step
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false)
  const [changeToken, setChangeToken] = useState<string | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null)

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

      // ── Must change password first ───────────────────────────────────────
      if (json.requiresPasswordChange) {
        setChangeToken(json.changeToken)
        setRequiresPasswordChange(true)
        return
      }

      // ── Normal login ─────────────────────────────────────────────────────
      setSession(json.data)
      router.push(routes.dashboard)
    } catch {
      setLoginError('Erro de conexão. Tente novamente.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const changePassword = async (newPassword: string) => {
    if (!changeToken) return
    setIsChangingPassword(true)
    setChangePasswordError(null)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changeToken, newPassword }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setChangePasswordError(json.message ?? 'Erro ao alterar senha')
        return
      }
      // Password changed — now log in normally
      setRequiresPasswordChange(false)
      setChangeToken(null)
      setSession(json.data)
      router.push(routes.dashboard)
    } catch {
      setChangePasswordError('Erro de conexão. Tente novamente.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    storeLogout()
    setRequiresPasswordChange(false)
    setChangeToken(null)
    router.push(routes.auth.login)
  }

  return (
    <AuthContext.Provider value={{
      login,
      logout,
      changePassword,
      isLoggingIn,
      loginError,
      requiresPasswordChange,
      changePasswordError,
      isChangingPassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside AuthContextProvider')
  return ctx
}
