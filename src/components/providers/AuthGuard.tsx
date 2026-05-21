'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // On every page load/refresh, if there's no auth in memory → clear cookie and force login
    if (!isAuthenticated) {
      fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
        router.replace('/login')
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isAuthenticated) return null

  return <>{children}</>
}
