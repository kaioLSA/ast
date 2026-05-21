'use client'

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuthStore } from '@/store/auth.store'
import { sendMetaEvent } from '@/services/integrations/metaPixel.service'
import { useRealtime } from '@/hooks/useRealtime'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import {
  Plus, Eye, MessageCircle, Search, X, CheckCircle2,
  Phone, Mail, Building2, Trash2, MoreVertical, Pencil, UserCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ContactAvatar } from '@/components/ui/ContactAvatar'

type Lead = {
  id: string
  name: string
  company: string
  status: string
  source: string
  aiScore: number
  value: number
  temperature: string
  email?: string
  phone?: string
  state?: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'Novo', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  contacted: { label: 'Contatado', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  qualified: { label: 'Qualificado', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  proposal: { label: 'Proposta', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  negotiation: { label: 'Negociação', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  won: { label: 'Ganho', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  lost: { label: 'Perdido', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

const sourceLabel: Record<string, string> = {
  meta_ads: 'Meta Ads', google_ads: 'Google Ads', whatsapp: 'WhatsApp', organic: 'Orgânico', referral: 'Indicação',
}

const sources = ['meta_ads', 'google_ads', 'whatsapp', 'organic', 'referral']
const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
const temps = ['hot', 'warm', 'cold']
const tempIcon: Record<string, string> = { hot: '🔥', warm: '🌡', cold: '❄' }

const tabs = [
  { key: 'all', label: 'Todos' },
  { key: 'hot', label: 'Quentes' },
  { key: 'negotiation', label: 'Em Negociação' },
  { key: 'won', label: 'Ganhos' },
]

type FormState = { name: string; company: string; email: string; phone: string; status: string; source: string; temperature: string; value: string; state: string }

const emptyForm: FormState = { name: '', company: '', email: '', phone: '', status: 'new', source: 'meta_ads', temperature: 'warm', value: '', state: '' }

const BRAZIL_STATES = [
  { id: 'AC', name: 'Acre' }, { id: 'AL', name: 'Alagoas' }, { id: 'AP', name: 'Amapá' },
  { id: 'AM', name: 'Amazonas' }, { id: 'BA', name: 'Bahia' }, { id: 'CE', name: 'Ceará' },
  { id: 'DF', name: 'Distrito Federal' }, { id: 'ES', name: 'Espírito Santo' }, { id: 'GO', name: 'Goiás' },
  { id: 'MA', name: 'Maranhão' }, { id: 'MT', name: 'Mato Grosso' }, { id: 'MS', name: 'Mato Grosso do Sul' },
  { id: 'MG', name: 'Minas Gerais' }, { id: 'PA', name: 'Pará' }, { id: 'PB', name: 'Paraíba' },
  { id: 'PR', name: 'Paraná' }, { id: 'PE', name: 'Pernambuco' }, { id: 'PI', name: 'Piauí' },
  { id: 'RJ', name: 'Rio de Janeiro' }, { id: 'RN', name: 'Rio Grande do Norte' }, { id: 'RS', name: 'Rio Grande do Sul' },
  { id: 'RO', name: 'Rondônia' }, { id: 'RR', name: 'Roraima' }, { id: 'SC', name: 'Santa Catarina' },
  { id: 'SP', name: 'São Paulo' }, { id: 'SE', name: 'Sergipe' }, { id: 'TO', name: 'Tocantins' },
]

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

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

  if (!mounted || typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 200ms ease' }}
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-[#1c1c24] shadow-2xl"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.97)',
          transition: 'opacity 200ms ease, transform 200ms ease',
        }}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  )
}

function LeadForm({ form, setForm, onSubmit, submitLabel, saving }: {
  form: FormState
  setForm: (f: FormState) => void
  onSubmit: () => void
  submitLabel: string
  saving: boolean
}) {
  const field = (label: string, node: React.ReactNode) => (
    <div>
      <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
      {node}
    </div>
  )
  const inp = (placeholder: string, key: keyof FormState, type = 'text') => (
    <input type={type} placeholder={placeholder} value={form[key]}
      onChange={e => setForm({ ...form, [key]: e.target.value })}
      className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors" />
  )
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">{field('Nome *', inp('Nome completo', 'name'))}</div>
        <div className="col-span-2">{field('Empresa', inp('Nome da empresa', 'company'))}</div>
        <div>{field('Email', inp('email@empresa.com', 'email', 'email'))}</div>
        <div>{field('Telefone', inp('+55 11 99999-0000', 'phone'))}</div>
        <div>
          {field('Status', (
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
              className="w-full h-10 rounded-xl bg-[#1c1c24] border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors">
              {statuses.map(s => <option key={s} value={s}>{statusConfig[s]?.label ?? s}</option>)}
            </select>
          ))}
        </div>
        <div>
          {field('Origem', (
            <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
              className="w-full h-10 rounded-xl bg-[#1c1c24] border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors">
              {sources.map(s => <option key={s} value={s}>{sourceLabel[s] ?? s}</option>)}
            </select>
          ))}
        </div>
        <div>
          {field('Temperatura', (
            <select value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })}
              className="w-full h-10 rounded-xl bg-[#1c1c24] border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors">
              {temps.map(t => <option key={t} value={t}>{tempIcon[t]} {t === 'hot' ? 'Quente' : t === 'warm' ? 'Morno' : 'Frio'}</option>)}
            </select>
          ))}
        </div>
        <div>{field('Valor estimado (R$)', inp('0', 'value', 'number'))}</div>
        <div>
          {field('Estado', (
            <select value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
              className="w-full h-10 rounded-xl bg-[#1c1c24] border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors">
              <option value="">Selecione...</option>
              {BRAZIL_STATES.map(s => <option key={s.id} value={s.id}>{s.id} — {s.name}</option>)}
            </select>
          ))}
        </div>
      </div>
      <button onClick={onSubmit} disabled={saving}
        className={cn('w-full h-10 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
          saving ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white')}>
        {saving ? <><CheckCircle2 className="w-4 h-4" /> Salvo!</> : submitLabel}
      </button>
    </div>
  )
}

export default function LeadsPage() {
  usePageTitle('Leads')
  useAuthStore()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')

  // Modals
  const [viewLead, setViewLead] = useState<Lead | null>(null)
  const [createModal, setCreateModal] = useState(false)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const [convertLead, setConvertLead] = useState<Lead | null>(null)

  // Forms
  const [createForm, setCreateForm] = useState<FormState>(emptyForm)
  const [editForm, setEditForm] = useState<FormState>(emptyForm)
  const [convertForm, setConvertForm] = useState<{ value: string; status: string }>({ value: '', status: 'active' })

  // Saving states
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [converting, setConverting] = useState(false)

  // Context menu
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; lead: Lead } | null>(null)
  const ctxRef = useRef<HTMLDivElement | null>(null)

  // Sliding pill for tabs
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false })

  const movePill = useCallback(() => {
    const el = tabRefs.current[activeTab]
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth, ready: true })
  }, [activeTab])

  useLayoutEffect(() => { movePill() }, [movePill])

  useEffect(() => {
    fetch('/api/leads')
      .then(r => r.json())
      .then((data: Array<{ id: string; name: string; company?: string; status: string; source: string; score?: number; value?: number; temperature: string; email?: string; phone?: string; state?: string }>) => {
        if (Array.isArray(data)) {
          setLeads(data.map(l => ({
            id: l.id, name: l.name, company: l.company || '—', status: l.status,
            source: l.source, aiScore: l.score ?? 70, value: Number(l.value) || 0,
            temperature: l.temperature, email: l.email, phone: l.phone, state: l.state,
          })))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenu) return
    const close = () => setCtxMenu(null)
    const timer = setTimeout(() => {
      document.addEventListener('click', close, { once: true })
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', close)
    }
  }, [ctxMenu])

  useRealtime<{ id: string; name: string; company?: string; status: string; source: string; score?: number; value?: number; temperature: string; email?: string; phone?: string; state?: string }>(
    'leads',
    {
      existingIds: leads.map(l => l.id),
      onInsert: (row) => setLeads(prev => [{
        id: row.id, name: row.name, company: row.company || '—', status: row.status,
        source: row.source, aiScore: row.score ?? 70, value: Number(row.value) || 0,
        temperature: row.temperature, email: row.email, phone: row.phone, state: row.state,
      }, ...prev]),
      onUpdate: (row) => setLeads(prev => prev.map(l => l.id === row.id
        ? { ...l, name: row.name, company: row.company || '—', status: row.status, source: row.source, aiScore: row.score ?? l.aiScore, value: Number(row.value) || 0, temperature: row.temperature, email: row.email, phone: row.phone, state: row.state }
        : l
      )),
      onDelete: (id) => setLeads(prev => prev.filter(l => l.id !== id)),
    }
  )

  const filtered = leads.filter(l => {
    const matchTab = activeTab === 'all' || (activeTab === 'hot' && l.temperature === 'hot') || (activeTab === 'negotiation' && l.status === 'negotiation') || (activeTab === 'won' && l.status === 'won')
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.company.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const openCtxMenu = useCallback((e: React.MouseEvent, lead: Lead) => {
    e.preventDefault()
    e.stopPropagation()
    const x = Math.min(e.clientX, window.innerWidth - 200)
    const y = Math.min(e.clientY, window.innerHeight - 120)
    setCtxMenu({ x, y, lead })
  }, [])

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!createForm.name) return
    const aiScore = Math.floor(Math.random() * 40 + 40)
    const optimistic: Lead = {
      id: `temp-${Date.now()}`, name: createForm.name, company: createForm.company || '—',
      email: createForm.email, phone: createForm.phone, status: createForm.status,
      source: createForm.source, temperature: createForm.temperature, value: Number(createForm.value) || 0, aiScore, state: createForm.state || undefined,
    }
    setLeads(prev => [optimistic, ...prev])
    setCreating(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createForm.name, company: createForm.company || '', email: createForm.email, phone: createForm.phone, status: createForm.status, source: createForm.source, temperature: createForm.temperature, value: Number(createForm.value) || 0, score: aiScore, state: createForm.state || '' }),
      })
      if (res.ok) {
        const created = await res.json()
        setLeads(prev => prev.map(l => l.id === optimistic.id ? { ...optimistic, id: created.id } : l))
        sendMetaEvent({ eventName: 'Lead', email: createForm.email, phone: createForm.phone, leadId: created.id, value: Number(createForm.value) || undefined })
      }
    } catch { /* keep optimistic */ }
    setTimeout(() => {
      setCreateModal(false)
      setCreating(false)
      setCreateForm(emptyForm)
    }, 800)
  }

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit = (lead: Lead) => {
    setEditForm({ name: lead.name, company: lead.company === '—' ? '' : lead.company, email: lead.email ?? '', phone: lead.phone ?? '', status: lead.status, source: lead.source, temperature: lead.temperature, value: lead.value ? String(lead.value) : '', state: lead.state ?? '' })
    setEditLead(lead)
    setCtxMenu(null)
  }

  const handleEdit = async () => {
    if (!editLead || !editForm.name) return
    setEditing(true)
    const patch = { name: editForm.name, company: editForm.company, email: editForm.email, phone: editForm.phone, status: editForm.status, source: editForm.source, temperature: editForm.temperature, value: Number(editForm.value) || 0, state: editForm.state || '' }
    setLeads(prev => prev.map(l => l.id === editLead.id ? { ...l, ...patch, company: patch.company || '—', state: patch.state || undefined } : l))
    try {
      await fetch(`/api/leads/${editLead.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    } catch { /* keep optimistic */ }
    setTimeout(() => { setEditLead(null); setEditing(false) }, 800)
  }

  // ── Convert to client ─────────────────────────────────────────────────────
  const openConvert = (lead: Lead) => {
    setConvertForm({ value: lead.value ? String(lead.value) : '', status: 'active' })
    setConvertLead(lead)
    setCtxMenu(null)
  }

  const handleConvert = async () => {
    if (!convertLead) return
    setConverting(true)
    // Optimistically remove from leads
    setLeads(prev => prev.filter(l => l.id !== convertLead.id))
    try {
      await Promise.all([
        fetch('/api/clients', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: convertLead.name, company_name: convertLead.company === '—' ? '' : convertLead.company,
            email: convertLead.email ?? '', phone: convertLead.phone ?? '',
            status: convertForm.status, value: Number(convertForm.value) || 0,
            score: convertLead.aiScore, since: new Date().toISOString().slice(0, 10),
          }),
        }),
        fetch(`/api/leads/${convertLead.id}`, { method: 'DELETE' }),
      ])
    } catch {
      // on failure put lead back
      setLeads(prev => [convertLead, ...prev])
    }
    setTimeout(() => { setConvertLead(null); setConverting(false) }, 500)
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id))
    try { await fetch(`/api/leads/${id}`, { method: 'DELETE' }) } catch { /* ignore */ }
  }

  // ── Context menu items ────────────────────────────────────────────────────
  const ctxItems = ctxMenu ? [
    { label: 'Editar', icon: Pencil, action: () => openEdit(ctxMenu.lead), color: 'text-slate-300 hover:text-white hover:bg-white/8' },
    { label: 'Converter em Cliente', icon: UserCheck, action: () => openConvert(ctxMenu.lead), color: 'text-green-400 hover:text-green-300 hover:bg-green-500/10' },
    { label: 'Excluir', icon: Trash2, action: () => { handleDelete(ctxMenu.lead.id); setCtxMenu(null) }, color: 'text-red-400 hover:text-red-300 hover:bg-red-500/10' },
  ] : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Gerencie seu pipeline de vendas"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Leads' }]}
        actions={
          <button onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Novo Lead
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
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
          {tabs.map(t => (
            <button
              key={t.key}
              ref={el => { tabRefs.current[t.key] = el }}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'relative z-10 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150',
                activeTab === t.key ? 'text-black' : 'text-slate-400 hover:text-white',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar leads..."
            className="pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 w-64" />
        </div>
      </div>

      <p className="text-sm text-slate-400">Mostrando <span className="text-white font-medium">{filtered.length}</span> leads</p>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <div className="rounded-2xl border border-white/10 bg-white/3 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {['Lead', 'Status', 'Origem', 'Valor', 'Temp.', ''].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
                  <tr
                    key={lead.id}
                    onContextMenu={e => openCtxMenu(e, lead)}
                    className="group border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-default"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <ContactAvatar name={lead.name} phone={lead.phone} size={32} />
                        <div>
                          <p className="text-sm font-medium text-white">{lead.name}</p>
                          <p className="text-xs text-slate-500">{lead.company}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn('px-2 py-0.5 rounded-md text-[11px] font-medium border', statusConfig[lead.status]?.color)}>
                        {statusConfig[lead.status]?.label ?? lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-400">{sourceLabel[lead.source] ?? lead.source}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-slate-300 tabular-nums">
                      {lead.value > 0 ? `R$ ${lead.value.toLocaleString('pt-BR')}` : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-lg">{tempIcon[lead.temperature]}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewLead(lead)} className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg text-slate-500 hover:text-green-400 hover:bg-green-500/10 transition-colors">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        {/* Three-dot menu */}
                        <button
                          onClick={e => openCtxMenu(e, lead)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Context menu ────────────────────────────────────────────────── */}
      {ctxMenu && typeof document !== 'undefined' && createPortal(
        <div
          ref={ctxRef}
          style={{ position: 'fixed', top: ctxMenu.y, left: ctxMenu.x, zIndex: 99999 }}
          className="w-48 rounded-xl border border-white/10 bg-[#111827] shadow-2xl py-1 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {ctxItems.map(item => {
            const Icon = item.icon
            return (
              <button key={item.label} onClick={item.action}
                className={cn('w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors', item.color)}>
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            )
          })}
        </div>,
        document.body
      )}

      {/* ── View modal ──────────────────────────────────────────────────── */}
      <Modal open={!!viewLead} onClose={() => setViewLead(null)} title="Detalhes do Lead">
        {viewLead && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <ContactAvatar name={viewLead.name} phone={viewLead.phone} size={56} className="rounded-2xl" />
              <div>
                <p className="text-base font-semibold text-white">{viewLead.name}</p>
                <p className="text-sm text-slate-400">{viewLead.company}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={cn('px-2 py-0.5 rounded-md text-[11px] font-medium border', statusConfig[viewLead.status]?.color)}>
                    {statusConfig[viewLead.status]?.label}
                  </span>
                  <span className="text-sm">{tempIcon[viewLead.temperature]}</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/3 divide-y divide-white/5">
              {viewLead.email && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-sm text-slate-300">{viewLead.email}</span>
                </div>
              )}
              {viewLead.phone && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-sm text-slate-300">{viewLead.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 px-4 py-3">
                <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-sm text-slate-300">{sourceLabel[viewLead.source] ?? viewLead.source}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Score IA</p>
                <p className="text-lg font-bold text-white">{viewLead.aiScore}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Valor</p>
                <p className="text-sm font-bold text-green-400">{viewLead.value > 0 ? `R$ ${viewLead.value.toLocaleString('pt-BR')}` : '—'}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Temp.</p>
                <p className="text-2xl">{tempIcon[viewLead.temperature]}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setViewLead(null); openEdit(viewLead) }}
                className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-white/8 hover:bg-white/12 text-sm text-slate-300 hover:text-white transition-colors border border-white/10">
                <Pencil className="w-3.5 h-3.5" /> Editar
              </button>
              <button onClick={() => { setViewLead(null); openConvert(viewLead) }}
                className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-green-600/20 hover:bg-green-600/30 text-sm text-green-400 hover:text-green-300 transition-colors border border-green-500/20">
                <UserCheck className="w-3.5 h-3.5" /> Converter em Cliente
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create modal ────────────────────────────────────────────────── */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Novo Lead">
        <LeadForm form={createForm} setForm={setCreateForm} onSubmit={handleCreate} submitLabel="Criar Lead" saving={creating} />
      </Modal>

      {/* ── Edit modal ──────────────────────────────────────────────────── */}
      <Modal open={!!editLead} onClose={() => setEditLead(null)} title="Editar Lead">
        <LeadForm form={editForm} setForm={setEditForm} onSubmit={handleEdit} submitLabel="Salvar alterações" saving={editing} />
      </Modal>

      {/* ── Convert to client modal ──────────────────────────────────────── */}
      <Modal open={!!convertLead} onClose={() => setConvertLead(null)} title="Converter em Cliente">
        {convertLead && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <UserCheck className="w-5 h-5 text-green-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-white">{convertLead.name}</p>
                <p className="text-xs text-slate-400">{convertLead.company !== '—' ? convertLead.company : 'Sem empresa'}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">O lead será removido da lista e adicionado como cliente. Confirme os dados abaixo:</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Valor do contrato (R$)</label>
                <input type="number" placeholder="0" value={convertForm.value}
                  onChange={e => setConvertForm(p => ({ ...p, value: e.target.value }))}
                  className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-green-500/60 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Status do cliente</label>
                <select value={convertForm.status} onChange={e => setConvertForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full h-10 rounded-xl bg-[#1c1c24] border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-green-500/60 transition-colors">
                  <option value="active">Ativo</option>
                  <option value="prospect">Prospect</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setConvertLead(null)}
                className="flex-1 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-slate-300 transition-colors border border-white/10">
                Cancelar
              </button>
              <button onClick={handleConvert} disabled={converting}
                className={cn('flex-1 h-10 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2',
                  converting ? 'bg-green-600 text-white' : 'bg-green-600 hover:bg-green-500 text-white')}>
                {converting ? <><CheckCircle2 className="w-4 h-4" /> Convertido!</> : <><UserCheck className="w-4 h-4" /> Confirmar</>}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
