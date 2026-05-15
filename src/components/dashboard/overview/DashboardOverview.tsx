'use client'

import {
  TrendingUp, TrendingDown, Users, DollarSign,
  Target, Zap, ArrowUpRight, Bot,
  BarChart3, Activity, MousePointerClick, UserCheck, ShoppingCart, HelpCircle,
  Eye, MousePointer, Megaphone,
} from 'lucide-react'
import { mockDashboardAnalytics } from '@/services/mocks/dashboard.mock'
import { mockLeads } from '@/services/mocks/leads.mock'
import { formatCurrency, formatCompact } from '@/lib/formatters'
import { cn } from '@/lib/utils/cn'
import { useAuthStore } from '@/store/auth.store'
import { useEffect, useState } from 'react'

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

type MetaSectionProps = {
  data: MetaInsights | null
  loading: boolean
  error: boolean
  period: string
  setPeriod: (p: string) => void
}

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
          {PERIODS.map(p => (
            <option key={p.value} value={p.value} className="bg-[#0d1425]">{p.label}</option>
          ))}
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
              { label: 'Gasto Total', value: `R$ ${fmt(data.totalSpend)}`, icon: DollarSign, color: 'border-green-500/20 bg-green-500/5', iconColor: 'text-green-400' },
              { label: 'Alcance', value: fmtInt(data.totalReach), icon: Eye, color: 'border-blue-500/20 bg-blue-500/5', iconColor: 'text-blue-400' },
              { label: 'Impressões', value: fmtInt(data.totalImpressions), icon: Megaphone, color: 'border-purple-500/20 bg-purple-500/5', iconColor: 'text-purple-400' },
              { label: 'Cliques', value: fmtInt(data.totalClicks), icon: MousePointer, color: 'border-cyan-500/20 bg-cyan-500/5', iconColor: 'text-cyan-400' },
            ].map(m => {
              const Icon = m.icon
              return (
                <div key={m.label} className={cn('rounded-2xl border p-5', m.color)}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-400">{m.label}</p>
                    <div className={cn('p-1.5 rounded-lg bg-white/5', m.iconColor)}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-white tabular-nums">{m.value}</p>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'CPM', sublabel: 'Custo por mil impressões', value: `R$ ${fmt(data.cpm)}`, icon: BarChart3, color: 'border-orange-500/20 bg-orange-500/5', iconColor: 'text-orange-400' },
              { label: 'CPC', sublabel: 'Custo por clique', value: `R$ ${fmt(data.cpc)}`, icon: MousePointerClick, color: 'border-yellow-500/20 bg-yellow-500/5', iconColor: 'text-yellow-400' },
              { label: 'CTR', sublabel: 'Taxa de clique', value: `${data.ctr}%`, icon: Target, color: 'border-teal-500/20 bg-teal-500/5', iconColor: 'text-teal-400' },
            ].map(m => {
              const Icon = m.icon
              return (
                <div key={m.label} className={cn('rounded-2xl border p-5', m.color)}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-white">{m.label}</p>
                      <p className="text-[10px] text-slate-500">{m.sublabel}</p>
                    </div>
                    <div className={cn('p-1.5 rounded-lg bg-white/5', m.iconColor)}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
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

const metrics = [
  {
    label: 'Receita Total',
    value: 'R$ 248.500',
    change: '+12,5%',
    up: true,
    icon: DollarSign,
    color: 'from-green-500/20 to-emerald-500/10',
    iconColor: 'text-green-400',
    border: 'border-green-500/20',
  },
  {
    label: 'Novos Leads',
    value: '342',
    change: '+8,2%',
    up: true,
    icon: Users,
    color: 'from-blue-500/20 to-blue-500/10',
    iconColor: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  {
    label: 'Taxa de Conversão',
    value: '24,7%',
    change: '-2,1%',
    up: false,
    icon: Target,
    color: 'from-purple-500/20 to-purple-500/10',
    iconColor: 'text-purple-400',
    border: 'border-purple-500/20',
  },
  {
    label: 'MRR',
    value: 'R$ 42.300',
    change: '+9,1%',
    up: true,
    icon: BarChart3,
    color: 'from-cyan-500/20 to-cyan-500/10',
    iconColor: 'text-cyan-400',
    border: 'border-cyan-500/20',
  },
  {
    label: 'Negócios Fechados',
    value: '47',
    change: '+15,3%',
    up: true,
    icon: Zap,
    color: 'from-yellow-500/20 to-yellow-500/10',
    iconColor: 'text-yellow-400',
    border: 'border-yellow-500/20',
  },
  {
    label: 'Ticket Médio',
    value: 'R$ 5.287',
    change: '+3,8%',
    up: true,
    icon: Activity,
    color: 'from-orange-500/20 to-orange-500/10',
    iconColor: 'text-orange-400',
    border: 'border-orange-500/20',
  },
]

const emptyMetrics = [
  { label: 'Receita Total', value: 'R$ 0', change: '0%', up: true, icon: DollarSign, color: 'from-green-500/20 to-emerald-500/10', iconColor: 'text-green-400', border: 'border-green-500/20' },
  { label: 'Novos Leads', value: '0', change: '0%', up: true, icon: Users, color: 'from-blue-500/20 to-blue-500/10', iconColor: 'text-blue-400', border: 'border-blue-500/20' },
  { label: 'Taxa de Conversão', value: '0%', change: '0%', up: true, icon: Target, color: 'from-purple-500/20 to-purple-500/10', iconColor: 'text-purple-400', border: 'border-purple-500/20' },
  { label: 'MRR', value: 'R$ 0', change: '0%', up: true, icon: BarChart3, color: 'from-cyan-500/20 to-cyan-500/10', iconColor: 'text-cyan-400', border: 'border-cyan-500/20' },
  { label: 'Negócios Fechados', value: '0', change: '0%', up: true, icon: Zap, color: 'from-yellow-500/20 to-yellow-500/10', iconColor: 'text-yellow-400', border: 'border-yellow-500/20' },
  { label: 'Ticket Médio', value: 'R$ 0', change: '0%', up: true, icon: Activity, color: 'from-orange-500/20 to-orange-500/10', iconColor: 'text-orange-400', border: 'border-orange-500/20' },
]

export function DashboardOverview() {
  const { user } = useAuthStore()
  const isEmpty = user?.teamId === 'gabriel-team'
  const activeMetrics = isEmpty ? emptyMetrics : metrics
  const activeLeads = isEmpty ? [] : mockLeads.slice(0, 4)
  const sourceBars = isEmpty ? [] : mockDashboardAnalytics.sourceBreakdown

  const [metaData, setMetaData] = useState<MetaInsights | null>(null)
  const [metaLoading, setMetaLoading] = useState(true)
  const [metaError, setMetaError] = useState(false)
  const [period, setPeriod] = useState('last_30d')

  useEffect(() => {
    setMetaLoading(true)
    setMetaError(false)
    fetch(`/api/meta/insights?period=${period}`)
      .then(r => r.json())
      .then(d => { setMetaData(d); setMetaLoading(false) })
      .catch(() => { setMetaError(true); setMetaLoading(false) })
  }, [period])

  const periodLabel = PERIODS.find(p => p.value === period)?.label ?? ''
  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const cplValue = metaData?.cpl != null ? `R$ ${fmt(metaData.cpl)}` : '—'
  const qualifiedLeads = metaData ? Math.round(metaData.leadCount * 0.25) : 0
  const cpmqlValue = (metaData && qualifiedLeads > 0)
    ? `R$ ${fmt(metaData.totalSpend / qualifiedLeads)}`
    : '—'
  const cacValue = metaData?.cac != null ? `R$ ${fmt(metaData.cac)}` : '—'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Visão geral — {periodLabel}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Sistema operacional
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {activeMetrics.map((m) => {
          const Icon = m.icon
          return (
            <div
              key={m.label}
              className={cn(
                'rounded-2xl border bg-gradient-to-br p-5 hover:scale-[1.02] transition-transform duration-200',
                m.color, m.border,
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-400">{m.label}</p>
                <div className={cn('p-2 rounded-xl bg-white/5', m.iconColor)}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">{m.value}</p>
              <div className={cn(
                'flex items-center gap-1 mt-2 text-xs font-medium',
                m.up ? 'text-green-400' : 'text-red-400',
              )}>
                {m.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {m.change} vs mês anterior
              </div>
            </div>
          )
        })}
      </div>

      {/* Meta Ads real data */}
      <MetaSection
        data={metaData}
        loading={metaLoading}
        error={metaError}
        period={period}
        setPeriod={setPeriod}
      />

      {/* Cost metrics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Resumo de Custos</h2>
          <span className="text-xs text-slate-500">{periodLabel}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'CPL',
              sublabel: 'Custo por Lead',
              value: cplValue,
              hasData: metaData?.cpl != null,
              desc: 'Gasto médio para captar cada lead',
              icon: MousePointerClick,
              color: 'border-blue-500/20 bg-blue-500/5',
              iconColor: 'text-blue-400',
              tooltip: 'Total investido ÷ conversas/leads iniciados (Meta Ads)',
            },
            {
              label: 'CPMQL',
              sublabel: 'Custo por Lead Qualificado',
              value: cpmqlValue,
              hasData: cpmqlValue !== '—',
              desc: 'Gasto médio por lead que avançou no funil',
              icon: UserCheck,
              color: 'border-purple-500/20 bg-purple-500/5',
              iconColor: 'text-purple-400',
              tooltip: 'Total investido ÷ leads qualificados (estimado ~25% do total)',
            },
            {
              label: 'CAC',
              sublabel: 'Custo por Aquisição',
              value: cacValue,
              hasData: metaData?.cac != null,
              desc: 'Gasto médio para fechar cada cliente',
              icon: ShoppingCart,
              color: 'border-green-500/20 bg-green-500/5',
              iconColor: 'text-green-400',
              tooltip: `Total investido ÷ ${metaData?.clientCount ?? 0} clientes gerenciados`,
            },
          ].map((m) => {
            const Icon = m.icon
            return (
              <div key={m.label} className={cn('rounded-2xl border p-5', m.color)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">{m.label}</span>
                      <span className="text-[10px] text-slate-500 border border-white/10 rounded px-1.5 py-0.5">{m.sublabel}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{m.desc}</p>
                  </div>
                  <div className={cn('p-2 rounded-xl bg-white/5 shrink-0', m.iconColor)}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className={cn('text-3xl font-bold tabular-nums mt-4', m.hasData ? 'text-white' : 'text-slate-600')}>
                  {metaLoading ? (
                    <span className="inline-block h-8 w-28 bg-white/10 rounded animate-pulse" />
                  ) : m.value}
                </p>
                {!m.hasData && !metaLoading && (
                  <p className="text-xs text-slate-600 mt-1">Sem dados suficientes</p>
                )}
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1 text-[10px] text-slate-600">
                    <HelpCircle className="w-3 h-3 shrink-0" />
                    {m.tooltip}
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
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/3 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">Leads Recentes</h2>
            <a href="/leads" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-3">
            {activeLeads.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-6">Nenhum lead ainda.</p>
            )}
            {activeLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {lead.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{lead.name}</p>
                    <p className="text-xs text-slate-500">{lead.company ?? lead.contact.email ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {lead.value && (
                    <span className="text-sm font-semibold text-slate-300">
                      {formatCurrency(lead.value)}
                    </span>
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
        </div>

        {/* Fontes */}
        <div className="rounded-2xl border border-white/10 bg-white/3 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">Origem dos Leads</h2>
          </div>
          <div className="space-y-3">
            {sourceBars.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">Sem dados ainda.</p>
            )}
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

          {/* AI widget */}
          <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400">IA Insight</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Aumentar orçamento da Meta Ads em <span className="text-white font-medium">20%</span> pode gerar <span className="text-green-400 font-medium">+35%</span> de conversões esta semana.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
