'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import {
  Video, Plus, Copy, Check, ExternalLink, Clock, X, Loader2, Link2,
  Trash2, UserPlus, CalendarClock, Users, FileText, Sparkles, ChevronRight, Star, ListChecks,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Meeting {
  id: string
  code: string
  title: string | null
  created_at: string
  expires_at: string | null
  ended_at?: string | null
  scheduled_at: string | null
  active: boolean
  role?: 'host' | 'guest'
}

function meetingLink(code: string) {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/sala/${code}`
}
// Sem limite de tempo: só está "encerrada" quando active = false.
function isExpired(m: Meeting) {
  return !m.active
}
function isPending(m: Meeting) {
  return !!m.scheduled_at && new Date(m.scheduled_at).getTime() > Date.now()
}
function fmt(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function MeetingsPage() {
  usePageTitle('Reuniões')
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [created, setCreated] = useState<Meeting | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [inviteFor, setInviteFor] = useState<Meeting | null>(null)
  const [detailFor, setDetailFor] = useState<Meeting | null>(null)

  const load = useCallback(() => {
    fetch('/api/meetings')
      .then(r => r.json())
      .then((d: Meeting[]) => { if (Array.isArray(d)) setMeetings(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const copy = (code: string) => {
    navigator.clipboard.writeText(meetingLink(code)).then(() => {
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 1500)
    })
  }

  const remove = async (m: Meeting) => {
    if (!confirm(`Excluir a reunião "${m.title || 'Reunião'}"? Isso apaga o chat e os convites.`)) return
    setMeetings(prev => prev.filter(x => x.id !== m.id))
    await fetch(`/api/meetings/${m.code}`, { method: 'DELETE' }).catch(() => {})
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reuniões"
        description="Crie uma sala, mande o link e controle quem entra — câmera, microfone e fundo borrado"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Reuniões' }]}
      />

      <div className="flex justify-end">
        <button
          onClick={() => { setCreated(null); setModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova reunião
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
        </div>
      ) : meetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
            <Video className="w-8 h-8 text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-slate-300 font-medium">Nenhuma reunião ainda</p>
            <p className="text-slate-600 text-sm mt-1">Crie uma sala e compartilhe o link</p>
          </div>
          <button onClick={() => { setCreated(null); setModal(true) }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nova reunião
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {meetings.map(m => {
            const expired = isExpired(m)
            const pending = isPending(m)
            const host = m.role !== 'guest'
            return (
              <div key={m.id} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/3 px-4 py-3">
                <div className={cn('w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center shrink-0', pending ? 'bg-amber-500/10' : 'bg-blue-500/10')}>
                  {pending ? <CalendarClock className="w-5 h-5 text-amber-400" /> : <Video className="w-5 h-5 text-blue-400" />}
                </div>
                <button onClick={() => setDetailFor(m)} className="flex-1 min-w-0 text-left group">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">{m.title || 'Reunião'}</p>
                    {!host && <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] text-slate-300">Convidado</span>}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {expired ? 'Encerrada' : pending ? `Agendada para ${fmt(m.scheduled_at!)}` : 'Link ativo'}
                  </p>
                </button>

                {!expired && (
                  <button
                    onClick={() => copy(m.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {copiedCode === m.code ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar link</>}
                  </button>
                )}

                {!expired && (
                  pending ? (
                    <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-500 cursor-not-allowed">
                      Aguardando horário
                    </span>
                  ) : (
                    <a
                      href={`/sala/${m.code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Entrar
                    </a>
                  )
                )}

                {host && (
                  <>
                    <button
                      onClick={() => setInviteFor(m)}
                      title="Convidar equipe"
                      className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(m)}
                      title="Excluir"
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <CreateModal
          created={created}
          onCreated={(m) => { setCreated(m); setMeetings(prev => [m, ...prev]) }}
          onCopy={copy}
          copiedCode={copiedCode}
          onClose={() => setModal(false)}
        />
      )}

      {inviteFor && (
        <InviteModal meeting={inviteFor} onClose={() => setInviteFor(null)} />
      )}

      {detailFor && (
        <DetailModal meeting={detailFor} onClose={() => setDetailFor(null)} />
      )}
    </div>
  )
}

interface SummaryData {
  resumo?: string
  topicos?: string[]
  action_items?: { tarefa: string; responsavel?: string }[]
  decisoes?: string[]
}
interface TranscriptData {
  status: string
  title: string | null
  isHost: boolean
  summary: SummaryData | null
  segments: Array<{ speaker: string; text: string; start_ms: number }>
}
interface Highlight { author: string; label: string; created_at: string }

function DetailModal({ meeting, onClose }: { meeting: Meeting; onClose: () => void }) {
  const [data, setData] = useState<TranscriptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [genAI, setGenAI] = useState(false)
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [tab, setTab] = useState<'resumo' | 'transcricao' | 'destaques'>('resumo')

  const load = useCallback(() => {
    fetch(`/api/meetings/${meeting.code}/transcript`)
      .then(r => r.json())
      .then((d) => { if (d && !d.error) { setData(d); if (d.summary) setSummary(d.summary) } })
      .catch(() => {})
      .finally(() => setLoading(false))
    fetch(`/api/meetings/${meeting.code}/highlights`)
      .then(r => r.json())
      .then((h) => { if (Array.isArray(h)) setHighlights(h) })
      .catch(() => {})
  }, [meeting.code])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    // acompanha o fluxo automático (gravando → gravado → transcrevendo → pronto)
    if (!['processing', 'recording', 'recorded'].includes(data?.status ?? '')) return
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [data?.status, load])

  const transcribe = async () => {
    setWorking(true)
    setData(d => d ? { ...d, status: 'processing' } : d)
    try { await fetch(`/api/meetings/${meeting.code}/transcribe`, { method: 'POST' }) } catch { /* ignore */ }
    load()
    setWorking(false)
  }

  const generateAI = async () => {
    setGenAI(true)
    try {
      const r = await fetch(`/api/meetings/${meeting.code}/summary`, { method: 'POST' })
      const d = await r.json()
      if (d?.summary) setSummary(d.summary)
    } catch { /* ignore */ } finally { setGenAI(false) }
  }

  const [creatingTasks, setCreatingTasks] = useState(false)
  const [tasksMsg, setTasksMsg] = useState('')
  const createTasks = async () => {
    setCreatingTasks(true)
    try {
      const r = await fetch(`/api/meetings/${meeting.code}/action-items`, { method: 'POST' })
      const d = await r.json()
      if (r.ok) setTasksMsg(d.created > 0 ? `✓ ${d.created} tarefa(s) criada(s) no CRM` : 'Tarefas já estavam criadas')
      else setTasksMsg('Não foi possível criar as tarefas')
    } catch { setTasksMsg('Erro ao criar tarefas') } finally { setCreatingTasks(false) }
  }

  const status = data?.status ?? 'none'
  const hasTranscript = status === 'ready' && (data?.segments?.length ?? 0) > 0

  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#1c1c24] shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
            <h3 className="text-base font-semibold text-white truncate">{meeting.title || 'Reunião'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-slate-600" /></div>
          ) : hasTranscript ? (
            <div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit mb-4">
                {([['resumo', 'Resumo'], ['transcricao', 'Transcrição'], ['destaques', `Destaques${highlights.length ? ` (${highlights.length})` : ''}`]] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setTab(v)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', tab === v ? 'bg-white text-gray-900' : 'text-slate-400 hover:text-white')}>{l}</button>
                ))}
              </div>

              {tab === 'resumo' && (summary ? (
                <div className="space-y-4">
                  {summary.resumo && <div><p className="text-xs font-semibold text-slate-400 mb-1">Resumo</p><p className="text-sm text-slate-200 leading-relaxed">{summary.resumo}</p></div>}
                  {summary.topicos?.length ? <div><p className="text-xs font-semibold text-slate-400 mb-1.5">Tópicos</p><ul className="space-y-1">{summary.topicos.map((t, i) => <li key={i} className="text-sm text-slate-200 flex gap-2"><span className="text-blue-400">•</span>{t}</li>)}</ul></div> : null}
                  {summary.action_items?.length ? (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 mb-1.5">Action items</p>
                      <ul className="space-y-1.5">{summary.action_items.map((a, i) => <li key={i} className="text-sm text-slate-200 flex gap-2"><span className="w-4 h-4 rounded border border-white/20 shrink-0 mt-0.5" />{a.tarefa}{a.responsavel ? <span className="text-slate-500"> — {a.responsavel}</span> : null}</li>)}</ul>
                      {data?.isHost && (
                        <div className="flex items-center gap-3 mt-2.5">
                          <button onClick={createTasks} disabled={creatingTasks} className="flex items-center gap-2 px-3 h-9 rounded-lg bg-white text-gray-900 text-xs font-semibold hover:bg-slate-100 disabled:opacity-50 transition-colors">
                            {creatingTasks ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ListChecks className="w-3.5 h-3.5" />}
                            Criar tarefas no CRM
                          </button>
                          {tasksMsg && <span className="text-xs text-emerald-400">{tasksMsg}</span>}
                        </div>
                      )}
                    </div>
                  ) : null}
                  {summary.decisoes?.length ? <div><p className="text-xs font-semibold text-slate-400 mb-1.5">Decisões</p><ul className="space-y-1">{summary.decisoes.map((d, i) => <li key={i} className="text-sm text-slate-200 flex gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />{d}</li>)}</ul></div> : null}
                  {data?.isHost && <p className="text-[11px] text-slate-600 mt-1">O relatório completo também fica em <span className="text-slate-400">Task → Relatórios</span>.</p>}
                  {data?.isHost && <button onClick={generateAI} disabled={genAI} className="text-xs text-slate-500 hover:text-blue-400 mt-1 disabled:opacity-50">{genAI ? 'Gerando...' : 'Gerar novamente'}</button>}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-white/10 flex items-center justify-center"><Sparkles className="w-6 h-6 text-blue-400" /></div>
                  <p className="text-white font-medium">Análise com IA</p>
                  <p className="text-sm text-slate-500 max-w-sm">Resumo, tópicos e action items a partir da transcrição. Só usa IA quando você clica.</p>
                  {data?.isHost && <button onClick={generateAI} disabled={genAI} className="mt-1 px-5 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2">{genAI ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</> : <><Sparkles className="w-4 h-4" /> Gerar análise</>}</button>}
                </div>
              ))}

              {tab === 'transcricao' && (
                <div className="space-y-3">
                  {data!.segments.map((s, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-xs font-semibold text-blue-300 shrink-0 w-28 truncate">{s.speaker}</span>
                      <p className="text-sm text-slate-200 leading-relaxed flex-1">{s.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'destaques' && (highlights.length ? (
                <div className="space-y-2">
                  {highlights.map((hl, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/3 px-3 py-2">
                      <Star className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-sm text-slate-200 flex-1">{hl.label || 'Destaque'}</span>
                      <span className="text-[11px] text-slate-500 shrink-0">{hl.author} · {new Date(hl.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-8">Nenhum destaque. Use o botão "Destacar" durante a reunião.</p>
              ))}
            </div>
          ) : status === 'processing' ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              <p className="text-white font-medium">Transcrevendo a reunião...</p>
              <p className="text-sm text-slate-500">Isso leva alguns minutos. Pode fechar — fica salvo.</p>
            </div>
          ) : status === 'recorded' ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-white/10 flex items-center justify-center"><Sparkles className="w-6 h-6 text-blue-400" /></div>
              <p className="text-white font-medium">Gravação pronta</p>
              <p className="text-sm text-slate-500 max-w-sm">Gere a transcrição separada por pessoa (Whisper).</p>
              {data?.isHost && (
                <button onClick={transcribe} disabled={working} className="mt-1 px-5 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                  {working ? <><Loader2 className="w-4 h-4 animate-spin" /> Iniciando...</> : <><FileText className="w-4 h-4" /> Gerar transcrição</>}
                </button>
              )}
            </div>
          ) : status === 'recording' ? (
            <div className="text-center py-10">
              <p className="text-white font-medium mb-1">Reunião em andamento</p>
              <p className="text-sm text-slate-500">A transcrição fica disponível quando a reunião terminar.</p>
            </div>
          ) : status === 'empty' ? (
            <div className="text-center py-10">
              <p className="text-white font-medium mb-1">Nenhuma fala detectada</p>
              <p className="text-sm text-slate-500">A gravação não tinha áudio reconhecível.</p>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-white font-medium mb-1">Sem gravação ainda</p>
              <p className="text-sm text-slate-500">A reunião é gravada automaticamente. A transcrição aparece aqui depois que ela acontecer.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function CreateModal({
  created, onCreated, onCopy, copiedCode, onClose,
}: {
  created: Meeting | null
  onCreated: (m: Meeting) => void
  onCopy: (code: string) => void
  copiedCode: string | null
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const [when, setWhen] = useState<'now' | 'schedule'>('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const [creating, setCreating] = useState(false)

  const create = async () => {
    setCreating(true)
    try {
      const payload: Record<string, unknown> = { title: title.trim() || 'Reunião' }
      if (when === 'schedule' && scheduledAt) payload.scheduled_at = new Date(scheduledAt).toISOString()
      const r = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (r.ok) onCreated(await r.json())
    } finally {
      setCreating(false)
    }
  }

  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#1c1c24] shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-base font-semibold text-white">{created ? 'Reunião criada' : 'Nova reunião'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5">
          {created ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                {created.scheduled_at ? `Agendada para ${fmt(created.scheduled_at)}. Compartilhe o link — ele abre no horário marcado.` : 'Compartilhe este link. Quem abrir vai pedir entrada e você admite na sala.'}
              </p>
              <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
                <Link2 className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="flex-1 min-w-0 truncate text-sm text-slate-200">{meetingLink(created.code)}</span>
                <button onClick={() => onCopy(created.code)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-xs text-white hover:bg-white/20 transition-colors shrink-0">
                  {copiedCode === created.code ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
                </button>
              </div>
              {!created.scheduled_at && (
                <a href={`/sala/${created.code}`} target="_blank" rel="noopener noreferrer" className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Video className="w-4 h-4" /> Entrar na sala
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Título</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Reunião com cliente" className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" />
              </div>

              {/* Quando */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Quando</label>
                <div className="flex gap-2">
                  {([['now', 'Agora'], ['schedule', 'Agendar']] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setWhen(v)} className={cn('flex-1 h-10 rounded-xl text-sm font-medium border transition-colors', when === v ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10')}>{l}</button>
                  ))}
                </div>
              </div>

              {when === 'schedule' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Data e hora</label>
                  <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/50 [color-scheme:dark]" />
                </div>
              )}

              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3 h-3 shrink-0" />
                O link não expira por tempo — vale até a reunião ser encerrada (você encerra ou a sala fica vazia).
              </p>

              <button onClick={create} disabled={creating || (when === 'schedule' && !scheduledAt)} className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : <><Plus className="w-4 h-4" /> {when === 'schedule' ? 'Agendar reunião' : 'Criar reunião'}</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

interface TeamMember { id: string; name: string; email: string }

function InviteModal({ meeting, onClose }: { meeting: Meeting; onClose: () => void }) {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/team').then(r => r.json()).catch(() => []),
      fetch(`/api/meetings/${meeting.code}/invite`).then(r => r.json()).catch(() => []),
    ]).then(([members, invited]) => {
      if (Array.isArray(members)) setTeam(members.map((u: { id: string; name?: string; email?: string }) => ({ id: u.id, name: u.name || 'Sem nome', email: u.email || '' })))
      if (Array.isArray(invited)) setSelected(new Set(invited))
    }).finally(() => setLoading(false))
  }, [meeting.code])

  const toggle = (id: string) => setSelected(prev => {
    const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n
  })

  const save = async () => {
    setSaving(true)
    try {
      await fetch(`/api/meetings/${meeting.code}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_ids: Array.from(selected) }),
      })
      setDone(true)
      setTimeout(onClose, 900)
    } finally { setSaving(false) }
  }

  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#1c1c24] shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <h3 className="text-base font-semibold text-white">Convidar equipe</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-400 mb-3">Quem você marcar recebe uma notificação e a reunião aparece na lista dela.</p>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-600" /></div>
          ) : team.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">Nenhum membro na equipe.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-1 -mx-1 px-1">
              {team.map(u => {
                const on = selected.has(u.id)
                return (
                  <button key={u.id} onClick={() => toggle(u.id)} className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-colors text-left', on ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/3 border-white/8 hover:bg-white/5')}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white shrink-0">{u.name.charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{u.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                    </div>
                    <span className={cn('w-5 h-5 rounded-md border flex items-center justify-center shrink-0', on ? 'bg-blue-600 border-blue-600' : 'border-white/20')}>{on && <Check className="w-3.5 h-3.5 text-white" />}</span>
                  </button>
                )
              })}
            </div>
          )}
          <button onClick={save} disabled={saving || done} className="w-full h-11 mt-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {done ? <><Check className="w-4 h-4" /> Convidados!</> : saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><UserPlus className="w-4 h-4" /> Convidar selecionados</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
