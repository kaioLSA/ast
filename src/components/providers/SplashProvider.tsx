'use client'

import { useState } from 'react'
import { SplashScreen } from '@/components/ui/SplashScreen'

export function SplashProvider({ children }: { children: React.ReactNode }) {
  const [done, setDone] = useState(false)

  return (
    <>
      {!done && <SplashScreen onComplete={() => setDone(true)} />}
      <div style={{
        opacity: done ? 1 : 0,
        transition: done ? 'opacity 350ms ease' : 'none',
      }}>
        {children}
      </div>
    </>
  )
}
