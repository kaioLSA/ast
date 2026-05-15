import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { animationConfig } from '@/config/animations'

export function useFadeIn(delay = 0) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: animationConfig.durations.normal, delay, ease: 'power2.out' },
    )
  }, [delay])

  return ref
}

export function useStaggerIn(selector: string, stagger = 0.07) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    gsap.fromTo(
      containerRef.current.querySelectorAll(selector),
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, stagger, duration: 0.3, ease: 'power2.out' },
    )
  }, [selector, stagger])

  return containerRef
}

export function useGlowPulse() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!ref.current) return
    gsap.to(ref.current, {
      boxShadow: '0 0 24px rgba(59,130,246,0.8)',
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    })
    return () => gsap.killTweensOf(ref.current)
  }, [])

  return ref
}
