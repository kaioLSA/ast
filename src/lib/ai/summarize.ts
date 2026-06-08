// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  Geração de resumos (diário e semanal) de grupos WhatsApp via Claude Haiku  ║
// ╚══════════════════════════════════════════════════════════════════════════╝

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? ''
const MODEL = 'claude-haiku-4-5-20251001'

export interface CapturedMessage {
  sender_name: string
  message_text: string
  message_type: string
  transcription?: string
  message_timestamp: string
}

export interface DailySummaryResult {
  resumo: string
  critico: boolean
  nota_critica: string
}

export interface ActionItem {
  tarefa: string
  responsavel: string
  prazo: string
}

export interface WeeklySummaryResult {
  resumo_geral: string
  action_items: ActionItem[]
  decisoes: string[]
  pendencias: string[]
  follow_up: string[]
  clima: string
}

// ── Chamada base ao Claude ─────────────────────────────────────────────────────
async function callHaiku(system: string, userContent: string, maxTokens = 1500): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userContent }],
    }),
  })

  if (!res.ok) throw new Error(`Claude API error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const blocks = (data.content ?? []) as Array<{ type: string; text?: string }>
  return blocks.filter(b => b.type === 'text').map(b => b.text ?? '').join('').trim()
}

// ── Extrai JSON de uma resposta (lida com ```json ... ``` ou texto solto) ───────
function parseJson<T>(raw: string, fallback: T): T {
  try {
    let s = raw.trim()
    const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fence) s = fence[1].trim()
    const first = s.indexOf('{')
    const last = s.lastIndexOf('}')
    if (first >= 0 && last > first) s = s.slice(first, last + 1)
    return JSON.parse(s) as T
  } catch {
    return fallback
  }
}

// ── Formata mensagens para o prompt ─────────────────────────────────────────────
function formatMessages(messages: CapturedMessage[]): string {
  return messages
    .map(m => {
      const time = new Date(m.message_timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
      })
      const text = m.message_type === 'audio' && m.transcription
        ? `[áudio transcrito] ${m.transcription}`
        : m.message_text
      return `[${time}] ${m.sender_name || 'Desconhecido'}: ${text}`
    })
    .join('\n')
}

// ── Resumo DIÁRIO ───────────────────────────────────────────────────────────────
export async function summarizeDay(
  groupName: string,
  messages: CapturedMessage[],
): Promise<DailySummaryResult> {
  const system = `Você é um assistente que resume conversas de grupos de WhatsApp de uma empresa.
Responda SEMPRE em português brasileiro.
Sua tarefa: ler as mensagens de um dia e gerar um resumo conciso e objetivo do que foi discutido, decidido e combinado.
Também identifique se houve algo CRÍTICO que exija atenção imediata (ex: cliente irritado/insatisfeito, prazo estourando, problema grave, urgência real).

Responda APENAS com um JSON válido neste formato exato:
{
  "resumo": "texto do resumo do dia em 2-5 frases objetivas",
  "critico": true ou false,
  "nota_critica": "se critico=true, descreva em 1 frase o que precisa de atenção; senão deixe vazio"
}`

  const user = `Grupo: ${groupName}\n\nMensagens do dia:\n${formatMessages(messages)}`

  const raw = await callHaiku(system, user, 1000)
  return parseJson<DailySummaryResult>(raw, {
    resumo: 'Não foi possível gerar o resumo do dia.',
    critico: false,
    nota_critica: '',
  })
}

// ── Resumo SEMANAL ──────────────────────────────────────────────────────────────
export async function summarizeWeek(
  groupName: string,
  dailySummaries: { summary_date: string; content: string }[],
  previousWeekPendencias: string[],
): Promise<WeeklySummaryResult> {
  const system = `Você é um assistente que consolida o resumo semanal de um grupo de WhatsApp de uma empresa.
Responda SEMPRE em português brasileiro, de forma clara e profissional.

Você receberá os resumos de cada dia da semana e as pendências da semana anterior.
Gere um relatório semanal completo e estruturado.

Responda APENAS com um JSON válido neste formato exato:
{
  "resumo_geral": "visão geral do que foi discutido, feito e o que falta — 3 a 6 frases",
  "action_items": [{ "tarefa": "o que precisa ser feito", "responsavel": "nome de quem ficou responsável ou 'Não definido'", "prazo": "prazo mencionado ou 'Não definido'" }],
  "decisoes": ["decisões que foram batido o martelo durante a semana"],
  "pendencias": ["perguntas ou assuntos que ficaram sem resposta/resolução"],
  "follow_up": ["status das pendências da semana anterior: o que foi resolvido e o que continua em aberto"],
  "clima": "uma frase sobre o clima/sentimento geral do grupo na semana (produtivo, tenso, tranquilo, etc.)"
}

Se alguma seção não tiver conteúdo, retorne array vazio []. Seja específico e útil.`

  const dailyText = dailySummaries
    .map(d => {
      const date = new Date(d.summary_date + 'T12:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: '2-digit',
      })
      return `── ${date} ──\n${d.content}`
    })
    .join('\n\n')

  const prevText = previousWeekPendencias.length
    ? previousWeekPendencias.map(p => `- ${p}`).join('\n')
    : '(nenhuma pendência registrada na semana anterior)'

  const user = `Grupo: ${groupName}\n\n=== RESUMOS DIÁRIOS DA SEMANA ===\n${dailyText}\n\n=== PENDÊNCIAS DA SEMANA ANTERIOR (para follow-up) ===\n${prevText}`

  const raw = await callHaiku(system, user, 2500)
  return parseJson<WeeklySummaryResult>(raw, {
    resumo_geral: 'Não foi possível gerar o resumo semanal.',
    action_items: [],
    decisoes: [],
    pendencias: [],
    follow_up: [],
    clima: '',
  })
}

// ── Formata o relatório semanal como mensagem de WhatsApp ───────────────────────
export function formatWeeklyMessage(groupName: string, weekLabel: string, r: WeeklySummaryResult): string {
  const lines: string[] = [
    '📊 *RESUMO SEMANAL* 📊',
    `_${groupName}_`,
    `🗓️ ${weekLabel}`,
    '',
    '━━━━━━━━━━━━━━━━━━',
    '',
    '*📝 Visão Geral*',
    r.resumo_geral,
  ]

  if (r.action_items.length) {
    lines.push('', '*✅ Tarefas (Action Items)*')
    for (const a of r.action_items) {
      lines.push(`• ${a.tarefa}`)
      const meta: string[] = []
      if (a.responsavel && a.responsavel !== 'Não definido') meta.push(`👤 ${a.responsavel}`)
      if (a.prazo && a.prazo !== 'Não definido') meta.push(`⏰ ${a.prazo}`)
      if (meta.length) lines.push(`   ${meta.join('  ')}`)
    }
  }

  if (r.decisoes.length) {
    lines.push('', '*🎯 Decisões Tomadas*')
    for (const d of r.decisoes) lines.push(`• ${d}`)
  }

  if (r.pendencias.length) {
    lines.push('', '*❓ Pendências (sem resposta)*')
    for (const p of r.pendencias) lines.push(`• ${p}`)
  }

  if (r.follow_up.length) {
    lines.push('', '*🔄 Follow-up da Semana Anterior*')
    for (const f of r.follow_up) lines.push(`• ${f}`)
  }

  if (r.clima) {
    lines.push('', '*🌡️ Clima do Grupo*', r.clima)
  }

  lines.push('', '━━━━━━━━━━━━━━━━━━', '_Gerado automaticamente pela IA da Startsette_')
  return lines.join('\n')
}
