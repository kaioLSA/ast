'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Full-screen intro splash.
 * Sequence:
 *   0-100ms    → mount
 *   100-700ms  → icon scales in with bounce + glow appears + stars twinkle in
 *   700-1200ms → "StartSette" text slides in from the right
 *   1200-2000ms → hold (subtle float + pulsing glow)
 *   2000-2450ms → everything fades out
 */

type Phase = 'hidden' | 'icon' | 'text' | 'hold' | 'out' | 'done'

interface Props {
  onComplete?: () => void
}

const STARS = [
  { x: 12, y: 18, size: 2,   delay: 100, dur: 2.4 },
  { x: 88, y: 22, size: 1.6, delay: 240, dur: 2.8 },
  { x: 18, y: 78, size: 1.8, delay: 380, dur: 2.2 },
  { x: 82, y: 80, size: 2.4, delay: 60,  dur: 3.0 },
  { x: 8,  y: 48, size: 1.3, delay: 520, dur: 2.6 },
  { x: 92, y: 52, size: 2,   delay: 180, dur: 2.4 },
  { x: 48, y: 12, size: 1.6, delay: 320, dur: 2.6 },
  { x: 52, y: 88, size: 1.9, delay: 440, dur: 2.8 },
  { x: 28, y: 32, size: 1.1, delay: 600, dur: 2.0 },
  { x: 72, y: 68, size: 1.4, delay: 140, dur: 3.2 },
  { x: 34, y: 64, size: 1.2, delay: 280, dur: 2.4 },
  { x: 66, y: 36, size: 1.7, delay: 480, dur: 2.6 },
  { x: 22, y: 88, size: 1.4, delay: 360, dur: 2.2 },
  { x: 78, y: 14, size: 1.2, delay: 540, dur: 2.8 },
]

export function SplashScreen({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('hidden')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const t0 = setTimeout(() => setPhase('icon'), 100)
    const t1 = setTimeout(() => setPhase('text'), 700)
    const t2 = setTimeout(() => setPhase('hold'), 1200)
    const t3 = setTimeout(() => setPhase('out'),  2000)
    const t4 = setTimeout(() => { setPhase('done'); onComplete?.() }, 2450)
    return () => [t0, t1, t2, t3, t4].forEach(clearTimeout)
  }, [onComplete])

  if (!mounted || phase === 'done') return null

  const iconIn  = phase !== 'hidden'
  const textIn  = ['text', 'hold', 'out'].includes(phase)
  const isHold  = phase === 'hold'
  const fadeOut = phase === 'out'

  const ICON = 140

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#0b0b0f',
        opacity: fadeOut ? 0 : 1,
        transition: fadeOut ? 'opacity 430ms ease' : 'none',
        pointerEvents: fadeOut ? 'none' : 'all',
        overflow: 'hidden',
      }}
    >
      {/* Embedded keyframes for looping effects */}
      <style>{`
        @keyframes splash-twinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50%      { opacity: 1;    transform: scale(1.15); }
        }
        @keyframes splash-pulse {
          0%, 100% { opacity: 0.55; transform: translate(-50%,-50%) scale(1); }
          50%      { opacity: 1;    transform: translate(-50%,-50%) scale(1.18); }
        }
        @keyframes splash-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }
        @keyframes splash-shimmer {
          0%   { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(220%)  skewX(-20deg); }
        }
      `}</style>

      {/* Subtle vignette dark edges */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
        opacity: iconIn ? 1 : 0,
        transition: 'opacity 700ms ease',
      }}/>

      {/* Stars scattered across viewport */}
      {STARS.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          left:  `${s.x}%`,
          top:   `${s.y}%`,
          width:  s.size,
          height: s.size,
          borderRadius: '50%',
          backgroundColor: 'white',
          boxShadow: '0 0 6px rgba(255,255,255,0.9), 0 0 12px rgba(0,170,255,0.6)',
          opacity: iconIn ? 1 : 0,
          animation: iconIn
            ? `splash-twinkle ${s.dur}s ease-in-out ${s.delay}ms infinite`
            : 'none',
          transition: `opacity 600ms ease ${s.delay}ms`,
        }}/>
      ))}

      {/* Soft ambient blue glow center */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 50% 30% at 50% 50%, rgba(0,140,255,0.22) 0%, transparent 70%)',
        opacity: iconIn ? 1 : 0,
        transition: 'opacity 800ms ease',
      }}/>

      {/* Center wrapper */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 28,
        position: 'relative',
        zIndex: 2,
        animation: isHold ? 'splash-float 3s ease-in-out infinite' : 'none',
      }}>

        {/* Icon container */}
        <div style={{
          position: 'relative',
          width: ICON,
          height: ICON,
          flexShrink: 0,
        }}>
          {/* Pulsing aura halo behind icon */}
          <div style={{
            position: 'absolute',
            left: '50%', top: '50%',
            width: ICON * 1.55,
            height: ICON * 1.55,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,180,255,0.45) 0%, rgba(0,120,220,0.15) 40%, transparent 70%)',
            filter: 'blur(18px)',
            opacity: iconIn ? 1 : 0,
            transition: 'opacity 700ms ease 150ms',
            animation: iconIn ? 'splash-pulse 2.8s ease-in-out infinite' : 'none',
            transform: 'translate(-50%,-50%)',
            pointerEvents: 'none',
          }}/>

          {/* Secondary outer ring glow */}
          <div style={{
            position: 'absolute',
            left: '50%', top: '50%',
            width: ICON * 1.1,
            height: ICON * 1.1,
            borderRadius: '50%',
            border: '1px solid rgba(0,180,255,0.25)',
            opacity: iconIn ? 1 : 0,
            transform: iconIn
              ? 'translate(-50%,-50%) scale(1)'
              : 'translate(-50%,-50%) scale(0.6)',
            transition: 'opacity 600ms ease 300ms, transform 800ms cubic-bezier(0.34,1.56,0.64,1) 300ms',
            pointerEvents: 'none',
          }}/>

          {/* The actual PNG icon */}
          <img
            src="/st.png"
            alt="StartSette"
            draggable={false}
            style={{
              width: ICON,
              height: ICON,
              objectFit: 'contain',
              position: 'relative',
              zIndex: 2,
              opacity: iconIn ? 1 : 0,
              transform: iconIn
                ? 'scale(1) rotate(0deg)'
                : 'scale(0.35) rotate(-12deg)',
              transition: iconIn
                ? 'opacity 480ms ease, transform 720ms cubic-bezier(0.34, 1.56, 0.64, 1)'
                : 'none',
              filter: iconIn
                ? 'drop-shadow(0 6px 24px rgba(0,150,255,0.55)) drop-shadow(0 0 8px rgba(0,180,255,0.4))'
                : 'none',
              userSelect: 'none',
            }}
          />

          {/* Shimmer sweep overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            borderRadius: 20,
            pointerEvents: 'none',
            zIndex: 3,
            opacity: iconIn ? 1 : 0,
            transition: 'opacity 200ms ease 500ms',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '60%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
              animation: iconIn ? 'splash-shimmer 1.6s ease-out 600ms 1' : 'none',
              opacity: 0,
              animationFillMode: 'forwards',
            }}/>
          </div>
        </div>

        {/* Text */}
        <div style={{
          opacity: textIn ? 1 : 0,
          transform: textIn ? 'translateX(0)' : 'translateX(36px)',
          transition: textIn
            ? 'opacity 450ms cubic-bezier(0.22,1,0.36,1), transform 500ms cubic-bezier(0.22,1,0.36,1)'
            : 'none',
          whiteSpace: 'nowrap',
          position: 'relative',
          zIndex: 2,
        }}>
          <span style={{
            fontSize: 60,
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-0.025em',
            lineHeight: 1,
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            textShadow: '0 0 24px rgba(0,170,255,0.45), 0 2px 8px rgba(0,0,0,0.4)',
          }}>
            StartSette
          </span>
          {/* Small subtitle that fades in slightly later */}
          <div style={{
            fontSize: 13,
            color: 'rgba(180,210,255,0.7)',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            marginTop: 8,
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            opacity: isHold || fadeOut ? 1 : 0,
            transform: isHold || fadeOut ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 500ms ease, transform 500ms ease',
          }}>
            crm intelligence
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
