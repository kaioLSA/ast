import { NextResponse, type NextRequest } from 'next/server'
import { TrackType } from 'livekit-server-sdk'
import { webhookReceiver, startAudioTrackEgress } from '@/lib/egress'
import { SUPABASE_URL, sbHeaders } from '@/lib/livekit-server'

export const dynamic = 'force-dynamic'

// Webhook do LiveKit: grava cada faixa de áudio (1 por participante) e marca status.
export async function POST(req: NextRequest) {
  const body = await req.text()
  const auth = req.headers.get('Authorization') || ''

  let event
  try {
    event = await webhookReceiver.receive(body, auth)
  } catch {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  const room = event.room?.name
  if (!room) return NextResponse.json({ ok: true })
  const h = sbHeaders()

  try {
    if (event.event === 'track_published' && event.track?.type === TrackType.AUDIO) {
      const p = event.participant
      const trackSid = event.track.sid
      const safeId = (p?.identity || 'user').replace(/[^a-zA-Z0-9_-]/g, '_')
      const filepath = `/out/${room}/${safeId}__${trackSid}.ogg`

      const info = await startAudioTrackEgress(room, trackSid, filepath)

      await fetch(`${SUPABASE_URL}/rest/v1/meeting_recordings`, {
        method: 'POST',
        headers: { ...h, Prefer: 'return=minimal' },
        body: JSON.stringify({
          meeting_code: room,
          egress_id: info.egressId,
          participant_identity: p?.identity,
          participant_name: p?.name || p?.identity || 'Participante',
          track_id: trackSid,
          filepath,
          status: 'recording',
        }),
      })
      await fetch(`${SUPABASE_URL}/rest/v1/meetings?code=eq.${encodeURIComponent(room)}`, {
        method: 'PATCH',
        headers: { ...h, Prefer: 'return=minimal' },
        body: JSON.stringify({ transcript_status: 'recording' }),
      })
    } else if (event.event === 'room_finished') {
      await fetch(`${SUPABASE_URL}/rest/v1/meeting_recordings?meeting_code=eq.${encodeURIComponent(room)}&status=eq.recording`, {
        method: 'PATCH',
        headers: { ...h, Prefer: 'return=minimal' },
        body: JSON.stringify({ status: 'stopped' }),
      })
      // marca como "gravado" → pronto para transcrever (próxima etapa)
      await fetch(`${SUPABASE_URL}/rest/v1/meetings?code=eq.${encodeURIComponent(room)}&transcript_status=eq.recording`, {
        method: 'PATCH',
        headers: { ...h, Prefer: 'return=minimal' },
        body: JSON.stringify({ transcript_status: 'recorded' }),
      })
    }
  } catch (e) {
    console.error('[livekit webhook]', e)
  }

  return NextResponse.json({ ok: true })
}
