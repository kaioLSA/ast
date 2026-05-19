import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'

const OLLAMA_URL = process.env.OLLAMA_API_URL ?? 'http://localhost:11434'
const MODEL = 'llama3.2:3b'

/**
 * GET /api/ai/warmup
 * Pings Ollama with keep_alive=-1 to load (and keep) the model in memory.
 * Called by the AI page on mount so the first real message is fast.
 */
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: 'oi' }],
        stream: false,
        keep_alive: '-1',
        options: { num_predict: 1 }, // generate just 1 token — we don't need the reply
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `Ollama ${res.status}` }, { status: 200 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
