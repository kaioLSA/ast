import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { getMeeting, SUPABASE_URL, sbHeaders } from '@/lib/livekit-server'

export const dynamic = 'force-dynamic'

// GET — transcrição (segmentos por pessoa) + status
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const m = await getMeeting(params.code)
  if (!m) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (m.company_id && m.company_id !== user.company_id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/meeting_transcript_segments?select=speaker,text,start_ms&meeting_code=eq.${encodeURIComponent(m.code)}&order=start_ms.asc&limit=3000`,
    { headers: sbHeaders(), cache: 'no-store' },
  )
  const segments = res.ok ? await res.json() : []
  return NextResponse.json({
    status: m.transcript_status ?? 'none',
    title: m.title,
    isHost: m.host_user_id === user.id,
    summary: m.summary ?? null,
    segments,
  })
}
