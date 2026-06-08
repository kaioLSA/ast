import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { hasPermission, forbiddenResponse } from '@/lib/utils/require-permission'
import { sbPatch, sbDelete } from '@/lib/utils/sb'

// PATCH — atualiza status/campos de uma task
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json({ ok: true, demo: true })
  if (!hasPermission(user, 'tasks:write')) return forbiddenResponse('tasks:write')

  const body = await request.json().catch(() => ({}))
  const allowed = ['title', 'description', 'responsible', 'due_date', 'priority', 'status'] as const
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of allowed) {
    if (k in body) patch[k] = (body as Record<string, unknown>)[k]
  }
  if (patch.due_date === '') patch.due_date = null

  try {
    const rows = await sbPatch(
      'tasks',
      `id=eq.${params.id}&company_id=eq.${user.company_id}`,
      patch,
    )
    return NextResponse.json(rows[0] ?? {})
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// DELETE — remove uma task
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json({ ok: true, demo: true })
  if (!hasPermission(user, 'tasks:write')) return forbiddenResponse('tasks:write')

  try {
    await sbDelete('tasks', `id=eq.${params.id}&company_id=eq.${user.company_id}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
