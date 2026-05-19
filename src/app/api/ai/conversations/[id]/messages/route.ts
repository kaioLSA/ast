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

// GET /api/ai/conversations/[id]/messages — return all messages ordered by created_at asc
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // First verify the conversation belongs to this user
  const convRes = await fetch(
    `${SUPABASE_URL}/rest/v1/ai_conversations?id=eq.${id}&user_id=eq.${user.id}&company_id=eq.${user.company_id}&select=id&limit=1`,
    { headers: sbHeaders(), cache: 'no-store' },
  )

  if (!convRes.ok) {
    return NextResponse.json({ error: 'Erro ao verificar conversa' }, { status: 500 })
  }

  const convData = await convRes.json()
  if (!Array.isArray(convData) || convData.length === 0) {
    return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
  }

  const msgRes = await fetch(
    `${SUPABASE_URL}/rest/v1/ai_messages?conversation_id=eq.${id}&select=id,role,content,created_at&order=created_at.asc`,
    { headers: sbHeaders(), cache: 'no-store' },
  )

  if (!msgRes.ok) {
    const err = await msgRes.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  const data = await msgRes.json()
  return NextResponse.json(data)
}
