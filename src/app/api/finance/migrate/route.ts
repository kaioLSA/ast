import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function pgQuery(sql: string) {
  const res = await fetch(`${URL}/pg/query`, {
    method: 'POST',
    headers: { apikey: KEY!, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  return res.ok
}

export async function POST() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json({ error: 'Não disponível no modo demonstração.' }, { status: 403 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Apenas administradores podem executar migrações' }, { status: 403 })

  // Add scope column: 'company' (shared) or 'personal' (private)
  await pgQuery(`ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'company'`)

  // Add user_id column for personal transactions
  await pgQuery(`ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS user_id UUID`)

  // Index for fast personal queries
  await pgQuery(`CREATE INDEX IF NOT EXISTS idx_ftx_scope ON financial_transactions(scope)`)
  await pgQuery(`CREATE INDEX IF NOT EXISTS idx_ftx_user ON financial_transactions(user_id)`)

  return NextResponse.json({ ok: true })
}
