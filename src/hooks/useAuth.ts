import { useAuthStore } from '@/store/auth.store'
import { useAuthContext } from '@/context/auth.context'
import type { Permission } from '@/types/auth.types'
import { hasPermission, hasAnyPermission } from '@/lib/permissions'

export function useAuth() {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const { login, logout, isLoggingIn, loginError } = useAuthContext()

  function can(permission: Permission): boolean {
    if (!user) return false
    return hasPermission(user.permissions, permission)
  }

  function canAny(permissions: Permission[]): boolean {
    if (!user) return false
    return hasAnyPermission(user.permissions, permissions)
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    isLoggingIn,
    loginError,
    can,
    canAny,
  }
}
