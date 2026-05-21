'use client'

import { useEffect, useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import { TrendingUp, Users, UserCheck, DollarSign } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { cn } from '@/lib/utils/cn'

// ── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  metrics: {
    totalLeads:     number
    conversionRate: string
    totalRevenue:   number
    activeClients:  number
  }
  leadsPerDay:    { day: string; leads: number; conversions: number }[]
  leadsBySource:  { name: string; value: number; color: string }[]
  revenueByMonth: { month: string; receita: number; despesas: number }[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const tooltipStyle = {
  backgroundColor: '#1c1c24',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#e2e8f0',
  fontSize: 12,
}

function fmtCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  usePageTitle('Analytics')

  const [data, setData]       = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const metricCards = [
    {
      label: 'Total de Leads',
      value: data ? String(data.metrics.totalLeads) : '—',
      icon: Users,
      sub: 'leads cadastrados',
    },
    {
      label: 'Taxa de Conversão',
      value: data ? data.metrics.conversionRate : '—',
      icon: TrendingUp,
      sub: 'leads convertidos em ganhos',
    },
    {
      label: 'Receita Total',
      value: data ? fmtCurrency(data.metrics.totalRevenue) : '—',
      icon: DollarSign,
      sub: 'total de receitas registradas',
    },
    {
      label: 'Clientes Ativos',
      value: data ? String(data.metrics.activeClients) : '—',
      icon: UserCheck,
      sub: 'clientes com status ativo',
    },
  ]

  const leadsPerDay    = data?.leadsPerDay    ?? []
  const leadsBySource  = data?.leadsBySource  ?? []
  const revenueByMonth = data?.revenueByMonth ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Métricas e desempenho da sua operação"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Analytics' }]}
      />

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map(m => {
          const Icon = m.icon
          return (
            <div key={m.label} className="rounded-2xl border border-white/10 bg-[#141418] p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-400">{m.label}</p>
                <div className="p-2 rounded-xl bg-white/5 text-slate-400">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className={cn('text-2xl font-bold tabular-nums', loading ? 'text-slate-600 animate-pulse' : 'text-white')}>
                {loading ? '...' : m.value}
              </p>
              <p className="text-xs text-slate-500 mt-2">{m.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Area + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#141418] p-6">
          <h2 className="text-base font-semibold text-white mb-5">Leads por Dia — últimos 30 dias</h2>
          {loading ? (
            <div className="h-[250px] flex items-center justify-center text-slate-600 text-sm">Carregando...</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={leadsPerDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} interval={4} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Area type="monotone" dataKey="leads"       name="Leads"      stroke="#3b82f6" fill="url(#leadsGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="conversions" name="Conversões"  stroke="#10b981" fill="url(#convGrad)"  strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#141418] p-6">
          <h2 className="text-base font-semibold text-white mb-5">Origem dos Leads</h2>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">Carregando...</div>
          ) : leadsBySource.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">Sem dados</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={leadsBySource} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {leadsBySource.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {leadsBySource.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-slate-400">{d.name}</span>
                    </div>
                    <span className="text-slate-300 font-medium">{d.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Revenue bar chart */}
      <div className="rounded-2xl border border-white/10 bg-[#141418] p-6">
        <h2 className="text-base font-semibold text-white mb-5">Receita vs Despesas — últimos 6 meses</h2>
        {loading ? (
          <div className="h-[250px] flex items-center justify-center text-slate-600 text-sm">Carregando...</div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueByMonth} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Bar dataKey="receita"  name="Receita"   fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" name="Despesas"  fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  )
}
