import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { getMeeting, SUPABASE_URL, sbHeaders } from '@/lib/livekit-server'

// GET — lista IDs de usuários já convidados (host)
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const m = await getMeeting(params.code)
  if (!m || m.host_user_id !== user.id) return NextResponse.json([], { status: 200 })

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/meeting_invites?select=user_id&meeting_code=eq.${encodeURIComponent(m.code)}`,
    { headers: sbHeaders(), cache: 'no-store' },
  )
  const rows: Array<{ user_id: string }> = res.ok ? await res.json() : []
  return NextResponse.json(rows.map(r => r.user_id))
}

// POST — convida membros da equipe (host) + cria notificações
export async function POST(request: NextRequest, { params }: { params: { code: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const m = await getMeeting(params.code)
  if (!m) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (m.host_user_id !== user.id) return NextResponse.json({ error: 'not_host' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const userIds: string[] = Array.isArray(body.user_ids) ? body.user_ids.filter(Boolean) : []
  if (userIds.length === 0) return NextResponse.json({ ok: true, invited: 0 })

  const h = sbHeaders()

  // convites (ignora duplicados via on_conflict)
  await fetch(`${SUPABASE_URL}/rest/v1/meeting_invites?on_conflict=meeting_code,user_id`, {
    method: 'POST',
    headers: { ...h, Prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(userIds.map(uid => ({ meeting_code: m.code, user_id: uid }))),
  })

  // notificações
  const notifs = userIds.map(uid => ({
    user_id: uid,
    title: 'Convite para reunião',
    description: `${m.host_name || 'Alguém'} convidou você para "${m.title || 'uma reunião'}"`,
    type: 'info',
    action_label: 'Ver reunião',
    action_href: '/meetings',
  }))
  await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
    method: 'POST',
    headers: { ...h, Prefer: 'return=minimal' },
    body: JSON.stringify(notifs),
  })

  return NextResponse.json({ ok: true, invited: userIds.length })
}
