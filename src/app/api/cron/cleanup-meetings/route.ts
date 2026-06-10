import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_URL, sbHeaders } from '@/lib/livekit-server'
import { maybeAutoTranscribe } from '@/lib/meeting-transcribe'

const CRON_SECRET = process.env.CRON_SECRET ?? 'cron-startsette-2024'

export const dynamic = 'force-dynamic'

// Apaga mensagens/pedidos de reuniões expiradas e remove reuniões antigas.
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('secret') !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = { ended: 0, messagesDeleted: false, requestsDeleted: false, oldMeetingsDeleted: false, retranscribed: 0 }

  try {
    // 1) reuniões encerradas (active = false) → apaga chat e pedidos (privacidade)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/meetings?select=code&active=is.false&limit=1000`,
      { headers: sbHeaders(), cache: 'no-store' },
    )
    const rows: Array<{ code: string }> = res.ok ? await res.json() : []
    const codes = rows.map(r => r.code).filter(Boolean)
    result.ended = codes.length

    if (codes.length) {
      const inList = `in.(${codes.map(c => `"${c}"`).join(',')})`
      const delMsg = await fetch(`${SUPABASE_URL}/rest/v1/meeting_messages?meeting_code=${encodeURIComponent(inList)}`, { method: 'DELETE', headers: sbHeaders() })
      result.messagesDeleted = delMsg.ok
      const delReq = await fetch(`${SUPABASE_URL}/rest/v1/meeting_requests?meeting_code=${encodeURIComponent(inList)}`, { method: 'DELETE', headers: sbHeaders() })
      result.requestsDeleted = delReq.ok
    }

    // 2) rede de segurança: reuniões encerradas há +3min e ainda não transcritas
    //    (caso algum webhook egress_ended não tenha chegado) → força e transcreve
    const cutoff = new Date(Date.now() - 3 * 60 * 1000).toISOString()
    const stuckRes = await fetch(
      `${SUPABASE_URL}/rest/v1/meetings?select=code&active=is.false&transcript_status=eq.recorded&ended_at=lt.${cutoff}&limit=100`,
      { headers: sbHeaders(), cache: 'no-store' },
    )
    const stuck: Array<{ code: string }> = stuckRes.ok ? await stuckRes.json() : []
    for (const s of stuck) {
      await fetch(`${SUPABASE_URL}/rest/v1/meeting_recordings?meeting_code=eq.${encodeURIComponent(s.code)}&status=eq.recording`, {
        method: 'PATCH', headers: { ...sbHeaders(), Prefer: 'return=minimal' }, body: JSON.stringify({ status: 'stopped' }),
      })
      void maybeAutoTranscribe(s.code)
    }
    result.retranscribed = stuck.length

    // 3) remove reuniões encerradas há mais de 30 dias (faxina; transcrição/relatório já ficam salvos)
    const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    const delOld = await fetch(`${SUPABASE_URL}/rest/v1/meetings?ended_at=lt.${monthAgo}`, { method: 'DELETE', headers: sbHeaders() })
    result.oldMeetingsDeleted = delOld.ok

    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: message, ...result }, { status: 500 })
  }
}
