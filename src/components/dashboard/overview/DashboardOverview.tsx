'use client'

import {
  TrendingUp, TrendingDown, Users, DollarSign,
  Target, Zap, ArrowUpRight, Bot, MessageCircle,
  BarChart3, Activity,
} from 'lucide-react'
import { mockDashboardAnalytics } from '@/services/mocks/dashboard.mock'
import { mockLeads } from '@/services/mocks/leads.mock'
import { formatCurrency, formatCompact } from '@/lib/formatters'
import { cn } from '@/lib/utils/cn'

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

const sourceBars = mockDashboardAnalytics.sourceBreakdown

export function DashboardOverview() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Visão geral dos últimos 30 dias</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Sistema operacional
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m) => {
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
            {mockLeads.slice(0, 4).map((lead) => (
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
