'use client'

import { useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import { Plus, TrendingUp, Eye, X, CheckCircle2 } from 'lucide-react'
import { mockCampaigns } from '@/services/mocks/campaigns.mock'
import { cn } from '@/lib/utils/cn'

type Campaign = {
  id: string
  name: string
  platform: string
  status: string
  budget: { spent: number; total: number }
  metrics: { impressions: number; ctr: number; conversions: number; roas: number; clicks?: number; reach?: number; cpc?: number }
}

const extraCampaigns: Campaign[] = [
  { id: '3', name: 'TikTok Ads — Geração Z', platform: 'tiktok', status: 'active', budget: { spent: 2100, total: 6000 }, metrics: { impressions: 520000, ctr: 6.2, conversions: 89, roas: 5.7, clicks: 32240, reach: 410000, cpc: 0.065 } },
  { id: '4', name: 'Email Mkt — Newsletter Maio', platform: 'email', status: 'active', budget: { spent: 320, total: 800 }, metrics: { impressions: 14200, ctr: 21.4, conversions: 204, roas: 14.2, clicks: 3038, reach: 14200, cpc: 0.105 } },
  { id: '5', name: 'Influencer — @marktechbr', platform: 'influencer', status: 'paused', budget: { spent: 4500, total: 4500 }, metrics: { impressions: 180000, ctr: 3.8, conversions: 67, roas: 4.1, clicks: 6840, reach: 154000, cpc: 0.658 } },
  { id: '6', name: 'YouTube Pre-roll — Demo', platform: 'youtube', status: 'ended', budget: { spent: 7800, total: 7800 }, metrics: { impressions: 320000, ctr: 1.9, conversions: 145, roas: 7.3, clicks: 6080, reach: 290000, cpc: 1.283 } },
]

const platformIcon: Record<string, string> = { meta: '📘', google: '🔵', tiktok: '🎵', email: '📧', influencer: '⭐', youtube: '▶️' }
const platformColor: Record<string, string> = {
  meta: 'from-blue-600/20 to-blue-500/5 border-blue-500/20',
  google: 'from-red-500/20 to-orange-500/5 border-red-500/20',
  tiktok: 'from-pink-500/20 to-purple-500/5 border-pink-500/20',
  email: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20',
  influencer: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20',
  youtube: 'from-red-600/20 to-red-500/5 border-red-600/20',
}
const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'Ativa', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  paused: { label: 'Pausada', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  ended: { label: 'Encerrada', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
}

const allCampaigns: Campaign[] = [
  ...mockCampaigns.map(c => ({
    id: c.id, name: c.name, platform: c.platform, status: c.status,
    budget: { spent: c.budget.spent, total: c.budget.total },
    metrics: { impressions: c.metrics.impressions, ctr: c.metrics.ctr, conversions: c.metrics.conversions, roas: c.metrics.roas, clicks: c.metrics.clicks, reach: c.metrics.reach, cpc: c.metrics.cpc },
  })),
  ...extraCampaigns,
]

const platforms = ['Meta Ads', 'Google Ads', 'TikTok Ads', 'Email Marketing', 'YouTube Ads', 'Influencer', 'LinkedIn Ads']
const objectives = ['Leads', 'Conversões', 'Tráfego', 'Alcance', 'Engajamento', 'Reconhecimento de marca']

function Modal({ open, onClose, title, wide, children }: { open: boolean; onClose: () => void; title: string; wide?: boolean; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative z-10 w-full rounded-2xl border border-white/10 bg-[#0d1425] shadow-2xl', wide ? 'max-w-2xl' : 'max-w-lg')}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export default function CampaignsPage() {
  usePageTitle('Campanhas')
  const [activeTab, setActiveTab] = useState('all')
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null)
  const [createModal, setCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', platform: platforms[0], objective: objectives[0], dailyBudget: '', totalBudget: '' })
  const [created, setCreated] = useState(false)

  const filtered = allCampaigns.filter(c => activeTab === 'all' || c.status === activeTab)

  const handleCreate = () => {
    setCreated(true)
    setTimeout(() => { setCreateModal(false); setCreated(false); setCreateForm({ name: '', platform: platforms[0], objective: objectives[0], dailyBudget: '', totalBudget: '' }) }, 800)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campanhas"
        description="Gerencie suas campanhas de marketing"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Campanhas' }]}
        actions={
          <button onClick={() => setCreateModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nova Campanha
          </button>
        }
      />

      <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
        {[{ key: 'all', label: 'Todas' }, { key: 'active', label: 'Ativas' }, { key: 'paused', label: 'Pausadas' }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all', activeTab === t.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5')}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(c => {
          const spentPct = Math.round((c.budget.spent / (c.budget.total ?? 1)) * 100)
          return (
            <div key={c.id} className={cn('rounded-2xl border bg-gradient-to-br p-5 hover:scale-[1.01] transition-transform duration-200', platformColor[c.platform] ?? 'from-white/5 to-white/3 border-white/10')}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{platformIcon[c.platform] ?? '📣'}</span>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">{c.name}</p>
                    <p className="text-xs text-slate-500 capitalize mt-0.5">{c.platform}</p>
                  </div>
                </div>
                <span className={cn('px-2 py-0.5 rounded-md text-[11px] font-medium border', statusConfig[c.status]?.color)}>{statusConfig[c.status]?.label}</span>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>Orçamento</span>
                  <span className="text-white font-medium">R$ {c.budget.spent.toLocaleString('pt-BR')} / R$ {(c.budget.total ?? 0).toLocaleString('pt-BR')}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10">
                  <div className={cn('h-full rounded-full transition-all', spentPct >= 90 ? 'bg-red-500' : 'bg-blue-500')} style={{ width: `${Math.min(spentPct, 100)}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-1">{spentPct}% utilizado</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-slate-500 mb-1">Impressões</p><p className="text-sm font-semibold text-white">{c.metrics.impressions >= 1000 ? `${(c.metrics.impressions / 1000).toFixed(0)}K` : c.metrics.impressions}</p></div>
                <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-slate-500 mb-1">CTR</p><p className="text-sm font-semibold text-white">{c.metrics.ctr}%</p></div>
                <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-slate-500 mb-1">Conversões</p><p className="text-sm font-semibold text-white">{c.metrics.conversions}</p></div>
                <div className="rounded-xl bg-white/5 p-3"><p className="text-xs text-slate-500 mb-1">ROAS</p><p className="text-sm font-semibold text-green-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{c.metrics.roas}x</p></div>
              </div>

              <button onClick={() => setDetailCampaign(c)} className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 transition-colors">
                <Eye className="w-3.5 h-3.5" /> Ver detalhes
              </button>
            </div>
          )
        })}
      </div>

      {/* Details modal */}
      <Modal wide open={!!detailCampaign} onClose={() => setDetailCampaign(null)} title={detailCampaign?.name ?? ''}>
        {detailCampaign && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{platformIcon[detailCampaign.platform] ?? '📣'}</span>
              <div>
                <p className="text-white font-semibold">{detailCampaign.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 capitalize">{detailCampaign.platform}</span>
                  <span className={cn('px-2 py-0.5 rounded-md text-[11px] font-medium border', statusConfig[detailCampaign.status]?.color)}>{statusConfig[detailCampaign.status]?.label}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/3 p-4">
              <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wide">Orçamento</p>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Gasto</span>
                <span className="text-white font-semibold">R$ {detailCampaign.budget.spent.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-slate-400">Total</span>
                <span className="text-white font-semibold">R$ {detailCampaign.budget.total.toLocaleString('pt-BR')}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(Math.round(detailCampaign.budget.spent / detailCampaign.budget.total * 100), 100)}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Impressões', value: detailCampaign.metrics.impressions.toLocaleString('pt-BR') },
                { label: 'Cliques', value: (detailCampaign.metrics.clicks ?? 0).toLocaleString('pt-BR') },
                { label: 'CTR', value: `${detailCampaign.metrics.ctr}%` },
                { label: 'CPC', value: detailCampaign.metrics.cpc ? `R$ ${detailCampaign.metrics.cpc.toFixed(2)}` : '—' },
                { label: 'Conversões', value: String(detailCampaign.metrics.conversions) },
                { label: 'ROAS', value: `${detailCampaign.metrics.roas}x` },
                { label: 'Alcance', value: detailCampaign.metrics.reach ? (detailCampaign.metrics.reach / 1000).toFixed(0) + 'K' : '—' },
              ].map(m => (
                <div key={m.label} className="rounded-xl bg-white/5 p-3">
                  <p className="text-xs text-slate-500 mb-1">{m.label}</p>
                  <p className="text-sm font-semibold text-white">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Create modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Nova Campanha">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Nome da campanha</label>
            <input placeholder="Ex: Black Friday 2026 — Meta" value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Plataforma</label>
            <select value={createForm.platform} onChange={e => setCreateForm(p => ({ ...p, platform: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors">
              {platforms.map(pl => <option key={pl} value={pl} className="bg-[#0d1425]">{pl}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Objetivo</label>
            <select value={createForm.objective} onChange={e => setCreateForm(p => ({ ...p, objective: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors">
              {objectives.map(o => <option key={o} value={o} className="bg-[#0d1425]">{o}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Orçamento diário (R$)</label>
              <input type="number" placeholder="500" value={createForm.dailyBudget} onChange={e => setCreateForm(p => ({ ...p, dailyBudget: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Orçamento total (R$)</label>
              <input type="number" placeholder="15000" value={createForm.totalBudget} onChange={e => setCreateForm(p => ({ ...p, totalBudget: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors" />
            </div>
          </div>
          <button onClick={handleCreate} className={cn('w-full h-10 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2', created ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white')}>
            {created ? <><CheckCircle2 className="w-4 h-4" /> Campanha criada!</> : <><Plus className="w-4 h-4" /> Criar Campanha</>}
          </button>
        </div>
      </Modal>
    </div>
  )
}
