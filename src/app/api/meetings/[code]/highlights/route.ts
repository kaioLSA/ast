import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { getMeeting, isExpired, SUPABASE_URL, sbHeaders } from '@/lib/livekit-server'

// POST — marca um destaque na reunião (público: qualquer participante na sala)
export async function POST(request: NextRequest, { params }: { params: { code: string } }) {
  const m = await getMeeting(params.code)
  if (!m) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (isExpired(m)) return NextResponse.json({ error: 'expired' }, { status: 410 })

  const body = await request.json().catch(() => ({}))
  const author: string = (body.author || 'Participante').toString().slice(0, 80)
  const label: string = (body.label || '').toString().slice(0, 200)

  const res = await fetch(`${SUPABASE_URL}/rest/v1/meeting_highlights`, {
    method: 'POST', headers: { ...sbHeaders(), Prefer: 'return=minimal' },
    body: JSON.stringify({ meeting_code: m.code, author, label }),
  })
  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}

// GET — lista os destaques (autenticado, mesma empresa)
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json([], { status: 200 })
  const m = await getMeeting(params.code)
  if (!m || (m.company_id && m.company_id !== user.company_id)) return NextResponse.json([], { status: 200 })

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/meeting_highlights?select=author,label,created_at&meeting_code=eq.${encodeURIComponent(m.code)}&order=created_at.asc&limit=200`,
    { headers: sbHeaders(), cache: 'no-store' },
  )
  return NextResponse.json(res.ok ? await res.json() : [])
}
