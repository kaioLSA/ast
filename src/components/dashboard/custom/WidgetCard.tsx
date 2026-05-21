'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts'
import { BrazilMap } from '@/components/dashboard/analytics/BrazilMap'
import type { DBWidget, MetricData, SeriesItem, TimeItem, StateMap } from './types'
import { isGradient } from './types'

/* ── Tooltip ─────────────────────────────────────────────────────────────── */
function ChartTip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; color?: string }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1c1c24] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          {p.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />}
          <span className="text-slate-400">{p.name}:</span>
          <span className="text-white font-semibold">{Number(p.value).toLocaleString('pt-BR')}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Height class ────────────────────────────────────────────────────────── */
function heightClass(tall: boolean, type: string) {
  if (type === 'map') return tall ? 'h-80' : 'h-64'
  if (type === 'metric') return 'h-auto min-h-[100px]'
  return tall ? 'h-72' : 'h-52'
}

/* ── Currency format ─────────────────────────────────────────────────────── */
function fmtVal(val: number, format?: string) {
  if (format === 'currency') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  return val.toLocaleString('pt-BR')
}

/* ── Individual renders ──────────────────────────────────────────────────── */

function MetricWidget({ data, color, tall }: { data: MetricData; color: string; tall: boolean }) {
  const grad = isGradient(color)
  return (
    <div className={cn('flex flex-col justify-center', tall ? 'gap-3' : 'gap-2')}>
      <p className="text-xs text-slate-400">{data.label}</p>
      <p
        className={cn('font-bold tabular-nums', tall ? 'text-5xl' : 'text-3xl', grad ? 'text-transparent bg-clip-text' : '')}
        style={grad ? { backgroundImage: color } : { color }}
      >
        {fmtVal(data.value, data.format)}
      </p>
    </div>
  )
}

function BarWidget({ data, color }: { data: SeriesItem[]; color: string }) {
  // For gradients, extract the first solid color for recharts
  const solidColor = isGradient(color) ? color.match(/#[0-9a-fA-F]{6}/)?.[0] ?? '#3b82f6' : color
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={90} />
        <Tooltip content={<ChartTip />} />
        <Bar dataKey="value" fill={solidColor} radius={[0, 4, 4, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function LineWidget({ data, color }: { data: TimeItem[]; color: string }) {
  const solidColor = isGradient(color) ? color.match(/#[0-9a-fA-F]{6}/)?.[0] ?? '#3b82f6' : color
  const gradId = `lg_${solidColor.replace('#', '')}`
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={solidColor} stopOpacity={0.35} />
            <stop offset="100%" stopColor={solidColor} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
        <Tooltip content={<ChartTip />} />
        <Area type="monotone" dataKey="income"   stroke={solidColor} strokeWidth={1.5} fill={`url(#${gradId})`} dot={false} />
        <Area type="monotone" dataKey="expenses" stroke="#64748b"    strokeWidth={1.5} fill="none"              dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function DonutWidget({ data, color }: { data: SeriesItem[]; color: string }) {
  const solidColor = isGradient(color) ? color.match(/#[0-9a-fA-F]{6}/)?.[0] ?? '#3b82f6' : color
  const PALETTE = [solidColor, `${solidColor}cc`, `${solidColor}88`, `${solidColor}55`, '#64748b', '#475569']
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={3}>
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Tooltip content={<ChartTip />} />
      </PieChart>
    </ResponsiveContainer>
  )
}

function ListWidget({ data, color }: { data: SeriesItem[]; color: string }) {
  const solidColor = isGradient(color) ? color.match(/#[0-9a-fA-F]{6}/)?.[0] ?? '#3b82f6' : color
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 7)
  const max = sorted[0]?.value || 1
  return (
    <div className="flex flex-col gap-2 w-full">
      {sorted.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 w-4 shrink-0">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs text-white truncate">{item.name}</span>
              <span className="text-xs font-semibold text-white tabular-nums ml-2">{item.value}</span>
            </div>
            <div className="h-1 rounded-full bg-white/8 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(item.value / max) * 100}%`, background: isGradient(color) ? color : solidColor }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Main WidgetCard ─────────────────────────────────────────────────────── */

interface Props {
  widget: DBWidget
  editMode: boolean
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}

export function WidgetCard({ widget, editMode, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: Props) {
  const [data, setData] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetch(`/api/dashboard-data?source=${widget.data_source}`)
      .then(r => r.json())
      .then(d => { if (alive) { setData(d); setLoading(false) } })
      .catch(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [widget.data_source])

  const colClass = {
    3:  'col-span-3',
    6:  'col-span-6',
    9:  'col-span-9',
    12: 'col-span-12',
  }[widget.col_span] ?? 'col-span-6'

  const cardClass = widget.merged
    ? 'rounded-[24px] p-5'
    : 'rounded-[24px] border border-white/10 bg-[#141418] p-5'

  const hClass = heightClass(widget.tall, widget.widget_type)

  function renderContent() {
    if (loading) {
      return <div className="flex items-center justify-center h-20 text-slate-500 text-sm">Carregando...</div>
    }
    if (!data) {
      return <div className="flex items-center justify-center h-20 text-slate-600 text-sm">Sem dados</div>
    }

    switch (widget.widget_type) {
      case 'metric': return <MetricWidget data={data as MetricData} color={widget.color} tall={widget.tall} />
      case 'bar':    return <div className={hClass}><BarWidget data={data as SeriesItem[]} color={widget.color} /></div>
      case 'line':   return <div className={hClass}><LineWidget data={data as TimeItem[]} color={widget.color} /></div>
      case 'donut':  return <div className={hClass}><DonutWidget data={data as SeriesItem[]} color={widget.color} /></div>
      case 'map':    return <div className={hClass}><BrazilMap counts={data as StateMap} /></div>
      case 'list':   return <ListWidget data={data as SeriesItem[]} color={widget.color} />
      default:       return null
    }
  }

  return (
    <div className={cn(colClass, cardClass, 'relative group transition-all')}>
      {/* Title */}
      {widget.title && (
        <p className="text-sm font-semibold text-white mb-3">{widget.title}</p>
      )}

      {renderContent()}

      {/* Edit controls */}
      {editMode && (
        <div className="absolute inset-0 rounded-[24px] ring-2 ring-dashed ring-white/20 pointer-events-none" />
      )}
      {editMode && (
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          {!isFirst && (
            <button onClick={onMoveUp} className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center justify-center transition-colors" title="Mover para esquerda">←</button>
          )}
          {!isLast && (
            <button onClick={onMoveDown} className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center justify-center transition-colors" title="Mover para direita">→</button>
          )}
          <button onClick={onDelete} className="w-6 h-6 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 text-xs flex items-center justify-center transition-colors" title="Remover">✕</button>
        </div>
      )}
    </div>
  )
}
