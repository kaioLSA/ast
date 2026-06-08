import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { DEMO_EVENTS } from '@/lib/demo/data'
import { hasPermission, forbiddenResponse } from '@/lib/utils/require-permission'

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
  if (user.is_demo) return NextResponse.json(DEMO_EVENTS)
  if (!hasPermission(user, 'calendar:read')) return forbiddenResponse('calendar:read')

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/calendar_events?select=*&company_id=eq.${user.company_id}&order=year.asc,month.asc,day.asc`,
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
  if (user.is_demo) return NextResponse.json(DEMO_EVENTS[0], { status: 201 })
  if (!hasPermission(user, 'calendar:write')) return forbiddenResponse('calendar:write')

  const body = await request.json().catch(() => ({}))

  const payload = {
    company_id: user.company_id,
    created_by: user.id,
    label: body.label ?? '',
    color: body.color ?? '',
    time: body.time ?? '',
    description: body.description ?? '',
    day: body.day,
    month: body.month,
    year: body.year,
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/calendar_events`, {
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
