'use client'

import { useEffect, useState } from 'react'

interface Props {
  name: string
  phone?: string | null
  size?: number        // px — used for both width/height
  className?: string
}

/** Color palette for letter avatars — deterministic based on name */
const COLORS = [
  'from-blue-500   to-cyan-400',
  'from-violet-500 to-purple-400',
  'from-emerald-500 to-teal-400',
  'from-orange-500 to-amber-400',
  'from-rose-500   to-pink-400',
  'from-indigo-500 to-blue-400',
  'from-cyan-500   to-sky-400',
  'from-fuchsia-500 to-violet-400',
]

function colorFor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}

function initials(name: string) {
  return name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// In-memory cache so the same phone isn't fetched multiple times per session
const avatarCache = new Map<string, string | null>()

export function ContactAvatar({ name, phone, size = 36, className = '' }: Props) {
  const [imgUrl, setImgUrl] = useState<string | null>(() =>
    phone ? (avatarCache.get(phone) ?? null) : null
  )
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    if (!phone) return
    // Already cached (including null = "no picture")
    if (avatarCache.has(phone)) {
      setImgUrl(avatarCache.get(phone) ?? null)
      return
    }

    let cancelled = false
    fetch(`/api/whatsapp/avatar?phone=${encodeURIComponent(phone)}`)
      .then(r => r.ok ? r.json() : { url: null })
      .then(({ url }: { url: string | null }) => {
        if (cancelled) return
        avatarCache.set(phone, url)
        setImgUrl(url)
      })
      .catch(() => {
        if (!cancelled) avatarCache.set(phone, null)
      })

    return () => { cancelled = true }
  }, [phone])

  const showPhoto = imgUrl && !imgFailed

  return (
    <div
      className={`shrink-0 rounded-full overflow-hidden flex items-center justify-center ${
        showPhoto ? '' : `bg-gradient-to-br ${colorFor(name)}`
      } ${className}`}
      style={{ width: size, height: size }}
    >
      {showPhoto ? (
        <img
          src={imgUrl}
          alt={name}
          width={size}
          height={size}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span
          className="font-bold text-white select-none leading-none"
          style={{ fontSize: size * 0.36 }}
        >
          {initials(name)}
        </span>
      )}
    </div>
  )
}
