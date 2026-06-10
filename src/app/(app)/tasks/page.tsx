'use client'

import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import {
  ListChecks, FileText, AlertTriangle, Plus, Check, Clock, Circle,
  Trash2, ChevronDown, ChevronUp, User, X, Loader2, RefreshCw, Bell, Video,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface Task {
  id: string
  group_name: string
  title: string
  description: string
  responsible: string
  due_date: string | null
  status: 'pending' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  source: string
  created_at: string
}

interface WeeklySummary {
  id: string
  group_name: string
  week_start: string
  week_end: string
  created_at: string
  source?: string
  ref_code?: string
  content: {
    resumo_geral: string
    topicos?: string[]
    action_items: { tarefa: string; responsavel: string; prazo: string }[]
    decisoes: string[]
    pendencias: string[]
    follow_up: string[]
    clima: string
  }
}

interface Alert {
  id: string
  group_name: string
  message: string
  level: 'warning' | 'critical'
  detected_date: string
  is_read: boolean
  created_at: string
}

type Tab = 'tasks' | 'reports' | 'alerts'

// ── Helpers ─────────────────────────────────────────────────────────────────────
function fmtDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso.length <= 10 ? iso + 'T12:00:00' : iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

const PRIORITY = {
  high:   { label: 'Alta',  cls: 'bg-rose-500/15 text-rose-300 border-rose-500/25' },
  medium: { label: 'Média', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  low:    { label: 'Baixa', cls: 'bg-slate-500/15 text-slate-300 border-slate-500/25' },
}

const STATUS_ORDER: Task['status'][] = ['pending', 'in_progress', 'done']

const inputCls = 'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors'

// ── Card de Tarefa ──────────────────────────────────────────────────────────────
function TaskRow({ task, onCycle, onDelete }: { task: Task; onCycle: (t: Task) => void; onDelete: (id: string) => void }) {
  const p = PRIORITY[task.priority] ?? PRIORITY.medium
  const done = task.status === 'done'

  return (
    <div className={cn(
      'group flex items-start gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3 hover:border-white/15 transition-all',
      done && 'opacity-60',
    )}>
      <button onClick={() => onCycle(task)} className="mt-0.5 shrink-0" title="Alterar status">
        {task.status === 'done'
          ? <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>
          : task.status === 'in_progress'
          ? <div className="w-5 h-5 rounded-full border-2 border-amber-400 flex items-center justify-center"><Clock className="w-2.5 h-2.5 text-amber-400" /></div>
          : <Circle className="w-5 h-5 text-slate-500 hover:text-slate-300" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium text-white', done && 'line-through')}>{task.title}</p>
        {task.description && <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={cn('text-[10px] px-2 py-0.5 rounded-md border font-medium', p.cls)}>{p.label}</span>
          {task.responsible && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400"><User className="w-3 h-3" />{task.responsible}</span>
          )}
          {task.group_name && <span className="text-[10px] text-slate-600">• {task.group_name}</span>}
          {task.source === 'weekly_summary' && <span className="text-[10px] text-blue-400/70">• via IA</span>}
          {task.source === 'meeting' && <span className="text-[10px] text-blue-400/70">• via Reunião</span>}
        </div>
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all shrink-0"
        title="Excluir"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ── Card de Relatório semanal ───────────────────────────────────────────────────
function Section({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null
  return (
    <div>
      <p className="text-xs font-semibold text-slate-300 mb-1.5">{title}</p>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-xs text-slate-400 flex gap-1.5"><span className="text-slate-600">•</span>{it}</li>
        ))}
      </ul>
    </div>
  )
}

function ReportCard({ s }: { s: WeeklySummary }) {
  const [open, setOpen] = useState(false)
  const c = s.content
  const isMeeting = s.source === 'meeting'
  return (
    <div className="bg-white/3 border border-white/8 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/3 transition-colors">
        <div className="min-w-0 flex items-center gap-3">
          <div className={cn('w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center shrink-0', isMeeting ? 'bg-blue-500/10' : 'bg-white/5')}>
            {isMeeting ? <Video className="w-4 h-4 text-blue-400" /> : <FileText className="w-4 h-4 text-slate-400" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{s.group_name || 'Grupo'}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isMeeting ? `Reunião • ${fmtDate(s.week_start)}` : `Semana de ${fmtDate(s.week_start)} a ${fmtDate(s.week_end)}`}
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/8 pt-4">
          <div>
            <p className="text-xs font-semibold text-slate-300 mb-1.5">📝 Visão Geral</p>
            <p className="text-xs text-slate-400 leading-relaxed">{c.resumo_geral}</p>
          </div>

          <Section title="📌 Tópicos" items={c.topicos || []} />

          {c.action_items?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-1.5">✅ Tarefas (Action Items)</p>
              <ul className="space-y-1.5">
                {c.action_items.map((a, i) => (
                  <li key={i} className="text-xs text-slate-400">
                    <span className="text-slate-600">•</span> {a.tarefa}
                    {(a.responsavel !== 'Não definido' || a.prazo !== 'Não definido') && (
                      <span className="text-slate-600">
                        {a.responsavel && a.responsavel !== 'Não definido' && `  👤 ${a.responsavel}`}
                        {a.prazo && a.prazo !== 'Não definido' && `  ⏰ ${a.prazo}`}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Section title="🎯 Decisões Tomadas" items={c.decisoes} />
          <Section title="❓ Pendências (sem resposta)" items={c.pendencias} />
          <Section title="🔄 Follow-up da Semana Anterior" items={c.follow_up} />

          {c.clima && (
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-1.5">🌡️ Clima do Grupo</p>
              <p className="text-xs text-slate-400">{c.clima}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Página ──────────────────────────────────────────────────────────────────────
export default function TasksPage() {
  usePageTitle('Task')

  const [tab, setTab] = useState<Tab>('tasks')
  const [tasks, setTasks] = useState<Task[]>([])
  const [summaries, setSummaries] = useState<WeeklySummary[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Modal nova task
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', responsible: '', priority: 'medium' })
  const [saving, setSaving] = useState(false)

  // Sliding pill (aba ativa)
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false })
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const movePill = useCallback(() => {
    const el = tabRefs.current[tab]
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth, ready: true })
  }, [tab])
  useLayoutEffect(() => { movePill() }, [movePill])

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true)
    try {
      const [t, s, a] = await Promise.all([
        fetch('/api/tasks').then(r => r.ok ? r.json() : []),
        fetch('/api/tasks/summaries').then(r => r.ok ? r.json() : []),
        fetch('/api/tasks/alerts').then(r => r.ok ? r.json() : []),
      ])
      setTasks(Array.isArray(t) ? t : [])
      setSummaries(Array.isArray(s) ? s : [])
      setAlerts(Array.isArray(a) ? a : [])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const cycleStatus = async (task: Task) => {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(task.status) + 1) % STATUS_ORDER.length]
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t))
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    }).catch(() => {})
  }

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' }).catch(() => {})
  }

  const createTask = async () => {
    if (!form.title.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const created = await res.json()
        if (created?.id) setTasks(prev => [created, ...prev])
        setShowModal(false)
        setForm({ title: '', description: '', responsible: '', priority: 'medium' })
      }
    } finally {
      setSaving(false)
    }
  }

  const markRead = async (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a))
    await fetch('/api/tasks/alerts', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {})
  }

  const pendingTasks = useMemo(() => tasks.filter(t => t.status !== 'done').length, [tasks])
  const unreadAlerts = useMemo(() => alerts.filter(a => !a.is_read).length, [alerts])

  // Re-medir a pílula quando os contadores das abas mudam
  useEffect(() => { requestAnimationFrame(movePill) }, [pendingTasks, summaries.length, unreadAlerts, movePill])

  const tabs: { key: Tab; label: string; icon: typeof ListChecks; count: number }[] = [
    { key: 'tasks',   label: 'Tarefas',    icon: ListChecks,    count: pendingTasks },
    { key: 'reports', label: 'Relatórios', icon: FileText,      count: summaries.length },
    { key: 'alerts',  label: 'Alertas',    icon: AlertTriangle, count: unreadAlerts },
  ]

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Task"
        description="Tarefas, relatórios semanais e alertas gerados pela IA dos grupos"
        actions={
          <button
            onClick={() => load(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300 hover:text-white hover:border-white/20 transition-all"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </button>
        }
      />

      <div className="flex-1 overflow-auto px-6 py-5">
        {/* Tabs */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="relative flex items-center gap-1 bg-white/5 border border-white/8 rounded-xl p-1">
            {/* Sliding pill */}
            {pill.ready && (
              <div
                className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm pointer-events-none"
                style={{
                  left:  pill.left,
                  width: pill.width,
                  transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1), width 0.22s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            )}
            {tabs.map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                ref={el => { tabRefs.current[key] = el }}
                onClick={() => setTab(key)}
                className={cn(
                  'relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150',
                  tab === key ? 'text-black' : 'text-slate-400 hover:text-white',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {count > 0 && (
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', tab === key ? 'bg-black/10 text-black' : 'bg-white/8')}>{count}</span>
                )}
              </button>
            ))}
          </div>

          {tab === 'tasks' && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white transition-colors ml-auto"
            >
              <Plus className="w-4 h-4" /> Nova Tarefa
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-slate-500 animate-spin" /></div>
        ) : (
          <>
            {/* ── Tarefas ── */}
            {tab === 'tasks' && (
              tasks.length === 0 ? (
                <Empty icon={ListChecks} text="Nenhuma tarefa ainda. As tarefas dos relatórios semanais aparecem aqui automaticamente." />
              ) : (
                <div className="space-y-2 max-w-3xl">
                  {tasks.map(t => <TaskRow key={t.id} task={t} onCycle={cycleStatus} onDelete={deleteTask} />)}
                </div>
              )
            )}

            {/* ── Relatórios ── */}
            {tab === 'reports' && (
              summaries.length === 0 ? (
                <Empty icon={FileText} text="Nenhum relatório semanal ainda. Eles são gerados toda segunda às 6h dos grupos com resumo ativado." />
              ) : (
                <div className="space-y-3 max-w-3xl">
                  {summaries.map(s => <ReportCard key={s.id} s={s} />)}
                </div>
              )
            )}

            {/* ── Alertas ── */}
            {tab === 'alerts' && (
              alerts.length === 0 ? (
                <Empty icon={Bell} text="Nenhum alerta crítico. A IA avisa aqui quando detectar algo urgente nos grupos." />
              ) : (
                <div className="space-y-2 max-w-3xl">
                  {alerts.map(a => (
                    <div key={a.id} className={cn(
                      'flex items-start gap-3 border rounded-xl px-4 py-3 transition-all',
                      a.is_read ? 'bg-white/3 border-white/8 opacity-60' : a.level === 'critical' ? 'bg-rose-500/8 border-rose-500/25' : 'bg-amber-500/8 border-amber-500/25',
                    )}>
                      <AlertTriangle className={cn('w-4 h-4 mt-0.5 shrink-0', a.level === 'critical' ? 'text-rose-400' : 'text-amber-400')} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white">{a.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500">{a.group_name}</span>
                          <span className="text-[10px] text-slate-600">• {fmtDate(a.detected_date)}</span>
                        </div>
                      </div>
                      {!a.is_read && (
                        <button onClick={() => markRead(a.id)} className="text-[10px] px-2 py-1 rounded-md bg-white/8 hover:bg-white/15 text-slate-300 transition-colors shrink-0">
                          Marcar lido
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>

      {/* Modal nova task */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#14141b] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Plus className="w-4 h-4 text-blue-400" /> Nova Tarefa</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/8 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Título *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="O que precisa ser feito?" className={inputCls} autoFocus />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Descrição</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhes (opcional)" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Responsável</label>
                  <input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} placeholder="Nome" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Prioridade</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className={`${inputCls} cursor-pointer`}>
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-white/10 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={createTask} disabled={!form.title.trim() || saving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-medium text-white transition-colors">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Empty({ icon: Icon, text }: { icon: typeof ListChecks; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-500" />
      </div>
      <p className="text-sm text-slate-400">{text}</p>
    </div>
  )
}
