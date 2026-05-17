import { NextResponse, type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { getAuthUser } from '@/lib/utils/get-auth-user'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// ── Conta protegida — nunca pode ser desativada ou excluída ───────────────────
const PROTECTED_EMAIL = 'kaiolaurindo@setteia.com'

function sbHeaders() {
  return {
    apikey: SUPABASE_SERVICE_KEY!,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }
}

async function getTargetEmail(id: string, companyId: string): Promise<string | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/crm_users?id=eq.${id}&company_id=eq.${companyId}&select=email&limit=1`,
    { headers: sbHeaders() },
  )
  const rows = await res.json().catch(() => [])
  return rows?.[0]?.email ?? null
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin')
    return NextResponse.json(
      { error: 'Apenas administradores podem remover membros' },
      { status: 403 },
    )
  if (params.id === user.id)
    return NextResponse.json({ error: 'Você não pode remover sua própria conta' }, { status: 400 })

  // Bloquear desativação da conta protegida
  const targetEmail = await getTargetEmail(params.id, user.company_id)
  if (targetEmail?.toLowerCase() === PROTECTED_EMAIL.toLowerCase()) {
    return NextResponse.json(
      { error: 'Esta conta é protegida e não pode ser desativada.' },
      { status: 403 },
    )
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/crm_users?id=eq.${params.id}&company_id=eq.${user.company_id}`,
    {
      method: 'PATCH',
      headers: { ...sbHeaders(), Prefer: 'return=minimal' },
      body: JSON.stringify({ active: false }),
    },
  )

  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin')
    return NextResponse.json(
      { error: 'Apenas administradores podem editar membros' },
      { status: 403 },
    )

  const body = await req.json().catch(() => ({}))

  // Bloquear desativação da conta protegida via PATCH active: false
  if ('active' in body && body.active === false) {
    const targetEmail = await getTargetEmail(params.id, user.company_id)
    if (targetEmail?.toLowerCase() === PROTECTED_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { error: 'Esta conta é protegida e não pode ser desativada.' },
        { status: 403 },
      )
    }
  }

  // ── Password reset by admin ──────────────────────────────────────────────────
  if ('newPassword' in body) {
    if (typeof body.newPassword !== 'string' || body.newPassword.length < 6) {
      return NextResponse.json(
        { error: 'A senha temporária deve ter pelo menos 6 caracteres' },
        { status: 400 },
      )
    }
    const password_hash = await bcrypt.hash(body.newPassword, 12)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/crm_users?id=eq.${params.id}&company_id=eq.${user.company_id}`,
      {
        method: 'PATCH',
        headers: { ...sbHeaders(), Prefer: 'return=minimal' },
        body: JSON.stringify({ password_hash, force_password_change: true }),
      },
    )
    if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // ── Regular field updates ────────────────────────────────────────────────────
  const allowed = ['permissions', 'custom_role', 'role', 'active']
  const patch: Record<string, unknown> = {}
  for (const k of allowed) if (k in body) patch[k] = body[k]

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/crm_users?id=eq.${params.id}&company_id=eq.${user.company_id}`,
    {
      method: 'PATCH',
      headers: { ...sbHeaders(), Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    },
  )

  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 500 })
  return NextResponse.json({ success: true })
}
