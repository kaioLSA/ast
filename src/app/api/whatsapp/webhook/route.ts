import { NextResponse, type NextRequest } from 'next/server'
import { evoFetch } from '@/lib/utils/evo-fetch'
import { transcribeAudio } from '@/lib/utils/whisper'
import { sbSelect, sbInsert } from '@/lib/utils/sb'

const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE ?? ''
const WEBHOOK_SECRET = process.env.WA_WEBHOOK_SECRET ?? ''

interface EvoKey {
  remoteJid?: string
  fromMe?: boolean
  id?: string
  participant?: string
}
interface EvoMessage {
  conversation?: string
  extendedTextMessage?: { text?: string }
  imageMessage?: { caption?: string }
  videoMessage?: { caption?: string }
  documentMessage?: { title?: string; fileName?: string }
  audioMessage?: unknown
}
interface EvoData {
  key?: EvoKey
  pushName?: string
  message?: EvoMessage
  messageType?: string
  messageTimestamp?: number | string
}

interface SettingRow { company_id: string; group_name: string }

function formatPhone(jid: string): string {
  const digits = (jid.split('@')[0] || '').replace(/\D/g, '')
  const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  return digits
}

/** Extrai texto + tipo de uma mensagem do Evolution */
function extractContent(msg: EvoMessage | undefined, type: string | undefined): { text: string; kind: string } {
  if (!msg) return { text: '', kind: 'text' }
  if (msg.conversation) return { text: msg.conversation, kind: 'text' }
  if (msg.extendedTextMessage?.text) return { text: msg.extendedTextMessage.text, kind: 'text' }
  if (type === 'imageMessage' || msg.imageMessage) return { text: msg.imageMessage?.caption ?? '', kind: 'image' }
  if (type === 'videoMessage' || msg.videoMessage) return { text: msg.videoMessage?.caption ?? '', kind: 'video' }
  if (type === 'audioMessage' || msg.audioMessage) return { text: '', kind: 'audio' }
  if (type === 'documentMessage' || msg.documentMessage)
    return { text: msg.documentMessage?.title || msg.documentMessage?.fileName || 'Documento', kind: 'document' }
  return { text: '', kind: 'text' }
}

async function processMessage(data: EvoData): Promise<void> {
  const key = data.key
  const groupId = key?.remoteJid ?? ''
  if (!groupId.endsWith('@g.us')) return // só grupos

  // Empresas que têm esse grupo com resumo ativado
  const settings = await sbSelect<SettingRow>(
    'group_summary_settings',
    `group_id=eq.${encodeURIComponent(groupId)}&enabled=is.true&select=company_id,group_name`,
  )
  if (!settings.length) return // grupo não monitorado — ignora

  const { text, kind } = extractContent(data.message, data.messageType)

  // Áudio → transcreve via Whisper
  let transcription = ''
  if (kind === 'audio') {
    try {
      const media = (await evoFetch.post(`/chat/getBase64FromMediaMessage/${EVO_INSTANCE}`, {
        message: { key },
        convertToMp4: false,
      })) as { base64?: string }
      if (media?.base64) transcription = await transcribeAudio(media.base64)
    } catch (err) {
      console.error('[WA Webhook] Falha ao transcrever áudio:', err)
    }
  }

  // Ignora mensagens sem nenhum conteúdo aproveitável (ex: figurinha, reação)
  if (!text && !transcription && kind === 'text') return

  const senderJid = key?.fromMe ? '' : (key?.participant ?? '')
  const senderName = key?.fromMe ? 'Você' : (data.pushName || formatPhone(senderJid) || 'Desconhecido')
  const tsRaw = data.messageTimestamp ? Number(data.messageTimestamp) : Date.now() / 1000
  const messageTs = new Date(tsRaw * 1000).toISOString()

  for (const s of settings) {
    try {
      await sbInsert('group_messages', {
        company_id: s.company_id,
        group_id: groupId,
        group_name: s.group_name || '',
        sender_name: senderName,
        sender_phone: senderJid ? formatPhone(senderJid) : '',
        message_text: text,
        message_type: kind,
        transcription,
        wa_message_id: key?.id ?? '',
        message_timestamp: messageTs,
      })
    } catch (err) {
      // duplicata (índice único) ou outro erro — não interrompe o webhook
      const msg = String(err)
      if (!msg.includes('duplicate') && !msg.includes('23505')) {
        console.error('[WA Webhook] Erro ao salvar mensagem:', msg)
      }
    }
  }
}

export async function POST(request: NextRequest) {
  // Proteção opcional por secret (?secret=...)
  if (WEBHOOK_SECRET) {
    const got = request.nextUrl.searchParams.get('secret')
    if (got !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  try {
    const body = await request.json().catch(() => ({}))
    const event = body.event ?? body.type ?? ''

    if (event === 'messages.upsert' || event === 'messages.update' || !event) {
      // data pode ser objeto único ou array
      const raw = body.data ?? body
      const items: EvoData[] = Array.isArray(raw) ? raw : [raw]
      for (const item of items) {
        if (item?.key?.remoteJid) {
          processMessage(item).catch(console.error)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[WA Webhook] Erro:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
