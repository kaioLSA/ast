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

// PATCH /api/ai/conversations/[id] — rename conversation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const { title } = body as { title?: string }

  if (!title?.trim()) {
    return NextResponse.json({ error: 'title é obrigatório' }, { status: 400 })
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/ai_conversations?id=eq.${id}&user_id=eq.${user.id}&company_id=eq.${user.company_id}`,
    {
      method: 'PATCH',
      headers: sbHeaders(),
      body: JSON.stringify({ title: title.trim(), updated_at: new Date().toISOString() }),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json(Array.isArray(data) ? data[0] : data)
}

// DELETE /api/ai/conversations/[id] — delete conversation and all messages
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/ai_conversations?id=eq.${id}&user_id=eq.${user.id}&company_id=eq.${user.company_id}`,
    {
      method: 'DELETE',
      headers: sbHeaders(),
    },
  )

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
