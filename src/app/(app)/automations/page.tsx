'use client'

import { useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import { Plus, Zap, Clock, Users, Play, X, ScrollText, Pencil, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type Automation = {
  id: string
  name: string
  description: string
  trigger: string
  triggerColor: string
  steps: number
  lastRun: string
  leadsProcessed: number
  active: boolean
}

const initial: Automation[] = [
  { id: '1', name: 'Boas-vindas WhatsApp', description: 'Envia mensagem de boas-vindas via WhatsApp para cada novo lead captado', trigger: 'Novo Lead', triggerColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20', steps: 3, lastRun: '2 min atrás', leadsProcessed: 847, active: true },
  { id: '2', name: 'Follow-up 3 dias', description: 'Dispara email de follow-up para leads sem contato há 3 dias', trigger: 'Sem contato 3 dias', triggerColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', steps: 2, lastRun: '1h atrás', leadsProcessed: 234, active: true },
  { id: '3', name: 'Proposta automática', description: 'Gera e envia proposta personalizada quando lead é qualificado pela IA', trigger: 'Lead qualificado', triggerColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20', steps: 5, lastRun: '4h atrás', leadsProcessed: 156, active: true },
  { id: '4', name: 'Alerta lead quente', description: 'Notifica o vendedor responsável quando IA Score ultrapassa 90 pontos', trigger: 'AI Score > 90', triggerColor: 'bg-red-500/10 text-red-400 border-red-500/20', steps: 2, lastRun: '30 min atrás', leadsProcessed: 89, active: true },
  { id: '5', name: 'Reengajamento', description: 'Inicia nova sequência de mensagens para leads sem resposta há 7 dias', trigger: 'Sem resposta 7 dias', triggerColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20', steps: 4, lastRun: '12h atrás', leadsProcessed: 312, active: false },
  { id: '6', name: 'Relatório semanal', description: 'Compila e envia relatório completo de performance para toda a equipe', trigger: 'Toda segunda-feira', triggerColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', steps: 3, lastRun: '3 dias atrás', leadsProcessed: 52, active: true },
]

const fakeLogs = [
  { time: '14:32:01', event: 'Automação executada', detail: 'Lead Carlos Mendes processado com sucesso', status: 'ok' },
  { time: '14:28:47', event: 'WhatsApp enviado', detail: 'Mensagem entregue para +55 11 99999-0001', status: 'ok' },
  { time: '13:55:12', event: 'Automação executada', detail: 'Lead Mariana Costa processada com sucesso', status: 'ok' },
  { time: '13:50:03', event: 'WhatsApp enviado', detail: 'Mensagem entregue para +55 21 98888-0002', status: 'ok' },
  { time: '13:10:44', event: 'Erro de entrega', detail: 'Número inválido: +55 00 00000-0000', status: 'error' },
  { time: '12:42:19', event: 'Automação executada', detail: 'Lead Roberto Alves processado com sucesso', status: 'ok' },
  { time: '11:30:55', event: 'Limite diário atingido', detail: 'Pausado temporariamente, retoma às 00:00', status: 'warn' },
  { time: '10:15:30', event: 'Automação executada', detail: 'Lead Juliana Santos processada com sucesso', status: 'ok' },
]

const triggers = ['Novo Lead', 'Sem contato 3 dias', 'Lead qualificado', 'AI Score > 90', 'Sem resposta 7 dias', 'Toda segunda-feira', 'Lead fechado', 'Campanha iniciada']

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1425] shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function Toggle({ active, onChange }: { active: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onChange() }}
      className={cn('relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none', active ? 'bg-blue-600' : 'bg-white/15')}
    >
      <span className={cn('absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200', active ? 'left-6' : 'left-1')} />
    </button>
  )
}

export default function AutomationsPage() {
  usePageTitle('Automações')
  const [automations, setAutomations] = useState(initial)
  const [logsModal, setLogsModal] = useState<Automation | null>(null)
  const [editModal, setEditModal] = useState<Automation | null>(null)
  const [createModal, setCreateModal] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', description: '', trigger: '', steps: 1 })
  const [createForm, setCreateForm] = useState({ name: '', description: '', trigger: triggers[0], steps: 1 })
  const [saved, setSaved] = useState(false)

  const toggle = (id: string) => setAutomations(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a))

  const openEdit = (a: Automation) => {
    setEditForm({ name: a.name, description: a.description, trigger: a.trigger, steps: a.steps })
    setEditModal(a)
    setSaved(false)
  }

  const saveEdit = () => {
    if (!editModal) return
    setAutomations(prev => prev.map(a => a.id === editModal.id ? { ...a, ...editForm } : a))
    setSaved(true)
    setTimeout(() => { setEditModal(null); setSaved(false) }, 800)
  }

  const createNew = () => {
    const id = String(Date.now())
    setAutomations(prev => [...prev, {
      id,
      name: createForm.name || 'Nova Automação',
      description: createForm.description || 'Descrição da automação',
      trigger: createForm.trigger,
      triggerColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      steps: createForm.steps,
      lastRun: 'Nunca executado',
      leadsProcessed: 0,
      active: false,
    }])
    setCreateModal(false)
    setCreateForm({ name: '', description: '', trigger: triggers[0], steps: 1 })
  }

  const activeCount = automations.filter(a => a.active).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automações"
        description="Configure fluxos automáticos de nutrição e engajamento"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Automações' }]}
        actions={
          <button onClick={() => setCreateModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nova Automação
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Automações ativas', value: activeCount },
          { label: 'Leads processados', value: automations.reduce((s, a) => s + a.leadsProcessed, 0).toLocaleString('pt-BR') },
          { label: 'Total de etapas', value: automations.reduce((s, a) => s + a.steps, 0) },
        ].map(c => (
          <div key={c.label} className="rounded-2xl border border-white/10 bg-white/3 p-4 backdrop-blur-sm">
            <p className="text-xs text-slate-500 mb-1">{c.label}</p>
            <p className="text-2xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {automations.map(a => (
          <div key={a.id} className={cn('rounded-2xl border p-5 backdrop-blur-sm transition-all duration-200', a.active ? 'border-white/10 bg-white/3 hover:border-white/20' : 'border-white/5 bg-white/1 opacity-70')}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', a.active ? 'bg-blue-500/15' : 'bg-white/5')}>
                  <Zap className={cn('w-4 h-4', a.active ? 'text-blue-400' : 'text-slate-500')} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{a.name}</p>
                  <span className={cn('inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-medium border', a.triggerColor)}>{a.trigger}</span>
                </div>
              </div>
              <Toggle active={a.active} onChange={() => toggle(a.id)} />
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">{a.description}</p>

            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Play className="w-3 h-3" />{a.steps} etapas</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{a.lastRun}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{a.leadsProcessed.toLocaleString('pt-BR')} processados</span>
            </div>

            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
              <span className={cn('px-2 py-0.5 rounded-md text-[11px] font-medium border', a.active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20')}>
                {a.active ? '● Ativa' : '○ Inativa'}
              </span>
              <div className="flex gap-3">
                <button onClick={() => openEdit(a)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
                  <Pencil className="w-3 h-3" /> Editar
                </button>
                <button onClick={() => setLogsModal(a)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-colors">
                  <ScrollText className="w-3 h-3" /> Ver logs
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Logs modal */}
      <Modal open={!!logsModal} onClose={() => setLogsModal(null)} title={`Logs — ${logsModal?.name}`}>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {fakeLogs.map((log, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
              <span className="text-[11px] text-slate-500 font-mono shrink-0 mt-0.5">{log.time}</span>
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-medium', log.status === 'ok' ? 'text-green-400' : log.status === 'error' ? 'text-red-400' : 'text-yellow-400')}>{log.event}</p>
                <p className="text-xs text-slate-500 truncate">{log.detail}</p>
              </div>
              <span className={cn('w-2 h-2 rounded-full mt-1 shrink-0', log.status === 'ok' ? 'bg-green-400' : log.status === 'error' ? 'bg-red-400' : 'bg-yellow-400')} />
            </div>
          ))}
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Editar Automação">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Nome</label>
            <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Descrição</label>
            <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={3}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors resize-none" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Gatilho</label>
            <select value={editForm.trigger} onChange={e => setEditForm(p => ({ ...p, trigger: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors">
              {triggers.map(t => <option key={t} value={t} className="bg-[#0d1425]">{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Número de etapas</label>
            <input type="number" min={1} max={20} value={editForm.steps} onChange={e => setEditForm(p => ({ ...p, steps: Number(e.target.value) }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors" />
          </div>
          <button onClick={saveEdit} className={cn('w-full h-10 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2', saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white')}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Salvo!</> : 'Salvar alterações'}
          </button>
        </div>
      </Modal>

      {/* Create modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Nova Automação">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Nome da automação</label>
            <input placeholder="Ex: Follow-up pós-demo" value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Descrição</label>
            <textarea placeholder="Descreva o que esta automação faz..." value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} rows={3}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors resize-none" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Gatilho</label>
            <select value={createForm.trigger} onChange={e => setCreateForm(p => ({ ...p, trigger: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors">
              {triggers.map(t => <option key={t} value={t} className="bg-[#0d1425]">{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Número de etapas</label>
            <input type="number" min={1} max={20} value={createForm.steps} onChange={e => setCreateForm(p => ({ ...p, steps: Number(e.target.value) }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors" />
          </div>
          <button onClick={createNew} className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Criar Automação
          </button>
        </div>
      </Modal>
    </div>
  )
}
