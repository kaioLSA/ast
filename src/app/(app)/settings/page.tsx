'use client'

import { useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import { Button } from '@/components/ui/button'
import { User, Bell, Plug, Shield, CreditCard, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const TABS = [
  { key: 'profile', label: 'Perfil', icon: User },
  { key: 'notifications', label: 'Notificações', icon: Bell },
  { key: 'integrations', label: 'Integrações', icon: Plug },
  { key: 'security', label: 'Segurança', icon: Shield },
  { key: 'plan', label: 'Plano', icon: CreditCard },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none',
        checked ? 'bg-blue-600' : 'bg-white/10',
      )}
    >
      <span
        className={cn(
          'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}

function ProfileTab() {
  const [form, setForm] = useState({
    name: 'Admin Startsette',
    email: 'admin@startsette.com',
    role: 'Administrador',
    company: 'Startsette',
    phone: '+55 11 99999-0000',
    bio: 'Administrador do sistema CRM Startsette.',
  })

  return (
    <div className="space-y-5 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        {(['name', 'role', 'company', 'phone'] as const).map(field => (
          <div key={field}>
            <label className="text-xs text-slate-400 mb-1 block capitalize">{field === 'name' ? 'Nome' : field === 'role' ? 'Cargo' : field === 'company' ? 'Empresa' : 'Telefone'}</label>
            <input
              value={form[field]}
              onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        ))}
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Email</label>
        <input
          value={form.email}
          readOnly
          className="w-full px-4 py-2.5 rounded-xl bg-white/3 border border-white/5 text-sm text-slate-500 cursor-not-allowed"
        />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Bio</label>
        <textarea
          value={form.bio}
          onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 resize-none"
        />
      </div>
      <Button variant="glow" size="md">Salvar Alterações</Button>
    </div>
  )
}

function NotificationsTab() {
  const [settings, setSettings] = useState({
    newLeads: true,
    followUps: true,
    campaigns: false,
    weeklyReports: true,
    aiAlerts: true,
    whatsapp: true,
  })

  const items = [
    { key: 'newLeads', label: 'Novos leads', desc: 'Notificar quando um novo lead for captado' },
    { key: 'followUps', label: 'Follow-ups', desc: 'Lembrete de follow-ups pendentes' },
    { key: 'campaigns', label: 'Campanhas', desc: 'Alertas de performance de campanhas' },
    { key: 'weeklyReports', label: 'Relatórios semanais', desc: 'Envio automático toda segunda-feira' },
    { key: 'aiAlerts', label: 'Alertas IA', desc: 'Insights e recomendações da IA' },
    { key: 'whatsapp', label: 'WhatsApp mensagens', desc: 'Notificações de novas mensagens' },
  ] as const

  return (
    <div className="space-y-3 max-w-lg">
      {items.map(item => (
        <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/3">
          <div>
            <p className="text-sm font-medium text-white">{item.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
          </div>
          <Toggle
            checked={settings[item.key]}
            onChange={() => setSettings(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
          />
        </div>
      ))}
    </div>
  )
}

function IntegrationsTab() {
  const [connected] = useState(['meta', 'google', 'whatsapp', 'stripe', 'openai'])

  const integrations = [
    { key: 'meta', name: 'Meta Ads', desc: 'Facebook & Instagram Ads', icon: '📘' },
    { key: 'google', name: 'Google Ads', desc: 'Search & Display', icon: '🔵' },
    { key: 'whatsapp', name: 'WhatsApp Business', desc: 'API oficial Meta', icon: '💬' },
    { key: 'stripe', name: 'Stripe', desc: 'Pagamentos e cobranças', icon: '💳' },
    { key: 'openai', name: 'OpenAI', desc: 'GPT-4o para IA', icon: '🤖' },
    { key: 'gcalendar', name: 'Google Calendar', desc: 'Sincronização de agenda', icon: '📅' },
    { key: 'slack', name: 'Slack', desc: 'Notificações em canais', icon: '💼' },
    { key: 'zapier', name: 'Zapier', desc: 'Automações externas', icon: '⚡' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
      {integrations.map(int => {
        const isConnected = connected.includes(int.key)
        return (
          <div key={int.key} className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/3">
            <span className="text-2xl shrink-0">{int.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{int.name}</p>
              <p className="text-xs text-slate-500">{int.desc}</p>
            </div>
            {isConnected ? (
              <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium shrink-0">
                <Check className="w-3.5 h-3.5" />
                Conectado
              </div>
            ) : (
              <button className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-xs text-blue-400 hover:bg-blue-600/30 transition-colors font-medium">
                Conectar
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SecurityTab() {
  const [twoFA, setTwoFA] = useState(false)
  const sessions = [
    { device: 'Chrome — Windows 11', location: 'São Paulo, BR', active: true, time: 'Agora' },
    { device: 'Safari — iPhone 15', location: 'São Paulo, BR', active: false, time: '2h atrás' },
  ]

  return (
    <div className="space-y-6 max-w-lg">
      <div className="rounded-xl border border-white/10 bg-white/3 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Alterar Senha</h3>
        <div className="space-y-3">
          {['Senha atual', 'Nova senha', 'Confirmar nova senha'].map(label => (
            <div key={label}>
              <label className="text-xs text-slate-400 mb-1 block">{label}</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          ))}
          <Button variant="outline" size="sm" className="mt-2">Atualizar Senha</Button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/3 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Autenticação em 2 fatores</p>
            <p className="text-xs text-slate-400 mt-0.5">Adiciona uma camada extra de segurança</p>
          </div>
          <Toggle checked={twoFA} onChange={() => setTwoFA(v => !v)} />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/3 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Sessões Ativas</h3>
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <p className="text-xs font-medium text-white">{s.device}</p>
                <p className="text-xs text-slate-500">{s.location} · {s.time}</p>
              </div>
              <div className="flex items-center gap-2">
                {s.active ? (
                  <span className="text-xs text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Ativa</span>
                ) : (
                  <button className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                    <X className="w-3 h-3" /> Encerrar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PlanTab() {
  const features = [
    'Leads ilimitados por ciclo', 'IA com GPT-4o', 'WhatsApp Business API',
    'Automações avançadas', 'Analytics completo', 'Relatórios em PDF/XLSX',
    'Integrações com Meta & Google', 'Suporte prioritário',
  ]
  const usage = [
    { label: 'Leads', current: 342, max: 1000, color: 'bg-blue-500' },
    { label: 'Campanhas', current: 8, max: 50, color: 'bg-purple-500' },
    { label: 'Usuários', current: 8, max: 20, color: 'bg-cyan-500' },
  ]

  return (
    <div className="space-y-6 max-w-lg">
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-blue-400 font-medium uppercase tracking-wide">Plano atual</p>
            <p className="text-2xl font-bold text-white mt-0.5">Professional</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 text-xs font-medium border border-blue-500/30">
            Ativo
          </span>
        </div>
        <p className="text-xs text-slate-400">Renovação em 15/06/2026 · R$ 497/mês</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/3 p-5">
        <p className="text-sm font-semibold text-white mb-3">Recursos incluídos</p>
        <div className="grid grid-cols-2 gap-2">
          {features.map(f => (
            <div key={f} className="flex items-center gap-2 text-xs text-slate-400">
              <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
              {f}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/3 p-5">
        <p className="text-sm font-semibold text-white mb-4">Uso atual</p>
        <div className="space-y-4">
          {usage.map(u => (
            <div key={u.label}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400">{u.label}</span>
                <span className="text-slate-300 font-medium">{u.current} / {u.max}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10">
                <div
                  className={cn('h-full rounded-full', u.color)}
                  style={{ width: `${(u.current / u.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button variant="glow" size="lg" className="w-full">Fazer Upgrade para Enterprise</Button>
    </div>
  )
}

export default function SettingsPage() {
  usePageTitle('Configurações')
  const [activeTab, setActiveTab] = useState('profile')

  const content: Record<string, React.ReactNode> = {
    profile: <ProfileTab />,
    notifications: <NotificationsTab />,
    integrations: <IntegrationsTab />,
    security: <SecurityTab />,
    plan: <PlanTab />,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie suas preferências e integrações"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Configurações' }]}
      />

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 shrink-0 space-y-1">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  activeTab === t.key
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5',
                )}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 rounded-2xl border border-white/10 bg-white/3 p-6 backdrop-blur-sm">
          {content[activeTab]}
        </div>
      </div>
    </div>
  )
}
