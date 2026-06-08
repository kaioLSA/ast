import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { SUPABASE_URL, sbHeaders, generateMeetingCode } from '@/lib/livekit-server'

// POST — cria uma nova reunião (host = usuário logado)
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const title: string = (body.title || 'Reunião').toString().slice(0, 120)
  const hours = Math.min(Math.max(Number(body.hours) || 12, 1), 72) // 1h a 72h
  const expires_at = new Date(Date.now() + hours * 3600 * 1000).toISOString()

  const code = generateMeetingCode()

  const res = await fetch(`${SUPABASE_URL}/rest/v1/meetings`, {
    method: 'POST',
    headers: { ...sbHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify({
      code,
      host_user_id: user.id,
      host_name: user.name,
      company_id: user.company_id,
      title,
      expires_at,
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: await res.text() }, { status: 500 })
  }
  const rows = await res.json()
  return NextResponse.json(rows[0] ?? rows, { status: 201 })
}

// GET — lista reuniões do host
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/meetings?select=*&host_user_id=eq.${user.id}&order=created_at.desc&limit=50`,
    { headers: sbHeaders(), cache: 'no-store' },
  )
  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 })
  return NextResponse.json(await res.json())
}
