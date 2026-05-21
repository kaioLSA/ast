import { NextResponse, type NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'

const SB  = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const H   = () => ({ apikey: KEY!, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' })

async function get(path: string) {
  const r = await fetch(`${SB}/rest/v1/${path}`, { headers: H(), cache: 'no-store' })
  return r.ok ? r.json() : []
}

function monthLabel(d: Date) {
  return d.toLocaleString('pt-BR', { month: 'short' })
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const source = req.nextUrl.searchParams.get('source') ?? ''
  const cid    = user.company_id

  // ── Leads ──────────────────────────────────────────────────────────
  if (source === 'leads_total') {
    const rows = await get(`leads?company_id=eq.${cid}&select=id`)
    return NextResponse.json({ value: rows.length, label: 'Leads' })
  }

  if (source === 'leads_hot') {
    const rows = await get(`leads?company_id=eq.${cid}&temperature=eq.hot&select=id`)
    return NextResponse.json({ value: rows.length, label: 'Leads Quentes' })
  }

  if (source === 'leads_by_status') {
    const rows = await get(`leads?company_id=eq.${cid}&select=status`)
    const map: Record<string, number> = {}
    for (const r of rows) map[r.status ?? 'sem status'] = (map[r.status ?? 'sem status'] ?? 0) + 1
    return NextResponse.json(Object.entries(map).map(([name, value]) => ({ name, value })))
  }

  if (source === 'leads_by_source') {
    const rows = await get(`leads?company_id=eq.${cid}&select=source`)
    const map: Record<string, number> = {}
    for (const r of rows) map[r.source ?? 'Direto'] = (map[r.source ?? 'Direto'] ?? 0) + 1
    return NextResponse.json(Object.entries(map).map(([name, value]) => ({ name, value })))
  }

  if (source === 'leads_temperature') {
    const rows = await get(`leads?company_id=eq.${cid}&select=temperature`)
    const labels: Record<string, string> = { hot: 'Quente', warm: 'Morno', cold: 'Frio' }
    const map: Record<string, number> = {}
    for (const r of rows) { const k = labels[r.temperature] ?? r.temperature ?? 'N/A'; map[k] = (map[k] ?? 0) + 1 }
    return NextResponse.json(Object.entries(map).map(([name, value]) => ({ name, value })))
  }

  if (source === 'leads_by_state') {
    const rows = await get(`leads?company_id=eq.${cid}&select=state`)
    const map: Record<string, number> = {}
    for (const r of rows) { if (r.state) map[r.state] = (map[r.state] ?? 0) + 1 }
    return NextResponse.json(map)
  }

  if (source === 'leads_score_avg') {
    const rows = await get(`leads?company_id=eq.${cid}&select=score`)
    const scores = rows.map((r: { score: number }) => r.score ?? 0).filter((s: number) => s > 0)
    const avg = scores.length ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0
    return NextResponse.json({ value: avg, label: 'Score Médio' })
  }

  // ── Clients ────────────────────────────────────────────────────────
  if (source === 'clients_total') {
    const rows = await get(`clients?company_id=eq.${cid}&select=id`)
    return NextResponse.json({ value: rows.length, label: 'Clientes' })
  }

  // ── Finance ────────────────────────────────────────────────────────
  if (source === 'revenue_total') {
    const rows = await get(`financial_transactions?company_id=eq.${cid}&type=eq.income&select=amount`)
    const val = rows.reduce((s: number, r: { amount: number }) => s + (r.amount ?? 0), 0)
    return NextResponse.json({ value: val, label: 'Receita Total', format: 'currency' })
  }

  if (source === 'expenses_total') {
    const rows = await get(`financial_transactions?company_id=eq.${cid}&type=eq.expense&select=amount`)
    const val = rows.reduce((s: number, r: { amount: number }) => s + (r.amount ?? 0), 0)
    return NextResponse.json({ value: val, label: 'Despesas', format: 'currency' })
  }

  if (source === 'net_balance') {
    const inc = await get(`financial_transactions?company_id=eq.${cid}&type=eq.income&select=amount`)
    const exp = await get(`financial_transactions?company_id=eq.${cid}&type=eq.expense&select=amount`)
    const val = inc.reduce((s: number, r: { amount: number }) => s + r.amount, 0) - exp.reduce((s: number, r: { amount: number }) => s + r.amount, 0)
    return NextResponse.json({ value: val, label: 'Saldo Líquido', format: 'currency' })
  }

  if (source === 'transactions_count') {
    const rows = await get(`financial_transactions?company_id=eq.${cid}&select=id`)
    return NextResponse.json({ value: rows.length, label: 'Transações' })
  }

  if (source === 'revenue_by_category') {
    const rows = await get(`financial_transactions?company_id=eq.${cid}&type=eq.income&select=category,amount`)
    const map: Record<string, number> = {}
    for (const r of rows) map[r.category ?? 'other'] = (map[r.category ?? 'other'] ?? 0) + r.amount
    return NextResponse.json(Object.entries(map).map(([name, value]) => ({ name, value })))
  }

  if (source === 'revenue_over_time') {
    const rows = await get(`financial_transactions?company_id=eq.${cid}&select=type,amount,transaction_date`)
    // last 6 months
    const months: { key: string; label: string }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: monthLabel(d) })
    }
    const result = months.map(m => {
      const inc = rows.filter((r: { type: string; transaction_date: string; amount: number }) => r.type === 'income' && r.transaction_date?.slice(0, 7) === m.key).reduce((s: number, r: { amount: number }) => s + r.amount, 0)
      const exp = rows.filter((r: { type: string; transaction_date: string; amount: number }) => r.type === 'expense' && r.transaction_date?.slice(0, 7) === m.key).reduce((s: number, r: { amount: number }) => s + r.amount, 0)
      return { month: m.label, income: inc, expenses: exp }
    })
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: `Unknown source: ${source}` }, { status: 400 })
}
