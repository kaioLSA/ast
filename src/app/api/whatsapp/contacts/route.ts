import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { DEMO_WA_CHATS } from '@/lib/demo/data'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

function sbHeaders() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }
}

/** GET — returns all saved contacts for this company as { phone → name } map */
export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json(DEMO_WA_CHATS.map(c => ({ id: `demo-contact-${c.phone}`, phone: c.phone, name: c.name, company_id: 'demo' })))

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/whatsapp_contacts?company_id=eq.${user.company_id}&select=phone,name`,
    { headers: sbHeaders(), cache: 'no-store' },
  )

  if (!res.ok) return NextResponse.json({}, { status: 200 }) // return empty map on error

  const rows: { phone: string; name: string }[] = await res.json()
  const map: Record<string, string> = {}
  for (const r of rows) map[r.phone] = r.name

  return NextResponse.json(map)
}

/** POST — upsert a saved contact name */
export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { phone, name } = body as { phone?: string; name?: string }

  if (!phone?.trim() || !name?.trim()) {
    return NextResponse.json({ error: 'phone e name são obrigatórios' }, { status: 400 })
  }

  const payload = {
    company_id: user.company_id,
    phone: phone.trim(),
    name: name.trim(),
    updated_at: new Date().toISOString(),
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/whatsapp_contacts`, {
    method: 'POST',
    headers: {
      ...sbHeaders(),
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
