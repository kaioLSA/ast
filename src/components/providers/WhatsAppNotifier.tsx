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
  lastFromMe: boolean
}

// ── Favicon dot ───────────────────────────────────────────────────────────────

let _originalHref = ''

function setFaviconDot(hasDot: boolean) {
  if (typeof document === 'undefined') return

  let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }

  if (!hasDot) {
    if (_originalHref) link.href = _originalHref
    return
  }

  if (!_originalHref) _originalHref = link.href || '/favicon.ico'

  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const drawDot = () => {
    ctx.beginPath()
    ctx.arc(26, 6, 7, 0, 2 * Math.PI)
    ctx.fillStyle = '#22c55e'
    ctx.fill()
    ctx.strokeStyle = '#04070f'
    ctx.lineWidth = 2
    ctx.stroke()
    link!.href = canvas.toDataURL('image/png')
  }

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => { ctx.drawImage(img, 0, 0, 32, 32); drawDot() }
  img.onerror = drawDot
  img.src = _originalHref
}

// ── Browser popup notification ────────────────────────────────────────────────

function fireNotification(senderName: string) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  new Notification('💬 Nova mensagem no WhatsApp', {
    body: senderName,
    icon: '/st.png',
    tag: `wa-${senderName}`,
    silent: false,
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WhatsAppNotifier() {
  const { setTotalUnread, pendingCount, incrementPending, clearPending } = useWhatsAppStore()
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  const prevTimestamps = useRef<Record<string, number>>({})
  const initialized = useRef(false)

  // Keep pathname ref fresh without restarting the poll interval
  useEffect(() => { pathnameRef.current = pathname }, [pathname])

  // Clear pending badge when user is on the WhatsApp page
  useEffect(() => {
    if (pathname.startsWith('/whatsapp')) {
      clearPending()
      setFaviconDot(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Update favicon whenever pendingCount changes
  useEffect(() => {
    setFaviconDot(pendingCount > 0)
  }, [pendingCount])

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

        // Keep total unread from API (may be 0 if Evolution doesn't support it)
        const total = chats.reduce((s, c) => s + (c.unread || 0), 0)
        setTotalUnread(total)

        const onWAPage = pathnameRef.current.startsWith('/whatsapp')

        if (initialized.current) {
          for (const chat of chats) {
            const prev = prevTimestamps.current[chat.id]
            const isNewer = prev !== undefined && chat.timestamp > prev
            // Only count as new if the last message came FROM the other person
            const isIncoming = !chat.lastFromMe

            if (isNewer && isIncoming) {
              incrementPending()
              // Popup notification only when NOT on the WhatsApp page
              if (!onWAPage) {
                fireNotification(chat.name)
              }
            }
            prevTimestamps.current[chat.id] = chat.timestamp
          }
        } else {
          // First load — snapshot without notifying
          for (const chat of chats) {
            prevTimestamps.current[chat.id] = chat.timestamp
          }
          initialized.current = true
        }
      } catch {
        // ignore silently
      }
    }

    poll()
    const id = setInterval(poll, 15_000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTotalUnread, incrementPending])

  return null
}
