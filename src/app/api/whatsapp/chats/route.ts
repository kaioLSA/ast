import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { evoFetch } from '@/lib/utils/evo-fetch'

const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE

type EvoChat = {
  remoteJid?: string
  pushName?: string | null
  name?: string | null
  subject?: string | null
  updatedAt?: string
  unreadMessages?: number
  lastMessage?: {
    key?: {
      fromMe?: boolean
      remoteJidAlt?: string   // real phone JID for @lid contacts
    }
    pushName?: string | null
    messageType?: string
    message?: {
      conversation?: string
      extendedTextMessage?: { text?: string }
      imageMessage?: { caption?: string }
      videoMessage?: { caption?: string }
      documentMessage?: { title?: string }
    }
  }
}

/** Format a raw phone number string to Brazilian (XX) XXXXX-XXXX */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  // Strip Brazilian country code 55 if present
  const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits
  if (local.length === 11) {
    // Mobile: (XX) XXXXX-XXXX
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  }
  if (local.length === 10) {
    // Landline: (XX) XXXX-XXXX
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  }
  // International or unknown — return raw digits
  return digits || raw
}

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const rawChats = await evoFetch.post(`/chat/findChats/${EVO_INSTANCE}`, {})
    const chats: EvoChat[] = Array.isArray(rawChats) ? rawChats : []

    const mapped = chats
      .filter((c) => c.remoteJid)
      .map((c) => {
        const jid = c.remoteJid!
        const isGroup = jid.endsWith('@g.us')
        const isLid = jid.endsWith('@lid')

        // For @lid contacts, the real phone number is in lastMessage.key.remoteJidAlt
        const remoteJidAlt = c.lastMessage?.key?.remoteJidAlt ?? ''
        const phoneRaw = isLid
          ? (remoteJidAlt.split('@')[0] || jid.split('@')[0])
          : jid.split('@')[0]
        const phoneFormatted = formatPhone(phoneRaw)

        const lm = c.lastMessage
        const lastMsgFromMe = lm?.key?.fromMe ?? true
        // Only use lastMessage.pushName when the sender is the contact (not us)
        const lastSenderName = lastMsgFromMe ? null : (lm?.pushName ?? null)

        // Name resolution: saved/cached WA name → last received sender name → formatted phone
        const name = isGroup
          ? (c.name || c.subject || c.pushName || lastSenderName || phoneFormatted)
          : (c.pushName || lastSenderName || phoneFormatted)

        let lastText = '...'
        if (lm?.messageType === 'conversation' || lm?.messageType === 'extendedTextMessage') {
          lastText = lm.message?.conversation || lm.message?.extendedTextMessage?.text || '...'
        } else if (lm?.messageType === 'imageMessage') {
          lastText = lm.message?.imageMessage?.caption || '📷 Foto'
        } else if (lm?.messageType === 'videoMessage') {
          lastText = lm.message?.videoMessage?.caption || '🎥 Vídeo'
        } else if (lm?.messageType === 'audioMessage') {
          lastText = '🎵 Áudio'
        } else if (lm?.messageType === 'documentMessage') {
          lastText = '📄 ' + (lm.message?.documentMessage?.title || 'Documento')
        } else if (lm?.messageType) {
          lastText = `[${lm.messageType}]`
        }

        const ts = c.updatedAt ? new Date(c.updatedAt).getTime() / 1000 : 0
        const lastFromMe = lm?.key?.fromMe ?? true

        return { id: jid, name, lastMsg: lastText, timestamp: ts, unread: c.unreadMessages ?? 0, isGroup, lastFromMe }
      })
      .sort((a, b) => b.timestamp - a.timestamp)

    return NextResponse.json(mapped)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
