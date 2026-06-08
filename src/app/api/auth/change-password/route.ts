import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { verifyFpcToken, signSessionToken } from '@/lib/utils/jwt'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

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

  // Verify signed FPC token (replaces old base64 approach)
  const payload = await verifyFpcToken(changeToken)
  if (!payload) {
    return NextResponse.json({ success: false, message: 'Token inválido ou expirado. Faça login novamente.' }, { status: 401 })
  }
  const userId = payload.userId

  // Fetch user — only non-sensitive company fields
  const userRes = await fetch(
    `${SUPABASE_URL}/rest/v1/crm_users?select=id,email,name,role,permissions,is_demo,company_id,companies(name,slug)&id=eq.${userId}&active=eq.true&limit=1`,
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

  // Issue real auth token (signed JWT)
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

  const token = await signSessionToken(user.id)

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

  const isHttps = (process.env.NEXT_PUBLIC_APP_URL ?? '').startsWith('https')
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return response
}
