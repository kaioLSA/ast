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

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Try with avatar_url; fall back if column doesn't exist yet
  const resWithAvatar = await fetch(
    `${SUPABASE_URL}/rest/v1/crm_users?select=id,name,email,role,avatar_url&id=eq.${user.id}&limit=1`,
    { headers: headers(), cache: 'no-store' }
  )
  if (resWithAvatar.ok) {
    const rows = await resWithAvatar.json()
    return NextResponse.json(rows?.[0] ?? null)
  }

  // Fallback without avatar_url
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/crm_users?select=id,name,email,role&id=eq.${user.id}&limit=1`,
    { headers: headers(), cache: 'no-store' }
  )
  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  const rows = await res.json()
  return NextResponse.json(rows?.[0] ?? null)
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const patch: Record<string, unknown> = {}

  if (typeof body.name === 'string' && body.name.trim()) {
    patch.name = body.name.trim()
  }
  if ('avatar_url' in body) {
    // Accept data URL (base64) or null to remove
    patch.avatar_url = body.avatar_url ?? null
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  // If avatar_url column doesn't exist, only send name
  let patchToSend = patch
  if ('avatar_url' in patch) {
    const testRes = await fetch(
      `${SUPABASE_URL}/rest/v1/crm_users?select=avatar_url&id=eq.${user.id}&limit=1`,
      { headers: headers(), cache: 'no-store' }
    )
    if (!testRes.ok) {
      // Column doesn't exist — remove it from patch
      const { avatar_url: _removed, ...rest } = patch  // eslint-disable-line @typescript-eslint/no-unused-vars
      patchToSend = rest
    }
  }

  if (Object.keys(patchToSend).length === 0) {
    return NextResponse.json({ ok: true, note: 'avatar_url column not migrated yet' })
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/crm_users?id=eq.${user.id}`,
    { method: 'PATCH', headers: headers(), body: JSON.stringify(patchToSend) }
  )

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  const data = await res.json()
  return NextResponse.json(Array.isArray(data) ? data[0] : data)
}
