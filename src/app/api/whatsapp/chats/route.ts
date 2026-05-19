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
    key?: { fromMe?: boolean }
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

type EvoMsgRecord = {
  pushName?: string | null
  key?: { fromMe?: boolean }
}

/** Fetch the pushName from the most recent received message for a given JID */
async function fetchReceivedPushName(jid: string): Promise<string | null> {
  try {
    const raw = await evoFetch.post(`/chat/findMessages/${EVO_INSTANCE}`, {
      where: { key: { remoteJid: jid, fromMe: false } },
      limit: 1,
    }) as { messages?: { records?: EvoMsgRecord[] } } | EvoMsgRecord[]

    const records: EvoMsgRecord[] = Array.isArray(raw)
      ? raw
      : ((raw as { messages?: { records?: EvoMsgRecord[] } }).messages?.records ?? [])

    return records[0]?.pushName ?? null
  } catch {
    return null
  }
}

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const rawChats = await evoFetch.post(`/chat/findChats/${EVO_INSTANCE}`, {})
    const chats: EvoChat[] = Array.isArray(rawChats) ? rawChats : []

    // First pass: build mapped list and collect JIDs that still have no name
    type MappedChat = {
      id: string; name: string; lastMsg: string
      timestamp: number; unread: number; isGroup: boolean; lastFromMe: boolean
      needsName: boolean
    }

    const firstPass: MappedChat[] = chats
      .filter((c) => c.remoteJid)
      .map((c) => {
        const jid = c.remoteJid!
        const isGroup = jid.endsWith('@g.us')
        // @lid contacts: show number only as last resort (it's an internal WA id, not a phone)
        const number = jid.split('@')[0]

        const lm = c.lastMessage
        const lastMsgFromMe = lm?.key?.fromMe ?? true
        const lastSenderName = lastMsgFromMe ? null : (lm?.pushName ?? null)

        const rawName = isGroup
          ? (c.name || c.subject || c.pushName || lastSenderName || null)
          : (c.pushName || lastSenderName || null)

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

        return {
          id: jid,
          name: rawName ?? number,
          lastMsg: lastText,
          timestamp: ts,
          unread: c.unreadMessages ?? 0,
          isGroup,
          lastFromMe,
          needsName: !rawName && !isGroup,
        }
      })

    // Second pass: for contacts still missing a name, fetch their most recent
    // received message in parallel (up to 20 contacts to avoid too many calls)
    const nameless = firstPass.filter(c => c.needsName).slice(0, 20)

    if (nameless.length > 0) {
      const resolved = await Promise.all(
        nameless.map(async (c) => ({
          id: c.id,
          name: await fetchReceivedPushName(c.id),
        }))
      )

      const nameMap: Record<string, string> = {}
      for (const r of resolved) {
        if (r.name) nameMap[r.id] = r.name
      }

      for (const c of firstPass) {
        if (c.needsName && nameMap[c.id]) {
          c.name = nameMap[c.id]
        }
      }
    }

    // Strip internal field and sort
    const mapped = firstPass
      .map(({ needsName: _, ...rest }) => rest)
      .sort((a, b) => b.timestamp - a.timestamp)

    return NextResponse.json(mapped)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
