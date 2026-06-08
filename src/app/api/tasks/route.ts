import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { hasPermission, forbiddenResponse } from '@/lib/utils/require-permission'
import { sbSelect, sbInsert } from '@/lib/utils/sb'
import { DEMO_TASKS } from '@/lib/demo/data'

// GET — lista as tasks da empresa (visível para todos da empresa)
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json(DEMO_TASKS)
  if (!hasPermission(user, 'tasks:read')) return forbiddenResponse('tasks:read')

  const rows = await sbSelect(
    'tasks',
    `company_id=eq.${user.company_id}&order=created_at.desc&limit=500`,
  )
  return NextResponse.json(rows)
}

// POST — cria uma task manual
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json({ ok: true, demo: true })
  if (!hasPermission(user, 'tasks:write')) return forbiddenResponse('tasks:write')

  const body = await request.json().catch(() => ({}))
  const { title, description, responsible, due_date, priority, status, group_name } = body as Record<string, string>

  if (!title?.trim()) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })

  try {
    const rows = await sbInsert('tasks', {
      company_id: user.company_id,
      title: title.trim(),
      description: description ?? '',
      responsible: responsible ?? '',
      due_date: due_date || null,
      priority: priority || 'medium',
      status: status || 'pending',
      source: 'manual',
      group_name: group_name ?? '',
      created_by: user.id,
    })
    return NextResponse.json(rows[0] ?? {}, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
