import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const CHANGE_TOKEN_MAX_AGE_MS = 15 * 60 * 1000 // 15 minutes

function sbHeaders() {
  return {
    apikey: SUPABASE_SERVICE_KEY!,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }
}

const ADMIN_PERMISSIONS = [
  'leads:read','leads:write','leads:delete',
  'clients:read','clients:write','clients:delete',
  'calendar:read','calendar:write','calendar:delete',
  'campaigns:read','campaigns:write','campaigns:delete',
  'finance:read','finance:write',
  'team:read','team:write','team:delete',
  'settings:read','settings:write',
  'analytics:read','ai:use',
  'whatsapp:read','whatsapp:write',
  'reports:read',
]

function getPermissions(role: string, stored: string[]) {
  if (role === 'admin') return ADMIN_PERMISSIONS
  return stored?.length ? stored : ['leads:read','analytics:read']
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { changeToken, newPassword } = body as { changeToken?: string; newPassword?: string }

  if (!changeToken || !newPassword) {
    return NextResponse.json({ success: false, message: 'Token e nova senha são obrigatórios' }, { status: 400 })
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ success: false, message: 'A nova senha deve ter pelo menos 6 caracteres' }, { status: 400 })
  }

  // Decode and validate change token
  let userId: string
  let issuedAt: number
  try {
    const decoded = Buffer.from(changeToken, 'base64').toString('utf-8')
    const parts = decoded.split(':')
    if (parts.length < 3 || parts[2] !== 'fpc') throw new Error('invalid')
    userId = parts[0]
    issuedAt = Number(parts[1])
    if (isNaN(issuedAt) || Date.now() - issuedAt > CHANGE_TOKEN_MAX_AGE_MS) {
      return NextResponse.json({ success: false, message: 'Token expirado. Faça login novamente.' }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ success: false, message: 'Token inválido' }, { status: 401 })
  }

  // Fetch user
  const userRes = await fetch(
    `${SUPABASE_URL}/rest/v1/crm_users?select=id,email,name,role,permissions,is_demo,company_id,companies(name,slug,meta_pixel_id,meta_pixel_token,meta_access_token,meta_ad_account_id,whatsapp_phone_id,whatsapp_access_token)&id=eq.${userId}&active=eq.true&limit=1`,
    { headers: sbHeaders(), cache: 'no-store' }
  )
  if (!userRes.ok) return NextResponse.json({ success: false, message: 'Usuário não encontrado' }, { status: 404 })
  const rows = await userRes.json()
  const dbUser = rows?.[0]
  if (!dbUser) return NextResponse.json({ success: false, message: 'Usuário não encontrado' }, { status: 404 })

  // Hash new password and clear force_password_change
  const password_hash = await bcrypt.hash(newPassword, 12)
  const patchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/crm_users?id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: { ...sbHeaders(), Prefer: 'return=minimal' },
      body: JSON.stringify({ password_hash, force_password_change: false }),
    }
  )
  if (!patchRes.ok) {
    return NextResponse.json({ success: false, message: 'Erro ao atualizar senha' }, { status: 500 })
  }

  // Now issue the real auth token and set cookie
  const user = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    avatar: null,
    role: dbUser.role as 'admin' | 'manager' | 'agent' | 'viewer',
    status: 'active' as const,
    permissions: getPermissions(dbUser.role, dbUser.permissions ?? []),
    teamId: dbUser.company_id,
    isDemo: dbUser.is_demo,
    company: dbUser.companies ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

  const response = NextResponse.json({
    success: true,
    message: 'Senha alterada com sucesso!',
    data: {
      user,
      accessToken: token,
      refreshToken: token,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    },
  })

  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return response
}
