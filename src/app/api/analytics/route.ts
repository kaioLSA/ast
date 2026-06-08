import { hasPermission, forbiddenResponse } from '@/lib/utils/require-permission'
import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/utils/get-auth-user'
import { DEMO_ANALYTICS } from '@/lib/demo/data'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Retorna 'YYYY-MM-DD' no fuso de Brasília (UTC-3) independente do servidor
function toBRDate(dateStr: string): string {
  const d = new Date(dateStr)
  // UTC-3 offset em ms
  const br = new Date(d.getTime() - 3 * 60 * 60 * 1000)
  return br.toISOString().slice(0, 10)
}

function headers() {
  return {
    apikey: SUPABASE_SERVICE_KEY!,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }
}

const SOURCE_COLORS: Record<string, string> = {
  meta_ads:   '#3b82f6',
  google_ads: '#10b981',
  whatsapp:   '#8b5cf6',
  organic:    '#f59e0b',
  referral:   '#06b6d4',
  manual:     '#94a3b8',
}

const SOURCE_LABELS: Record<string, string> = {
  meta_ads:   'Meta Ads',
  google_ads: 'Google Ads',
  whatsapp:   'WhatsApp',
  organic:    'Orgânico',
  referral:   'Indicação',
  manual:     'Manual',
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.is_demo) return NextResponse.json(DEMO_ANALYTICS)
  if (!hasPermission(user, 'analytics:read')) return forbiddenResponse('analytics:read')

  const cid = user.company_id

  // ── Fetch all data in parallel ────────────────────────────────────────────
  const [leadsRes, clientsRes, txRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/leads?select=id,created_at,status,source,value&company_id=eq.${cid}`, { headers: headers(), cache: 'no-store' }),
    fetch(`${SUPABASE_URL}/rest/v1/clients?select=id,status,created_at&company_id=eq.${cid}`, { headers: headers(), cache: 'no-store' }),
    fetch(`${SUPABASE_URL}/rest/v1/finance_transactions?select=id,type,amount,transaction_date&company_id=eq.${cid}`, { headers: headers(), cache: 'no-store' }),
  ])

  const leads:   { id: string; created_at: string; status: string; source: string; value: number }[]   = leadsRes.ok   ? await leadsRes.json()   : []
  const clients: { id: string; status: string; created_at: string }[]                                  = clientsRes.ok ? await clientsRes.json() : []
  const txs:     { id: string; type: string; amount: number; transaction_date: string }[]              = txRes.ok      ? await txRes.json()      : []

  // ── Metric cards ──────────────────────────────────────────────────────────

  const totalLeads      = leads.length
  const wonLeads        = leads.filter(l => l.status === 'won').length
  const conversionRate  = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) + '%' : '0%'
  const totalRevenue    = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const activeClients   = clients.filter(c => c.status === 'active').length

  // ── Leads por dia — últimos 30 dias ──────────────────────────────────────

  const today   = new Date()
  const days30: { day: string; leads: number; conversions: number }[] = []

  for (let i = 29; i >= 0; i--) {
    const d   = new Date(today)
    d.setDate(d.getDate() - i)
    const key = toBRDate(d.toISOString())   // 'YYYY-MM-DD' em Brasília
    const brD = new Date(d.getTime() - 3 * 60 * 60 * 1000)
    const label = `${brD.getUTCDate().toString().padStart(2, '0')}/${(brD.getUTCMonth() + 1).toString().padStart(2, '0')}`
    const dayLeads = leads.filter(l => l.created_at ? toBRDate(l.created_at) === key : false)
    days30.push({
      day: label,
      leads: dayLeads.length,
      conversions: dayLeads.filter(l => l.status === 'won').length,
    })
  }

  // ── Leads por origem ──────────────────────────────────────────────────────

  const sourceCounts: Record<string, number> = {}
  leads.forEach(l => { sourceCounts[l.source] = (sourceCounts[l.source] ?? 0) + 1 })
  const total = leads.length || 1
  const leadsBySource = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([src, count]) => ({
      name:  SOURCE_LABELS[src] ?? src,
      value: Math.round((count / total) * 100),
      color: SOURCE_COLORS[src] ?? '#94a3b8',
    }))

  // ── Receita vs Despesas — últimos 6 meses ────────────────────────────────

  const revenueByMonth: { month: string; receita: number; despesas: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const yyyy = d.getFullYear()
    const mm   = String(d.getMonth() + 1).padStart(2, '0')
    const prefix = `${yyyy}-${mm}`
    const monthTxs = txs.filter(t => t.transaction_date?.startsWith(prefix))
    revenueByMonth.push({
      month:    MONTH_LABELS[d.getMonth()],
      receita:  monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
      despesas: monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
    })
  }

  return NextResponse.json({
    metrics: {
      totalLeads,
      conversionRate,
      totalRevenue,
      activeClients,
    },
    leadsPerDay:    days30,
    leadsBySource,
    revenueByMonth,
  })
}
