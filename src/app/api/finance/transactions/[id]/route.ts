import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { DEMO_TRANSACTIONS } from '@/lib/demo/data'
import { hasPermission, forbiddenResponse } from '@/lib/utils/require-permission'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function headers() {
  return {
    apikey: SUPABASE_SERVICE_KEY!,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json(DEMO_TRANSACTIONS[0])
  if (!hasPermission(user, 'finance:write')) return forbiddenResponse('finance:write')

  const { id } = await params
  const body = await request.json().catch(() => ({}))

  const allowed = ['type', 'description', 'category', 'amount', 'status', 'transaction_date']
  const payload: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) payload[key] = body[key]
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/financial_transactions?id=eq.${id}&company_id=eq.${user.company_id}`,
    { method: 'PATCH', headers: headers(), body: JSON.stringify(payload) }
  )

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json(Array.isArray(data) ? data[0] : data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json({ success: true })
  if (!hasPermission(user, 'finance:write')) return forbiddenResponse('finance:write')

  const { id } = await params

  // Check scope from query param — personal transactions require user_id match for safety
  const scope = request.nextUrl.searchParams.get('scope') ?? 'company'
  const filter =
    scope === 'personal'
      ? `id=eq.${id}&company_id=eq.${user.company_id}&user_id=eq.${user.id}`
      : `id=eq.${id}&company_id=eq.${user.company_id}`

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/financial_transactions?${filter}`,
    { method: 'DELETE', headers: headers() }
  )

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
