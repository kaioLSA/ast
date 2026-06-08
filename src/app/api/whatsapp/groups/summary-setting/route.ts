import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { hasPermission, forbiddenResponse } from '@/lib/utils/require-permission'
import { sbSelect, sbUpsert } from '@/lib/utils/sb'

// Demo: alguns grupos fictícios já com resumo ligado
const DEMO_SETTINGS: Record<string, boolean> = {
  'demo-group-comercial@g.us': true,
  'demo-group-suporte@g.us': true,
}

interface SettingRow { group_id: string; enabled: boolean }

// GET — mapa { group_id: enabled } dos grupos da empresa
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json(DEMO_SETTINGS)
  if (!hasPermission(user, 'whatsapp:read')) return forbiddenResponse('whatsapp:read')

  const rows = await sbSelect<SettingRow>(
    'group_summary_settings',
    `company_id=eq.${user.company_id}&select=group_id,enabled`,
  )
  const map: Record<string, boolean> = {}
  for (const r of rows) map[r.group_id] = r.enabled
  return NextResponse.json(map)
}

// POST — liga/desliga o resumo de um grupo
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json({ ok: true, demo: true })
  if (!hasPermission(user, 'whatsapp:write')) return forbiddenResponse('whatsapp:write')

  const body = await request.json().catch(() => ({}))
  const { group_id, group_name, enabled } = body as {
    group_id?: string; group_name?: string; enabled?: boolean
  }

  if (!group_id || !group_id.endsWith('@g.us')) {
    return NextResponse.json({ error: 'group_id de grupo inválido' }, { status: 400 })
  }

  try {
    await sbUpsert(
      'group_summary_settings',
      {
        company_id: user.company_id,
        group_id,
        group_name: group_name ?? '',
        enabled: enabled ?? false,
        updated_at: new Date().toISOString(),
      },
      'company_id,group_id',
    )
    return NextResponse.json({ ok: true, group_id, enabled: enabled ?? false })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
