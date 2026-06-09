import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_URL, sbHeaders } from '@/lib/livekit-server'

const CRON_SECRET = process.env.CRON_SECRET ?? 'cron-startsette-2024'

export const dynamic = 'force-dynamic'

// Apaga mensagens/pedidos de reuniões expiradas e remove reuniões antigas.
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('secret') !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const nowISO = new Date().toISOString()
  const result = { expired: 0, messagesDeleted: false, requestsDeleted: false, oldMeetingsDeleted: false }

  try {
    // 1) reuniões expiradas (link vencido ou desativado)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/meetings?select=code&or=(expires_at.lt.${nowISO},active.is.false)&limit=1000`,
      { headers: sbHeaders(), cache: 'no-store' },
    )
    const rows: Array<{ code: string }> = res.ok ? await res.json() : []
    const codes = rows.map(r => r.code).filter(Boolean)
    result.expired = codes.length

    if (codes.length) {
      const inList = `in.(${codes.map(c => `"${c}"`).join(',')})`
      const delMsg = await fetch(`${SUPABASE_URL}/rest/v1/meeting_messages?meeting_code=${encodeURIComponent(inList)}`, { method: 'DELETE', headers: sbHeaders() })
      result.messagesDeleted = delMsg.ok
      const delReq = await fetch(`${SUPABASE_URL}/rest/v1/meeting_requests?meeting_code=${encodeURIComponent(inList)}`, { method: 'DELETE', headers: sbHeaders() })
      result.requestsDeleted = delReq.ok
    }

    // 2) remove as reuniões expiradas há mais de 7 dias (faxina)
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
    const delOld = await fetch(`${SUPABASE_URL}/rest/v1/meetings?expires_at=lt.${weekAgo}`, { method: 'DELETE', headers: sbHeaders() })
    result.oldMeetingsDeleted = delOld.ok

    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'erro'
    return NextResponse.json({ error: message, ...result }, { status: 500 })
  }
}
