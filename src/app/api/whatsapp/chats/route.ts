import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { evoFetch } from '@/lib/utils/evo-fetch'

const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE

type EvoChat = {
  remoteJid?: string
  pushName?: string | null
  updatedAt?: string
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

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const raw = await evoFetch.post(`/chat/findChats/${EVO_INSTANCE}`, {})
    const chats = Array.isArray(raw) ? raw : []

    const mapped = chats
      .filter((c: EvoChat) => c.remoteJid)
      .map((c: EvoChat) => {
        const jid = c.remoteJid!
        const isGroup = jid.endsWith('@g.us')
        const number = jid.split('@')[0]
        const name = c.pushName || c.lastMessage?.pushName || number

        const lm = c.lastMessage
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

        return { id: jid, name, lastMsg: lastText, timestamp: ts, unread: 0, isGroup }
      })
      .sort((a: { timestamp: number }, b: { timestamp: number }) => b.timestamp - a.timestamp)

    return NextResponse.json(mapped)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
