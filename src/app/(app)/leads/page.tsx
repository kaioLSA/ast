'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuthStore } from '@/store/auth.store'
import { sendMetaEvent } from '@/services/integrations/metaPixel.service'
import { useRealtime } from '@/hooks/useRealtime'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import { Plus, Eye, MessageCircle, Search, X, CheckCircle2, Phone, Mail, Building2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

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

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open || typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1425] shadow-2xl">
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

export default function LeadsPage() {
  usePageTitle('Leads')
  const { user } = useAuthStore()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [viewLead, setViewLead] = useState<Lead | null>(null)
  const [createModal, setCreateModal] = useState(false)
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', status: 'new', source: 'meta_ads', temperature: 'warm', value: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/leads')
      .then(r => r.json())
      .then((data: Array<{ id: string; name: string; company?: string; status: string; source: string; score?: number; value?: number; temperature: string; email?: string; phone?: string }>) => {
        if (Array.isArray(data)) {
          setLeads(data.map(l => ({
            id: l.id,
            name: l.name,
            company: l.company || '—',
            status: l.status,
            source: l.source,
            aiScore: l.score ?? 70,
            value: Number(l.value) || 0,
            temperature: l.temperature,
            email: l.email,
            phone: l.phone,
          })))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useRealtime<{ id: string; name: string; company?: string; status: string; source: string; score?: number; value?: number; temperature: string; email?: string; phone?: string }>(
    'leads',
    {
      existingIds: leads.map(l => l.id),
      onInsert: (row) => setLeads(prev => [{
        id: row.id,
        name: row.name,
        company: row.company || '—',
        status: row.status,
        source: row.source,
        aiScore: row.score ?? 70,
        value: Number(row.value) || 0,
        temperature: row.temperature,
        email: row.email,
        phone: row.phone,
      }, ...prev]),
      onUpdate: (row) => setLeads(prev => prev.map(l => l.id === row.id
        ? { ...l, name: row.name, company: row.company || '—', status: row.status, source: row.source, aiScore: row.score ?? l.aiScore, value: Number(row.value) || 0, temperature: row.temperature, email: row.email, phone: row.phone }
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

  const handleCreate = async () => {
    if (!form.name) return
    const aiScore = Math.floor(Math.random() * 40 + 40)
    const optimisticLead: Lead = {
      id: `temp-${Date.now()}`,
      name: form.name,
      company: form.company || '—',
      email: form.email,
      phone: form.phone,
      status: form.status,
      source: form.source,
      temperature: form.temperature,
      value: Number(form.value) || 0,
      aiScore,
    }
    setLeads(prev => [optimisticLead, ...prev])
    setSaved(true)

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          company: form.company || '',
          email: form.email,
          phone: form.phone,
          status: form.status,
          source: form.source,
          temperature: form.temperature,
          value: Number(form.value) || 0,
          score: aiScore,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setLeads(prev => prev.map(l => l.id === optimisticLead.id
          ? { ...optimisticLead, id: created.id }
          : l
        ))
        sendMetaEvent({
          eventName: 'Lead',
          email: form.email,
          phone: form.phone,
          leadId: created.id,
          value: Number(form.value) || undefined,
        })
      }
    } catch {
      // keep optimistic entry
    }

    setTimeout(() => {
      setCreateModal(false)
      setSaved(false)
      setForm({ name: '', company: '', email: '', phone: '', status: 'new', source: 'meta_ads', temperature: 'warm', value: '' })
    }, 800)
  }

  const handleDelete = async (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id))
    try {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' })
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Gerencie seu pipeline de vendas"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Leads' }]}
        actions={
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Lead
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all', activeTab === t.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5')}>
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
                <tr key={lead.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {lead.name.charAt(0)}
                      </div>
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
                      <button onClick={() => handleDelete(lead.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
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

      {/* View lead modal */}
      <Modal open={!!viewLead} onClose={() => setViewLead(null)} title="Detalhes do Lead">
        {viewLead && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xl font-bold text-white shrink-0">
                {viewLead.name.charAt(0)}
              </div>
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
          </div>
        )}
      </Modal>

      {/* Create lead modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Novo Lead">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1.5 block">Nome *</label>
              <input placeholder="Nome completo" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1.5 block">Empresa</label>
              <input placeholder="Nome da empresa" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Email</label>
              <input type="email" placeholder="email@empresa.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Telefone</label>
              <input placeholder="+55 11 99999-0000" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors">
                {statuses.map(s => <option key={s} value={s} className="bg-[#0d1425]">{statusConfig[s]?.label ?? s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Origem</label>
              <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors">
                {sources.map(s => <option key={s} value={s} className="bg-[#0d1425]">{sourceLabel[s] ?? s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Temperatura</label>
              <select value={form.temperature} onChange={e => setForm(p => ({ ...p, temperature: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors">
                {temps.map(t => <option key={t} value={t} className="bg-[#0d1425]">{tempIcon[t]} {t === 'hot' ? 'Quente' : t === 'warm' ? 'Morno' : 'Frio'}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Valor estimado (R$)</label>
              <input type="number" placeholder="0" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors" />
            </div>
          </div>
          <button onClick={handleCreate}
            className={cn('w-full h-10 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2', saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white')}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Lead criado!</> : <><Plus className="w-4 h-4" /> Criar Lead</>}
          </button>
        </div>
      </Modal>
    </div>
  )
}
