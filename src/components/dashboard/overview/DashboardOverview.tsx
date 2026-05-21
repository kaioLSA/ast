'use client'

import {
  TrendingUp, TrendingDown, Users, DollarSign,
  Target, Zap, ArrowUpRight, Bot,
  BarChart3, Activity, MousePointerClick, UserCheck, ShoppingCart, HelpCircle,
  Eye, MousePointer, Megaphone, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useEffect, useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Lead = {
  id: string
  name: string
  company?: string
  email?: string
  phone?: string
  status: string
  source?: string
  temperature?: string
  value?: number
  score?: number
  created_at: string
}

type Client = {
  id: string
  name: string
  company_name?: string
  email?: string
  phone?: string
  status: string
  value?: number
  deals?: number
  created_at: string
}

type MetaInsights = {
  totalSpend: number
  totalImpressions: number
  totalClicks: number
  totalReach: number
  totalLeads: number
  totalMessages: number
  leadCount: number
  clientCount: number
  cpl: number | null
  cac: number | null
  ctr: number
  cpc: number
  cpm: number
  activeAccounts: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PERIODS = [
  { label: 'Hoje', value: 'today' },
  { label: 'Ontem', value: 'yesterday' },
  { label: 'Últimos 7 dias', value: 'last_7d' },
  { label: 'Últimos 14 dias', value: 'last_14d' },
  { label: 'Últimos 30 dias', value: 'last_30d' },
  { label: 'Últimos 60 dias', value: 'last_60d' },
  { label: 'Últimos 90 dias', value: 'last_90d' },
  { label: 'Este mês', value: 'this_month' },
  { label: 'Mês passado', value: 'last_month' },
  { label: 'Máximo — tudo disponível', value: 'maximum' },
]

const SOURCE_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  meta: 'Meta Ads',
  facebook: 'Facebook',
  instagram: 'Instagram',
  manual: 'Manual',
  website: 'Website',
  referral: 'Indicação',
  email: 'E-mail',
  organic: 'Orgânico',
}

const SOURCE_COLORS: Record<string, string> = {
  whatsapp: '#22c55e',
  meta: '#3b82f6',
  facebook: '#6366f1',
  instagram: '#ec4899',
  manual: '#a855f7',
  website: '#06b6d4',
  referral: '#f59e0b',
  email: '#f97316',
  organic: '#10b981',
}

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function pct(curr: number, prev: number): { change: string; up: boolean } {
  if (prev === 0 && curr === 0) return { change: '0%', up: true }
  if (prev === 0) return { change: '+100%', up: true }
  const diff = ((curr - prev) / prev) * 100
  const sign = diff >= 0 ? '+' : ''
  return { change: `${sign}${diff.toFixed(1)}%`, up: diff >= 0 }
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000)
}

// ── Meta Section ──────────────────────────────────────────────────────────────

type MetaSectionProps = { data: MetaInsights | null; loading: boolean; error: boolean; period: string; setPeriod: (p: string) => void }

function MetaSection({ data, loading, error, period, setPeriod }: MetaSectionProps) {
  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtInt = (n: number) => n.toLocaleString('pt-BR')

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">f</div>
          <h2 className="font-semibold text-white">Meta Ads — Tempo Real</h2>
          {data && (
            <span className="text-[10px] text-slate-500 border border-white/10 rounded px-1.5 py-0.5">
              {data.activeAccounts} contas ativas
            </span>
          )}
        </div>
        <select
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="text-xs text-slate-300 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500/50 cursor-pointer"
        >
          {PERIODS.map(p => <option key={p.value} value={p.value} className="bg-[#1c1c24]">{p.label}</option>)}
        </select>
      </div>

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/3 p-5 animate-pulse">
              <div className="h-3 w-20 bg-white/10 rounded mb-4" />
              <div className="h-7 w-28 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          Erro ao carregar dados do Meta. Verifique o token de acesso.
        </div>
      )}

      {data && !loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {[
              { label: 'Gasto Total', value: `R$ ${fmt(data.totalSpend)}`, icon: DollarSign },
              { label: 'Alcance', value: fmtInt(data.totalReach), icon: Eye },
              { label: 'Impressões', value: fmtInt(data.totalImpressions), icon: Megaphone },
              { label: 'Cliques', value: fmtInt(data.totalClicks), icon: MousePointer },
            ].map(m => {
              const Icon = m.icon
              return (
                <div key={m.label} className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10)] hover:scale-[1.02] transition-transform duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-400">{m.label}</p>
                    <div className="p-1.5 rounded-lg bg-white/8 text-slate-300"><Icon className="w-3.5 h-3.5" /></div>
                  </div>
                  <p className="text-xl font-bold text-white tabular-nums">{m.value}</p>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'CPM', sublabel: 'Custo por mil impressões', value: `R$ ${fmt(data.cpm)}`, icon: BarChart3 },
              { label: 'CPC', sublabel: 'Custo por clique', value: `R$ ${fmt(data.cpc)}`, icon: MousePointerClick },
              { label: 'CTR', sublabel: 'Taxa de clique', value: `${data.ctr}%`, icon: Target },
            ].map(m => {
              const Icon = m.icon
              return (
                <div key={m.label} className="rounded-2xl border border-white/8 bg-white/[0.04] p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-white">{m.label}</p>
                      <p className="text-[10px] text-slate-500">{m.sublabel}</p>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/5 text-slate-400"><Icon className="w-3.5 h-3.5" /></div>
                  </div>
                  <p className="text-2xl font-bold text-white tabular-nums mt-3">{m.value}</p>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardOverview() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [crmLoading, setCrmLoading] = useState(true)

  const [metaData, setMetaData] = useState<MetaInsights | null>(null)
  const [metaLoading, setMetaLoading] = useState(true)
  const [metaError, setMetaError] = useState(false)
  const [period, setPeriod] = useState('last_30d')

  // Fetch real CRM data
  useEffect(() => {
    setCrmLoading(true)
    Promise.all([
      fetch('/api/leads').then(r => r.json()).catch(() => []),
      fetch('/api/clients').then(r => r.json()).catch(() => []),
    ]).then(([l, c]) => {
      setLeads(Array.isArray(l) ? l : [])
      setClients(Array.isArray(c) ? c : [])
      setCrmLoading(false)
    })
  }, [])

  // Fetch Meta Ads data
  useEffect(() => {
    setMetaLoading(true)
    setMetaError(false)
    fetch(`/api/meta/insights?period=${period}`)
      .then(r => r.json())
      .then(d => { setMetaData(d); setMetaLoading(false) })
      .catch(() => { setMetaError(true); setMetaLoading(false) })
  }, [period])

  // ── Compute metrics from real data ──────────────────────────────────────────

  const now = new Date()
  const d30 = daysAgo(30)
  const d60 = daysAgo(60)

  const leadsLast30 = leads.filter(l => new Date(l.created_at) >= d30)
  const leadsPrev30 = leads.filter(l => { const d = new Date(l.created_at); return d >= d60 && d < d30 })

  const clientsLast30 = clients.filter(c => new Date(c.created_at) >= d30)
  const clientsPrev30 = clients.filter(c => { const d = new Date(c.created_at); return d >= d60 && d < d30 })

  const closedWon = leads.filter(l => l.status === 'closed_won')
  const closedWonPrev = leadsPrev30.filter(l => l.status === 'closed_won')
  const closedWonCurr = leadsLast30.filter(l => l.status === 'closed_won')

  const totalRevenue = clients.reduce((s, c) => s + (c.value || 0), 0)
  const revLast30 = clientsLast30.reduce((s, c) => s + (c.value || 0), 0)
  const revPrev30 = clientsPrev30.reduce((s, c) => s + (c.value || 0), 0)

  const convRate = leads.length > 0 ? (closedWon.length / leads.length) * 100 : 0
  const convPrev = leadsPrev30.length > 0 ? (closedWonPrev.length / leadsPrev30.length) * 100 : 0

  const avgTicket = clients.length > 0 ? totalRevenue / clients.length : 0
  const avgTicketPrev = clientsPrev30.length > 0
    ? clientsPrev30.reduce((s, c) => s + (c.value || 0), 0) / clientsPrev30.length : 0

  const mrr = totalRevenue / 12
  const mrrPrev = revPrev30 / 12

  // Computed metric cards
  const metricCards = [
    { label: 'Receita Total',      value: fmtBRL(totalRevenue),          ...pct(revLast30, revPrev30),                          icon: DollarSign },
    { label: 'Novos Leads',        value: String(leadsLast30.length),     ...pct(leadsLast30.length, leadsPrev30.length),         icon: Users      },
    { label: 'Taxa de Conversão',  value: `${convRate.toFixed(1)}%`,      ...pct(convRate, convPrev),                             icon: Target     },
    { label: 'MRR',                value: fmtBRL(mrr),                    ...pct(mrr, mrrPrev),                                   icon: BarChart3  },
    { label: 'Negócios Fechados',  value: String(closedWon.length),       ...pct(closedWonCurr.length, closedWonPrev.length),     icon: Zap        },
    { label: 'Ticket Médio',       value: fmtBRL(avgTicket),              ...pct(avgTicket, avgTicketPrev),                       icon: Activity   },
  ]

  // Source breakdown from lead.source field
  const sourceMap: Record<string, number> = {}
  for (const lead of leads) {
    const src = lead.source || 'manual'
    sourceMap[src] = (sourceMap[src] || 0) + 1
  }
  const sourceBars = Object.entries(sourceMap)
    .map(([source, count]) => ({
      source: SOURCE_LABELS[source] || source,
      count,
      percentage: leads.length > 0 ? Math.round((count / leads.length) * 100) : 0,
      color: SOURCE_COLORS[source] || '#6366f1',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  // Recent leads (last 5)
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const periodLabel = PERIODS.find(p => p.value === period)?.label ?? ''
  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const cplValue = metaData?.cpl != null ? `R$ ${fmt(metaData.cpl)}` : '—'
  const qualifiedLeads = metaData ? Math.round(metaData.leadCount * 0.25) : 0
  const cpmqlValue = (metaData && qualifiedLeads > 0) ? `R$ ${fmt(metaData.totalSpend / qualifiedLeads)}` : '—'
  // CAC = total Meta spend ÷ number of CRM clients (not Meta ad accounts)
  const cacRaw = (metaData && clients.length > 0) ? metaData.totalSpend / clients.length : null
  const cacValue = cacRaw != null ? `R$ ${fmt(cacRaw)}` : '—'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Visão geral — {periodLabel}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          Sistema operacional
        </div>
      </div>

      {/* Metrics grid */}
      {crmLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/3 p-5 animate-pulse">
              <div className="h-3 w-24 bg-white/10 rounded mb-4" />
              <div className="h-8 w-32 bg-white/10 rounded mb-2" />
              <div className="h-3 w-20 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {metricCards.map((m) => {
            const Icon = m.icon
            return (
              <div
                key={m.label}
                className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.10)] hover:scale-[1.02] transition-transform duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-slate-400">{m.label}</p>
                  <div className="p-2 rounded-xl bg-white/8 text-slate-300">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums">{m.value}</p>
                <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', m.up ? 'text-blue-400' : 'text-red-400')}>
                  {m.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {m.change} vs mês anterior
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Meta Ads */}
      <MetaSection data={metaData} loading={metaLoading} error={metaError} period={period} setPeriod={setPeriod} />

      {/* Cost metrics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Resumo de Custos</h2>
          <span className="text-xs text-slate-500">{periodLabel}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'CPL',   sublabel: 'Custo por Lead',            value: cplValue,   hasData: metaData?.cpl != null, desc: 'Gasto médio para captar cada lead',        icon: MousePointerClick, tooltip: 'Total investido ÷ conversas/leads iniciados (Meta Ads)' },
            { label: 'CPMQL', sublabel: 'Custo por Lead Qualificado', value: cpmqlValue, hasData: cpmqlValue !== '—',    desc: 'Gasto médio por lead que avançou no funil', icon: UserCheck,         tooltip: 'Total investido ÷ leads qualificados (estimado ~25% do total)' },
            { label: 'CAC',   sublabel: 'Custo por Aquisição',        value: cacValue,   hasData: cacRaw != null,        desc: 'Gasto médio para fechar cada cliente',      icon: ShoppingCart,      tooltip: `Total investido ÷ ${clients.length} clientes gerenciados` },
          ].map((m) => {
            const Icon = m.icon
            return (
              <div key={m.label} className="rounded-2xl border border-white/8 bg-white/[0.04] p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">{m.label}</span>
                      <span className="text-[10px] text-slate-500 border border-white/10 rounded px-1.5 py-0.5">{m.sublabel}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{m.desc}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5 text-slate-400 shrink-0"><Icon className="w-4 h-4" /></div>
                </div>
                <p className={cn('text-3xl font-bold tabular-nums mt-4', m.hasData ? 'text-white' : 'text-slate-600')}>
                  {metaLoading ? <span className="inline-block h-8 w-28 bg-white/10 rounded animate-pulse" /> : m.value}
                </p>
                {!m.hasData && !metaLoading && <p className="text-xs text-slate-600 mt-1">Sem dados suficientes</p>}
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1 text-[10px] text-slate-600">
                    <HelpCircle className="w-3 h-3 shrink-0" />{m.tooltip}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Leads recentes */}
        <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-white/[0.04] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">Leads Recentes</h2>
            <a href="/leads" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          {crmLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/5 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-white/10 shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 w-32 bg-white/10 rounded mb-1.5" />
                    <div className="h-2.5 w-24 bg-white/10 rounded" />
                  </div>
                  <div className="h-5 w-16 bg-white/10 rounded" />
                </div>
              ))}
            </div>
          ) : recentLeads.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Nenhum lead ainda.</p>
          ) : (
            <div className="space-y-1">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{lead.name}</p>
                      <p className="text-xs text-slate-500">{lead.company || lead.email || lead.phone || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {(lead.value ?? 0) > 0 && (
                      <span className="text-sm font-semibold text-slate-300">{fmtBRL(lead.value!)}</span>
                    )}
                    <span className={cn(
                      'px-2 py-0.5 rounded-md text-[11px] font-medium border',
                      lead.temperature === 'hot' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      lead.temperature === 'warm' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20',
                    )}>
                      {lead.temperature === 'hot' ? '🔥 Quente' : lead.temperature === 'warm' ? '🌡 Morno' : '❄ Frio'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Origem dos Leads + IA */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">Origem dos Leads</h2>
            <span className="text-[11px] text-slate-500">{leads.length} total</span>
          </div>
          {crmLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-3 w-24 bg-white/10 rounded mb-1.5" />
                  <div className="h-1.5 w-full bg-white/10 rounded-full" />
                </div>
              ))}
            </div>
          ) : sourceBars.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Sem dados ainda.</p>
          ) : (
            <div className="space-y-3">
              {sourceBars.map((s) => (
                <div key={s.source}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">{s.source}</span>
                    <span className="text-xs font-medium text-slate-300">{s.percentage}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${s.percentage}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI widget */}
          <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400">IA Insight</span>
            </div>
            {crmLoading ? (
              <div className="h-10 bg-white/5 rounded animate-pulse" />
            ) : leads.length > 0 ? (
              <p className="text-xs text-slate-400 leading-relaxed">
                Você tem <span className="text-white font-medium">{leads.length} leads</span> e{' '}
                <span className="text-white font-medium">{clients.length} clientes</span>.
                {convRate > 0 && (
                  <> Taxa de conversão atual: <span className="text-green-400 font-medium">{convRate.toFixed(1)}%</span>.</>
                )}
              </p>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                Adicione leads para visualizar insights sobre sua performance de vendas.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
