import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
function sbHeaders() {
  return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }
}

// GET — notificações do usuário logado
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json([])

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/notifications?select=*&user_id=eq.${user.id}&order=created_at.desc&limit=50`,
    { headers: sbHeaders(), cache: 'no-store' },
  )
  if (!res.ok) return NextResponse.json([])
  return NextResponse.json(await res.json())
}

// PATCH — marca todas como lidas
export async function PATCH(_request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json({ ok: true })

  await fetch(`${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${user.id}&read=eq.false`, {
    method: 'PATCH',
    headers: { ...sbHeaders(), Prefer: 'return=minimal' },
    body: JSON.stringify({ read: true }),
  })
  return NextResponse.json({ ok: true })
}
