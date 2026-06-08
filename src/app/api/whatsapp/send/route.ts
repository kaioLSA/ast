import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { evoFetch } from '@/lib/utils/evo-fetch'
import { hasPermission, forbiddenResponse } from '@/lib/utils/require-permission'

const EVO_INSTANCE = process.env.EVOLUTION_INSTANCE

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json({ key: { id: 'demo-msg' }, status: { code: 200 } })
  if (!hasPermission(user, 'whatsapp:write')) return forbiddenResponse('whatsapp:write')

  const body = await request.json().catch(() => ({}))
  const { number, text } = body as { number?: string; text?: string }

  if (!number || !text) {
    return NextResponse.json({ error: 'number e text são obrigatórios' }, { status: 400 })
  }

  try {
    const data = await evoFetch.post(`/message/sendText/${EVO_INSTANCE}`, { number, text })
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
