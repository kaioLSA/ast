import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { toolDefinitions, executeTool } from '../tools'

const OLLAMA_URL = process.env.OLLAMA_API_URL ?? 'http://localhost:11434'
const MODEL = 'llama3.2:3b'
const MAX_TOOL_ITERATIONS = 6

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

async function ollamaChat(messages: OllamaMessage[], stream: false): Promise<OllamaResponse>
async function ollamaChat(messages: OllamaMessage[], stream: true): Promise<Response>
async function ollamaChat(messages: OllamaMessage[], stream: boolean) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream,
      tools: toolDefinitions,
      options: { temperature: 0.3, num_predict: 1024 },
    }),
  })

  if (!res.ok) {
    throw new Error(`Ollama error ${res.status}: ${await res.text()}`)
  }

  if (stream) return res
  return res.json() as Promise<OllamaResponse>
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
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const timeStr = today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const systemPrompt: OllamaMessage = {
    role: 'system',
    content: `Você é um assistente de vendas e CRM inteligente da Startsette com acesso total ao sistema.
Data e hora atual: ${dateStr}, ${timeStr}.

Suas capacidades:
- Criar, listar, atualizar leads
- Criar e listar clientes
- Criar, listar e remover eventos na agenda

Regras importantes:
- Responda SEMPRE em português brasileiro.
- Quando o usuário pedir para fazer algo no CRM, use as ferramentas imediatamente — não peça confirmação desnecessária.
- Se faltar apenas o nome (para criar lead/cliente), pergunte somente o nome e crie em seguida.
- Se faltar data/hora para criar evento, pergunte só esses dados essenciais.
- Após executar uma ação, confirme o que foi feito de forma clara e amigável.
- Para consultas (listar leads, ver agenda), execute a ferramenta e apresente os dados de forma organizada.
- Você também pode dar conselhos de vendas, estratégias de follow-up e análises gerais de negócios.`,
  }

  const conversation: OllamaMessage[] = [
    systemPrompt,
    ...(messages as OllamaMessage[]),
  ]

  const toolsUsed: string[] = []

  try {
    // ── Agentic tool loop ──────────────────────────────────────────────────
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const data = await ollamaChat(conversation, false)
      const assistantMsg = data.message

      // No tool calls → this is the final text response, stream it
      if (!assistantMsg.tool_calls?.length) {
        const finalText = assistantMsg.content || 'Pronto!'

        // If tools were used, we already have the content. Fake-stream it.
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          start(controller) {
            // Emit tools metadata as first line (JSON), then text
            if (toolsUsed.length) {
              const meta = JSON.stringify({ _tools: toolsUsed }) + '\n'
              controller.enqueue(encoder.encode(meta))
            }

            // Word-by-word streaming for natural feel
            const words = finalText.split(/(\s+)/)
            let idx = 0

            function pushNext() {
              if (idx >= words.length) {
                controller.close()
                return
              }
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
          },
        })
      }

      // ── Tool calls detected — execute them ─────────────────────────────
      conversation.push(assistantMsg)

      for (const call of assistantMsg.tool_calls) {
        const toolName = call.function.name
        const toolArgs = call.function.arguments ?? {}
        toolsUsed.push(toolName)

        const result = await executeTool(toolName, toolArgs, user)

        conversation.push({
          role: 'tool',
          content: result,
        })
      }

      // Continue loop — Ollama will now generate a response using tool results
    }

    // Fallback if loop exhausted without a text response
    return new Response('Não consegui completar a operação. Por favor, tente novamente.', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('[AI chat error]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
