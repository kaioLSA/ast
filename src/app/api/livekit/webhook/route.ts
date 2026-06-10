import { NextResponse, type NextRequest } from 'next/server'
import { TrackType } from 'livekit-server-sdk'
import { webhookReceiver, startAudioTrackEgress } from '@/lib/egress'
import { SUPABASE_URL, sbHeaders } from '@/lib/livekit-server'
import { maybeAutoTranscribe } from '@/lib/meeting-transcribe'

export const dynamic = 'force-dynamic'

// Webhook do LiveKit: grava cada faixa de áudio (1 por participante), encerra a reunião
// quando a sala fecha e dispara a transcrição automática.
export async function POST(req: NextRequest) {
  const body = await req.text()
  const auth = req.headers.get('Authorization') || ''

  let event
  try {
    event = await webhookReceiver.receive(body, auth)
  } catch {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  // egress_ended não traz event.room — pega o nome da sala do egressInfo
  const room = event.room?.name ?? event.egressInfo?.roomName
  if (!room) return NextResponse.json({ ok: true })
  const h = sbHeaders()
  const enc = encodeURIComponent(room)

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
      await fetch(`${SUPABASE_URL}/rest/v1/meetings?code=eq.${enc}`, {
        method: 'PATCH',
        headers: { ...h, Prefer: 'return=minimal' },
        body: JSON.stringify({ transcript_status: 'recording' }),
      })
    } else if (event.event === 'egress_ended') {
      // gravação de UMA faixa finalizou (arquivo já está no disco, flushed)
      const egressId = event.egressInfo?.egressId
      if (egressId) {
        await fetch(`${SUPABASE_URL}/rest/v1/meeting_recordings?egress_id=eq.${encodeURIComponent(egressId)}`, {
          method: 'PATCH',
          headers: { ...h, Prefer: 'return=minimal' },
          body: JSON.stringify({ status: 'stopped' }),
        })
      }
      // se a reunião já encerrou e todas as faixas finalizaram → transcreve
      void maybeAutoTranscribe(room)
    } else if (event.event === 'room_finished') {
      // sala fechou (host encerrou ou ficou vazia) → reunião encerrada
      await fetch(`${SUPABASE_URL}/rest/v1/meetings?code=eq.${enc}`, {
        method: 'PATCH',
        headers: { ...h, Prefer: 'return=minimal' },
        body: JSON.stringify({ active: false, ended_at: new Date().toISOString() }),
      })
      // marca como "gravado" (se ainda estava gravando) → pronto para transcrever
      await fetch(`${SUPABASE_URL}/rest/v1/meetings?code=eq.${enc}&transcript_status=eq.recording`, {
        method: 'PATCH',
        headers: { ...h, Prefer: 'return=minimal' },
        body: JSON.stringify({ transcript_status: 'recorded' }),
      })
      // privacidade: apaga o chat da sala ao encerrar
      await fetch(`${SUPABASE_URL}/rest/v1/meeting_messages?meeting_code=eq.${enc}`, { method: 'DELETE', headers: h })
      // dispara a transcrição automática (espera as faixas finalizarem via egress_ended)
      void maybeAutoTranscribe(room)
    }
  } catch (e) {
    console.error('[livekit webhook]', e)
  }

  return NextResponse.json({ ok: true })
}
