import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { hasPermission, forbiddenResponse } from '@/lib/utils/require-permission'
import { DEMO_LEADS } from '@/lib/demo/data'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function supabaseHeaders() {
  return {
    apikey: SUPABASE_SERVICE_KEY!,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json(DEMO_LEADS[0])
  if (!hasPermission(user, 'leads:write')) return forbiddenResponse('leads:write')

  const { id } = params
  const body = await request.json().catch(() => ({}))

  const allowed = ['name', 'company', 'email', 'phone', 'status', 'source', 'temperature', 'value', 'score', 'state']
  const patch: Record<string, unknown> = {}
  for (const k of allowed) {
    if (k in body) patch[k] = body[k]
  }
  patch.updated_at = new Date().toISOString()

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/leads?id=eq.${id}&company_id=eq.${user.company_id}`,
    {
      method: 'PATCH',
      headers: { ...supabaseHeaders(), Prefer: 'return=representation' },
      body: JSON.stringify(patch),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json(data[0] ?? data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return new NextResponse(null, { status: 204 })
  if (!hasPermission(user, 'leads:delete')) return forbiddenResponse('leads:delete')

  const { id } = params

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/leads?id=eq.${id}&company_id=eq.${user.company_id}`,
    { method: 'DELETE', headers: supabaseHeaders() }
  )

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
