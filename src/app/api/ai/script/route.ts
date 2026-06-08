import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { hasPermission, forbiddenResponse } from '@/lib/utils/require-permission'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? ''
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const MODEL = 'claude-haiku-4-5-20251001'

type Script = { gancho: string; desenvolvimento: string; cta: string }

function sbHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }
}

// GET — histórico de roteiros do próprio usuário (escopo individual)
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json([])
  if (!hasPermission(user, 'ai:use')) return forbiddenResponse('ai:use')

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/script_history?select=*&user_id=eq.${user.id}&order=created_at.desc&limit=50`,
    { headers: sbHeaders(), cache: 'no-store' },
  )
  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 })
  return NextResponse.json(await res.json())
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) {
    return NextResponse.json({
      script: {
        gancho: 'Você está perdendo cliente todo dia e nem percebe. O motivo é mais simples do que você imagina.',
        desenvolvimento: 'A maioria dos negócios some das redes porque posta sem constância. Quem aparece todo dia na frente do cliente certo vende mais, mesmo sem investir uma fortuna. O segredo não é postar mais, é postar com intenção e falar direto com quem importa.',
        cta: 'Comenta a palavra QUERO que eu te mostro como começar ainda essa semana.',
      },
    })
  }
  if (!hasPermission(user, 'ai:use')) return forbiddenResponse('ai:use')
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 })
  }

  const body = await request.json().catch(() => ({}))
  const { client_id, tema, duracao } = body as {
    client_id?: string
    tema?: string
    duracao?: string
  }

  if (!tema?.trim()) {
    return NextResponse.json({ error: 'O tema do vídeo é obrigatório' }, { status: 400 })
  }

  let tom = 'informal e próximo'
  let nicho = 'negócio local'
  let clientName = ''

  if (client_id) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/clients?select=name,niche,tone_of_voice&id=eq.${client_id}&company_id=eq.${user.company_id}&limit=1`,
      { headers: sbHeaders(), cache: 'no-store' },
    )
    if (res.ok) {
      const rows = await res.json()
      const c = rows?.[0]
      if (c) {
        clientName = c.name ?? ''
        if (c.tone_of_voice?.trim()) tom = c.tone_of_voice.trim()
        if (c.niche?.trim()) nicho = c.niche.trim()
      }
    }
  }

  const dur = duracao?.trim() || '30'

  const system = `Você é roteirista de conteúdo para redes sociais. Gere um roteiro de vídeo curto.

Nicho: ${nicho}
Tema: ${tema.trim()}
Duração alvo: ${dur} segundos
Tom: ${tom}

Entregue apenas o texto de fala. Sem indicações de câmera, sem títulos de seção, sem emojis.
Estrutura: gancho forte (primeiros 3 segundos), desenvolvimento e CTA direto.

Responda APENAS com um JSON válido neste formato, sem texto extra:
{"gancho":"...","desenvolvimento":"...","cta":"..."}`

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
        messages: [{ role: 'user', content: `Tema do vídeo: ${tema.trim()}` }],
      }),
    })

    if (!apiRes.ok) {
      return NextResponse.json({ error: `Claude API error: ${await apiRes.text()}` }, { status: 502 })
    }

    const data = await apiRes.json()
    const raw: string = data?.content?.[0]?.text ?? ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Resposta da IA em formato inesperado' }, { status: 502 })
    }

    const script = JSON.parse(jsonMatch[0]) as Script
    if (!script.gancho && !script.desenvolvimento && !script.cta) {
      return NextResponse.json({ error: 'Nenhum roteiro foi gerado' }, { status: 502 })
    }

    // Salva no histórico do usuário (escopo individual)
    let savedId: string | null = null
    try {
      const saveRes = await fetch(`${SUPABASE_URL}/rest/v1/script_history`, {
        method: 'POST',
        headers: { ...sbHeaders(), Prefer: 'return=representation' },
        body: JSON.stringify({
          user_id: user.id,
          company_id: user.company_id,
          client_id: client_id || null,
          client_name: clientName,
          tema: tema.trim(),
          duracao: dur,
          tom,
          script,
        }),
      })
      if (saveRes.ok) {
        const saved = await saveRes.json()
        savedId = Array.isArray(saved) ? saved[0]?.id ?? null : saved?.id ?? null
      }
    } catch { /* não bloqueia a resposta */ }

    return NextResponse.json({ script, client: clientName, id: savedId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
