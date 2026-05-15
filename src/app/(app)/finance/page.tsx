'use client'

import { useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuthStore } from '@/store/auth.store'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import { Plus, TrendingUp, TrendingDown, DollarSign, BarChart3, ArrowUpRight, ArrowDownRight, X, CheckCircle2 } from 'lucide-react'
import { mockFinancialSummary, mockTransactions } from '@/services/mocks/finance.mock'
import { cn } from '@/lib/utils/cn'

const extraTransactions = [
  { id: '4', type: 'income', status: 'completed', amount: 72000, currency: 'BRL', description: 'Projeto Startup X — Contrato anual', category: 'project', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: '5', type: 'income', status: 'completed', amount: 35000, currency: 'BRL', description: 'Consultoria AgriTech Brasil', category: 'consulting', createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: '6', type: 'expense', status: 'completed', amount: 1200, currency: 'BRL', description: 'Google Ads — Budget semanal', category: 'ads', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: '7', type: 'expense', status: 'completed', amount: 3500, currency: 'BRL', description: 'Salários — Time vendas', category: 'payroll', createdAt: new Date(Date.now() - 6 * 86400000).toISOString() },
  { id: '8', type: 'income', status: 'pending', amount: 15000, currency: 'BRL', description: 'Assinatura Enterprise — Clínica Saúde+', category: 'subscription', createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: '9', type: 'expense', status: 'completed', amount: 890, currency: 'BRL', description: 'SaaS Tools — Ferramentas internas', category: 'software', createdAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: '10', type: 'income', status: 'completed', amount: 8000, currency: 'BRL', description: 'Onboarding LogTech — Fase 1', category: 'project', createdAt: new Date(Date.now() - 8 * 86400000).toISOString() },
  { id: '11', type: 'expense', status: 'completed', amount: 2100, currency: 'BRL', description: 'Escritório — Aluguel proporcional', category: 'rent', createdAt: new Date(Date.now() - 9 * 86400000).toISOString() },
  { id: '12', type: 'income', status: 'completed', amount: 22000, currency: 'BRL', description: 'Campanha Marketing Digital — EduPlus', category: 'project', createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: '13', type: 'expense', status: 'pending', amount: 4200, currency: 'BRL', description: 'TikTok Ads — Campanha Geração Z', category: 'ads', createdAt: new Date(Date.now() - 0.5 * 86400000).toISOString() },
]

const categoryLabel: Record<string, string> = { subscription: 'Assinatura', project: 'Projeto', ads: 'Anúncios', consulting: 'Consultoria', payroll: 'Folha', software: 'Software', rent: 'Aluguel' }
const categoryColor: Record<string, string> = {
  subscription: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  project: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  ads: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  consulting: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  payroll: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  software: 'bg-green-500/10 text-green-400 border-green-500/20',
  rent: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

const categories = ['subscription', 'project', 'ads', 'consulting', 'payroll', 'software', 'rent']

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1425] shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export default function FinancePage() {
  usePageTitle('Financeiro')
  const { user } = useAuthStore()
  const isEmpty = user?.teamId === 'gabriel-team'
  const [activeTab, setActiveTab] = useState('all')
  const [transactions, setTransactions] = useState(isEmpty ? [] : [...mockTransactions, ...extraTransactions])
  const [createModal, setCreateModal] = useState(false)
  const [form, setForm] = useState({ type: 'income', description: '', category: categories[0], amount: '', status: 'completed' })
  const [saved, setSaved] = useState(false)

  const filtered = transactions
    .filter(t => activeTab === 'all' || t.type === activeTab)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const handleCreate = () => {
    if (!form.description || !form.amount) return
    const newT = {
      id: String(Date.now()),
      type: form.type,
      status: form.status,
      amount: Number(form.amount),
      currency: 'BRL',
      description: form.description,
      category: form.category,
      createdAt: new Date().toISOString(),
    }
    setTransactions(prev => [newT, ...prev])
    setSaved(true)
    setTimeout(() => { setCreateModal(false); setSaved(false); setForm({ type: 'income', description: '', category: categories[0], amount: '', status: 'completed' }) }, 800)
  }

  const summaryCards = isEmpty
    ? [
        { label: 'Receita Total', value: 'R$ 0', change: '0%', up: true, icon: DollarSign, color: 'from-green-500/20 to-green-500/5 border-green-500/20', iconColor: 'text-green-400' },
        { label: 'Despesas', value: 'R$ 0', change: '0%', up: true, icon: ArrowDownRight, color: 'from-red-500/20 to-red-500/5 border-red-500/20', iconColor: 'text-red-400' },
        { label: 'Lucro Líquido', value: 'R$ 0', change: '0%', up: true, icon: TrendingUp, color: 'from-blue-500/20 to-blue-500/5 border-blue-500/20', iconColor: 'text-blue-400' },
        { label: 'MRR', value: 'R$ 0', change: '0%', up: true, icon: BarChart3, color: 'from-purple-500/20 to-purple-500/5 border-purple-500/20', iconColor: 'text-purple-400' },
      ]
    : [
        { label: 'Receita Total', value: `R$ ${mockFinancialSummary.totalRevenue.toLocaleString('pt-BR')}`, change: '+12,5%', up: true, icon: DollarSign, color: 'from-green-500/20 to-green-500/5 border-green-500/20', iconColor: 'text-green-400' },
        { label: 'Despesas', value: `R$ ${mockFinancialSummary.totalExpenses.toLocaleString('pt-BR')}`, change: '-3,2%', up: true, icon: ArrowDownRight, color: 'from-red-500/20 to-red-500/5 border-red-500/20', iconColor: 'text-red-400' },
        { label: 'Lucro Líquido', value: `R$ ${mockFinancialSummary.netProfit.toLocaleString('pt-BR')}`, change: '+18,1%', up: true, icon: TrendingUp, color: 'from-blue-500/20 to-blue-500/5 border-blue-500/20', iconColor: 'text-blue-400' },
        { label: 'MRR', value: `R$ ${mockFinancialSummary.mrr.toLocaleString('pt-BR')}`, change: '+9,1%', up: true, icon: BarChart3, color: 'from-purple-500/20 to-purple-500/5 border-purple-500/20', iconColor: 'text-purple-400' },
      ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description="Controle de receitas, despesas e métricas financeiras"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Financeiro' }]}
        actions={
          <button onClick={() => setCreateModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Registrar Transação
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(m => {
          const Icon = m.icon
          return (
            <div key={m.label} className={cn('rounded-2xl border bg-gradient-to-br p-5', m.color)}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-400">{m.label}</p>
                <div className={cn('p-2 rounded-xl bg-white/5', m.iconColor)}><Icon className="w-4 h-4" /></div>
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

      <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
        {[{ key: 'all', label: 'Todos' }, { key: 'income', label: 'Receitas' }, { key: 'expense', label: 'Despesas' }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all', activeTab === t.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5')}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/3 backdrop-blur-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'].map((h, i) => (
                <th key={h} className={cn('px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wide', i === 4 ? 'text-right' : 'text-left')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                <td className="px-5 py-3.5 text-sm text-slate-400 tabular-nums whitespace-nowrap">
                  {new Date(t.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-sm text-white">{t.description}</p>
                  {t.status === 'pending' && <span className="text-[10px] text-yellow-400">● Pendente</span>}
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn('px-2 py-0.5 rounded-md text-[11px] font-medium border', (t.category ? categoryColor[t.category] : undefined) ?? 'bg-white/5 text-slate-400 border-white/10')}>
                    {(t.category ? categoryLabel[t.category] : undefined) ?? t.category}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className={cn('flex items-center gap-1 text-xs font-medium', t.type === 'income' ? 'text-green-400' : 'text-red-400')}>
                    {t.type === 'income' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {t.type === 'income' ? 'Receita' : 'Despesa'}
                  </div>
                </td>
                <td className={cn('px-5 py-3.5 text-right text-sm font-semibold tabular-nums', t.type === 'income' ? 'text-green-400' : 'text-red-400')}>
                  {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Registrar Transação">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Tipo</label>
            <div className="flex gap-2">
              {[{ key: 'income', label: '↑ Receita' }, { key: 'expense', label: '↓ Despesa' }].map(opt => (
                <button key={opt.key} type="button" onClick={() => setForm(p => ({ ...p, type: opt.key }))}
                  className={cn('flex-1 py-2 rounded-xl text-sm font-medium border transition-colors', form.type === opt.key ? opt.key === 'income' ? 'bg-green-600/20 border-green-500/40 text-green-400' : 'bg-red-600/20 border-red-500/40 text-red-400' : 'border-white/10 text-slate-400 hover:text-white')}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Descrição</label>
            <input placeholder="Ex: Assinatura plano Professional" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Categoria</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors">
                {categories.map(c => <option key={c} value={c} className="bg-[#0d1425]">{categoryLabel[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Valor (R$)</label>
              <input type="number" placeholder="0,00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Status</label>
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors">
              <option value="completed" className="bg-[#0d1425]">Concluído</option>
              <option value="pending" className="bg-[#0d1425]">Pendente</option>
            </select>
          </div>
          <button onClick={handleCreate} className={cn('w-full h-10 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2', saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white')}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Registrado!</> : <><Plus className="w-4 h-4" /> Registrar</>}
          </button>
        </div>
      </Modal>
    </div>
  )
}
