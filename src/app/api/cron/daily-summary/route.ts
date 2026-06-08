import { NextResponse, type NextRequest } from 'next/server'
import { sbSelect, sbUpsert, sbInsert } from '@/lib/utils/sb'
import { summarizeDay, type CapturedMessage } from '@/lib/ai/summarize'

const CRON_SECRET = process.env.CRON_SECRET ?? 'cron-startsette-2024'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

interface Setting { company_id: string; group_id: string; group_name: string }

// Range do dia atual em BRT (UTC-3 fixo) → datas UTC
function brtDayRange() {
  const now = new Date()
  const brt = new Date(now.getTime() - 3 * 3600 * 1000)
  const y = brt.getUTCFullYear(), m = brt.getUTCMonth(), d = brt.getUTCDate()
  const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const startUtc = new Date(Date.UTC(y, m, d, 3, 0, 0))         // 00:00 BRT
  const endUtc = new Date(startUtc.getTime() + 24 * 3600 * 1000) // 00:00 BRT dia seguinte
  return { dateStr, startUtc, endUtc }
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('secret') !== CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const settings = await sbSelect<Setting>(
    'group_summary_settings',
    'enabled=is.true&select=company_id,group_id,group_name',
  )

  const { dateStr, startUtc, endUtc } = brtDayRange()
  let processed = 0
  let skipped = 0
  let critical = 0

  for (const s of settings) {
    try {
      const msgs = await sbSelect<CapturedMessage>(
        'group_messages',
        `company_id=eq.${s.company_id}` +
          `&group_id=eq.${encodeURIComponent(s.group_id)}` +
          `&message_timestamp=gte.${startUtc.toISOString()}` +
          `&message_timestamp=lt.${endUtc.toISOString()}` +
          `&order=message_timestamp.asc&limit=3000` +
          `&select=sender_name,message_text,message_type,transcription,message_timestamp`,
      )

      // Sem mensagens hoje → não gasta token
      if (!msgs.length) { skipped++; continue }

      const result = await summarizeDay(s.group_name || 'Grupo', msgs)

      await sbUpsert(
        'daily_summaries',
        {
          company_id: s.company_id,
          group_id: s.group_id,
          group_name: s.group_name || '',
          summary_date: dateStr,
          content: result.resumo,
          message_count: msgs.length,
          has_critical: result.critico,
          critical_note: result.nota_critica || '',
        },
        'company_id,group_id,summary_date',
      )

      // Alerta crítico → grava no CRM (não envia no grupo)
      if (result.critico && result.nota_critica) {
        await sbInsert('critical_alerts', {
          company_id: s.company_id,
          group_id: s.group_id,
          group_name: s.group_name || '',
          message: result.nota_critica,
          level: 'critical',
          detected_date: dateStr,
        })
        critical++
      }

      processed++
    } catch (err) {
      console.error(`[Daily Summary] Erro no grupo ${s.group_id}:`, err)
    }
  }

  return NextResponse.json({ ok: true, date: dateStr, processed, skipped, critical })
}
