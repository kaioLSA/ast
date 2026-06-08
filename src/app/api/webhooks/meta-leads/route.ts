import { NextResponse, type NextRequest } from 'next/server'
import { evoFetch } from '@/lib/utils/evo-fetch'

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN ?? ''
const META_TOKEN   = process.env.META_ACCESS_TOKEN ?? ''
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE ?? ''

// Grupo COMERCIAL - START SETTE
const WA_GROUP_ID = '120363407832868715@g.us'

// ── GET — Verificação do webhook pelo Meta ────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const mode      = searchParams.get('hub.mode')
  const token     = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Meta Webhook] Verificado com sucesso')
    return new Response(challenge ?? '', { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// ── POST — Recebe notificação de novo lead ────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    const entries = body.entry ?? []
    for (const entry of entries) {
      const changes = entry.changes ?? []
      for (const change of changes) {
        if (change.field === 'leadgen') {
          const leadgenId = change.value?.leadgen_id
          if (leadgenId) {
            // Processa de forma assíncrona para responder rápido ao Meta
            processLead(leadgenId).catch(console.error)
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Meta Webhook] Erro:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// ── Busca detalhes do lead e envia no grupo ───────────────────────────────────
async function processLead(leadgenId: string) {
  console.log(`[Meta Webhook] Processando lead: ${leadgenId}`)

  // Busca dados do lead na API do Meta
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${leadgenId}?fields=field_data,created_time,ad_name,form_id&access_token=${META_TOKEN}`
  )
  if (!res.ok) {
    console.error('[Meta Webhook] Erro ao buscar lead:', await res.text())
    return
  }

  const lead = await res.json()
  const rawFields: { name: string; values: string[] }[] = lead.field_data ?? []

  // Mapeia os campos por chave
  const fields: Record<string, string> = {}
  for (const f of rawFields) {
    fields[f.name.toLowerCase()] = f.values?.[0] ?? ''
  }

  // Nome e telefone (campos padrão do Meta)
  const name = fields['full_name'] ?? fields['name'] ?? 'Não informado'
  const rawPhone = fields['phone_number'] ?? fields['whatsapp_number'] ?? fields['phone'] ?? ''
  const phoneFormatted = formatPhone(rawPhone)

  // Respostas das perguntas personalizadas
  const answers: { question: string; answer: string }[] = []
  const skipKeys = ['full_name', 'name', 'phone_number', 'whatsapp_number', 'phone', 'email']
  for (const f of rawFields) {
    if (!skipKeys.includes(f.name.toLowerCase()) && f.values?.[0]) {
      answers.push({
        question: toTitleCase(f.name),
        answer: toTitleCase(f.values[0]),
      })
    }
  }

  // Data e hora em Brasília
  const ts = lead.created_time ? new Date(lead.created_time).getTime() : Date.now()
  const brtDate = new Date(ts - 3 * 60 * 60 * 1000)
  const dateStr = brtDate.toISOString().slice(0, 10).split('-').reverse().join('/')
  const timeStr = brtDate.toISOString().slice(11, 16) + 'h'

  // ── Monta a mensagem ──────────────────────────────────────────────────────
  const lines: string[] = [
    '🔔 *Novo Lead Chegou!* 🔔',
    '',
    `👤 *Nome:* ${name}`,
    `📱 *WhatsApp:* ${phoneFormatted}`,
  ]

  if (answers.length > 0) {
    lines.push('')
    lines.push('━━━━━━━━━━━━━━━━━━')
    for (const { question, answer } of answers) {
      lines.push(``)
      lines.push(`📌 *${question}*`)
      lines.push(`_${answer}_`)
    }
    lines.push('')
    lines.push('━━━━━━━━━━━━━━━━━━')
  }

  lines.push('')
  lines.push(`🕐 Recebido em ${dateStr} às ${timeStr}`)
  lines.push(`🎯 _Formulário: Forms Estética_`)

  const message = lines.join('\n')

  // ── Envia a mensagem formatada no grupo ──────────────────────────────────
  await evoFetch.post(`/message/sendText/${EVO_INSTANCE}`, {
    number: WA_GROUP_ID,
    text: message,
  })

  console.log(`[Meta Webhook] Mensagem enviada para o grupo — Lead: ${name}`)
}

// ── Converte underscores em espaços e capitaliza ──────────────────────────────
function toTitleCase(str: string): string {
  return str
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .trim()
}

// ── Formata número de telefone ────────────────────────────────────────────────
function formatPhone(raw: string): string {
  if (!raw) return 'Não informado'
  const digits = raw.replace(/\D/g, '')
  const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits
  if (local.length === 11) return `(${local.slice(0,2)}) ${local.slice(2,7)}-${local.slice(7)}`
  if (local.length === 10) return `(${local.slice(0,2)}) ${local.slice(2,6)}-${local.slice(6)}`
  return raw
}
