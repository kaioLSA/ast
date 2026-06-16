import { NextResponse, type NextRequest } from 'next/server'
import { evoFetch } from '@/lib/utils/evo-fetch'
import { getPageToken, getForm, parseLead, buildLeadMessage } from '@/lib/utils/meta-lead'

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN ?? ''
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

  const pageToken = await getPageToken()
  if (!pageToken) {
    console.error('[Meta Webhook] Não foi possível obter o page token')
    return
  }

  // Busca dados do lead na API do Meta (form_id identifica qual versão do formulário)
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${leadgenId}?fields=field_data,created_time,form_id&access_token=${pageToken}`
  )
  if (!res.ok) {
    console.error('[Meta Webhook] Erro ao buscar lead:', await res.text())
    return
  }

  const lead = await res.json()

  // Pega nome + perguntas (com tipos) do formulário que originou o lead.
  // Assim a mensagem sai com as perguntas ATUAIS desse formulário, seja qual for a versão.
  const { name: formName, questions } = await getForm(lead.form_id, pageToken)
  const parsed = parseLead(lead.field_data ?? [], questions)
  const message = buildLeadMessage(parsed, formName, lead.created_time)

  // ── Envia a mensagem formatada no grupo ──────────────────────────────────
  await evoFetch.post(`/message/sendText/${EVO_INSTANCE}`, {
    number: WA_GROUP_ID,
    text: message,
  })

  console.log(`[Meta Webhook] Mensagem enviada para o grupo — Lead: ${parsed.name} | Form: ${formName}`)
}
