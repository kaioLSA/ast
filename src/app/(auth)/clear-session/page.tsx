'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ClearSessionPage() {
  const router = useRouter()

  useEffect(() => {
    // Clear all localStorage
    localStorage.clear()
    sessionStorage.clear()

    // Clear cookies via API then redirect
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      router.replace('/login')
    })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0b0f]">
      <p className="text-slate-400 text-sm">Limpando sessão...</p>
    </div>
  )
}
