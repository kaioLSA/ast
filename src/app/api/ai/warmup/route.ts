import { NextResponse } from 'next/server'

// Claude API doesn't need warmup — it's always ready in the cloud.
export async function GET() {
  return NextResponse.json({ ok: true })
}
