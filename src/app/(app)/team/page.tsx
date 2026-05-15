'use client'

import { useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import { Plus, Mail, DollarSign, Target, X, CheckCircle2, Phone, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const members = [
  { id: '1', name: 'Admin Startsette', role: 'Administrador', department: 'admin', email: 'admin@startsette.com', phone: '+55 11 99100-0001', metric: '47 negócios fechados', revenue: 'R$ 248.500', avatar: 'AS', gradient: 'from-blue-500 to-cyan-500', joinedAt: 'Jan 2024', goal: 'R$ 300.000', goalPct: 82, bio: 'Fundador e administrador da Startsette. Responsável pela estratégia geral de vendas e crescimento da empresa.' },
  { id: '2', name: 'Ana Lima', role: 'Vendedora Senior', department: 'sales', email: 'ana@startsette.com', phone: '+55 11 99100-0002', metric: '23 negócios fechados', revenue: 'R$ 124.300', avatar: 'AL', gradient: 'from-purple-500 to-pink-500', joinedAt: 'Mar 2024', goal: 'R$ 150.000', goalPct: 83, bio: 'Vendedora sênior com foco em contas enterprise. Especialista em negociações B2B complexas e gestão de relacionamento.' },
  { id: '3', name: 'Bruno Reis', role: 'Vendedor', department: 'sales', email: 'bruno@startsette.com', phone: '+55 11 99100-0003', metric: '15 negócios fechados', revenue: 'R$ 87.200', avatar: 'BR', gradient: 'from-green-500 to-teal-500', joinedAt: 'Jun 2024', goal: 'R$ 100.000', goalPct: 87, bio: 'Vendedor focado no segmento de varejo e PMEs. Excelente histórico em prospecção via LinkedIn e WhatsApp.' },
  { id: '4', name: 'Carla Souza', role: 'SDR', department: 'sales', email: 'carla@startsette.com', phone: '+55 11 99100-0004', metric: '89 leads qualificados', revenue: null, avatar: 'CS', gradient: 'from-yellow-500 to-orange-500', joinedAt: 'Ago 2024', goal: '100 leads/mês', goalPct: 89, bio: 'SDR especializada em qualificação de leads inbound. Responsável pelo BANT e handoff para closers.' },
  { id: '5', name: 'Diego Santos', role: 'Marketing', department: 'marketing', email: 'diego@startsette.com', phone: '+55 11 99100-0005', metric: '6 campanhas ativas', revenue: null, avatar: 'DS', gradient: 'from-pink-500 to-rose-500', joinedAt: 'Fev 2024', goal: '500 leads/mês', goalPct: 68, bio: 'Gestor de tráfego pago e conteúdo. Responsável pelas campanhas Meta, Google e TikTok Ads da empresa.' },
  { id: '6', name: 'Fernanda Costa', role: 'Customer Success', department: 'cs', email: 'fernanda@startsette.com', phone: '+55 11 99100-0006', metric: '98% satisfação', revenue: null, avatar: 'FC', gradient: 'from-cyan-500 to-blue-500', joinedAt: 'Abr 2024', goal: '95% NPS', goalPct: 98, bio: 'CS Manager focada em retenção e expansão de contas. Responsável pelo onboarding e health score dos clientes.' },
  { id: '7', name: 'Gabriel Moura', role: 'Vendedor Junior', department: 'sales', email: 'gabriel@startsette.com', phone: '+55 11 99100-0007', metric: '8 negócios fechados', revenue: 'R$ 32.100', avatar: 'GM', gradient: 'from-indigo-500 to-purple-500', joinedAt: 'Out 2024', goal: 'R$ 50.000', goalPct: 64, bio: 'Vendedor júnior em crescimento acelerado. Foco em pequenas e médias empresas do setor de tecnologia.' },
  { id: '8', name: 'Helena Rocha', role: 'SDR', department: 'sales', email: 'helena@startsette.com', phone: '+55 11 99100-0008', metric: '67 leads qualificados', revenue: null, avatar: 'HR', gradient: 'from-teal-500 to-green-500', joinedAt: 'Nov 2024', goal: '100 leads/mês', goalPct: 67, bio: 'SDR com foco em outbound e cold calling. Especialista em mercado agro e industrial.' },
]

const deptColors: Record<string, string> = {
  admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  sales: 'bg-green-500/10 text-green-400 border-green-500/20',
  marketing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  cs: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
}

const roles = ['Administrador', 'Vendedor Senior', 'Vendedor', 'SDR', 'Marketing', 'Customer Success', 'Vendedor Junior']
const departments = ['admin', 'sales', 'marketing', 'cs']
const deptLabel: Record<string, string> = { admin: 'Admin', sales: 'Vendas', marketing: 'Marketing', cs: 'CS' }

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
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export default function TeamPage() {
  usePageTitle('Equipe')
  const [activeTab, setActiveTab] = useState('all')
  const [profileMember, setProfileMember] = useState<typeof members[0] | null>(null)
  const [inviteModal, setInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: roles[2], department: departments[1] })
  const [invited, setInvited] = useState(false)

  const filtered = members.filter(m => activeTab === 'all' || m.department === activeTab)

  const handleInvite = () => {
    if (!inviteForm.email) return
    setInvited(true)
    setTimeout(() => { setInviteModal(false); setInvited(false); setInviteForm({ name: '', email: '', role: roles[2], department: departments[1] }) }, 800)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipe"
        description="Gerencie sua equipe de vendas e marketing"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Equipe' }]}
        actions={
          <button onClick={() => setInviteModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Convidar Membro
          </button>
        }
      />

      <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
        {[{ key: 'all', label: 'Todos' }, { key: 'sales', label: 'Vendas' }, { key: 'marketing', label: 'Marketing' }, { key: 'cs', label: 'CS' }, { key: 'admin', label: 'Admin' }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all', activeTab === t.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5')}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {filtered.map(m => (
          <div key={m.id} className="rounded-2xl border border-white/10 bg-white/3 p-5 backdrop-blur-sm hover:border-white/20 transition-all duration-200">
            <div className="flex flex-col items-center text-center mb-4">
              <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-lg font-bold text-white mb-3', m.gradient)}>{m.avatar}</div>
              <p className="text-sm font-semibold text-white">{m.name}</p>
              <span className={cn('mt-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border', deptColors[m.department])}>{m.role}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Mail className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                <span className="truncate">{m.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Target className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                <span>{m.metric}</span>
              </div>
              {m.revenue && (
                <div className="flex items-center gap-2 text-xs text-green-400 font-medium">
                  <DollarSign className="w-3.5 h-3.5 shrink-0" />
                  <span>{m.revenue}</span>
                </div>
              )}
            </div>

            <div className="mt-3 mb-1">
              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                <span>Meta</span>
                <span>{m.goalPct}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/10">
                <div className={cn('h-full rounded-full', m.goalPct >= 80 ? 'bg-green-500' : m.goalPct >= 60 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${m.goalPct}%` }} />
              </div>
            </div>

            <button onClick={() => setProfileMember(m)} className="mt-3 w-full py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              Ver perfil
            </button>
          </div>
        ))}
      </div>

      {/* Profile modal */}
      <Modal open={!!profileMember} onClose={() => setProfileMember(null)} title="Perfil do Membro">
        {profileMember && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className={cn('w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-xl font-bold text-white shrink-0', profileMember.gradient)}>{profileMember.avatar}</div>
              <div>
                <p className="text-base font-semibold text-white">{profileMember.name}</p>
                <span className={cn('inline-block mt-1 px-2 py-0.5 rounded-md text-[11px] font-medium border', deptColors[profileMember.department])}>{profileMember.role}</span>
                <p className="text-xs text-slate-500 mt-1">Desde {profileMember.joinedAt}</p>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">{profileMember.bio}</p>

            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-3 py-2.5 border-b border-white/5">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-sm text-slate-300">{profileMember.email}</span>
              </div>
              <div className="flex items-center gap-3 py-2.5 border-b border-white/5">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-sm text-slate-300">{profileMember.phone}</span>
              </div>
              <div className="flex items-center gap-3 py-2.5 border-b border-white/5">
                <Target className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-sm text-slate-300">{profileMember.metric}</span>
              </div>
              {profileMember.revenue && (
                <div className="flex items-center gap-3 py-2.5 border-b border-white/5">
                  <DollarSign className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-sm text-green-400 font-medium">{profileMember.revenue}</span>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/3 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Meta do mês</span>
                </div>
                <span className="text-sm font-bold text-white">{profileMember.goalPct}%</span>
              </div>
              <p className="text-xs text-slate-500 mb-2">{profileMember.goal}</p>
              <div className="h-2 rounded-full bg-white/10">
                <div className={cn('h-full rounded-full transition-all', profileMember.goalPct >= 80 ? 'bg-green-500' : profileMember.goalPct >= 60 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${profileMember.goalPct}%` }} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Invite modal */}
      <Modal open={inviteModal} onClose={() => setInviteModal(false)} title="Convidar Membro">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Nome completo</label>
            <input placeholder="Ex: João Silva" value={inviteForm.name} onChange={e => setInviteForm(p => ({ ...p, name: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Email</label>
            <input type="email" placeholder="joao@empresa.com" value={inviteForm.email} onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Cargo</label>
            <select value={inviteForm.role} onChange={e => setInviteForm(p => ({ ...p, role: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors">
              {roles.map(r => <option key={r} value={r} className="bg-[#0d1425]">{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Departamento</label>
            <select value={inviteForm.department} onChange={e => setInviteForm(p => ({ ...p, department: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors">
              {departments.map(d => <option key={d} value={d} className="bg-[#0d1425]">{deptLabel[d]}</option>)}
            </select>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3">
            <p className="text-xs text-slate-400">Um email de convite será enviado para o endereço informado com as instruções de acesso.</p>
          </div>
          <button onClick={handleInvite} className={cn('w-full h-10 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2', invited ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white')}>
            {invited ? <><CheckCircle2 className="w-4 h-4" /> Convite enviado!</> : 'Enviar Convite'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
