import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { evoFetch } from '@/lib/utils/evo-fetch'

const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE

type EvoMsg = {
  id?: string
  key?: { id?: string; fromMe?: boolean }
  messageType?: string
  message?: {
    conversation?: string
    extendedTextMessage?: { text?: string }
    imageMessage?: { caption?: string }
    videoMessage?: { caption?: string }
    documentMessage?: { title?: string }
  }
  messageTimestamp?: number
  updatedAt?: string
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const chatId = decodeURIComponent(id)

  try {
    const raw = await evoFetch.post(`/chat/findMessages/${EVO_INSTANCE}`, {
      where: { key: { remoteJid: chatId } },
      limit: 60,
    }) as { messages?: { records?: EvoMsg[] } } | EvoMsg[]

    const records: EvoMsg[] = Array.isArray(raw)
      ? raw
      : ((raw as { messages?: { records?: EvoMsg[] } }).messages?.records ?? [])

    const mapped = records.map((m) => {
      const msgId = m.key?.id || m.id || String(m.messageTimestamp ?? Date.now())
      const fromMe = m.key?.fromMe ?? false

      let text = '[mídia]'
      if (m.messageType === 'conversation' || m.messageType === 'extendedTextMessage') {
        text = m.message?.conversation || m.message?.extendedTextMessage?.text || '...'
      } else if (m.messageType === 'imageMessage') {
        text = m.message?.imageMessage?.caption || '📷 Foto'
      } else if (m.messageType === 'videoMessage') {
        text = m.message?.videoMessage?.caption || '🎥 Vídeo'
      } else if (m.messageType === 'audioMessage') {
        text = '🎵 Áudio'
      } else if (m.messageType === 'documentMessage') {
        text = '📄 ' + (m.message?.documentMessage?.title || 'Documento')
      } else if (m.messageType) {
        text = `[${m.messageType}]`
      }

      const ts = m.messageTimestamp || (m.updatedAt ? Math.floor(new Date(m.updatedAt).getTime() / 1000) : 0)

      // time is formatted client-side (browser timezone) — server just returns raw timestamp
      return { id: msgId, from: fromMe ? 'me' : 'them', text, time: '', timestamp: ts }
    }).sort((a, b) => a.timestamp - b.timestamp)

    return NextResponse.json(mapped)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
