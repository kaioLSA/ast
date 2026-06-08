import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const H = () => ({ apikey: KEY!, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' })

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json({ error: 'Não disponível no modo demonstração.' }, { status: 403 })
  const { id } = await params
  const res = await fetch(`${URL}/rest/v1/custom_dashboard_widgets?dashboard_id=eq.${id}&order=position.asc`, { headers: H(), cache: 'no-store' })
  if (!res.ok) return NextResponse.json([])
  return NextResponse.json(await res.json())
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json({ error: 'Não disponível no modo demonstração.' }, { status: 403 })
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  // Get current max position
  const countRes = await fetch(`${URL}/rest/v1/custom_dashboard_widgets?dashboard_id=eq.${id}&select=position&order=position.desc&limit=1`, { headers: H(), cache: 'no-store' })
  const countData = countRes.ok ? await countRes.json() : []
  const nextPos = countData[0]?.position != null ? countData[0].position + 1 : 0

  const payload = {
    dashboard_id: id,
    position: nextPos,
    widget_type: body.widget_type ?? 'metric',
    data_source: body.data_source ?? 'leads_total',
    title: body.title ?? '',
    color: body.color ?? '#3b82f6',
    col_span: body.col_span ?? 6,
    tall: body.tall ?? false,
    merged: body.merged ?? false,
    config: body.config ?? {},
  }

  const res = await fetch(`${URL}/rest/v1/custom_dashboard_widgets`, { method: 'POST', headers: H(), body: JSON.stringify(payload) })
  if (!res.ok) { const e = await res.text(); return NextResponse.json({ error: e }, { status: 500 }) }
  const data = await res.json()
  return NextResponse.json(Array.isArray(data) ? data[0] : data, { status: 201 })
}
