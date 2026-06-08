import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { getMeeting, isExpired, createLiveKitToken, SUPABASE_URL, sbHeaders } from '@/lib/livekit-server'

// GET — convidado consulta status do pedido (público). Se aprovado, retorna o token.
export async function GET(_req: Request, { params }: { params: { code: string; requestId: string } }) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/meeting_requests?select=id,status,token,guest_name&id=eq.${params.requestId}&meeting_code=eq.${encodeURIComponent(params.code)}&limit=1`,
    { headers: sbHeaders(), cache: 'no-store' },
  )
  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 })
  const rows = await res.json()
  const req = rows?.[0]
  if (!req) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ status: req.status, token: req.status === 'approved' ? req.token : null })
}

// PATCH — host aprova/recusa (autenticado, só o dono)
export async function PATCH(request: NextRequest, { params }: { params: { code: string; requestId: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const m = await getMeeting(params.code)
  if (!m || m.host_user_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  if (isExpired(m)) return NextResponse.json({ error: 'expired' }, { status: 410 })

  const body = await request.json().catch(() => ({}))
  const approve = !!body.approve

  // Busca o pedido para pegar o nome do convidado
  const getRes = await fetch(
    `${SUPABASE_URL}/rest/v1/meeting_requests?select=id,guest_name,status&id=eq.${params.requestId}&meeting_code=eq.${encodeURIComponent(m.code)}&limit=1`,
    { headers: sbHeaders(), cache: 'no-store' },
  )
  const reqRows = await getRes.json()
  const reqRow = reqRows?.[0]
  if (!reqRow) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  let token: string | null = null
  if (approve) {
    token = await createLiveKitToken({
      room: m.code,
      identity: `guest-${reqRow.id}`,
      name: reqRow.guest_name || 'Convidado',
      isHost: false,
    })
  }

  const patch = await fetch(
    `${SUPABASE_URL}/rest/v1/meeting_requests?id=eq.${params.requestId}`,
    {
      method: 'PATCH',
      headers: { ...sbHeaders(), Prefer: 'return=minimal' },
      body: JSON.stringify({ status: approve ? 'approved' : 'denied', token }),
    },
  )
  if (!patch.ok) return NextResponse.json({ error: await patch.text() }, { status: 500 })
  return NextResponse.json({ ok: true })
}
