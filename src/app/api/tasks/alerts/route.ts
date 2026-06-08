import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { hasPermission, forbiddenResponse } from '@/lib/utils/require-permission'
import { sbSelect, sbPatch } from '@/lib/utils/sb'
import { DEMO_CRITICAL_ALERTS } from '@/lib/demo/data'

// GET — alertas críticos da empresa
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json(DEMO_CRITICAL_ALERTS)
  if (!hasPermission(user, 'tasks:read')) return forbiddenResponse('tasks:read')

  const rows = await sbSelect(
    'critical_alerts',
    `company_id=eq.${user.company_id}&order=created_at.desc&limit=100`,
  )
  return NextResponse.json(rows)
}

// PATCH — marca um alerta como lido ({ id })
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json({ ok: true, demo: true })
  if (!hasPermission(user, 'tasks:read')) return forbiddenResponse('tasks:read')

  const body = await request.json().catch(() => ({}))
  const { id } = body as { id?: string }
  if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

  try {
    await sbPatch('critical_alerts', `id=eq.${id}&company_id=eq.${user.company_id}`, { is_read: true })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
