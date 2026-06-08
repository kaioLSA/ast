import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { hasPermission, forbiddenResponse } from '@/lib/utils/require-permission'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const MODEL = 'claude-haiku-4-5-20251001'

type Caption = { angulo: 'emocional' | 'racional' | 'provocativa'; texto: string }

function sbHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }
}

// GET — histórico de legendas do próprio usuário (escopo individual)
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json([])
  if (!hasPermission(user, 'ai:use')) return forbiddenResponse('ai:use')

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/caption_history?select=*&user_id=eq.${user.id}&order=created_at.desc&limit=50`,
    { headers: sbHeaders(), cache: 'no-store' },
  )
  if (!res.ok) {
    return NextResponse.json({ error: await res.text() }, { status: 500 })
  }
  return NextResponse.json(await res.json())
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) {
    return NextResponse.json({
      captions: [
        { angulo: 'emocional', texto: 'Você lembra da última vez que se sentiu confiante no espelho? Esse sentimento muda o seu dia inteiro. É por isso que cuidar de você nunca é gasto, é investimento no que você sente.' },
        { angulo: 'racional', texto: 'Resultado de verdade vem de protocolo certo, equipamento certo e profissional certo. É exatamente isso que você encontra aqui. Agende sua avaliação e veja a diferença em números.' },
        { angulo: 'provocativa', texto: 'Quanto tempo mais você vai adiar o que sabe que precisa fazer por você? O espelho não mente, e a desculpa de amanhã também não. Comece hoje.' },
      ],
    })
  }
  if (!hasPermission(user, 'ai:use')) return forbiddenResponse('ai:use')

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 })
  }

  const body = await request.json().catch(() => ({}))
  const { client_id, tema, objetivo } = body as {
    client_id?: string
    tema?: string
    objetivo?: string
  }

  if (!tema?.trim()) {
    return NextResponse.json({ error: 'O tema do post é obrigatório' }, { status: 400 })
  }

  // Fetch client tone of voice and niche
  let tomDeVoz = 'informal e próximo'
  let nicho = 'negócio local'
  let clientName = ''

  if (client_id) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/clients?select=name,company_name,niche,tone_of_voice&id=eq.${client_id}&company_id=eq.${user.company_id}&limit=1`,
      { headers: sbHeaders(), cache: 'no-store' },
    )
    if (res.ok) {
      const rows = await res.json()
      const c = rows?.[0]
      if (c) {
        clientName = c.name ?? ''
        if (c.tone_of_voice?.trim()) tomDeVoz = c.tone_of_voice.trim()
        if (c.niche?.trim()) nicho = c.niche.trim()
      }
    }
  }

  const system = `Você é redator da Start Sette. Gere 3 opções de legenda para Instagram com base no tema informado.

Tom do cliente: ${tomDeVoz}
Nicho: ${nicho}
Objetivo do post: ${objetivo?.trim() || 'engajar e atrair clientes'}

Regras:
- Sem emojis, sem travessão
- Segunda pessoa (você), informal
- Máximo 5 linhas por opção
- Cada opção com ângulo diferente: emocional, racional e provocativo

Responda APENAS com um JSON válido neste formato, sem texto extra:
{"captions":[{"angulo":"emocional","texto":"..."},{"angulo":"racional","texto":"..."},{"angulo":"provocativa","texto":"..."}]}`

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: `Tema do post: ${tema.trim()}` }],
      }),
    })

    if (!apiRes.ok) {
      const err = await apiRes.text()
      return NextResponse.json({ error: `Claude API error: ${err}` }, { status: 502 })
    }

    const data = await apiRes.json()
    const raw: string = data?.content?.[0]?.text ?? ''

    // Extract JSON from the response (Claude may wrap it)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Resposta da IA em formato inesperado' }, { status: 502 })
    }

    const parsed = JSON.parse(jsonMatch[0]) as { captions?: Caption[] }
    const captions = Array.isArray(parsed.captions) ? parsed.captions.slice(0, 3) : []

    if (captions.length === 0) {
      return NextResponse.json({ error: 'Nenhuma legenda foi gerada' }, { status: 502 })
    }

    // Salva no histórico do usuário (escopo individual, não da empresa toda)
    let savedId: string | null = null
    try {
      const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/caption_history`, {
        method: 'POST',
        headers: { ...sbHeaders(), Prefer: 'return=representation' },
        body: JSON.stringify({
          user_id: user.id,
          company_id: user.company_id,
          client_id: client_id || null,
          client_name: clientName,
          tema: tema.trim(),
          objetivo: objetivo?.trim() || '',
          captions,
        }),
      })
      if (saveRes.ok) {
        const saved = await saveRes.json()
        savedId = Array.isArray(saved) ? saved[0]?.id ?? null : saved?.id ?? null
      }
    } catch { /* não bloqueia a resposta se o save falhar */ }

    return NextResponse.json({ captions, client: clientName, id: savedId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
