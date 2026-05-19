import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { toolDefinitions, executeTool } from '../tools'

const OLLAMA_URL = process.env.OLLAMA_API_URL ?? 'http://localhost:11434'
const MODEL = 'llama3.2:3b'
const MAX_TOOL_ITERATIONS = 6

// Keep model loaded in memory for 10 years (Ollama 0.24 doesn't accept -1 literal)
const KEEP_ALIVE = '87600h'

// Keywords that indicate the user wants to interact with the CRM.
// When none match, we skip sending the large tool definitions (~750 tokens)
// and respond 5-10x faster with a plain conversational reply.
const CRM_KEYWORDS = [
  'lead', 'leads', 'cliente', 'clientes', 'criar', 'cria', 'crie',
  'listar', 'lista', 'ver', 'veja', 'mostrar', 'mostre',
  'agendar', 'agenda', 'evento', 'eventos', 'reunião', 'reuniao',
  'atualizar', 'atualiza', 'atualize', 'remover', 'remove', 'deletar',
  'buscar', 'busca', 'pesquisar', 'encontrar', 'cadastrar', 'cadastra',
  'novo lead', 'nova reunião', 'meus leads', 'meus clientes',
]

function needsCRMTools(messages: Array<{ role: string; content: string }>): boolean {
  // Check only the last user message
  const lastUser = [...messages].reverse().find(m => m.role === 'user')
  if (!lastUser) return false
  const lower = lastUser.content.toLowerCase()
  return CRM_KEYWORDS.some(k => lower.includes(k))
}

type OllamaMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: OllamaToolCall[]
}

type OllamaToolCall = {
  function: {
    name: string
    arguments: Record<string, unknown>
  }
}

type OllamaResponse = {
  message: OllamaMessage
  done: boolean
}

async function ollamaChat(messages: OllamaMessage[], withTools: boolean): Promise<OllamaResponse> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
      ...(withTools ? { tools: toolDefinitions } : {}),
      keep_alive: KEEP_ALIVE,
      options: { temperature: 0.3, num_predict: 512 },
    }),
  })

  if (!res.ok) {
    throw new Error(`Ollama error ${res.status}: ${await res.text()}`)
  }

  return res.json() as Promise<OllamaResponse>
}

function makeStream(text: string, toolsUsed: string[]): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      if (toolsUsed.length) {
        controller.enqueue(encoder.encode(JSON.stringify({ _tools: toolsUsed }) + '\n'))
      }
      const words = text.split(/(\s+)/)
      let idx = 0
      function pushNext() {
        if (idx >= words.length) { controller.close(); return }
        controller.enqueue(encoder.encode(words[idx++]))
        setTimeout(pushNext, 12)
      }
      pushNext()
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Accel-Buffering': 'no',
      'Cache-Control': 'no-cache',
    },
  })
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { messages } = body as { messages?: Array<{ role: string; content: string }> }

  if (!messages?.length) {
    return NextResponse.json({ error: 'messages é obrigatório' }, { status: 400 })
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
  const timeStr = today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const systemPrompt: OllamaMessage = {
    role: 'system',
    content: `Você é um assistente de vendas e CRM da Startsette. Data: ${dateStr}, ${timeStr}.
Responda SEMPRE em português brasileiro. Seja direto e amigável.
Capacidades: criar/listar/atualizar leads, clientes e eventos na agenda.
Ao executar ações no CRM, use as ferramentas sem pedir confirmação desnecessária.`,
  }

  const withTools = needsCRMTools(messages)
  const conversation: OllamaMessage[] = [systemPrompt, ...(messages as OllamaMessage[])]
  const toolsUsed: string[] = []

  try {
    if (!withTools) {
      // ── Fast path: no CRM intent → skip tool definitions, respond quickly ──
      const data = await ollamaChat(conversation, false)
      return makeStream(data.message.content?.trim() || 'Olá! Como posso ajudar?', [])
    }

    // ── CRM path: agentic tool loop ────────────────────────────────────────
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const data = await ollamaChat(conversation, true)
      const assistantMsg = data.message

      if (!assistantMsg.tool_calls?.length) {
        return makeStream(assistantMsg.content?.trim() || 'Pronto!', toolsUsed)
      }

      conversation.push(assistantMsg)

      for (const call of assistantMsg.tool_calls) {
        const toolName = call.function.name
        const toolArgs = call.function.arguments ?? {}
        toolsUsed.push(toolName)
        const result = await executeTool(toolName, toolArgs, user)
        conversation.push({ role: 'tool', content: result })
      }
    }

    return new Response('Não consegui completar a operação. Tente novamente.', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('[AI chat error]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
