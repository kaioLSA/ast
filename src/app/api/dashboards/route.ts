import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const H = () => ({ apikey: KEY!, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' })

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json({ error: 'Não disponível no modo demonstração.' }, { status: 403 })

  // Filter by both company_id and user_id so each account sees only their own dashboards
  const res = await fetch(
    `${URL}/rest/v1/custom_dashboards?company_id=eq.${user.company_id}&user_id=eq.${user.id}&order=created_at.asc`,
    { headers: H(), cache: 'no-store' }
  )
  if (!res.ok) return NextResponse.json([], { status: 200 })
  return NextResponse.json(await res.json())
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json({ error: 'Não disponível no modo demonstração.' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const payload = {
    company_id: user.company_id,
    user_id:    user.id,
    name:       body.name ?? 'Meu Dashboard',
  }

  const res = await fetch(`${URL}/rest/v1/custom_dashboards`, { method: 'POST', headers: H(), body: JSON.stringify(payload) })
  if (!res.ok) { const e = await res.text(); return NextResponse.json({ error: e }, { status: 500 }) }
  const data = await res.json()
  return NextResponse.json(Array.isArray(data) ? data[0] : data, { status: 201 })
}
