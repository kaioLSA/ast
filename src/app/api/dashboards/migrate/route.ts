import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

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

  await pgQuery(`
    CREATE TABLE IF NOT EXISTS custom_dashboards (
      id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      company_id   UUID NOT NULL,
      user_id      UUID,
      name         TEXT NOT NULL DEFAULT 'Meu Dashboard',
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // Add user_id to tables that were created before this column existed
  await pgQuery(`ALTER TABLE custom_dashboards ADD COLUMN IF NOT EXISTS user_id UUID`)
  await pgQuery(`CREATE INDEX IF NOT EXISTS idx_cdash_user ON custom_dashboards(user_id)`)

  await pgQuery(`
    CREATE TABLE IF NOT EXISTS custom_dashboard_widgets (
      id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      dashboard_id UUID NOT NULL,
      position     INTEGER NOT NULL DEFAULT 0,
      widget_type  TEXT NOT NULL,
      data_source  TEXT NOT NULL,
      title        TEXT NOT NULL DEFAULT '',
      color        TEXT NOT NULL DEFAULT '#3b82f6',
      col_span     INTEGER NOT NULL DEFAULT 6,
      tall         BOOLEAN NOT NULL DEFAULT false,
      merged       BOOLEAN NOT NULL DEFAULT false,
      config       JSONB DEFAULT '{}',
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await pgQuery(`CREATE INDEX IF NOT EXISTS idx_cdash_company ON custom_dashboards(company_id)`)
  await pgQuery(`CREATE INDEX IF NOT EXISTS idx_cdw_dashboard ON custom_dashboard_widgets(dashboard_id)`)

  return NextResponse.json({ ok: true })
}
