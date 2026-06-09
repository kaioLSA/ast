import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { getMeeting, SUPABASE_URL, sbHeaders } from '@/lib/livekit-server'
import { transcribeSegments } from '@/lib/utils/whisper'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// POST — transcreve as gravações (1 por participante) e salva segmentos com o nome de cada um
export async function POST(_req: Request, { params }: { params: { code: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const m = await getMeeting(params.code)
  if (!m) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (m.host_user_id !== user.id) return NextResponse.json({ error: 'not_host' }, { status: 403 })

  const h = sbHeaders()
  const code = encodeURIComponent(m.code)

  await fetch(`${SUPABASE_URL}/rest/v1/meetings?code=eq.${code}`, {
    method: 'PATCH', headers: { ...h, Prefer: 'return=minimal' },
    body: JSON.stringify({ transcript_status: 'processing' }),
  })

  // gravações da reunião
  const recRes = await fetch(
    `${SUPABASE_URL}/rest/v1/meeting_recordings?select=participant_name,participant_identity,filepath&meeting_code=eq.${code}`,
    { headers: h, cache: 'no-store' },
  )
  const recs: Array<{ participant_name: string; participant_identity: string; filepath: string }> = recRes.ok ? await recRes.json() : []

  // resolve o nome real a partir do identity (host-<userId> / guest-<requestId>)
  async function resolveSpeaker(identity: string, fallback: string): Promise<string> {
    try {
      if (identity?.startsWith('host-')) {
        const uid = identity.slice(5)
        const r = await fetch(`${SUPABASE_URL}/rest/v1/crm_users?select=name&id=eq.${uid}&limit=1`, { headers: h, cache: 'no-store' })
        const rows = r.ok ? await r.json() : []
        if (rows?.[0]?.name) return rows[0].name
      } else if (identity?.startsWith('guest-')) {
        const rid = identity.slice(6)
        const r = await fetch(`${SUPABASE_URL}/rest/v1/meeting_requests?select=guest_name&id=eq.${rid}&limit=1`, { headers: h, cache: 'no-store' })
        const rows = r.ok ? await r.json() : []
        if (rows?.[0]?.guest_name) return rows[0].guest_name
      }
    } catch { /* ignore */ }
    // limpa o fallback (remove prefixo + uuid feio)
    if (fallback?.startsWith('host-')) return 'Anfitrião'
    if (fallback?.startsWith('guest-')) return 'Convidado'
    return fallback || 'Participante'
  }

  // limpa transcrição anterior
  await fetch(`${SUPABASE_URL}/rest/v1/meeting_transcript_segments?meeting_code=eq.${code}`, { method: 'DELETE', headers: h })

  const allSegs: Array<{ meeting_code: string; speaker: string; text: string; start_ms: number }> = []
  for (const r of recs) {
    const speaker = await resolveSpeaker(r.participant_identity || '', r.participant_name)
    const hostPath = (r.filepath || '').replace(/^\/out/, '/docker/livekit/recordings')
    const segs = await transcribeSegments(hostPath)
    for (const s of segs) {
      allSegs.push({
        meeting_code: m.code,
        speaker,
        text: s.text,
        start_ms: Math.round((s.start || 0) * 1000),
      })
    }
  }

  if (allSegs.length) {
    // insere em lotes
    for (let i = 0; i < allSegs.length; i += 200) {
      await fetch(`${SUPABASE_URL}/rest/v1/meeting_transcript_segments`, {
        method: 'POST', headers: { ...h, Prefer: 'return=minimal' },
        body: JSON.stringify(allSegs.slice(i, i + 200)),
      })
    }
  }

  await fetch(`${SUPABASE_URL}/rest/v1/meetings?code=eq.${code}`, {
    method: 'PATCH', headers: { ...h, Prefer: 'return=minimal' },
    body: JSON.stringify({ transcript_status: allSegs.length ? 'ready' : 'empty' }),
  })

  return NextResponse.json({ ok: true, segments: allSegs.length })
}
