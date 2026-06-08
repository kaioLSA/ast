import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { getMeeting, isExpired, SUPABASE_URL, sbHeaders } from '@/lib/livekit-server'

// POST — convidado pede para entrar (público)
export async function POST(request: NextRequest, { params }: { params: { code: string } }) {
  const m = await getMeeting(params.code)
  if (!m) return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 })
  if (isExpired(m)) return NextResponse.json({ error: 'expired' }, { status: 410 })

  const body = await request.json().catch(() => ({}))
  const name: string = (body.name || '').toString().trim().slice(0, 60)
  if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })

  const res = await fetch(`${SUPABASE_URL}/rest/v1/meeting_requests`, {
    method: 'POST',
    headers: { ...sbHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify({ meeting_code: m.code, guest_name: name, status: 'pending' }),
  })
  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 })
  const rows = await res.json()
  return NextResponse.json({ requestId: rows[0]?.id }, { status: 201 })
}

// GET — host lista pedidos pendentes (autenticado, só o dono)
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const m = await getMeeting(params.code)
  if (!m || m.host_user_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/meeting_requests?select=id,guest_name,status,created_at&meeting_code=eq.${encodeURIComponent(m.code)}&status=eq.pending&order=created_at.asc`,
    { headers: sbHeaders(), cache: 'no-store' },
  )
  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 })
  return NextResponse.json(await res.json())
}
