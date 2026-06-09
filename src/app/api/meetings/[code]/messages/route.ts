import { NextResponse, type NextRequest } from 'next/server'
import { getMeeting, isExpired, SUPABASE_URL, sbHeaders } from '@/lib/livekit-server'

// GET — histórico de mensagens da reunião (público).
// Se a reunião expirou/não existe, apaga as mensagens e retorna vazio.
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const m = await getMeeting(params.code)
  if (!m || isExpired(m)) {
    fetch(`${SUPABASE_URL}/rest/v1/meeting_messages?meeting_code=eq.${encodeURIComponent(params.code)}`, { method: 'DELETE', headers: sbHeaders() }).catch(() => {})
    return NextResponse.json([], { status: 200 })
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/meeting_messages?select=id,sender_id,sender_name,text,created_at&meeting_code=eq.${encodeURIComponent(params.code)}&order=created_at.asc&limit=300`,
    { headers: sbHeaders(), cache: 'no-store' },
  )
  if (!res.ok) return NextResponse.json([], { status: 200 })
  return NextResponse.json(await res.json())
}

// POST — salva uma mensagem (público, escopo pela reunião)
export async function POST(request: NextRequest, { params }: { params: { code: string } }) {
  const m = await getMeeting(params.code)
  if (!m) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (isExpired(m)) return NextResponse.json({ error: 'expired' }, { status: 410 })

  const body = await request.json().catch(() => ({}))
  const text: string = (body.text || '').toString().trim().slice(0, 2000)
  if (!text) return NextResponse.json({ error: 'empty' }, { status: 400 })

  const res = await fetch(`${SUPABASE_URL}/rest/v1/meeting_messages`, {
    method: 'POST',
    headers: { ...sbHeaders(), Prefer: 'return=minimal' },
    body: JSON.stringify({
      meeting_code: m.code,
      sender_id: (body.identity || '').toString().slice(0, 120),
      sender_name: (body.name || 'Convidado').toString().slice(0, 80),
      text,
    }),
  })
  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
