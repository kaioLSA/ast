'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useWhatsAppStore } from '@/store/whatsapp.store'

type Chat = {
  id: string
  name: string
  lastMsg: string
  timestamp: number
  unread: number
  isGroup: boolean
}

// ── Favicon dot ──────────────────────────────────────────────────────────────

let originalFavicon = ''

function setFaviconDot(hasDot: boolean) {
  if (typeof document === 'undefined') return

  let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }

  if (!hasDot) {
    if (originalFavicon) link.href = originalFavicon
    return
  }

  if (!originalFavicon) originalFavicon = link.href || '/favicon.ico'

  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const img = new Image()
  img.crossOrigin = 'anonymous'

  const drawDot = () => {
    // Green dot — top-right corner
    ctx.beginPath()
    ctx.arc(26, 6, 7, 0, 2 * Math.PI)
    ctx.fillStyle = '#22c55e'
    ctx.fill()
    ctx.strokeStyle = '#04070f'
    ctx.lineWidth = 2
    ctx.stroke()
    link!.href = canvas.toDataURL('image/png')
  }

  img.onload = () => {
    ctx.drawImage(img, 0, 0, 32, 32)
    drawDot()
  }
  img.onerror = drawDot // if favicon fails to load, just draw the dot anyway

  img.src = originalFavicon
}

// ── Browser notification ──────────────────────────────────────────────────────

function notify(senderName: string) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return

  new Notification('💬 Nova mensagem no WhatsApp', {
    body: senderName,
    icon: '/st.png',
    tag: `wa-${senderName}`, // deduplicate per sender
    silent: false,
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WhatsAppNotifier() {
  const { setTotalUnread } = useWhatsAppStore()
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  const prevTimestamps = useRef<Record<string, number>>({})
  const initialized = useRef(false)

  // Keep pathnameRef current without restarting the effect
  useEffect(() => { pathnameRef.current = pathname }, [pathname])

  // Request notification permission once on mount
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Poll chats every 15 s
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/whatsapp/chats')
        if (!res.ok) return
        const chats: Chat[] = await res.json()
        if (!Array.isArray(chats)) return

        // Update global unread badge in sidebar
        const total = chats.reduce((s, c) => s + (c.unread || 0), 0)
        setTotalUnread(total)
        setFaviconDot(total > 0)

        const onWAPage = pathnameRef.current.startsWith('/whatsapp')

        if (initialized.current) {
          for (const chat of chats) {
            const prev = prevTimestamps.current[chat.id]
            // Timestamp increased = new message arrived
            if (prev !== undefined && chat.timestamp > prev && !onWAPage) {
              notify(chat.name)
            }
            prevTimestamps.current[chat.id] = chat.timestamp
          }
        } else {
          // First load — snapshot timestamps without notifying
          for (const chat of chats) {
            prevTimestamps.current[chat.id] = chat.timestamp
          }
          initialized.current = true
        }
      } catch {
        // ignore polling errors silently
      }
    }

    poll()
    const id = setInterval(poll, 15_000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTotalUnread])

  return null // purely side-effect component
}
