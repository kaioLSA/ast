import { NextResponse, type NextRequest } from 'next/server'
import { sbSelect, sbInsert } from '@/lib/utils/sb'
import { evoFetch } from '@/lib/utils/evo-fetch'
import { summarizeWeek, formatWeeklyMessage, type WeeklySummaryResult } from '@/lib/ai/summarize'

const CRON_SECRET  = process.env.CRON_SECRET ?? 'cron-startsette-2024'
const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE ?? ''

export const dynamic = 'force-dynamic'
export const maxDuration = 300

interface Setting { company_id: string; group_id: string; group_name: string }
interface Daily { summary_date: string; content: string }
interface PrevWeekly { content: WeeklySummaryResult }

// Semana anterior (segunda a domingo) em datas BRT — roda numa segunda 6h
function lastWeekRange() {
  const now = new Date()
  const brt = new Date(now.getTime() - 3 * 3600 * 1000)
  const today = new Date(Date.UTC(brt.getUTCFullYear(), brt.getUTCMonth(), brt.getUTCDate()))
  const end = new Date(today.getTime() - 1 * 86400000)  // ontem (domingo)
  const start = new Date(end.getTime() - 6 * 86400000)  // segunda anterior
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const label = (d: Date) => `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`
  return { startStr: fmt(start), endStr: fmt(end), weekLabel: `${label(start)} a ${label(end)}` }
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('secret') !== CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const settings = await sbSelect<Setting>(
    'group_summary_settings',
    'enabled=is.true&select=company_id,group_id,group_name',
  )

  const { startStr, endStr, weekLabel } = lastWeekRange()
  let processed = 0
  let skipped = 0
  let tasksCreated = 0

  for (const s of settings) {
    try {
      const dailies = await sbSelect<Daily>(
        'daily_summaries',
        `company_id=eq.${s.company_id}` +
          `&group_id=eq.${encodeURIComponent(s.group_id)}` +
          `&summary_date=gte.${startStr}&summary_date=lte.${endStr}` +
          `&order=summary_date.asc&select=summary_date,content`,
      )

      // Nenhum resumo diário na semana → não há o que consolidar
      if (!dailies.length) { skipped++; continue }

      // Pendências da semana anterior (para follow-up)
      const prev = await sbSelect<PrevWeekly>(
        'weekly_summaries',
        `company_id=eq.${s.company_id}` +
          `&group_id=eq.${encodeURIComponent(s.group_id)}` +
          `&order=created_at.desc&limit=1&select=content`,
      )
      const prevPendencias = prev[0]?.content?.pendencias ?? []

      const result = await summarizeWeek(s.group_name || 'Grupo', dailies, prevPendencias)

      // Salva o relatório semanal
      const saved = await sbInsert<{ id: string }>('weekly_summaries', {
        company_id: s.company_id,
        group_id: s.group_id,
        group_name: s.group_name || '',
        week_start: startStr,
        week_end: endStr,
        content: result,
      })
      const summaryId = saved[0]?.id ?? null

      // Action items → tasks na aba Task
      for (const a of result.action_items) {
        if (!a.tarefa?.trim()) continue
        const descParts: string[] = []
        if (a.prazo && a.prazo !== 'Não definido') descParts.push(`Prazo: ${a.prazo}`)
        await sbInsert('tasks', {
          company_id: s.company_id,
          group_id: s.group_id,
          group_name: s.group_name || '',
          title: a.tarefa.trim(),
          description: descParts.join(' • '),
          responsible: a.responsavel && a.responsavel !== 'Não definido' ? a.responsavel : '',
          status: 'pending',
          priority: 'medium',
          source: 'weekly_summary',
          source_summary_id: summaryId,
        })
        tasksCreated++
      }

      // Envia o relatório formatado no grupo
      const message = formatWeeklyMessage(s.group_name || 'Grupo', weekLabel, result)
      try {
        await evoFetch.post(`/message/sendText/${EVO_INSTANCE}`, {
          number: s.group_id,
          text: message,
        })
      } catch (err) {
        console.error(`[Weekly Summary] Falha ao enviar no grupo ${s.group_id}:`, err)
      }

      processed++
    } catch (err) {
      console.error(`[Weekly Summary] Erro no grupo ${s.group_id}:`, err)
    }
  }

  return NextResponse.json({ ok: true, week: weekLabel, processed, skipped, tasksCreated })
}
