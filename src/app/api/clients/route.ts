import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function supabaseHeaders() {
  return {
    apikey: SUPABASE_SERVICE_KEY!,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }
}

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/clients?select=*&company_id=eq.${user.company_id}&order=created_at.desc`,
    { headers: supabaseHeaders(), cache: 'no-store' }
  )

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))

  const payload = {
    company_id: user.company_id,
    created_by: user.id,
    name: body.name ?? '',
    company_name: body.company_name ?? '',
    email: body.email ?? '',
    phone: body.phone ?? '',
    status: body.status ?? 'prospect',
    value: body.value ?? 0,
    deals: body.deals ?? 0,
    score: body.score ?? 70,
    avatar: body.avatar ?? '',
    gradient: body.gradient ?? 'from-blue-500 to-cyan-500',
    since: body.since ?? '',
    state: body.state ?? '',
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
    method: 'POST',
    headers: { ...supabaseHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json(data[0] ?? data, { status: 201 })
}
