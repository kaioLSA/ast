'use client'

import { useRef, useEffect, type ReactNode } from 'react'
import { gsap } from 'gsap'
import { cn } from '@/lib/utils/cn'

interface FadeInProps {
  children: ReactNode
  delay?: number
  duration?: number
  y?: number
  className?: string
}

export function FadeIn({ children, delay = 0, duration = 0.4, y = 16, className }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(
      ref.current,
      { opacity: 0, y },
      { opacity: 1, y: 0, duration, delay, ease: 'power2.out' },
    )
  }, [delay, duration, y])

  return (
    <div ref={ref} className={cn('opacity-0', className)}>
      {children}
    </div>
  )
}
