import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { getAuthUser } from '@/lib/utils/get-auth-user'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// ── Conta blindada — nenhuma modificação permitida por ninguém ────────────────
const PROTECTED_EMAIL = 'kaiolaurindo@setteia.com'

function sbHeaders() {
  return {
    apikey: SUPABASE_SERVICE_KEY!,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }
}

async function getTargetUser(id: string, companyId: string): Promise<{ email: string } | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/crm_users?id=eq.${id}&company_id=eq.${companyId}&select=email&limit=1`,
    { headers: sbHeaders() },
  )
  const rows = await res.json().catch(() => [])
  return rows?.[0] ?? null
}

function isProtected(email: string | undefined | null): boolean {
  return !!email && email.toLowerCase() === PROTECTED_EMAIL.toLowerCase()
}

// ── DELETE (deactivate) ───────────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin')
    return NextResponse.json({ error: 'Apenas administradores podem remover membros' }, { status: 403 })
  if (params.id === user.id)
    return NextResponse.json({ error: 'Você não pode remover sua própria conta' }, { status: 400 })

  const target = await getTargetUser(params.id, user.company_id)
  if (isProtected(target?.email))
    return NextResponse.json({ error: 'Esta conta é protegida e não pode ser modificada.' }, { status: 403 })

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/crm_users?id=eq.${params.id}&company_id=eq.${user.company_id}`,
    { method: 'PATCH', headers: { ...sbHeaders(), Prefer: 'return=minimal' }, body: JSON.stringify({ active: false }) },
  )

  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 })
  return NextResponse.json({ success: true })
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin')
    return NextResponse.json({ error: 'Apenas administradores podem editar membros' }, { status: 403 })

  // Bloquear qualquer modificação na conta protegida
  const target = await getTargetUser(params.id, user.company_id)
  if (isProtected(target?.email))
    return NextResponse.json({ error: 'Esta conta é protegida e não pode ser modificada.' }, { status: 403 })

  const body = await req.json().catch(() => ({}))

  // ── Password reset by admin ────────────────────────────────────────────────
  if ('newPassword' in body) {
    if (typeof body.newPassword !== 'string' || body.newPassword.length < 6)
      return NextResponse.json({ error: 'A senha temporária deve ter pelo menos 6 caracteres' }, { status: 400 })

    const password_hash = await bcrypt.hash(body.newPassword, 12)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/crm_users?id=eq.${params.id}&company_id=eq.${user.company_id}`,
      { method: 'PATCH', headers: { ...sbHeaders(), Prefer: 'return=minimal' }, body: JSON.stringify({ password_hash, force_password_change: true }) },
    )
    if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // ── Regular field updates (permissions, role, avatar, etc.) ───────────────
  const allowed = ['permissions', 'custom_role', 'role', 'active', 'avatar_url', 'name']
  const patch: Record<string, unknown> = {}
  for (const k of allowed) if (k in body) patch[k] = body[k]

  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })

  // If avatar_url is included but column might not exist, try — PostgREST will error gracefully
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/crm_users?id=eq.${params.id}&company_id=eq.${user.company_id}`,
    { method: 'PATCH', headers: { ...sbHeaders(), Prefer: 'return=minimal' }, body: JSON.stringify(patch) },
  )

  if (!res.ok) {
    // If avatar_url column doesn't exist, retry without it
    if ('avatar_url' in patch) {
      const { avatar_url: _a, ...rest } = patch // eslint-disable-line @typescript-eslint/no-unused-vars
      if (Object.keys(rest).length > 0) {
        const res2 = await fetch(
          `${SUPABASE_URL}/rest/v1/crm_users?id=eq.${params.id}&company_id=eq.${user.company_id}`,
          { method: 'PATCH', headers: { ...sbHeaders(), Prefer: 'return=minimal' }, body: JSON.stringify(rest) },
        )
        if (!res2.ok) return NextResponse.json({ error: await res2.text() }, { status: 500 })
        return NextResponse.json({ success: true, avatarSkipped: true })
      }
    }
    return NextResponse.json({ error: await res.text() }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
