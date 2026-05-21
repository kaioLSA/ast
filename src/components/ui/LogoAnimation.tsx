'use client'

import { useEffect, useState } from 'react'

interface Props {
  onComplete?: () => void
  size?: number
}

export function LogoAnimation({ onComplete, size = 52 }: Props) {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0)

  useEffect(() => {
    // phase 1 → play button appears
    const t1 = setTimeout(() => setPhase(1), 80)
    // phase 2 → rocket launches in
    const t2 = setTimeout(() => setPhase(2), 480)
    // phase 3 → text slides in
    const t3 = setTimeout(() => setPhase(3), 820)
    // done
    const t4 = setTimeout(() => onComplete?.(), 1300)
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [onComplete])

  const textReady  = phase >= 3
  const rocketReady = phase >= 2
  const playReady   = phase >= 1

  return (
    <div className="flex items-center gap-3 select-none">
      {/* ── Icon SVG ── */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Main gradient — dark navy → bright blue */}
          <linearGradient id="lg-play" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#0d3d72" />
            <stop offset="100%" stopColor="#0090ff" />
          </linearGradient>

          {/* Trail gradient */}
          <linearGradient id="lg-trail" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
            <stop offset="0%"   stopColor="#00c8ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00aaff" stopOpacity="0.4" />
          </linearGradient>

          {/* Clip so rocket+trail stay inside play button */}
          <clipPath id="clip-play">
            <path d="M9 3.5 C5 3.5 2 6.5 2 10.5 L2 45.5 C2 49.5 5 52.5 9 52.5 C11.5 52.5 13.5 51.5 15.5 50 L50 30.5 C53.5 28.5 53.5 27.5 50 25.5 L15.5 6 C13.5 4.5 11.5 3.5 9 3.5 Z" />
          </clipPath>
        </defs>

        {/* ──── PLAY BUTTON ──── */}
        <g
          style={{
            opacity:   playReady ? 1 : 0,
            transform: playReady ? 'scale(1)' : 'scale(0.4)',
            transformOrigin: '28px 28px',
            transition: playReady
              ? 'opacity 320ms cubic-bezier(0.22,1,0.36,1), transform 420ms cubic-bezier(0.22,1,0.36,1)'
              : 'none',
          }}
        >
          <path
            d="M9 3.5 C5 3.5 2 6.5 2 10.5 L2 45.5 C2 49.5 5 52.5 9 52.5 C11.5 52.5 13.5 51.5 15.5 50 L50 30.5 C53.5 28.5 53.5 27.5 50 25.5 L15.5 6 C13.5 4.5 11.5 3.5 9 3.5 Z"
            fill="url(#lg-play)"
          />
        </g>

        {/* ──── ROCKET + TRAIL (clips inside play button) ──── */}
        <g clipPath="url(#clip-play)">
          {/* Trail — cyan streak */}
          <g
            style={{
              opacity:   rocketReady ? 1 : 0,
              transform: rocketReady ? 'translate(0px, 0px)' : 'translate(-18px, 18px)',
              transition: rocketReady
                ? 'opacity 300ms ease, transform 380ms cubic-bezier(0.22,1,0.36,1)'
                : 'none',
            }}
          >
            <ellipse
              cx="20" cy="43"
              rx="16" ry="6"
              fill="url(#lg-trail)"
              transform="rotate(-45 20 43)"
            />
          </g>

          {/* Rocket (white, 45° diagonal pointing upper-right) */}
          <g
            style={{
              opacity:   rocketReady ? 1 : 0,
              transform: rocketReady ? 'translate(0px, 0px)' : 'translate(-22px, 22px)',
              transition: rocketReady
                ? 'opacity 280ms ease 40ms, transform 400ms cubic-bezier(0.22,1,0.36,1) 40ms'
                : 'none',
            }}
          >
            <g transform="translate(26,26) rotate(-45)">
              {/* Body */}
              <path
                d="M0,-13 C5.5,-13 9,-7 9,0 C9,7 5.5,13 0,13 C-5.5,13 -9,7 -9,0 C-9,-7 -5.5,-13 0,-13 Z"
                fill="white"
              />
              {/* Nose cone */}
              <path d="M-4.5,-11 L0,-20 L4.5,-11 Z" fill="white" />
              {/* Left fin */}
              <path d="M-9,7 L-16,18 L-4,13 Z" fill="white" />
              {/* Right fin */}
              <path d="M9,7 L16,18 L4,13 Z" fill="white" />
              {/* Window */}
              <circle cx="0" cy="-3" r="3.5" fill="#00aaff" />
            </g>
          </g>
        </g>
      </svg>

      {/* ──── TEXT ──── */}
      <div
        style={{
          opacity:   textReady ? 1 : 0,
          transform: textReady ? 'translateX(0px)' : 'translateX(20px)',
          transition: textReady
            ? 'opacity 380ms cubic-bezier(0.22,1,0.36,1), transform 420ms cubic-bezier(0.22,1,0.36,1)'
            : 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            fontSize: size * 0.56,
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            fontFamily: 'var(--font-inter), Inter, sans-serif',
          }}
        >
          Start<span style={{ color: '#38bdf8' }}>Sette</span>
        </span>
      </div>
    </div>
  )
}
