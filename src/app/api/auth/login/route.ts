import { NextResponse, type NextRequest } from 'next/server'

const DEMO_USERS = [
  {
    email: 'admin@startsette.com',
    password: 'admin123',
    user: {
      id: 'u0',
      name: 'Admin Startsette',
      email: 'admin@startsette.com',
      avatar: null,
      role: 'admin' as const,
      status: 'active' as const,
      permissions: [
        'leads:read','leads:write','leads:delete',
        'campaigns:read','campaigns:write','campaigns:delete',
        'finance:read','finance:write',
        'team:read','team:write','team:delete',
        'settings:read','settings:write',
        'analytics:read','ai:use',
        'whatsapp:read','whatsapp:write',
      ],
      teamId: 't1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    email: 'demo@startsette.com',
    password: 'demo123',
    user: {
      id: 'u1',
      name: 'Demo User',
      email: 'demo@startsette.com',
      avatar: null,
      role: 'manager' as const,
      status: 'active' as const,
      permissions: [
        'leads:read','leads:write',
        'campaigns:read','campaigns:write',
        'analytics:read','ai:use',
        'whatsapp:read','whatsapp:write',
      ],
      teamId: 't1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
]

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { email, password } = body as { email?: string; password?: string }

  const match = DEMO_USERS.find(
    (u) => u.email === email?.toLowerCase().trim() && u.password === password,
  )

  if (!match) {
    return NextResponse.json(
      { success: false, message: 'Email ou senha incorretos' },
      { status: 401 },
    )
  }

  const token = Buffer.from(`${match.user.id}:${Date.now()}`).toString('base64')

  const response = NextResponse.json({
    success: true,
    message: 'Login realizado com sucesso',
    data: {
      user: match.user,
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
