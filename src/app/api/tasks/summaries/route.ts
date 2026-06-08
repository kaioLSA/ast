import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { hasPermission, forbiddenResponse } from '@/lib/utils/require-permission'
import { sbSelect } from '@/lib/utils/sb'
import { DEMO_WEEKLY_SUMMARIES } from '@/lib/demo/data'

// GET — lista os relatórios semanais da empresa
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json(DEMO_WEEKLY_SUMMARIES)
  if (!hasPermission(user, 'tasks:read')) return forbiddenResponse('tasks:read')

  const rows = await sbSelect(
    'weekly_summaries',
    `company_id=eq.${user.company_id}&order=created_at.desc&limit=100`,
  )
  return NextResponse.json(rows)
}
