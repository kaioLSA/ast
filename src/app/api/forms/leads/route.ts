import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { hasPermission, forbiddenResponse } from '@/lib/utils/require-permission'
import { DEMO_FORM_LEADS } from '@/lib/demo/data'

const META_TOKEN   = process.env.META_ACCESS_TOKEN ?? ''
const META_PAGE_ID = '483909614807424'

// Forma IDs da página Start Sette
const FORM_IDS = ['1155959746683167', '27392529027055331', '869805239525808']

async function getPageToken(): Promise<string> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${META_TOKEN}`
  )
  if (!res.ok) return ''
  const data = await res.json()
  const page = data.data?.find((p: { id: string; access_token: string }) => p.id === META_PAGE_ID)
  return page?.access_token ?? ''
}

async function getFormLeads(formId: string, formName: string, pageToken: string) {
  const res = await fetch(
    `https://graph.facebook.com/v16.0/${formId}/leads?fields=field_data,created_time&limit=50&access_token=${pageToken}`
  )
  if (!res.ok) return []
  const data = await res.json()

  return (data.data ?? []).map((lead: { id: string; created_time: number; field_data: { name: string; values: string[] }[] }) => {
    const fields: Record<string, string> = {}
    for (const f of lead.field_data ?? []) {
      fields[f.name.toLowerCase()] = f.values?.[0] ?? ''
    }

    const name  = fields['full_name'] ?? fields['name'] ?? 'Não informado'
    const phone = fields['phone_number'] ?? fields['whatsapp_number'] ?? fields['phone'] ?? ''
    const phoneFormatted = formatPhone(phone)

    const skipKeys = ['full_name', 'name', 'phone_number', 'whatsapp_number', 'phone', 'email']
    const answers = lead.field_data
      .filter((f: { name: string; values: string[] }) => !skipKeys.includes(f.name.toLowerCase()) && f.values?.[0])
      .map((f: { name: string; values: string[] }) => ({ question: f.name, answer: f.values[0] }))

    return {
      id: lead.id,
      form_id: formId,
      form_name: formName,
      name,
      phone: phoneFormatted,
      created_time: lead.created_time ?? new Date().toISOString(),
      answers,
    }
  })
}

function formatPhone(raw: string): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  return raw
}

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json(DEMO_FORM_LEADS)
  if (!hasPermission(user, 'forms:read')) return forbiddenResponse('forms:read')

  try {
    const pageToken = await getPageToken()
    if (!pageToken) return NextResponse.json([], { status: 200 })

    const formNames: Record<string, string> = {
      '1155959746683167': 'FORMS 01 - ESTÉTICA',
      '27392529027055331': 'FORMS 01 - ESTÉTICA (v1)',
      '869805239525808':  'FORMS 02 - ESTÉTICA',
    }

    const allLeads = await Promise.all(
      FORM_IDS.map(id => getFormLeads(id, formNames[id] ?? id, pageToken))
    )

    const leads = allLeads
      .flat()
      .sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime())

    return NextResponse.json(leads)
  } catch (err) {
    console.error('[Forms API]', err)
    return NextResponse.json([], { status: 200 })
  }
}
