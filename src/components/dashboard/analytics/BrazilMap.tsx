'use client'

import { useState } from 'react'
import { STATE_PATHS, BRAZIL_VIEWBOX } from './brazil-state-paths'

export type StateCount = Record<string, number>

interface Props {
  counts: StateCount
  maxCount?: number
}

export function BrazilMap({ counts, maxCount }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  const max = maxCount ?? Math.max(...Object.values(counts), 1)

  return (
    <div className="relative w-full mx-auto" style={{ maxWidth: 260 }}>
      <svg
        viewBox={BRAZIL_VIEWBOX}
        className="w-full h-auto"
        style={{ display: 'block' }}
      >
        {Object.entries(STATE_PATHS).map(([id, s]) => {
          const count = counts[id] ?? 0
          const isHovered = hovered === id
          const hasData = count > 0
          const intensity = max > 0 ? count / max : 0

          // Light violet → dark violet based on intensity
          // No data: subtle slate gray
          let fill: string
          if (hasData) {
            // Interpolate between light and dark purple
            const opacity = 0.25 + intensity * 0.70
            fill = `rgba(59, 130, 246, ${opacity})`
          } else {
            fill = 'rgba(148, 163, 184, 0.10)'
          }

          return (
            <path
              key={id}
              d={s.path}
              fill={fill}
              stroke={isHovered ? 'rgba(96, 165, 250, 0.8)' : 'rgba(255, 255, 255, 0.08)'}
              strokeWidth={isHovered ? 1.2 : 0.5}
              style={{
                cursor: 'pointer',
                transition: 'fill 0.15s ease, stroke 0.15s ease',
              }}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
            />
          )
        })}
      </svg>

      {hovered && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-[#1c1c24] border border-white/10 rounded-lg px-3 py-1.5 text-xs pointer-events-none shadow-xl whitespace-nowrap z-10">
          <span className="text-slate-400">{STATE_PATHS[hovered]?.name}: </span>
          <span className="text-white font-semibold">{counts[hovered] ?? 0} leads</span>
        </div>
      )}
    </div>
  )
}

export const BRAZIL_STATES = Object.entries(STATE_PATHS).map(([id, v]) => ({ id, name: v.name }))
