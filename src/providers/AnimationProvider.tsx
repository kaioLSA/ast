'use client'

import { useEffect, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function AnimationProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    gsap.defaults({ ease: 'power2.out', duration: 0.3 })
    return () => ScrollTrigger.getAll().forEach((t) => t.kill())
  }, [])

  return <>{children}</>
}
