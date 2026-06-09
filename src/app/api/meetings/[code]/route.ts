import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { getMeeting, isExpired, SUPABASE_URL, sbHeaders } from '@/lib/livekit-server'

// GET — info pública da reunião (para a tela do convidado)
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const m = await getMeeting(params.code)
  if (!m) return NextResponse.json({ error: 'Reunião não encontrada' }, { status: 404 })
  return NextResponse.json({
    title: m.title,
    host_name: m.host_name,
    expired: isExpired(m),
    scheduled_at: m.scheduled_at ?? null,
  })
}

// DELETE — exclui a reunião (somente o host) + mensagens, pedidos e convites
export async function DELETE(_req: Request, { params }: { params: { code: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const m = await getMeeting(params.code)
  if (!m) return new NextResponse(null, { status: 204 })
  if (m.host_user_id !== user.id) return NextResponse.json({ error: 'not_host' }, { status: 403 })

  const code = encodeURIComponent(m.code)
  const h = sbHeaders()
  await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/meeting_messages?meeting_code=eq.${code}`, { method: 'DELETE', headers: h }),
    fetch(`${SUPABASE_URL}/rest/v1/meeting_requests?meeting_code=eq.${code}`, { method: 'DELETE', headers: h }),
    fetch(`${SUPABASE_URL}/rest/v1/meeting_invites?meeting_code=eq.${code}`, { method: 'DELETE', headers: h }),
  ])
  await fetch(`${SUPABASE_URL}/rest/v1/meetings?id=eq.${m.id}`, { method: 'DELETE', headers: h })
  return new NextResponse(null, { status: 204 })
}
