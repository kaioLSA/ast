'use client'

import { useRef, type ReactNode, type MouseEvent } from 'react'
import { cn } from '@/lib/utils/cn'

interface GlowCardProps {
  children: ReactNode
  className?: string
  glowColor?: string
}

export function GlowCard({ children, className, glowColor = 'rgba(59,130,246,0.15)' }: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    ref.current.style.background = `radial-gradient(300px circle at ${x}px ${y}px, ${glowColor}, transparent 70%)`
  }

  function handleMouseLeave() {
    if (!ref.current) return
    ref.current.style.background = 'transparent'
  }

  return (
    <div className={cn('relative rounded-xl border border-border overflow-hidden group', className)}>
      <div
        ref={ref}
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
