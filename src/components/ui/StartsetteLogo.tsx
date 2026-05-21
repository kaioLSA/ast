// Faithful SVG recreation of the StartSette logo (traced from startsette.png)
// Play button shape + rocket cutout + trail swoosh + optional text

interface Props {
  showText?: boolean
  size?: number
  className?: string
}

export function StartsetteLogo({ showText = true, size = 48, className = '' }: Props) {
  const iconH = size
  const textSize = size * 0.50

  return (
    <div className={`flex items-center ${className}`} style={{ gap: Math.round(size * 0.22) }}>
      {/* ── Icon ── */}
      <svg width={iconH} height={iconH} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Play button gradient: dark navy top-left → bright cyan bottom-right */}
          <linearGradient id="ss-play" x1="10" y1="10" x2="92" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#0a3a7a" />
            <stop offset="45%"  stopColor="#0072d6" />
            <stop offset="100%" stopColor="#2cb8ff" />
          </linearGradient>
          {/* Trail gradient: bright cyan fading */}
          <linearGradient id="ss-trail" x1="20" y1="55" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#00b8ff" />
            <stop offset="100%" stopColor="#2cb8ff" stopOpacity="0.55" />
          </linearGradient>
          {/* Clip everything inside the play button shape */}
          <clipPath id="ss-clip">
            <path d="M14 4 C7 4,3 8,3 16 L3 84 C3 92,7 96,14 96 C18 96,22 94,26 91 L93 54 C97 51,97 49,93 46 L26 9 C22 6,18 4,14 4 Z" />
          </clipPath>
        </defs>

        {/* Play button — rounded triangle pointing right */}
        <path
          d="M14 4 C7 4,3 8,3 16 L3 84 C3 92,7 96,14 96 C18 96,22 94,26 91 L93 54 C97 51,97 49,93 46 L26 9 C22 6,18 4,14 4 Z"
          fill="url(#ss-play)"
        />

        {/* Trail + rocket clipped inside play button */}
        <g clipPath="url(#ss-clip)">
          {/* Trail — cyan exhaust swoosh from rocket's tail curving down-right */}
          <path
            d="M 22 56
               C 32 60, 48 64, 62 72
               C 74 78, 86 82, 92 82
               L 92 60
               C 82 56, 64 52, 48 50
               C 34 49, 24 51, 22 56 Z"
            fill="url(#ss-trail)"
          />

          {/* Rocket — pointing upper-LEFT (-50°) */}
          <g transform="translate(45, 45) rotate(-50)">
            {/* Left fin (back) */}
            <path d="M -7,12 L -16,22 L -3,17 Z" fill="white" />
            {/* Right fin (back) */}
            <path d="M 7,12 L 16,22 L 3,17 Z" fill="white" />

            {/* Body — bullet shape, pointed at top */}
            <path
              d="M 0,-26
                 C 5,-26 8,-20 8,-12
                 L 8,13
                 L -8,13
                 L -8,-12
                 C -8,-20 -5,-26 0,-26 Z"
              fill="white"
            />

            {/* Window / porthole */}
            <circle cx="0" cy="-7" r="4.2" fill="#0099e8" />
            <circle cx="-1.2" cy="-8.5" r="1.1" fill="#7fd6ff" opacity="0.85" />
          </g>
        </g>
      </svg>

      {/* ── Text ── */}
      {showText && (
        <span
          style={{
            fontSize: textSize,
            fontWeight: 700,
            color: 'white',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          StartSette
        </span>
      )}
    </div>
  )
}
