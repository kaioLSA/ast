'use client'

import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, Cell,
  PieChart, Pie,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  ArrowUpRight, Users, DollarSign, Target,
  Flame, Thermometer, Snowflake, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// Retorna um objeto Date ajustado para Brasília (UTC-3) — garante que .getDate/.getMonth/.getFullYear retornem o dia correto
function brDate(dateStr: string): Date {
  const d = new Date(dateStr)
  return new Date(d.getTime() - 3 * 60 * 60 * 1000)
}
import { BrazilMap, type StateCount } from './BrazilMap'

// ── Types ─────────────────────────────────────────────────────────────────────
type Lead = {
  id: string; name: string; company?: string; status: string
  source?: string; temperature?: string; value?: number; score?: number
  created_at: string; email?: string; phone?: string; state?: string
}
type Client = {
  id: string; name: string; status: string; value?: number; created_at: string
}
type Period = 'today' | 'week' | 'month'

const SOURCE_LABEL: Record<string, string> = {
  meta_ads: 'Meta Ads', google_ads: 'Google', whatsapp: 'WhatsApp',
  organic: 'Orgânico', referral: 'Indicação', manual: 'Manual',
}

const TEMP_CONFIG = [
  { key: 'hot',  label: 'Quente', icon: Flame,       color: '#ef4444', text: 'text-red-400'   },
  { key: 'warm', label: 'Morno',  icon: Thermometer, color: '#f59e0b', text: 'text-amber-400' },
  { key: 'cold', label: 'Frio',   icon: Snowflake,   color: '#3b82f6', text: 'text-blue-400'  },
]

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmtBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
function daysAgo(n: number) { return new Date(Date.now() - n * 86_400_000) }
function periodStart(p: Period) {
  if (p === 'today') return new Date(new Date().setHours(0, 0, 0, 0))
  if (p === 'week')  return daysAgo(7)
  return daysAgo(30)
}

function buildTimeSeries(leads: Lead[], clients: Client[], period: Period) {
  const days = period === 'today' ? 1 : period === 'week' ? 7 : 30
  const result: { label: string; leads: number; clientes: number }[] = []
  if (period === 'today') {
    for (let h = 0; h < 24; h += 3) {
      const from = new Date(); from.setHours(h, 0, 0, 0)
      const to   = new Date(); to.setHours(h + 3, 0, 0, 0)
      result.push({
        label: `${String(h).padStart(2,'0')}h`,
        leads:    leads.filter(l => { const d = brDate(l.created_at); return d >= from && d < to }).length,
        clientes: clients.filter(c => { const d = brDate(c.created_at); return d >= from && d < to }).length,
      })
    }
  } else {
    for (let i = days - 1; i >= 0; i--) {
      const day  = daysAgo(i)
      const next = daysAgo(i - 1)
      const label = period === 'week'
        ? ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][day.getDay()]
        : `${day.getDate()}/${day.getMonth()+1}`
      result.push({
        label,
        leads:    leads.filter(l => { const d = brDate(l.created_at); return d >= day && d < next }).length,
        clientes: clients.filter(c => { const d = brDate(c.created_at); return d >= day && d < next }).length,
      })
    }
  }
  return result
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: {name: string; value: number; color: string}[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-[#1c1c24] px-3 py-2 shadow-xl text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

// ── Calendar that matches the Fitonist dark reference ──────────────────────────
function DarkCalendar({ leads }: { leads: Lead[] }) {
  const today = new Date()
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })

  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()
  const firstDay    = new Date(cursor.year, cursor.month, 1).getDay()

  const { leadsByDay, monthRevenue } = useMemo(() => {
    const map: Record<number, number> = {}
    let revenue = 0
    leads.forEach(l => {
      const d = brDate(l.created_at)
      if (d.getUTCFullYear() === cursor.year && d.getUTCMonth() === cursor.month) {
        const day = d.getUTCDate()
        map[day] = (map[day] || 0) + 1
        revenue += l.value || 0
      }
    })
    return { leadsByDay: map, monthRevenue: revenue }
  }, [leads, cursor.year, cursor.month])

  const prev = () => setCursor(c => { const m = c.month - 1; return m < 0 ? { year: c.year - 1, month: 11 } : { ...c, month: m } })
  const next = () => setCursor(c => { const m = c.month + 1; return m > 11 ? { year: c.year + 1, month: 0 } : { ...c, month: m } })

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev}
          className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:text-white hover:bg-white/8 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-sm font-semibold text-white tracking-wide">
          {MONTH_NAMES[cursor.month]} {cursor.year}
        </span>
        <button onClick={next}
          className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:text-white hover:bg-white/8 transition-colors">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1.5">
        {['D','S','T','Q','Q','S','S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-slate-600 font-medium py-0.5">{d}</div>
        ))}
      </div>

      {/* Day grid — square cells like the reference */}
      <div className="grid grid-cols-7 gap-[3px] flex-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const count  = leadsByDay[day] || 0
          const isToday = day === today.getDate()
            && cursor.month === today.getMonth()
            && cursor.year  === today.getFullYear()
          const hasLeads = count > 0

          return (
            <div
              key={i}
              title={count > 0 ? `${count} lead${count > 1 ? 's' : ''}` : undefined}
              className={cn(
                'aspect-square rounded-md flex items-center justify-center',
                'text-xs font-semibold transition-colors select-none',
                isToday
                  ? 'bg-blue-500 text-white'
                  : hasLeads
                    ? 'bg-violet-500/35 text-violet-100 ring-1 ring-violet-500/30'
                    : 'bg-white/[0.05] text-slate-500 hover:bg-white/[0.08]',
              )}
            >
              {day}
            </div>
          )
        })}
      </div>

      {/* Revenue below — the "$18,434" style number */}
      <div className="mt-4 pt-3 border-t border-white/[0.07]">
        <p className="text-[9px] text-slate-600 uppercase tracking-[0.15em] mb-1">Pipeline do mês</p>
        <p className="text-2xl font-bold text-white tabular-nums leading-none">{fmtBRL(monthRevenue)}</p>
        {Object.keys(leadsByDay).length > 0 && (
          <p className="text-[10px] text-slate-500 mt-1">
            {Object.values(leadsByDay).reduce((s, v) => s + v, 0)} leads este mês
          </p>
        )}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function AnalyticsDashboard() {
  const [leads, setLeads]         = useState<Lead[]>([])
  const [clients, setClients]     = useState<Client[]>([])
  const [loading, setLoading]     = useState(true)
  const [period, setPeriod]       = useState<Period>('month')

  // Sliding pill for period tabs
  const periodRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false })
  const movePill = useCallback(() => {
    const el = periodRefs.current[period]
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth, ready: true })
  }, [period])
  useEffect(() => { const id = requestAnimationFrame(movePill); return () => cancelAnimationFrame(id) }, [movePill])
  // Re-measure after data loads — tabs are hidden during loading skeleton
  useEffect(() => { if (!loading) { const id = requestAnimationFrame(movePill); return () => cancelAnimationFrame(id) } }, [loading, movePill])
  const [metaSpend, setMetaSpend] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/leads').then(r => r.json()).catch(() => []),
      fetch('/api/clients').then(r => r.json()).catch(() => []),
      fetch('/api/meta/insights?period=last_30d').then(r => r.json()).catch(() => null),
    ]).then(([l, c, m]) => {
      if (Array.isArray(l)) setLeads(l)
      if (Array.isArray(c)) setClients(c)
      if (m?.totalSpend != null) setMetaSpend(m.totalSpend)
    }).finally(() => setLoading(false))
  }, [])

  const filteredLeads   = useMemo(() => leads.filter(l => brDate(l.created_at) >= periodStart(period)),   [leads, period])
  const filteredClients = useMemo(() => clients.filter(c => brDate(c.created_at) >= periodStart(period)), [clients, period])
  const timeSeries      = useMemo(() => buildTimeSeries(leads, clients, period), [leads, clients, period])

  const totalLeads   = filteredLeads.length
  const totalClients = filteredClients.length
  const convRate     = totalLeads > 0 ? ((totalClients / totalLeads) * 100).toFixed(1) : '0.0'

  const sourceData = useMemo(() => {
    const map: Record<string, number> = {}
    filteredLeads.forEach(l => { const k = l.source || 'manual'; map[k] = (map[k] || 0) + 1 })
    return Object.entries(map)
      .map(([source, count]) => ({ source: SOURCE_LABEL[source] || source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [filteredLeads])

  const tempData  = TEMP_CONFIG.map(t => ({ ...t, count: filteredLeads.filter(l => l.temperature === t.key).length })).filter(t => t.count > 0)
  const totalTemp = tempData.reduce((s, t) => s + t.count, 0)

  const stateCounts = useMemo(() => {
    const map: StateCount = {}
    leads.forEach(l => { if (l.state) map[l.state] = (map[l.state] || 0) + 1 })
    return map
  }, [leads])

  const recentLeads = useMemo(() =>
    [...filteredLeads].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6),
    [filteredLeads])

  const CARD = 'rounded-[28px] border border-white/8 bg-white/[0.04] p-5'

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-7 gap-4">
        <div className="col-span-5 h-72 rounded-[28px] border border-white/8 bg-white/5" />
        <div className="col-span-2 h-72 rounded-[28px] border border-white/8 bg-white/5" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-52 rounded-[28px] border border-white/8 bg-white/5" />)}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">

      {/* ── Period tabs ─────────────────────────────────────────────────── */}
      <div className="relative flex items-center gap-1 bg-white/5 border border-white/8 rounded-xl p-1 w-fit">
        {pill.ready && (
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm pointer-events-none"
            style={{
              left: pill.left,
              width: pill.width,
              transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1), width 0.22s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        )}
        {(['today','week','month'] as Period[]).map(p => (
          <button
            key={p}
            ref={el => { periodRefs.current[p] = el }}
            onClick={() => setPeriod(p)}
            className={cn(
              'relative z-10 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150',
              period === p ? 'text-black' : 'text-slate-400 hover:text-white',
            )}
          >
            {p === 'today' ? 'Hoje' : p === 'week' ? 'Semana' : 'Mês'}
          </button>
        ))}
      </div>

      {/* ── Row 1: 7 cols ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-7 gap-4">

        {/* [5] Leads chart + dark calendar — merged card */}
        <div className="col-span-5 rounded-[28px] border border-white/8 overflow-hidden flex bg-white/[0.04]">

          {/* Left: area chart */}
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between mb-1">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">Leads Captados</p>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold text-white tabular-nums">{totalLeads}</span>
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 bg-white/5 rounded-md px-1.5 py-0.5">
                      {convRate}%
                    </span>
                    <span className="text-xs text-slate-500">{totalClients} convertidos</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-1">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"/>Leads</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-400 inline-block"/>Clientes</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={195}>
              <AreaChart data={timeSeries} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gLeads2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gClients2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip content={<ChartTooltip />}/>
                <Area type="monotone" dataKey="leads"    name="Leads"    stroke="#3b82f6" strokeWidth={2} fill="url(#gLeads2)"   dot={false}/>
                <Area type="monotone" dataKey="clientes" name="Clientes" stroke="#8b5cf6" strokeWidth={2} fill="url(#gClients2)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Right: dark calendar panel */}
          <div className="w-[290px] shrink-0 bg-[#0d0d12] rounded-l-[28px] p-5 flex flex-col" style={{ boxShadow: '-1px 0 0 0 rgba(255,255,255,0.06)' }}>
            <DarkCalendar leads={leads} />
          </div>
        </div>

        {/* [2] Leads por Origem */}
        <div className={cn(CARD, 'col-span-2')}>
          <div className="mb-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Por Origem</p>
            {sourceData.length > 0 && (
              <div className="mt-1">
                <span className="text-2xl font-bold text-white tabular-nums">{sourceData[0]?.count ?? 0}</span>
                <span className="text-xs text-slate-500 ml-2">via {sourceData[0]?.source}</span>
              </div>
            )}
          </div>
          {sourceData.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-10">Sem dados</p>
          ) : (
            <ResponsiveContainer width="100%" height={195}>
              <BarChart data={sourceData} margin={{ top: 4, right: 0, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
                <XAxis dataKey="source" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip content={<ChartTooltip />}/>
                <Bar dataKey="count" name="Leads" radius={[4,4,0,0]}>
                  {sourceData.map((_, i) => (
                    <Cell key={i} fill={`rgba(99,102,241,${0.75 - i * 0.08})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Row 2: 4 cols ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">

        {/* [1] Leads Recentes */}
        <div className={cn(CARD, 'col-span-1')}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-white">Leads Recentes</p>
            <a href="/leads" className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
              Ver todos <ArrowUpRight className="w-3 h-3"/>
            </a>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-6">Sem leads</p>
          ) : (
            <div className="space-y-3">
              {recentLeads.map(l => (
                <div key={l.id} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {l.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{l.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{l.company || SOURCE_LABEL[l.source || ''] || '—'}</p>
                  </div>
                  {l.value ? (
                    <span className="text-[11px] font-semibold text-slate-300 shrink-0">{fmtBRL(l.value)}</span>
                  ) : l.state ? (
                    <span className="text-[10px] font-medium text-slate-500 shrink-0">{l.state}</span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* [1] Temperatura */}
        <div className={cn(CARD, 'col-span-1 flex flex-col')}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-white">Temperatura</p>
            <span className="text-xs text-slate-500">{totalTemp} leads</span>
          </div>
          {totalTemp === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-slate-600">Sem dados</p>
            </div>
          ) : (
            <>
              <div className="flex-1 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={tempData} dataKey="count" innerRadius={36} outerRadius={58}
                      paddingAngle={3} startAngle={90} endAngle={-270}>
                      {tempData.map((t, i) => <Cell key={i} fill={t.color} opacity={0.85}/>)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-1">
                {tempData.map(t => {
                  const Icon = t.icon
                  const pct = totalTemp > 0 ? Math.round((t.count / totalTemp) * 100) : 0
                  return (
                    <div key={t.key} className="flex items-center justify-between">
                      <div className={cn('flex items-center gap-1.5 text-xs', t.text)}>
                        <Icon className="w-3 h-3"/><span>{t.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: t.color, opacity: 0.7 }}/>
                        </div>
                        <span className="text-xs font-semibold text-white tabular-nums w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* [1] Brazil Map */}
        <div className={cn(CARD, 'col-span-1')}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-white">Por Estado</p>
            <span className="text-xs text-slate-500">{Object.keys(stateCounts).length} estados</span>
          </div>
          <BrazilMap counts={stateCounts} />
          {Object.keys(stateCounts).length === 0 && (
            <p className="text-[10px] text-slate-600 text-center -mt-2">Cadastre o estado dos leads</p>
          )}
        </div>

        {/* [1] Meta Ads + stats */}
        <div className={cn(CARD, 'col-span-1 flex flex-col justify-between')}>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">Gasto Meta Ads</p>
            <p className="text-3xl font-bold text-white tabular-nums">
              {metaSpend != null ? fmtBRL(metaSpend) : '—'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Últimos 30 dias</p>
          </div>

          <div className="space-y-2.5 mt-4 pt-4 border-t border-white/5">
            {[
              { label: 'Total de Leads',   value: String(leads.length),   icon: Users,      color: 'text-blue-400'   },
              { label: 'Clientes Ativos',  value: String(clients.length), icon: Target,     color: 'text-violet-400' },
              { label: 'Receita Pipeline', value: fmtBRL(leads.reduce((s,l) => s+(l.value||0),0)), icon: DollarSign, color: 'text-emerald-400' },
            ].map(m => {
              const Icon = m.icon
              return (
                <div key={m.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('w-3.5 h-3.5', m.color)}/>
                    <span className="text-xs text-slate-400">{m.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-white tabular-nums">{m.value}</span>
                </div>
              )
            })}
          </div>

          <a href="/leads" className="mt-4 flex items-center justify-center gap-2 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors">
            Ver Leads <ArrowUpRight className="w-3.5 h-3.5"/>
          </a>
        </div>
      </div>
    </div>
  )
}
