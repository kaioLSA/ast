import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

function sbHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }
}

// GET /api/ai/conversations — list conversations for current user
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/ai_conversations?select=id,title,created_at,updated_at&user_id=eq.${user.id}&company_id=eq.${user.company_id}&order=updated_at.desc`,
    { headers: sbHeaders(), cache: 'no-store' },
  )

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json(data)
}

// POST /api/ai/conversations — create a new conversation
export async function POST(_request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await fetch(`${SUPABASE_URL}/rest/v1/ai_conversations`, {
    method: 'POST',
    headers: sbHeaders(),
    body: JSON.stringify({
      user_id: user.id,
      company_id: user.company_id,
      title: 'Nova conversa',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json(Array.isArray(data) ? data[0] : data, { status: 201 })
}
