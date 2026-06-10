import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { getMeeting, SUPABASE_URL, sbHeaders } from '@/lib/livekit-server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? ''
const MODEL = 'claude-haiku-4-5-20251001'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

interface Summary {
  resumo: string
  topicos: string[]
  action_items: { tarefa: string; responsavel?: string }[]
  decisoes: string[]
}

// POST — gera (com IA, sob demanda) resumo + tópicos + action items da transcrição
export async function POST(_req: Request, { params }: { params: { code: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const m = await getMeeting(params.code)
  if (!m) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (m.company_id && m.company_id !== user.company_id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  if (!ANTHROPIC_API_KEY) return NextResponse.json({ error: 'IA não configurada' }, { status: 500 })

  const h = sbHeaders()
  const segRes = await fetch(
    `${SUPABASE_URL}/rest/v1/meeting_transcript_segments?select=speaker,text&meeting_code=eq.${encodeURIComponent(m.code)}&order=start_ms.asc&limit=3000`,
    { headers: h, cache: 'no-store' },
  )
  const segs: Array<{ speaker: string; text: string }> = segRes.ok ? await segRes.json() : []
  if (segs.length === 0) return NextResponse.json({ error: 'sem_transcricao' }, { status: 400 })

  const transcript = segs.map(s => `${s.speaker}: ${s.text}`).join('\n').slice(0, 24000)

  const system = `Você é analista de reuniões da Start Sette. Receberá a transcrição de uma reunião (com o nome de quem falou) e deve resumir em português brasileiro.

Responda APENAS com um JSON válido, sem texto extra, neste formato:
{
  "resumo": "3 a 5 linhas com o panorama da reunião",
  "topicos": ["tópico 1", "tópico 2"],
  "action_items": [{"tarefa": "...", "responsavel": "nome ou vazio"}],
  "decisoes": ["decisão 1"]
}
Seja objetivo e fiel à transcrição. Se algo não aparecer, retorne lista vazia.`

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system,
        messages: [{ role: 'user', content: `Transcrição:\n\n${transcript}` }],
      }),
    })
    if (!apiRes.ok) return NextResponse.json({ error: `IA: ${await apiRes.text()}` }, { status: 502 })
    const data = await apiRes.json()
    const raw: string = data?.content?.[0]?.text ?? ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ error: 'Resposta inesperada da IA' }, { status: 502 })
    const summary = JSON.parse(match[0]) as Summary

    await fetch(`${SUPABASE_URL}/rest/v1/meetings?code=eq.${encodeURIComponent(m.code)}`, {
      method: 'PATCH', headers: { ...h, Prefer: 'return=minimal' },
      body: JSON.stringify({ summary }),
    })

    // também gera um relatório em Task → Relatórios (regenerável: apaga o anterior)
    if (m.company_id) {
      try {
        const today = new Date().toISOString().slice(0, 10)
        const content = {
          resumo_geral: summary.resumo || '',
          topicos: summary.topicos || [],
          action_items: (summary.action_items || []).map(a => ({
            tarefa: a.tarefa,
            responsavel: a.responsavel || 'Não definido',
            prazo: 'Não definido',
          })),
          decisoes: summary.decisoes || [],
          pendencias: [],
          follow_up: [],
          clima: '',
        }
        await fetch(`${SUPABASE_URL}/rest/v1/weekly_summaries?ref_code=eq.${encodeURIComponent(m.code)}&source=eq.meeting`, { method: 'DELETE', headers: h })
        await fetch(`${SUPABASE_URL}/rest/v1/weekly_summaries`, {
          method: 'POST', headers: { ...h, Prefer: 'return=minimal' },
          body: JSON.stringify({
            company_id: m.company_id,
            group_id: m.code,
            group_name: m.title || 'Reunião',
            week_start: today,
            week_end: today,
            content,
            source: 'meeting',
            ref_code: m.code,
          }),
        })
      } catch { /* relatório é best-effort */ }
    }

    return NextResponse.json({ summary })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'erro' }, { status: 500 })
  }
}
