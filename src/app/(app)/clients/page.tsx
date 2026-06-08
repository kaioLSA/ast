'use client'

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, Plus, Building2, Phone, Mail, MoreHorizontal, Users, TrendingUp, DollarSign, Star, X, CheckCircle2, Trash2, Pencil, MapPin, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ContactAvatar } from '@/components/ui/ContactAvatar'
import { useRealtime } from '@/hooks/useRealtime'

interface Client {
  id: string
  name: string
  company: string
  email: string
  phone: string
  status: 'active' | 'inactive' | 'prospect'
  value: number
  deals: number
  score: number
  since: string
  avatar: string
  gradient: string
  state?: string
  niche?: string
  toneOfVoice?: string
}

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

const gradients = [
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-rose-500 to-pink-500',
  'from-indigo-500 to-blue-600',
]

const statusLabel: Record<Client['status'], string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  prospect: 'Prospect',
}

const statusColor: Record<Client['status'], string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  inactive: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  prospect: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
}

const emptyForm = { name: '', company: '', email: '', phone: '', status: 'active' as Client['status'], value: '', state: '', niche: '', toneOfVoice: '' }

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
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  )
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | Client['status']>('all')

  // Sliding pill
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false })
  const movePill = useCallback(() => {
    const el = tabRefs.current[filter]
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth, ready: true })
  }, [filter])
  useLayoutEffect(() => { movePill() }, [movePill])
  const [createModal, setCreateModal] = useState(false)
  const [viewClient, setViewClient] = useState<Client | null>(null)
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [saved, setSaved] = useState(false)
  const [editSaved, setEditSaved] = useState(false)

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then((data: Array<{ id: string; name: string; company_name?: string; email?: string; phone?: string; status: Client['status']; value?: number; deals?: number; score?: number; since?: string; avatar?: string; gradient?: string; state?: string; niche?: string; tone_of_voice?: string }>) => {
        if (Array.isArray(data)) {
          setClients(data.map(c => ({
            id: c.id,
            name: c.name || '',
            company: c.company_name || '—',
            email: c.email || '',
            phone: c.phone || '',
            status: (['active', 'inactive', 'prospect'].includes(c.status) ? c.status : 'prospect') as Client['status'],
            value: Number(c.value) || 0,
            deals: c.deals ?? 0,
            score: c.score ?? 70,
            since: c.since || '',
            avatar: c.avatar || (c.name ? c.name.split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase() : '?'),
            gradient: c.gradient || gradients[0],
            state: c.state,
            niche: c.niche,
            toneOfVoice: c.tone_of_voice,
          })))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useRealtime<{ id: string; name: string; company_name?: string; email?: string; phone?: string; status: Client['status']; value?: number; deals?: number; score?: number; since?: string; gradient?: string }>(
    'clients',
    {
      existingIds: clients.map(c => c.id),
      onInsert: (row) => setClients(prev => [{
        id: row.id,
        name: row.name || '',
        company: row.company_name || '—',
        email: row.email || '',
        phone: row.phone || '',
        status: (['active', 'inactive', 'prospect'].includes(row.status) ? row.status : 'prospect') as Client['status'],
        value: Number(row.value) || 0,
        deals: row.deals ?? 0,
        score: row.score ?? 70,
        since: row.since || '',
        avatar: row.name ? row.name.split(' ').map((w: string) => w[0] ?? '').join('').slice(0, 2).toUpperCase() : '?',
        gradient: row.gradient || gradients[0],
      }, ...prev]),
      onUpdate: (row) => setClients(prev => prev.map(c => c.id === row.id
        ? { ...c, name: row.name, company: row.company_name || '—', email: row.email || '', phone: row.phone || '', status: row.status, value: Number(row.value) || 0 }
        : c
      )),
      onDelete: (id) => setClients(prev => prev.filter(c => c.id !== id)),
    }
  )

  const filtered = clients.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  const handleCreate = async () => {
    if (!form.name) return
    const initials = form.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    const score = Math.floor(Math.random() * 30 + 60)
    const gradient = gradients[Math.floor(Math.random() * gradients.length)]
    const since = new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })

    const optimisticClient: Client = {
      id: `temp-${Date.now()}`,
      name: form.name,
      company: form.company || '—',
      email: form.email,
      phone: form.phone,
      status: form.status,
      value: Number(form.value) || 0,
      deals: 0,
      score,
      since,
      avatar: initials,
      gradient,
      niche: form.niche || undefined,
      toneOfVoice: form.toneOfVoice || undefined,
    }
    setClients(prev => [optimisticClient, ...prev])
    setSaved(true)

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          company_name: form.company || '',
          email: form.email,
          phone: form.phone,
          status: form.status,
          value: Number(form.value) || 0,
          deals: 0,
          score,
          since,
          avatar: initials,
          gradient,
          state: form.state || '',
          niche: form.niche || '',
          tone_of_voice: form.toneOfVoice || '',
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setClients(prev => prev.map(c => c.id === optimisticClient.id
          ? { ...optimisticClient, id: created.id }
          : c
        ))
      }
    } catch {
      // keep optimistic entry
    }

    setTimeout(() => {
      setCreateModal(false)
      setSaved(false)
      setForm(emptyForm)
    }, 800)
  }

  const openEdit = (c: Client) => {
    setEditForm({
      name: c.name,
      company: c.company === '—' ? '' : c.company,
      email: c.email,
      phone: c.phone,
      status: c.status,
      value: c.value ? String(c.value) : '',
      state: c.state ?? '',
      niche: c.niche ?? '',
      toneOfVoice: c.toneOfVoice ?? '',
    })
    setEditClient(c)
    setViewClient(null)
  }

  const handleEdit = async () => {
    if (!editClient || !editForm.name) return
    setEditSaved(true)
    const patch = {
      name: editForm.name,
      company_name: editForm.company || '',
      email: editForm.email,
      phone: editForm.phone,
      status: editForm.status,
      value: Number(editForm.value) || 0,
      state: editForm.state || '',
      niche: editForm.niche || '',
      tone_of_voice: editForm.toneOfVoice || '',
    }
    setClients(prev => prev.map(c => c.id === editClient.id
      ? { ...c, ...patch, company: patch.company_name || '—', state: patch.state || undefined, niche: patch.niche || undefined, toneOfVoice: patch.tone_of_voice || undefined }
      : c
    ))
    try {
      await fetch(`/api/clients/${editClient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
    } catch { /* keep optimistic */ }
    setTimeout(() => { setEditClient(null); setEditSaved(false) }, 800)
  }

  const handleDelete = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id))
    if (viewClient?.id === id) setViewClient(null)
    try {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    } catch {
      // ignore
    }
  }

  const totalValue = clients.reduce((s, c) => s + c.value, 0)
  const activeCount = clients.filter((c) => c.status === 'active').length

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Clientes</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gerencie sua base de clientes</p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo cliente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total clientes', value: clients.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Clientes ativos', value: activeCount, icon: Star, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Negócios totais', value: clients.reduce((s, c) => s + c.deals, 0), icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Receita total', value: totalValue > 0 ? `R$ ${(totalValue / 1000).toFixed(0)}k` : 'R$ 0', icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-white/3 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-lg font-semibold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-48 h-9 rounded-xl bg-white/5 border border-white/8 px-3">
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente ou empresa..."
            className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
          />
        </div>
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
          {(['all', 'active', 'prospect', 'inactive'] as const).map((s) => (
            <button
              key={s}
              ref={el => { tabRefs.current[s] = el }}
              onClick={() => setFilter(s)}
              className={cn(
                'relative z-10 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150',
                filter === s ? 'text-black' : 'text-slate-400 hover:text-white',
              )}
            >
              {s === 'all' ? 'Todos' : statusLabel[s as Client['status']]}
            </button>
          ))}
        </div>
      </div>

      {/* Client list */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-slate-300 font-medium">Nenhum cliente ainda</p>
            <p className="text-slate-600 text-sm mt-1">Adicione seu primeiro cliente para começar</p>
          </div>
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar cliente
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                {['Cliente', 'Contato', 'Status', 'Negócios', 'Receita', 'Score', ''].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setViewClient(c)}
                  className="border-b border-white/5 hover:bg-white/3 transition-colors group cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ContactAvatar name={c.name} phone={c.phone} size={32} />
                      <div>
                        <p className="text-sm font-medium text-white">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.company}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Mail className="w-3 h-3 text-slate-600" />{c.email || '—'}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Phone className="w-3 h-3 text-slate-600" />{c.phone || '—'}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${statusColor[c.status]}`}>
                      {statusLabel[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{c.deals}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {c.value > 0 ? `R$ ${c.value.toLocaleString('pt-BR')}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${c.score}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{c.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={(e) => { e.stopPropagation(); setViewClient(c) }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all"
                        title="Ver detalhes"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(c) }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(c.id) }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => { setCreateModal(false); setForm(emptyForm) }} title="Novo Cliente">
        <div className="space-y-4">
          {[
            { label: 'Nome *', key: 'name', placeholder: 'Nome completo', type: 'text' },
            { label: 'Empresa', key: 'company', placeholder: 'Nome da empresa', type: 'text' },
            { label: 'Email', key: 'email', placeholder: 'email@empresa.com', type: 'email' },
            { label: 'Telefone', key: 'phone', placeholder: '+55 11 99999-0000', type: 'text' },
            { label: 'Receita (R$)', key: 'value', placeholder: '0', type: 'number' },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key as keyof typeof form]}
                onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={e => setForm(prev => ({ ...prev, status: e.target.value as Client['status'] }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
            >
              <option value="prospect">Prospect</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Estado</label>
            <select
              value={form.state}
              onChange={e => setForm(prev => ({ ...prev, state: e.target.value }))}
              className="w-full h-10 rounded-xl bg-[#1c1c24] border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
            >
              <option value="">Selecione...</option>
              {BRAZIL_STATES.map(s => <option key={s.id} value={s.id}>{s.id} — {s.name}</option>)}
            </select>
          </div>

          <div className="pt-1 border-t border-white/8">
            <div className="flex items-center gap-1.5 mb-3 mt-3">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-slate-300">Dados para automações de IA</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nicho</label>
                <input
                  type="text"
                  placeholder="Ex: clínica estética, barbearia, odontologia"
                  value={form.niche}
                  onChange={e => setForm(prev => ({ ...prev, niche: e.target.value }))}
                  className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Tom de voz</label>
                <textarea
                  rows={2}
                  placeholder="Ex: emocional e próximo, fala direto com a cliente, sem formalidade"
                  value={form.toneOfVoice}
                  onChange={e => setForm(prev => ({ ...prev, toneOfVoice: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 resize-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!form.name || saved}
            className={cn(
              'w-full h-11 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
              saved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Cliente salvo!</> : <><Plus className="w-4 h-4" /> Criar cliente</>}
          </button>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editClient} onClose={() => setEditClient(null)} title="Editar Cliente">
        <div className="space-y-4">
          {[
            { label: 'Nome *', key: 'name', placeholder: 'Nome completo', type: 'text' },
            { label: 'Empresa', key: 'company', placeholder: 'Nome da empresa', type: 'text' },
            { label: 'Email', key: 'email', placeholder: 'email@empresa.com', type: 'email' },
            { label: 'Telefone', key: 'phone', placeholder: '+55 11 99999-0000', type: 'text' },
            { label: 'Receita (R$)', key: 'value', placeholder: '0', type: 'number' },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={editForm[key as keyof typeof editForm]}
                onChange={e => setEditForm(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
            <select
              value={editForm.status}
              onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value as Client['status'] }))}
              className="w-full h-10 rounded-xl bg-[#1c1c24] border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
            >
              <option value="prospect">Prospect</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Estado</label>
            <select
              value={editForm.state}
              onChange={e => setEditForm(prev => ({ ...prev, state: e.target.value }))}
              className="w-full h-10 rounded-xl bg-[#1c1c24] border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
            >
              <option value="">Selecione...</option>
              {BRAZIL_STATES.map(s => <option key={s.id} value={s.id}>{s.id} — {s.name}</option>)}
            </select>
          </div>

          <div className="pt-1 border-t border-white/8">
            <div className="flex items-center gap-1.5 mb-3 mt-3">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-semibold text-slate-300">Dados para automações de IA</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nicho</label>
                <input
                  type="text"
                  placeholder="Ex: clínica estética, barbearia, odontologia"
                  value={editForm.niche}
                  onChange={e => setEditForm(prev => ({ ...prev, niche: e.target.value }))}
                  className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Tom de voz</label>
                <textarea
                  rows={2}
                  placeholder="Ex: emocional e próximo, fala direto com a cliente, sem formalidade"
                  value={editForm.toneOfVoice}
                  onChange={e => setEditForm(prev => ({ ...prev, toneOfVoice: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 resize-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleEdit}
            disabled={!editForm.name || editSaved}
            className={cn(
              'w-full h-11 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
              editSaved ? 'bg-emerald-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {editSaved ? <><CheckCircle2 className="w-4 h-4" /> Salvo!</> : <><CheckCircle2 className="w-4 h-4" /> Salvar alterações</>}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewClient} onClose={() => setViewClient(null)} title="Detalhes do Cliente">
        {viewClient && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <ContactAvatar name={viewClient.name} phone={viewClient.phone} size={56} className="rounded-2xl" />
              <div>
                <p className="text-lg font-semibold text-white">{viewClient.name}</p>
                <p className="text-sm text-slate-400">{viewClient.company}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full border text-xs font-medium ${statusColor[viewClient.status]}`}>
                  {statusLabel[viewClient.status]}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Email', value: viewClient.email || '—', icon: Mail },
                { label: 'Telefone', value: viewClient.phone || '—', icon: Phone },
                { label: 'Receita', value: viewClient.value > 0 ? `R$ ${viewClient.value.toLocaleString('pt-BR')}` : '—', icon: DollarSign },
                { label: 'Negócios', value: String(viewClient.deals), icon: TrendingUp },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl bg-white/5 border border-white/8 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Icon className="w-3 h-3" />{label}
                  </div>
                  <p className="text-sm font-medium text-white truncate">{value}</p>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500">Score</span>
                <span className="text-xs font-medium text-white">{viewClient.score}/100</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all" style={{ width: `${viewClient.score}%` }} />
              </div>
            </div>

            {viewClient.state && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5" />
                {BRAZIL_STATES.find(s => s.id === viewClient.state)?.name ?? viewClient.state}
              </div>
            )}

            <p className="text-xs text-slate-600">Cliente desde {viewClient.since}</p>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => openEdit(viewClient)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <Pencil className="w-4 h-4" /> Editar
              </button>
              <button
                onClick={() => handleDelete(viewClient.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
