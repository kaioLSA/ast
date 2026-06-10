import { SUPABASE_URL, sbHeaders, getMeeting } from '@/lib/livekit-server'
import { transcribeSegments } from '@/lib/utils/whisper'

// Resolve o nome real do participante a partir do identity (host-<userId> / guest-<requestId>)
async function resolveSpeaker(identity: string, fallback: string): Promise<string> {
  const h = sbHeaders()
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
  if (fallback?.startsWith('host-')) return 'Anfitrião'
  if (fallback?.startsWith('guest-')) return 'Convidado'
  return fallback || 'Participante'
}

// Transcreve as gravações (1 por participante) e salva os segmentos com o nome de cada um.
// Usado tanto pelo botão manual quanto pela transcrição automática ao encerrar.
export async function runTranscription(code: string): Promise<{ segments: number }> {
  const h = sbHeaders()
  const enc = encodeURIComponent(code)

  await fetch(`${SUPABASE_URL}/rest/v1/meetings?code=eq.${enc}`, {
    method: 'PATCH', headers: { ...h, Prefer: 'return=minimal' },
    body: JSON.stringify({ transcript_status: 'processing' }),
  })

  const recRes = await fetch(
    `${SUPABASE_URL}/rest/v1/meeting_recordings?select=participant_name,participant_identity,filepath&meeting_code=eq.${enc}`,
    { headers: h, cache: 'no-store' },
  )
  const recs: Array<{ participant_name: string; participant_identity: string; filepath: string }> = recRes.ok ? await recRes.json() : []

  // limpa transcrição anterior (re-transcrição)
  await fetch(`${SUPABASE_URL}/rest/v1/meeting_transcript_segments?meeting_code=eq.${enc}`, { method: 'DELETE', headers: h })

  const allSegs: Array<{ meeting_code: string; speaker: string; text: string; start_ms: number }> = []
  for (const r of recs) {
    const speaker = await resolveSpeaker(r.participant_identity || '', r.participant_name)
    const hostPath = (r.filepath || '').replace(/^\/out/, '/docker/livekit/recordings')
    try {
      const segs = await transcribeSegments(hostPath)
      for (const s of segs) {
        allSegs.push({ meeting_code: code, speaker, text: s.text, start_ms: Math.round((s.start || 0) * 1000) })
      }
    } catch { /* arquivo ausente/ilegível — pula esse participante */ }
  }

  if (allSegs.length) {
    for (let i = 0; i < allSegs.length; i += 200) {
      await fetch(`${SUPABASE_URL}/rest/v1/meeting_transcript_segments`, {
        method: 'POST', headers: { ...h, Prefer: 'return=minimal' },
        body: JSON.stringify(allSegs.slice(i, i + 200)),
      })
    }
  }

  await fetch(`${SUPABASE_URL}/rest/v1/meetings?code=eq.${enc}`, {
    method: 'PATCH', headers: { ...h, Prefer: 'return=minimal' },
    body: JSON.stringify({ transcript_status: allSegs.length ? 'ready' : 'empty' }),
  })

  return { segments: allSegs.length }
}

// Dispara a transcrição automática quando a reunião terminou E todas as gravações finalizaram.
// É idempotente: usa um PATCH com filtro para "reivindicar" o trabalho (evita rodar 2x com webhooks duplicados).
export async function maybeAutoTranscribe(code: string): Promise<void> {
  const h = sbHeaders()
  const enc = encodeURIComponent(code)

  const m = await getMeeting(code)
  if (!m) return
  // só transcreve depois que a reunião encerrou
  if (m.active) return

  // todas as gravações precisam ter finalizado (egress_ended → status 'stopped')
  const recRes = await fetch(
    `${SUPABASE_URL}/rest/v1/meeting_recordings?select=status&meeting_code=eq.${enc}`,
    { headers: h, cache: 'no-store' },
  )
  const recs: Array<{ status: string }> = recRes.ok ? await recRes.json() : []
  if (recs.length > 0 && !recs.every(r => r.status === 'stopped')) return

  // reivindica o trabalho de forma atômica (só 1 webhook segue adiante)
  const claim = await fetch(
    `${SUPABASE_URL}/rest/v1/meetings?code=eq.${enc}&transcript_status=not.in.(processing,ready,empty)`,
    { method: 'PATCH', headers: { ...h, Prefer: 'return=representation' }, body: JSON.stringify({ transcript_status: 'processing' }) },
  )
  const claimed = claim.ok ? await claim.json() : []
  if (!Array.isArray(claimed) || claimed.length === 0) return

  await runTranscription(code)
}
