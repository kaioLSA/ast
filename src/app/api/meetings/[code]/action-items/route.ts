import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { hasPermission, forbiddenResponse } from '@/lib/utils/require-permission'
import { getMeeting } from '@/lib/livekit-server'
import { sbSelect, sbInsert } from '@/lib/utils/sb'

export const dynamic = 'force-dynamic'

interface ActionItem { tarefa: string; responsavel?: string }

// POST — transforma os action items da análise da IA em tarefas do CRM (1 clique).
export async function POST(_req: Request, { params }: { params: { code: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json({ ok: true, created: 0, demo: true })
  if (!hasPermission(user, 'tasks:write')) return forbiddenResponse('tasks:write')

  const m = await getMeeting(params.code)
  if (!m) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (m.company_id && m.company_id !== user.company_id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const summary = (m.summary ?? null) as { action_items?: ActionItem[] } | null
  const items = (summary?.action_items ?? []).filter(a => a?.tarefa?.trim())
  if (items.length === 0) return NextResponse.json({ error: 'sem_action_items' }, { status: 400 })

  const groupName = `Reunião: ${m.title || 'Reunião'}`

  // evita duplicar se clicar mais de uma vez
  const existing = await sbSelect<{ title: string }>(
    'tasks',
    `company_id=eq.${user.company_id}&source=eq.meeting&group_name=eq.${encodeURIComponent(groupName)}&select=title`,
  )
  const existingTitles = new Set(existing.map(t => t.title))

  const toCreate = items
    .filter(a => !existingTitles.has(a.tarefa.trim()))
    .map(a => ({
      company_id: user.company_id,
      title: a.tarefa.trim(),
      description: '',
      responsible: a.responsavel?.trim() || '',
      due_date: null,
      priority: 'medium',
      status: 'pending',
      source: 'meeting',
      group_name: groupName,
      created_by: user.id,
    }))

  if (toCreate.length === 0) return NextResponse.json({ ok: true, created: 0, already: items.length })

  try {
    await sbInsert('tasks', toCreate)
    return NextResponse.json({ ok: true, created: toCreate.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
