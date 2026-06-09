import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { SUPABASE_URL, sbHeaders, generateMeetingCode } from '@/lib/livekit-server'

// POST — cria uma nova reunião (host = usuário logado). Pode agendar (scheduled_at).
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const title: string = (body.title || 'Reunião').toString().slice(0, 120)
  const hours = Math.min(Math.max(Number(body.hours) || 12, 1), 72)

  let scheduledISO: string | null = null
  let baseMs = Date.now()
  if (body.scheduled_at) {
    const d = new Date(body.scheduled_at)
    if (!isNaN(d.getTime()) && d.getTime() > Date.now()) { scheduledISO = d.toISOString(); baseMs = d.getTime() }
  }
  const expires_at = new Date(baseMs + hours * 3600 * 1000).toISOString()
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
      scheduled_at: scheduledISO,
    }),
  })

  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 })
  const rows = await res.json()
  return NextResponse.json(rows[0] ?? rows, { status: 201 })
}

// GET — reuniões do host + reuniões em que fui convidado
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // hospedadas
  const hostedRes = await fetch(
    `${SUPABASE_URL}/rest/v1/meetings?select=*&host_user_id=eq.${user.id}&order=created_at.desc&limit=100`,
    { headers: sbHeaders(), cache: 'no-store' },
  )
  const hosted = hostedRes.ok ? await hostedRes.json() : []

  // convidado
  const invRes = await fetch(
    `${SUPABASE_URL}/rest/v1/meeting_invites?select=meeting_code&user_id=eq.${user.id}&limit=200`,
    { headers: sbHeaders(), cache: 'no-store' },
  )
  const invites: Array<{ meeting_code: string }> = invRes.ok ? await invRes.json() : []
  let invited: Array<{ id: string; code: string }> = []
  if (invites.length) {
    const inList = `in.(${invites.map(i => `"${i.meeting_code}"`).join(',')})`
    const invMeetRes = await fetch(
      `${SUPABASE_URL}/rest/v1/meetings?select=*&code=${encodeURIComponent(inList)}&order=created_at.desc&limit=100`,
      { headers: sbHeaders(), cache: 'no-store' },
    )
    invited = invMeetRes.ok ? await invMeetRes.json() : []
  }

  // merge único, marcando convidadas
  const byId = new Map<string, Record<string, unknown>>()
  for (const m of hosted) byId.set(m.id, { ...m, role: 'host' })
  for (const m of invited) if (!byId.has(m.id)) byId.set(m.id, { ...m, role: 'guest' })
  const all = Array.from(byId.values()).sort((a, b) =>
    new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime())

  return NextResponse.json(all)
}
