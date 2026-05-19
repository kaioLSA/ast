import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { evoFetch } from '@/lib/utils/evo-fetch'

const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE

type EvoChat = {
  remoteJid?: string
  pushName?: string | null
  name?: string | null        // group subject (Evolution API)
  subject?: string | null     // group subject (alt field)
  updatedAt?: string
  unreadMessages?: number
  lastMessage?: {
    key?: { fromMe?: boolean }
    pushName?: string
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

type EvoContact = {
  remoteJid?: string
  pushName?: string | null
  profileName?: string | null
  name?: string | null
  verifiedName?: string | null
}

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Fetch chats and contacts in parallel
    const [rawChats, rawContacts] = await Promise.all([
      evoFetch.post(`/chat/findChats/${EVO_INSTANCE}`, {}),
      evoFetch.post(`/contact/findContacts/${EVO_INSTANCE}`, {}).catch(() => []),
    ])

    const chats = Array.isArray(rawChats) ? rawChats : []

    // Build a JID → WhatsApp display name map from contacts endpoint
    // This gives us pushName even for unsaved contacts
    const contactMap: Record<string, string> = {}
    const contacts = Array.isArray(rawContacts) ? rawContacts : []
    for (const c of contacts as EvoContact[]) {
      if (!c.remoteJid) continue
      const displayName = c.pushName || c.profileName || c.verifiedName || c.name
      if (displayName) contactMap[c.remoteJid] = displayName
    }

    const mapped = chats
      .filter((c: EvoChat) => c.remoteJid)
      .map((c: EvoChat) => {
        const jid = c.remoteJid!
        const isGroup = jid.endsWith('@g.us')
        const number = jid.split('@')[0]

        const lm = c.lastMessage

        // For individuals: only use lastMessage.pushName when the last message
        // was received (fromMe=false), otherwise it returns the user's own name.
        const lastMsgFromMe = lm?.key?.fromMe ?? true
        const lastSenderName = lastMsgFromMe ? null : (lm?.pushName ?? null)

        // Priority: chat.pushName → contacts API name → last received sender name → number
        const name = isGroup
          ? (c.name || c.subject || c.pushName || contactMap[jid] || number)
          : (c.pushName || contactMap[jid] || lastSenderName || number)

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

        // Default true (unknown = assume outgoing) so we don't fire false-positive notifications
        const lastFromMe = lm?.key?.fromMe ?? true
        return { id: jid, name, lastMsg: lastText, timestamp: ts, unread: c.unreadMessages ?? 0, isGroup, lastFromMe }
      })
      .sort((a: { timestamp: number }, b: { timestamp: number }) => b.timestamp - a.timestamp)

    return NextResponse.json(mapped)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
