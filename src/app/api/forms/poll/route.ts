import { NextResponse } from 'next/server'
import { evoFetch } from '@/lib/utils/evo-fetch'
import fs from 'fs'
import path from 'path'

const META_TOKEN   = process.env.META_ACCESS_TOKEN ?? ''
const META_PAGE_ID = '483909614807424'
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE ?? ''
const WA_GROUP_ID  = '120363407832868715@g.us'
const POLL_SECRET  = process.env.POLL_SECRET ?? 'poll-startsette-2024'

const FORM_IDS: Record<string, string> = {
  '1155959746683167': 'FORMS 01 - ESTÉTICA',
  '27392529027055331': 'FORMS 01 - ESTÉTICA (v1)',
  '869805239525808':  'FORMS 02 - ESTÉTICA',
}

const NOTIFIED_FILE = '/tmp/.notified-leads.json'

function loadNotified(): Set<string> {
  try {
    const data = fs.readFileSync(NOTIFIED_FILE, 'utf-8')
    return new Set(JSON.parse(data))
  } catch {
    return new Set()
  }
}

function saveNotified(ids: Set<string>) {
  fs.writeFileSync(NOTIFIED_FILE, JSON.stringify([...ids]), 'utf-8')
}

async function getPageToken(): Promise<string> {
  const res = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${META_TOKEN}`)
  if (!res.ok) return ''
  const data = await res.json()
  const page = data.data?.find((p: { id: string; access_token: string }) => p.id === META_PAGE_ID)
  return page?.access_token ?? ''
}

function toTitleCase(str: string): string {
  return str
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .trim()
}

function formatPhone(raw: string): string {
  if (!raw) return 'Não informado'
  const digits = raw.replace(/\D/g, '')
  const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  return raw
}

async function notifyLead(lead: {
  id: string
  field_data: { name: string; values: string[] }[]
  created_time: string
}, formName: string) {
  const skipKeys = ['full_name', 'name', 'phone_number', 'whatsapp_number', 'phone', 'email']

  const fields: Record<string, string> = {}
  for (const f of lead.field_data ?? []) {
    fields[f.name.toLowerCase()] = f.values?.[0] ?? ''
  }

  const name      = fields['full_name'] ?? fields['name'] ?? 'Não informado'
  const rawPhone  = fields['phone_number'] ?? fields['whatsapp_number'] ?? fields['phone'] ?? ''
  const phone     = formatPhone(rawPhone)

  const answers = lead.field_data
    .filter(f => !skipKeys.includes(f.name.toLowerCase()) && f.values?.[0])
    .map(f => ({ question: toTitleCase(f.name), answer: toTitleCase(f.values[0]) }))

  const ts      = lead.created_time ? new Date(lead.created_time).getTime() : Date.now()
  const brtDate = new Date(ts - 3 * 60 * 60 * 1000)
  const dateStr = brtDate.toISOString().slice(0, 10).split('-').reverse().join('/')
  const timeStr = brtDate.toISOString().slice(11, 16) + 'h'

  const lines = [
    '🔔 *Novo Lead Chegou!* 🔔',
    '',
    `👤 *Nome:* ${name}`,
    `📱 *WhatsApp:* ${phone}`,
  ]

  if (answers.length > 0) {
    lines.push('')
    lines.push('━━━━━━━━━━━━━━━━━━')
    for (const { question, answer } of answers) {
      lines.push('')
      lines.push(`📌 *${question}*`)
      lines.push(`_${answer}_`)
    }
    lines.push('')
    lines.push('━━━━━━━━━━━━━━━━━━')
  }

  lines.push('')
  lines.push(`🕐 Recebido em ${dateStr} às ${timeStr}`)
  lines.push(`🎯 _Formulário: ${formName}_`)

  await evoFetch.post(`/message/sendText/${EVO_INSTANCE}`, {
    number: WA_GROUP_ID,
    text: lines.join('\n'),
  })

  console.log(`[Forms Poll] Notificado — Lead: ${name} | Form: ${formName}`)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== POLL_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const pageToken = await getPageToken()
    if (!pageToken) return NextResponse.json({ error: 'No page token' }, { status: 500 })

    const notified = loadNotified()
    let newCount = 0

    for (const [formId, formName] of Object.entries(FORM_IDS)) {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${formId}/leads?fields=id,field_data,created_time&limit=20&access_token=${pageToken}`
      )
      if (!res.ok) continue
      const data = await res.json()

      for (const lead of data.data ?? []) {
        if (notified.has(lead.id)) continue
        await notifyLead(lead, formName)
        notified.add(lead.id)
        newCount++
      }
    }

    saveNotified(notified)
    return NextResponse.json({ ok: true, new: newCount })
  } catch (err) {
    console.error('[Forms Poll] Erro:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
