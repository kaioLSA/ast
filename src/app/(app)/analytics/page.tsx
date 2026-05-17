'use client'

import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuthStore } from '@/store/auth.store'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import { TrendingUp, TrendingDown, Users, Clock, MousePointer, BarChart2 } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { cn } from '@/lib/utils/cn'

// Generate 30 days of lead data
const leadsData = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}/05`,
  leads: Math.floor(Math.random() * 25 + 5),
  conversions: Math.floor(Math.random() * 8 + 1),
}))

const pieData = [
  { name: 'Meta Ads', value: 36, color: '#3b82f6' },
  { name: 'Google Ads', value: 25, color: '#10b981' },
  { name: 'WhatsApp', value: 18, color: '#8b5cf6' },
  { name: 'Orgânico', value: 12, color: '#f59e0b' },
  { name: 'Outros', value: 9, color: '#06b6d4' },
]

const revenueData = [
  { month: 'Jan', receita: 32000, despesas: 14000 },
  { month: 'Fev', receita: 38500, despesas: 15200 },
  { month: 'Mar', receita: 41200, despesas: 13800 },
  { month: 'Abr', receita: 44800, despesas: 16500 },
  { month: 'Mai', receita: 51000, despesas: 14900 },
  { month: 'Jun', receita: 41000, despesas: 12900 },
]

const metricCards = [
  {
    label: 'Sessões',
    value: '12.847',
    change: '+18,3%',
    up: true,
    icon: Users,
    color: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
    iconColor: 'text-blue-400',
  },
  {
    label: 'Taxa de Rejeição',
    value: '32,4%',
    change: '-4,2%',
    up: true,
    icon: MousePointer,
    color: 'from-green-500/20 to-green-500/5 border-green-500/20',
    iconColor: 'text-green-400',
  },
  {
    label: 'Tempo Médio',
    value: '4m 32s',
    change: '+0m 48s',
    up: true,
    icon: Clock,
    color: 'from-purple-500/20 to-purple-500/5 border-purple-500/20',
    iconColor: 'text-purple-400',
  },
  {
    label: 'Páginas/Sessão',
    value: '6,8',
    change: '+1,2',
    up: true,
    icon: BarChart2,
    color: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20',
    iconColor: 'text-cyan-400',
  },
]

const tooltipStyle = {
  backgroundColor: '#0d1526',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#e2e8f0',
  fontSize: 12,
}

const emptyMetricCards = metricCards.map(m => ({ ...m, value: '0', change: '0%' }))
const emptyLeadsData = Array.from({ length: 30 }, (_, i) => ({ day: `${i + 1}/05`, leads: 0, conversions: 0 }))
const emptyRevenueData = revenueData.map(d => ({ ...d, receita: 0, despesas: 0 }))
const emptyPieData = pieData.map(d => ({ ...d, value: 0 }))

export default function AnalyticsPage() {
  usePageTitle('Analytics')
  const { user } = useAuthStore()
  const isEmpty = !user?.isDemo
  const activeMetrics = isEmpty ? emptyMetricCards : metricCards
  const activeLeads = isEmpty ? emptyLeadsData : leadsData
  const activeRevenue = isEmpty ? emptyRevenueData : revenueData
  const activePie = isEmpty ? emptyPieData : pieData
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Métricas e desempenho da sua operação"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Analytics' }]}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {activeMetrics.map(m => {
          const Icon = m.icon
          return (
            <div key={m.label} className={cn('rounded-2xl border bg-gradient-to-br p-5', m.color)}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-400">{m.label}</p>
                <div className={cn('p-2 rounded-xl bg-white/5', m.iconColor)}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">{m.value}</p>
              <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', m.up ? 'text-green-400' : 'text-red-400')}>
                {m.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {m.change} vs mês anterior
              </div>
            </div>
          )
        })}
      </div>

      {/* Area + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/3 p-6 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-5">Leads por Dia — Maio 2026</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={activeLeads} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} interval={4} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Area type="monotone" dataKey="leads" name="Leads" stroke="#3b82f6" fill="url(#leadsGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="conversions" name="Conversões" stroke="#10b981" fill="url(#convGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/3 p-6 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-5">Origem dos Leads</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={activePie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {activePie.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {activePie.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-400">{d.name}</span>
                </div>
                <span className="text-slate-300 font-medium">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue bar chart */}
      <div className="rounded-2xl border border-white/10 bg-white/3 p-6 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-white mb-5">Receita vs Despesas — Jan a Jun 2026</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={activeRevenue} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}K`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            <Bar dataKey="receita" name="Receita" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
