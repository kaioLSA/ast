import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { anthropicTools, executeTool } from '../tools'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? ''
const MODEL = 'claude-3-haiku-20240307'
const MAX_TOOL_ITERATIONS = 6

// ── Anthropic message types ────────────────────────────────────────────────────

type TextBlock    = { type: 'text'; text: string }
type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
type ToolResBlock = { type: 'tool_result'; tool_use_id: string; content: string }

type ContentBlock = TextBlock | ToolUseBlock | ToolResBlock

type AnthropicMessage = {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
}

type AnthropicResponse = {
  content: ContentBlock[]
  stop_reason: 'end_turn' | 'tool_use' | string
}

// ── API call ───────────────────────────────────────────────────────────────────

async function claudeChat(system: string, messages: AnthropicMessage[]): Promise<AnthropicResponse> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
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
      messages,
      tools: anthropicTools,
    }),
  })

  if (!res.ok) throw new Error(`Claude API error ${res.status}: ${await res.text()}`)
  return res.json() as Promise<AnthropicResponse>
}

// ── Streaming helper ───────────────────────────────────────────────────────────

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
        setTimeout(pushNext, 10)
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

// ── Route handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 })
  }

  const body = await request.json().catch(() => ({}))
  const { messages } = body as { messages?: Array<{ role: string; content: string }> }

  if (!messages?.length) {
    return NextResponse.json({ error: 'messages é obrigatório' }, { status: 400 })
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr = today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const systemPrompt = `Você é um assistente de vendas e CRM inteligente da Startsette com acesso total ao sistema.
Data e hora atual: ${dateStr}, ${timeStr}.

Suas capacidades:
- Criar, listar, atualizar leads
- Criar e listar clientes
- Criar, listar e remover eventos na agenda

Regras:
- Responda SEMPRE em português brasileiro.
- Use as ferramentas imediatamente quando o usuário pedir ações no CRM — sem pedir confirmação desnecessária.
- Se faltar o nome para criar lead/cliente, pergunte apenas o nome e crie em seguida.
- Se faltar data/hora para criar evento, pergunte só esses dados essenciais.
- Após executar uma ação, confirme de forma clara e amigável.
- Você também pode dar conselhos de vendas, estratégias de follow-up e análises de negócios.`

  const conversation: AnthropicMessage[] = messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  const toolsUsed: string[] = []

  try {
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await claudeChat(systemPrompt, conversation)

      const textBlocks = response.content.filter((b): b is TextBlock => b.type === 'text')
      const toolBlocks = response.content.filter((b): b is ToolUseBlock => b.type === 'tool_use')

      // No tools → final answer
      if (response.stop_reason !== 'tool_use' || toolBlocks.length === 0) {
        const finalText = textBlocks.map(b => b.text).join('').trim() || 'Pronto!'
        return makeStream(finalText, toolsUsed)
      }

      // Add assistant's response (with tool_use blocks) to conversation
      conversation.push({ role: 'assistant', content: response.content })

      // Execute each tool and collect tool_result blocks
      const toolResultContent: ToolResBlock[] = []
      for (const tool of toolBlocks) {
        toolsUsed.push(tool.name)
        const result = await executeTool(tool.name, tool.input, user)
        toolResultContent.push({
          type: 'tool_result',
          tool_use_id: tool.id,
          content: result,
        })
      }

      // Send all tool results back in a single user message
      conversation.push({ role: 'user', content: toolResultContent })
    }

    return new Response('Não consegui completar a operação. Tente novamente.', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('[Claude chat error]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
