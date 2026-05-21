import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'

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

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = request.nextUrl.searchParams.get('scope') ?? 'company'

  // Personal: only this user's personal transactions
  // Company: all transactions scoped to company (default scope='company')
  const filter =
    scope === 'personal'
      ? `company_id=eq.${user.company_id}&scope=eq.personal&user_id=eq.${user.id}`
      : `company_id=eq.${user.company_id}&scope=eq.company`

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/financial_transactions?${filter}&order=transaction_date.desc`,
    { headers: headers(), cache: 'no-store' }
  )

  if (!res.ok) {
    // If scope column doesn't exist yet, fall back to unscoped query
    const fallback = await fetch(
      `${SUPABASE_URL}/rest/v1/financial_transactions?company_id=eq.${user.company_id}&order=transaction_date.desc`,
      { headers: headers(), cache: 'no-store' }
    )
    if (!fallback.ok) return NextResponse.json([], { status: 200 })
    return NextResponse.json(await fallback.json())
  }

  return NextResponse.json(await res.json())
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))

  const scope: 'company' | 'personal' = body.scope === 'personal' ? 'personal' : 'company'

  const payload: Record<string, unknown> = {
    company_id: user.company_id,
    scope,
    type: body.type ?? 'income',
    description: body.description ?? '',
    category: body.category ?? 'other',
    amount: Number(body.amount) || 0,
    currency: body.currency ?? 'BRL',
    status: body.status ?? 'completed',
    transaction_date: body.transaction_date ?? new Date().toISOString(),
  }

  // Personal transactions also store user_id
  if (scope === 'personal') {
    payload.user_id = user.id
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/financial_transactions`,
    { method: 'POST', headers: headers(), body: JSON.stringify(payload) }
  )

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json(Array.isArray(data) ? data[0] : data, { status: 201 })
}
