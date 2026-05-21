import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const H = () => ({ apikey: KEY!, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' })

type Ctx = { params: Promise<{ id: string; wid: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { wid } = await params
  const body = await req.json().catch(() => ({}))
  const allowed = ['title', 'color', 'col_span', 'tall', 'merged', 'position', 'config', 'widget_type', 'data_source']
  const payload: Record<string, unknown> = {}
  for (const k of allowed) { if (k in body) payload[k] = body[k] }
  const res = await fetch(`${URL}/rest/v1/custom_dashboard_widgets?id=eq.${wid}`, { method: 'PATCH', headers: H(), body: JSON.stringify(payload) })
  if (!res.ok) { const e = await res.text(); return NextResponse.json({ error: e }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { wid } = await params
  await fetch(`${URL}/rest/v1/custom_dashboard_widgets?id=eq.${wid}`, { method: 'DELETE', headers: H() })
  return NextResponse.json({ ok: true })
}
