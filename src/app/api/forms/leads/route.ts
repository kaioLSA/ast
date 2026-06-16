import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { hasPermission, forbiddenResponse } from '@/lib/utils/require-permission'
import { DEMO_FORM_LEADS } from '@/lib/demo/data'
import { getPageToken, listPageForms, getForm, parseLead, type MetaQuestion } from '@/lib/utils/meta-lead'

const GRAPH = 'https://graph.facebook.com/v19.0'

async function getFormLeads(
  formId: string,
  formName: string,
  questions: Map<string, MetaQuestion>,
  pageToken: string
) {
  const res = await fetch(
    `${GRAPH}/${formId}/leads?fields=id,field_data,created_time&limit=50&access_token=${pageToken}`
  )
  if (!res.ok) return []
  const data = await res.json()

  return (data.data ?? []).map(
    (lead: { id: string; created_time: string; field_data: { name: string; values: string[] }[] }) => {
      const parsed = parseLead(lead.field_data ?? [], questions)
      return {
        id: lead.id,
        form_id: formId,
        form_name: formName,
        name: parsed.name,
        phone: parsed.phone,
        created_time: lead.created_time ?? new Date().toISOString(),
        answers: parsed.answers,
      }
    }
  )
}

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json(DEMO_FORM_LEADS)
  if (!hasPermission(user, 'forms:read')) return forbiddenResponse('forms:read')

  try {
    const pageToken = await getPageToken()
    if (!pageToken) return NextResponse.json([], { status: 200 })

    // Descobre todos os formulários da página (inclui versões novas automaticamente)
    const forms = await listPageForms(pageToken)

    const allLeads = await Promise.all(
      forms.map(async ({ id, name }) => {
        const { questions } = await getForm(id, pageToken)
        return getFormLeads(id, name, questions, pageToken)
      })
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
