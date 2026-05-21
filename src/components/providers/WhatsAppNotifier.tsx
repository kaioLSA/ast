'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useWhatsAppStore } from '@/store/whatsapp.store'
import { useNotificationsStore } from '@/store/notifications.store'

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
    ctx.strokeStyle = '#0b0b0f'
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

function fireBrowserNotification(senderName: string) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  new Notification('💬 WhatsApp — Nova mensagem', {
    body: senderName,
    icon: '/st.png',
    tag: `wa-${senderName}`,
    silent: false,
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WhatsAppNotifier() {
  const {
    setTotalUnread,
    pendingCount,
    incrementPending,
    clearPending,
    incrementChatUnread,
  } = useWhatsAppStore()

  const { addNotification } = useNotificationsStore()

  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  // Track which chatId is currently open (passed via URL hash or store — we use a simple ref)
  const selectedChatRef = useRef<string | null>(null)

  const prevTimestamps = useRef<Record<string, number>>({})
  const initialized = useRef(false)

  // Keep pathname ref fresh
  useEffect(() => { pathnameRef.current = pathname }, [pathname])

  // Clear pending badge & favicon when user enters WhatsApp page
  useEffect(() => {
    if (pathname.startsWith('/whatsapp')) {
      clearPending()
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

  // Expose setter so WhatsApp page can tell us the selected chat
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).__waSetSelectedChat = (id: string | null) => {
      selectedChatRef.current = id
    }
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).__waSetSelectedChat
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

        const total = chats.reduce((s, c) => s + (c.unread || 0), 0)
        setTotalUnread(total)

        if (initialized.current) {
          for (const chat of chats) {
            const prev = prevTimestamps.current[chat.id]
            const isNewer = prev !== undefined && chat.timestamp > prev
            const isIncoming = !chat.lastFromMe
            const isActiveChat = selectedChatRef.current === chat.id

            if (isNewer && isIncoming) {
              // Always increment sidebar badge and per-chat unread
              incrementPending()
              if (!isActiveChat) {
                incrementChatUnread(chat.id)
              }

              // In-app notification (topbar bell) — always show
              addNotification({
                id: `wa-${chat.id}-${Date.now()}`,
                type: 'info',
                title: '💬 ' + chat.name,
                description: 'Enviou uma mensagem no WhatsApp',
                read: false,
                createdAt: new Date().toISOString(),
                action: { label: 'Ver conversa', href: '/whatsapp' },
              })

              // Browser popup — show even on WA page, only skip if chat is open
              if (!isActiveChat) {
                fireBrowserNotification(chat.name)
              }
            }

            prevTimestamps.current[chat.id] = chat.timestamp
          }
        } else {
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
  }, [setTotalUnread, incrementPending, incrementChatUnread, addNotification])

  return null
}
