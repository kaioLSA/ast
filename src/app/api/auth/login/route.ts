import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

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

const MANAGER_PERMISSIONS = [
  'leads:read','leads:write',
  'clients:read','clients:write',
  'calendar:read','calendar:write',
  'campaigns:read','campaigns:write',
  'analytics:read','ai:use',
  'whatsapp:read','whatsapp:write',
]

function getPermissions(role: string) {
  if (role === 'admin') return ADMIN_PERMISSIONS
  if (role === 'manager') return MANAGER_PERMISSIONS
  return ['leads:read','analytics:read']
}

async function querySupabase(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY!,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json()
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { email, password } = body as { email?: string; password?: string }

  if (!email || !password) {
    return NextResponse.json({ success: false, message: 'Email e senha são obrigatórios' }, { status: 400 })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ success: false, message: 'Configuração do banco indisponível' }, { status: 500 })
  }

  const emailNorm = email.toLowerCase().trim()

  const rows = await querySupabase(
    `crm_users?select=id,email,name,role,custom_role,permissions,password_hash,is_demo,active,force_password_change,company_id,companies(name,slug,meta_pixel_id,meta_pixel_token,meta_access_token,meta_ad_account_id,whatsapp_phone_id,whatsapp_access_token)&email=eq.${encodeURIComponent(emailNorm)}&active=eq.true&limit=1`
  )

  const dbUser = rows?.[0]

  if (!dbUser) {
    return NextResponse.json({ success: false, message: 'Email ou senha incorretos' }, { status: 401 })
  }

  const passwordValid = await bcrypt.compare(password, dbUser.password_hash)
  if (!passwordValid) {
    return NextResponse.json({ success: false, message: 'Email ou senha incorretos' }, { status: 401 })
  }

  // ── Force password change ──────────────────────────────────────────────────
  if (dbUser.force_password_change) {
    // Return a short-lived change token — do NOT set auth cookie yet
    const changeToken = Buffer.from(`${dbUser.id}:${Date.now()}:fpc`).toString('base64')
    return NextResponse.json({
      success: true,
      requiresPasswordChange: true,
      changeToken,
      message: 'É necessário definir uma nova senha antes de continuar.',
    })
  }

  // ── Normal login ───────────────────────────────────────────────────────────
  const user = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    avatar: null,
    role: dbUser.role as 'admin' | 'manager' | 'agent' | 'viewer',
    status: 'active' as const,
    permissions: dbUser.role === 'admin' ? getPermissions('admin') : (dbUser.permissions ?? getPermissions(dbUser.role)),
    teamId: dbUser.company_id,
    isDemo: dbUser.is_demo,
    company: dbUser.companies ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

  const response = NextResponse.json({
    success: true,
    requiresPasswordChange: false,
    message: 'Login realizado com sucesso',
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
    path: '/',
    // Sem maxAge = session cookie: apagado ao fechar o navegador
  })

  return response
}
