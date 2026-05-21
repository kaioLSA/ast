import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { getAuthUser } from '@/lib/utils/get-auth-user'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function headers() {
  return {
    apikey: SUPABASE_SERVICE_KEY!,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }
}

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const base = `${SUPABASE_URL}/rest/v1/crm_users`
  const filter = `company_id=eq.${user.company_id}&order=created_at.asc`

  // Try with avatar_url first; if column doesn't exist yet fall back gracefully
  const resWithAvatar = await fetch(
    `${base}?select=id,name,email,role,custom_role,permissions,active,created_at,avatar_url&${filter}`,
    { headers: headers(), cache: 'no-store' }
  )

  if (resWithAvatar.ok) return NextResponse.json(await resWithAvatar.json())

  // Fallback: without avatar_url (column not yet migrated)
  const res = await fetch(
    `${base}?select=id,name,email,role,custom_role,permissions,active,created_at&${filter}`,
    { headers: headers(), cache: 'no-store' }
  )

  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 })
  return NextResponse.json(await res.json())
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Apenas administradores podem criar contas' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const { name, email, password, role, custom_role, permissions } = body as {
    name?: string
    email?: string
    password?: string
    role?: string
    custom_role?: string
    permissions?: string[]
  }

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 })
  }

  // Check if email already exists
  const existing = await fetch(
    `${SUPABASE_URL}/rest/v1/crm_users?select=id&email=eq.${encodeURIComponent(email.toLowerCase().trim())}&limit=1`,
    { headers: headers(), cache: 'no-store' }
  )
  const existingRows = await existing.json()
  if (existingRows?.length > 0) {
    return NextResponse.json({ error: 'Este email já está em uso' }, { status: 409 })
  }

  const password_hash = await bcrypt.hash(password, 12)
  const finalRole = role === 'admin' ? 'admin' : 'agent'
  const finalPermissions = role === 'admin' ? ALL_PERMISSIONS : (permissions ?? [])

  const payload = {
    company_id: user.company_id,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password_hash,
    role: finalRole,
    custom_role: custom_role ?? '',
    permissions: finalPermissions,
    is_demo: false,
    active: true,
    force_password_change: true,
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/crm_users`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 })
  const data = await res.json()
  const created = data[0] ?? data
  // Never return password_hash
  const { password_hash: _, ...safe } = created
  return NextResponse.json(safe, { status: 201 })
}

const ALL_PERMISSIONS = [
  'leads:read','leads:write','leads:delete',
  'clients:read','clients:write','clients:delete',
  'calendar:read','calendar:write','calendar:delete',
  'finance:read','finance:write',
  'analytics:read',
  'whatsapp:read','whatsapp:write',
  'reports:read',
  'campaigns:read','campaigns:write','campaigns:delete',
  'team:read','team:write','team:delete',
  'settings:read','settings:write',
  'ai:use',
]
