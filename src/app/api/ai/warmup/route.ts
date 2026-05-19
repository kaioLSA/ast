import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'

const OLLAMA_URL = process.env.OLLAMA_API_URL ?? 'http://localhost:11434'
const MODELS = ['llama3.2:1b', 'llama3.2:3b']

/**
 * GET /api/ai/warmup
 * Loads both models into memory so the first real message is fast.
 * Called by the AI page on mount.
 */
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fire both warmup calls in parallel — don't await, just let them run
  for (const model of MODELS) {
    fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'oi' }],
        stream: false,
        keep_alive: '87600h',
        options: { num_predict: 1 },
      }),
    }).catch(() => { /* silently ignore */ })
  }

  return NextResponse.json({ ok: true })
}
