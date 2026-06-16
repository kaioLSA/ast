/**
 * Helpers compartilhados para ler leads dos formulários (Lead Ads) do Meta.
 *
 * Por que existe: o Meta NÃO edita um formulário publicado — ao "editar" ele cria
 * uma nova versão (sufixo "(vN)") com um novo ID e, muitas vezes, novas chaves de
 * campo localizadas (ex.: `whatsapp_number` -> `número_do_whatsapp`,
 * `full_name` -> `nome_completo`). Para aguentar todas as versões sem mexer no
 * código a cada edição, aqui a gente:
 *   1. descobre os formulários da página dinamicamente (nada de IDs fixos);
 *   2. classifica cada campo pelo TIPO da pergunta (FULL_NAME/EMAIL/PHONE/...),
 *      não pela chave — assim nome/telefone/email são extraídos corretamente
 *      mesmo com chaves localizadas, e as perguntas novas viram "respostas".
 */

const GRAPH = 'https://graph.facebook.com/v19.0'
const META_TOKEN = process.env.META_ACCESS_TOKEN ?? ''
export const META_PAGE_ID = '483909614807424' // Página Start Sette

// ── Tipos ─────────────────────────────────────────────────────────────────────
export interface MetaQuestion {
  label: string
  type: string
  /** chave da opção -> texto legível (só para perguntas de múltipla escolha) */
  options: Map<string, string>
}

export interface MetaField {
  name: string
  values: string[]
}

export interface ParsedLead {
  name: string
  /** telefone formatado: (xx) xxxxx-xxxx */
  phone: string
  /** telefone só com dígitos, como veio do Meta */
  rawPhone: string
  email: string
  answers: { question: string; answer: string }[]
}

// Tipos de pergunta padrão do Meta (o resto cai em "resposta")
const NAME_TYPES = new Set(['FULL_NAME', 'FIRST_NAME', 'LAST_NAME'])
const PHONE_TYPES = new Set(['PHONE', 'PHONE_NUMBER', 'WHATSAPP_NUMBER'])
const EMAIL_TYPES = new Set(['EMAIL'])

// ── Token da página ─────────────────────────────────────────────────────────--
export async function getPageToken(): Promise<string> {
  const res = await fetch(`${GRAPH}/me/accounts?access_token=${META_TOKEN}`)
  if (!res.ok) return ''
  const data = await res.json()
  const page = data.data?.find((p: { id: string; access_token: string }) => p.id === META_PAGE_ID)
  return page?.access_token ?? ''
}

// ── Lista todos os formulários da página (descoberta dinâmica) ─────────────────
export async function listPageForms(pageToken: string): Promise<{ id: string; name: string }[]> {
  const res = await fetch(
    `${GRAPH}/${META_PAGE_ID}/leadgen_forms?fields=id,name&limit=100&access_token=${pageToken}`
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.data ?? []).map((f: { id: string; name: string }) => ({ id: f.id, name: f.name }))
}

function buildQuestionMap(rawQuestions: unknown): Map<string, MetaQuestion> {
  const map = new Map<string, MetaQuestion>()
  const questions = (rawQuestions ?? []) as {
    key?: string
    label?: string
    type?: string
    options?: { key: string; value: string }[]
  }[]
  for (const q of questions) {
    const key = (q.key ?? '').toLowerCase()
    if (!key) continue
    const options = new Map<string, string>()
    for (const o of q.options ?? []) options.set(o.key, o.value)
    map.set(key, { label: q.label ?? q.key ?? key, type: (q.type ?? 'CUSTOM').toUpperCase(), options })
  }
  return map
}

// ── Detalhes de um formulário: nome + perguntas (com tipos e opções) ───────────
export async function getForm(
  formId: string,
  token: string
): Promise<{ name: string; questions: Map<string, MetaQuestion> }> {
  const res = await fetch(
    `${GRAPH}/${formId}?fields=name,questions{key,label,type,options}&access_token=${token}`
  )
  if (!res.ok) return { name: formId, questions: new Map() }
  const data = await res.json()
  return { name: data.name ?? formId, questions: buildQuestionMap(data.questions) }
}

// ── Fallback de tipo quando a pergunta não está no mapa ────────────────────────
// Usado só se o mapa de perguntas falhar. Conservador no nome (só chaves exatas)
// para nunca confundir uma pergunta custom (ex.: "qual o nome da clínica?").
function inferType(key: string): string {
  const k = key.toLowerCase()
  if (k === 'email' || k.includes('e-mail') || k.includes('email')) return 'EMAIL'
  if (k.includes('whats') || k.includes('phone') || k.includes('fone') || k.includes('telefone') || k.includes('celular')) return 'WHATSAPP_NUMBER'
  if (['full_name', 'name', 'nome_completo', 'nome', 'first_name', 'last_name'].includes(k)) return 'FULL_NAME'
  return 'CUSTOM'
}

// Limpa o valor de uma resposta quando não há mapa de opções:
// chaves de opção vêm minúsculas com "_"; texto livre fica como o usuário digitou.
function cleanValue(v: string): string {
  if (/[A-Z]/.test(v) || v.includes(' ')) return v // parece texto livre
  if (v.includes('_')) return v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  return v
}

// ── Parse de um lead em campos estruturados ────────────────────────────────────
export function parseLead(fieldData: MetaField[], questions?: Map<string, MetaQuestion>): ParsedLead {
  let name = ''
  let phone = ''
  let email = ''
  const answers: { question: string; answer: string }[] = []

  for (const f of fieldData ?? []) {
    const value = f.values?.[0] ?? ''
    if (!value) continue

    const key = (f.name ?? '').toLowerCase()
    const q = questions?.get(key)
    const type = q?.type ?? inferType(f.name ?? '')

    if (NAME_TYPES.has(type)) {
      name = name ? `${name} ${value}`.trim() : value
    } else if (PHONE_TYPES.has(type)) {
      phone = phone || value
    } else if (EMAIL_TYPES.has(type)) {
      email = email || value
    } else {
      answers.push({
        question: q?.label ?? toTitleCase(f.name ?? ''),
        answer: q?.options.get(value) ?? cleanValue(value),
      })
    }
  }

  return {
    name: name || 'Não informado',
    phone: formatPhone(phone),
    rawPhone: phone,
    email,
    answers,
  }
}

// ── Monta a mensagem do WhatsApp para o grupo ──────────────────────────────────
export function buildLeadMessage(parsed: ParsedLead, formName: string, createdTime?: string): string {
  const ts = createdTime ? new Date(createdTime).getTime() : Date.now()
  const brtDate = new Date(ts - 3 * 60 * 60 * 1000) // Brasília (UTC-3)
  const dateStr = brtDate.toISOString().slice(0, 10).split('-').reverse().join('/')
  const timeStr = brtDate.toISOString().slice(11, 16) + 'h'

  const lines: string[] = [
    '🔔 *Novo Lead Chegou!* 🔔',
    '',
    `👤 *Nome:* ${parsed.name}`,
    `📱 *WhatsApp:* ${parsed.phone || 'Não informado'}`,
  ]

  if (parsed.answers.length > 0) {
    lines.push('', '━━━━━━━━━━━━━━━━━━')
    for (const { question, answer } of parsed.answers) {
      lines.push('', `📌 *${question}*`, `_${answer}_`)
    }
    lines.push('', '━━━━━━━━━━━━━━━━━━')
  }

  lines.push('', `🕐 Recebido em ${dateStr} às ${timeStr}`, `🎯 _Formulário: ${formName}_`)
  return lines.join('\n')
}

// ── Utilidades ─────────────────────────────────────────────────────────────────
export function toTitleCase(str: string): string {
  return str
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .trim()
}

export function formatPhone(raw: string): string {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  return raw
}
