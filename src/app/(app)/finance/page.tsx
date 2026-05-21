'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import {
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Search,
  Globe, Plus, X, CheckCircle2, Trash2, Building2, User,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, ResponsiveContainer, Tooltip,
} from 'recharts'

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Transaction {
  id: string
  type: 'income' | 'expense'
  description: string
  category: string
  amount: number
  currency: string
  status: 'completed' | 'pending'
  transaction_date: string
  created_at: string
  scope?: 'company' | 'personal'
}

type Scope = 'company' | 'personal'

/* ─── Constants ──────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { value: 'invest',    label: 'Investimento' },
  { value: 'product',   label: 'Produto'       },
  { value: 'service',   label: 'Serviço'       },
  { value: 'salary',    label: 'Salário'       },
  { value: 'marketing', label: 'Marketing'     },
  { value: 'software',  label: 'Software'      },
  { value: 'rent',      label: 'Aluguel'       },
  { value: 'transfer',  label: 'Transferência' },
  { value: 'other',     label: 'Outro'         },
]

const CAT_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map(c => [c.value, c.label])
)

const CAT_COLOR: Record<string, string> = {
  invest:    '#3b82f6',
  product:   '#22d3ee',
  service:   '#a78bfa',
  salary:    '#34d399',
  marketing: '#f97316',
  software:  '#818cf8',
  rent:      '#94a3b8',
  transfer:  '#22d3ee',
  other:     '#64748b',
}

const DAYS  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const HOURS = ['9am','12pm','3pm','6pm','9pm']

const CELL_BG: Record<number, string> = {
  0: 'rgba(255,255,255,0.04)',
  1: 'rgba(59,130,246,0.20)',
  2: 'rgba(59,130,246,0.42)',
  3: 'rgba(59,130,246,0.65)',
  4: 'rgba(59,130,246,0.90)',
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function fmt(n: number, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency, minimumFractionDigits: 2,
  }).format(n)
}

function monthKey(date: string) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function last6Months() {
  const months: { key: string; label: string }[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('pt-BR', { month: 'short' }),
    })
  }
  return months
}

function last30Days() {
  const days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function MiniBarChart({ heights, color }: { heights: number[]; color: string }) {
  return (
    <div className="flex items-end gap-[2px] h-16 w-full">
      {heights.map((h, i) => (
        <div
          key={i}
          style={{ height: `${Math.max(4, h)}%`, backgroundColor: color, borderRadius: 2 }}
          className="flex-1 min-w-0"
        />
      ))}
    </div>
  )
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; color: string }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1c1c24] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-400 capitalize">{p.name}:</span>
          <span className="text-white font-semibold">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Modal ──────────────────────────────────────────────────────────────── */

interface ModalProps {
  open: boolean
  scope: Scope
  onClose: () => void
  onSave: (t: Omit<Transaction, 'id' | 'created_at' | 'currency'>) => Promise<void>
}

function AddTransactionModal({ open, scope, onClose, onSave }: ModalProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [form, setForm] = useState({
    type: 'income' as 'income' | 'expense',
    description: '',
    category: 'other',
    amount: '',
    status: 'completed' as 'completed' | 'pending',
    transaction_date: new Date().toISOString().slice(0, 10),
  })
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  // Animation
  useEffect(() => {
    if (open) {
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 200)
      return () => clearTimeout(t)
    }
  }, [open])

  // Reset form on close
  useEffect(() => {
    if (!open) {
      setForm({ type: 'income', description: '', category: 'other', amount: '', status: 'completed', transaction_date: new Date().toISOString().slice(0, 10) })
      setDone(false)
    }
  }, [open])

  const handleSubmit = async () => {
    if (!form.description.trim() || !form.amount) return
    setSaving(true)
    try {
      await onSave({
        type: form.type,
        description: form.description.trim(),
        category: form.category,
        amount: parseFloat(form.amount),
        status: form.status,
        transaction_date: new Date(form.transaction_date + 'T12:00:00').toISOString(),
        scope,
      })
      setDone(true)
      setTimeout(onClose, 900)
    } finally {
      setSaving(false)
    }
  }

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 200ms ease' }}
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#1c1c24] shadow-2xl"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.97)',
          transition: 'opacity 200ms ease, transform 200ms ease',
        }}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-base font-semibold text-white">Nova Transação</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {scope === 'personal' ? '🔒 Pessoal — visível só por você' : '🏢 Empresa — visível por toda a equipe'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Tipo */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Tipo</label>
            <div className="flex gap-2">
              {([{ key: 'income', label: '↑ Receita' }, { key: 'expense', label: '↓ Despesa' }] as const).map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, type: opt.key }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    form.type === opt.key
                      ? opt.key === 'income'
                        ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                        : 'bg-red-600/20 border-red-500/40 text-red-400'
                      : 'border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Descrição</label>
            <input
              placeholder="Ex: Projeto StartSette — Fase 1"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
            />
          </div>

          {/* Categoria + Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Categoria</label>
              <select
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value} className="bg-[#1c1c24]">{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Valor (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
              />
            </div>
          </div>

          {/* Data + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Data</label>
              <input
                type="date"
                value={form.transaction_date}
                onChange={e => setForm(p => ({ ...p, transaction_date: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value as 'completed' | 'pending' }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors"
              >
                <option value="completed" className="bg-[#1c1c24]">Concluído</option>
                <option value="pending"   className="bg-[#1c1c24]">Pendente</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving || !form.description || !form.amount}
            className={`w-full h-10 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              done
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {done ? (
              <><CheckCircle2 className="w-4 h-4" /> Salvo!</>
            ) : saving ? (
              'Salvando...'
            ) : (
              <><Plus className="w-4 h-4" /> Registrar</>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

const SCOPE_TABS: { key: Scope; label: string; icon: React.ReactNode }[] = [
  { key: 'company',  label: 'Empresa',  icon: <Building2 className="w-3.5 h-3.5" /> },
  { key: 'personal', label: 'Pessoal',  icon: <User      className="w-3.5 h-3.5" /> },
]

export default function FinancePage() {
  usePageTitle('Financeiro')

  const [scope, setScope]               = useState<Scope>('company')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]           = useState(true)
  const [modalOpen, setModalOpen]       = useState(false)
  const [deletingId, setDeletingId]     = useState<string | null>(null)

  /* ── Sliding pill for scope tabs ────────────────────────────────── */
  const scopeRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false })

  const movePill = useCallback(() => {
    const el = scopeRefs.current[scope]
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth, ready: true })
  }, [scope])

  useEffect(() => {
    const id = requestAnimationFrame(movePill)
    return () => cancelAnimationFrame(id)
  }, [movePill])

  /* ── Fetch ──────────────────────────────────────────────────────── */
  const load = useCallback(async (s: Scope) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/finance/transactions?scope=${s}`, { cache: 'no-store' })
      if (res.ok) setTransactions(await res.json())
      else setTransactions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(scope) }, [load, scope])

  /* ── Save ───────────────────────────────────────────────────────── */
  const handleSave = async (data: Omit<Transaction, 'id' | 'created_at' | 'currency'>) => {
    const res = await fetch('/api/finance/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, scope }),
    })
    if (res.ok) await load(scope)
  }

  /* ── Delete ─────────────────────────────────────────────────────── */
  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await fetch(`/api/finance/transactions/${id}?scope=${scope}`, { method: 'DELETE' })
      setTransactions(prev => prev.filter(t => t.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  /* ── Computed metrics ────────────────────────────────────────────── */

  const income   = transactions.filter(t => t.type === 'income')
  const expenses = transactions.filter(t => t.type === 'expense')

  const totalIncome   = income.reduce((s, t) => s + t.amount, 0)
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0)
  const netBalance    = totalIncome - totalExpenses

  // Analytics chart — income vs expenses by month (last 6)
  const months = last6Months()
  const analyticsData = months.map(m => {
    const inc = income
      .filter(t => monthKey(t.transaction_date) === m.key)
      .reduce((s, t) => s + t.amount, 0)
    const exp = expenses
      .filter(t => monthKey(t.transaction_date) === m.key)
      .reduce((s, t) => s + t.amount, 0)
    return { month: m.label, income: inc, expenses: exp }
  })

  // Category totals
  const catTotal = (cat: string) =>
    income.filter(t => t.category === cat).reduce((s, t) => s + t.amount, 0)

  const investTotal  = catTotal('invest')
  const productTotal = catTotal('product')
  const otherTotal   = income
    .filter(t => !['invest', 'product'].includes(t.category))
    .reduce((s, t) => s + t.amount, 0)

  // Mini bar charts — daily amounts for last 30 days per category
  function dailyBars(cat: string | null, type: 'income' | 'expense' | 'all' = 'income') {
    const days = last30Days()
    const vals = days.map(d => {
      return transactions
        .filter(t =>
          t.transaction_date.slice(0, 10) === d &&
          (type === 'all' || t.type === type) &&
          (cat === null || t.category === cat)
        )
        .reduce((s, t) => s + t.amount, 0)
    })
    const max = Math.max(...vals, 1)
    return vals.map(v => (v / max) * 100)
  }

  const investBars  = dailyBars('invest')
  const productBars = dailyBars('product')
  const otherBars   = dailyBars(null, 'all')

  // Activity heatmap — count transactions per weekday (0=Mon) and hour bucket
  const hourBuckets = [9, 12, 15, 18, 21]
  const heatmap: number[][] = hourBuckets.map(hb => {
    return DAYS.map((_, di) => {
      const count = transactions.filter(t => {
        const d = new Date(t.transaction_date)
        const dow = (d.getDay() + 6) % 7
        const h = d.getHours()
        return dow === di && h >= hb && h < hb + 3
      }).length
      return count
    })
  })
  const maxCell = Math.max(...heatmap.flat(), 1)
  const heatmapNorm = heatmap.map(row =>
    row.map(v => Math.min(4, Math.round((v / maxCell) * 4)))
  )

  // Recent 5 transactions
  const recent = [...transactions]
    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
    .slice(0, 5)

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div className="space-y-4">
      <PageHeader
        title="Financeiro"
        description="Visão geral das suas finanças"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Financeiro' }]}
        actions={
          <div className="flex items-center gap-3">
            {/* Scope pill switcher */}
            <div className="relative flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
              {/* sliding pill */}
              <div
                className="absolute top-1 bottom-1 rounded-[10px] bg-white/10 border border-white/10 transition-all duration-[220ms]"
                style={{
                  left:    pill.ready ? pill.left  : 4,
                  width:   pill.ready ? pill.width : 80,
                  opacity: pill.ready ? 1 : 0,
                  transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)',
                }}
              />
              {SCOPE_TABS.map(tab => (
                <button
                  key={tab.key}
                  ref={el => { scopeRefs.current[tab.key] = el }}
                  onClick={() => setScope(tab.key)}
                  className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-sm font-medium transition-colors duration-150 ${
                    scope === tab.key ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" /> Nova Transação
            </button>
          </div>
        }
      />

      <AddTransactionModal open={modalOpen} scope={scope} onClose={() => setModalOpen(false)} onSave={handleSave} />

      {/* Scope indicator banner for personal */}
      {scope === 'personal' && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm">
          <User className="w-4 h-4 shrink-0" />
          <span>Visão <strong>Pessoal</strong> — estas transações são privadas e visíveis apenas por você.</span>
        </div>
      )}

      {/* ── Top row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Revenue card */}
        <div className="col-span-4 rounded-[24px] border border-white/10 bg-[#141418] p-5 flex flex-col gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Receita total</p>
            <div className="flex items-end gap-2 flex-wrap">
              <span className="text-[26px] font-bold text-white tabular-nums leading-none">
                {loading ? '—' : fmt(totalIncome)}
              </span>
              {!loading && totalIncome > 0 && (
                <span className="mb-0.5 text-[11px] font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-lg">
                  +{((totalIncome / (totalIncome + totalExpenses || 1)) * 100).toFixed(1)}%
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Saldo disponível:{' '}
              <span className={`font-medium ${netBalance >= 0 ? 'text-slate-300' : 'text-red-400'}`}>
                {loading ? '—' : fmt(netBalance)}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/8 hover:bg-white/12 text-sm text-white transition-colors font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" /> Receita
            </button>
            <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/8 hover:bg-white/12 text-sm text-white transition-colors font-medium">
              <ArrowDownRight className="w-3.5 h-3.5" /> Despesa
            </button>
            <button className="p-2 rounded-xl bg-white/8 hover:bg-white/12 text-slate-400 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Analytics chart */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-white">Analytics</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />Receitas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />Despesas
                </span>
              </div>
            </div>
            <div className="h-[130px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="fIncG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#facc15" stopOpacity={0.30} />
                      <stop offset="100%" stopColor="#facc15" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="fExpG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#64748b" stopOpacity={0.20} />
                      <stop offset="100%" stopColor="#64748b" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="income"   stroke="#facc15" strokeWidth={1.5} fill="url(#fIncG)" dot={false} activeDot={{ r: 3, fill: '#facc15',  strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="expenses" stroke="#64748b" strokeWidth={1.5} fill="url(#fExpG)" dot={false} activeDot={{ r: 3, fill: '#64748b', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Middle cards */}
        <div className="col-span-4 flex flex-col gap-4">
          <div className="flex-1 rounded-[24px] border border-white/10 bg-[#141418] p-5 flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xl font-bold text-white tabular-nums">{loading ? '—' : fmt(investTotal)}</p>
                <span className="text-[11px] text-green-400 font-semibold">Investimentos</span>
              </div>
              <p className="text-[11px] text-slate-500">Últimos 30 dias</p>
            </div>
            <div className="flex-1 flex items-end">
              <MiniBarChart heights={investBars} color="rgba(59,130,246,0.65)" />
            </div>
          </div>
          <div className="flex-1 rounded-[24px] border border-white/10 bg-[#141418] p-5 flex flex-col">
            <div className="mb-3">
              <p className="text-xl font-bold text-white tabular-nums">{loading ? '—' : fmt(productTotal)}</p>
              <span className="text-[11px] text-blue-400 font-semibold">Produtos</span>
            </div>
            <div className="flex-1 flex items-end">
              <MiniBarChart heights={productBars} color="rgba(59,130,246,0.50)" />
            </div>
          </div>
        </div>

        {/* Right card */}
        <div className="col-span-4 rounded-[24px] border border-white/10 bg-[#141418] p-5 flex flex-col gap-3">
          <p className="text-2xl font-bold text-white tabular-nums">{loading ? '—' : fmt(otherTotal)}</p>
          <span className="text-[11px] text-slate-400 bg-white/8 px-2.5 py-0.5 rounded-lg w-fit">Total geral</span>
          <div className="flex-1 flex items-end">
            <MiniBarChart heights={otherBars} color="rgba(59,130,246,0.72)" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">
              {transactions.length}{' '}
              <span className="text-slate-500 font-normal text-xs">transações</span>
            </span>
            <span className="text-[11px] text-slate-500">
              {new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">

        {/* Activity by time */}
        <div className="col-span-6 rounded-[24px] border border-white/10 bg-[#141418] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              <p className="text-sm font-semibold text-white">Atividade por horário</p>
            </div>
            <button className="text-slate-500 hover:text-slate-300 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1 pt-5 shrink-0">
              {HOURS.map(h => (
                <span key={h} className="text-[10px] text-slate-600 h-12 flex items-center">{h}</span>
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS.map(d => (
                  <span key={d} className="text-[10px] text-slate-500 text-center">{d}</span>
                ))}
              </div>
              <div className="flex flex-col gap-1">
                {heatmapNorm.map((row, hi) => (
                  <div key={hi} className="grid grid-cols-7 gap-1">
                    {row.map((val, di) => (
                      <div
                        key={di}
                        className="rounded-[6px] h-12"
                        style={{ backgroundColor: CELL_BG[val] }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1.5 mt-3">
            <span className="text-[10px] text-slate-500">Menos</span>
            {([0,1,2,3,4] as const).map(v => (
              <div key={v} className="w-5 h-3 rounded-[3px]" style={{ backgroundColor: CELL_BG[v] }} />
            ))}
            <span className="text-[10px] text-slate-500">Mais</span>
          </div>
        </div>

        {/* Recent transactions */}
        <div className="col-span-6 rounded-[24px] border border-white/10 bg-[#141418] p-5 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold text-white">Transações recentes</p>
            <button className="text-slate-500 hover:text-slate-300 transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-slate-500">Carregando...</p>
            </div>
          ) : recent.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
              <p className="text-sm text-slate-500 text-center">
                {scope === 'personal'
                  ? 'Nenhuma transação pessoal ainda.'
                  : 'Nenhuma transação ainda.'}
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-600/30 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar primeira transação
              </button>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {recent.map(t => {
                const color = CAT_COLOR[t.category] ?? '#64748b'
                return (
                  <div key={t.id} className="flex items-center gap-3 group">
                    <div className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-sm font-semibold text-white shrink-0">
                      {t.description.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{t.description}</p>
                      {t.status === 'pending' && (
                        <span className="text-[10px] text-yellow-400">● Pendente</span>
                      )}
                    </div>
                    <span
                      className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0"
                      style={{ backgroundColor: `${color}22`, color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      {CAT_LABEL[t.category] ?? t.category}
                    </span>
                    <span className={`text-sm font-semibold tabular-nums whitespace-nowrap shrink-0 ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                      {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
                    </span>
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deletingId === t.id}
                      className="text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      title="Excluir"
                    >
                      {deletingId === t.id
                        ? <MoreHorizontal className="w-4 h-4 animate-pulse" />
                        : <Trash2 className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
