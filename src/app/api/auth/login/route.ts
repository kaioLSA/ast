import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { signSessionToken, signFpcToken } from '@/lib/utils/jwt'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// ── In-memory rate limiter for login (brute-force protection) ─────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 10
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= MAX_ATTEMPTS) return false
  entry.count++
  return true
}

function resetRateLimit(ip: string) {
  loginAttempts.delete(ip)
}

// ── Permissions ────────────────────────────────────────────────────────────────

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
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, message: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.' },
      { status: 429 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const { email, password } = body as { email?: string; password?: string }

  if (!email || !password) {
    return NextResponse.json({ success: false, message: 'Email e senha são obrigatórios' }, { status: 400 })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ success: false, message: 'Configuração do banco indisponível' }, { status: 500 })
  }

  const emailNorm = email.toLowerCase().trim()

  // Fetch only non-sensitive company fields (no tokens/keys)
  const rows = await querySupabase(
    `crm_users?select=id,email,name,role,custom_role,permissions,password_hash,is_demo,active,force_password_change,company_id,companies(name,slug)&email=eq.${encodeURIComponent(emailNorm)}&active=eq.true&limit=1`
  )

  const dbUser = rows?.[0]

  if (!dbUser) {
    return NextResponse.json({ success: false, message: 'Email ou senha incorretos' }, { status: 401 })
  }

  const passwordValid = await bcrypt.compare(password, dbUser.password_hash)
  if (!passwordValid) {
    return NextResponse.json({ success: false, message: 'Email ou senha incorretos' }, { status: 401 })
  }

  // Reset rate limit on successful auth
  resetRateLimit(ip)

  // ── Force password change ──────────────────────────────────────────────────
  if (dbUser.force_password_change) {
    const changeToken = await signFpcToken(dbUser.id)
    return NextResponse.json({
      success: true,
      requiresPasswordChange: true,
      changeToken,
      message: 'É necessário definir uma nova senha antes de continuar.',
    })
  }

  // ── Try to fetch avatar_url separately (column may not exist yet) ──────────
  let avatarUrl: string | null = null
  try {
    const avatarRows = await querySupabase(`crm_users?select=avatar_url&id=eq.${dbUser.id}&limit=1`)
    avatarUrl = avatarRows?.[0]?.avatar_url ?? null
  } catch { /* column doesn't exist yet — ignore */ }

  // ── Normal login ───────────────────────────────────────────────────────────
  const user = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    avatar: avatarUrl,
    role: dbUser.role as 'admin' | 'manager' | 'agent' | 'viewer',
    status: 'active' as const,
    permissions: dbUser.role === 'admin' ? getPermissions('admin') : (dbUser.permissions ?? getPermissions(dbUser.role)),
    teamId: dbUser.company_id,
    isDemo: dbUser.is_demo,
    company: dbUser.companies ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const token = await signSessionToken(user.id)

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

  const isHttps = (process.env.NEXT_PUBLIC_APP_URL ?? '').startsWith('https')
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    path: '/',
  })

  return response
}
