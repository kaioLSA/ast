import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const H = () => ({ apikey: KEY!, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' })

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json({ error: 'Não disponível no modo demonstração.' }, { status: 403 })
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const res = await fetch(`${URL}/rest/v1/custom_dashboards?id=eq.${id}&company_id=eq.${user.company_id}`, { method: 'PATCH', headers: H(), body: JSON.stringify({ name: body.name }) })
  if (!res.ok) { const e = await res.text(); return NextResponse.json({ error: e }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json({ error: 'Não disponível no modo demonstração.' }, { status: 403 })
  const { id } = await params
  // Delete widgets first
  await fetch(`${URL}/rest/v1/custom_dashboard_widgets?dashboard_id=eq.${id}`, { method: 'DELETE', headers: H() })
  await fetch(`${URL}/rest/v1/custom_dashboards?id=eq.${id}&company_id=eq.${user.company_id}`, { method: 'DELETE', headers: H() })
  return NextResponse.json({ ok: true })
}
