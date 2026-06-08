'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import {
  MessageSquareText, Film, BarChart3, Loader2, Copy, Check, Sparkles,
  ArrowRight, ArrowLeft, Clock, ChevronDown, Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface AutomationClient {
  id: string
  name: string
  company: string
  niche?: string
  toneOfVoice?: string
}

type AutomationId = 'captions' | 'reels' | 'campaign-diagnosis'

const AUTOMATIONS: { id: AutomationId; name: string; description: string; icon: typeof MessageSquareText; available: boolean }[] = [
  { id: 'captions', name: 'Gerador de Legendas', description: 'Informe o tema e o cliente — a IA entrega 3 legendas prontas no tom de voz dele.', icon: MessageSquareText, available: true },
  { id: 'reels', name: 'Script de Reels', description: 'Roteiro de vídeo curto com gancho, desenvolvimento e CTA pronto para gravar.', icon: Film, available: true },
  { id: 'campaign-diagnosis', name: 'Diagnóstico de Campanha', description: 'Análise semanal das campanhas Meta Ads com pontos críticos e próximas ações.', icon: BarChart3, available: false },
]

export default function AutomationsPage() {
  usePageTitle('Automações')
  const [selected, setSelected] = useState<AutomationId | null>(null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automações"
        description="Ferramentas com IA para acelerar o dia a dia da equipe"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Automações' }]}
      />

      <div className="relative">
        {selected === null ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {AUTOMATIONS.map((a, i) => {
                const Icon = a.icon
                return (
                  <motion.button
                    key={a.id}
                    type="button"
                    disabled={!a.available}
                    onClick={() => a.available && setSelected(a.id)}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    whileHover={a.available ? { y: -4 } : undefined}
                    className={cn(
                      'group relative text-left rounded-2xl border p-5 flex flex-col gap-4 h-44 transition-colors',
                      a.available
                        ? 'border-white/8 bg-white/3 hover:bg-white/[0.06] hover:border-white/20 cursor-pointer'
                        : 'border-white/5 bg-white/[0.02] opacity-55 cursor-not-allowed',
                    )}
                  >
                    {/* Status badge */}
                    <div className="flex items-start justify-between">
                      <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-white/20 transition-colors">
                        <Icon className="w-5 h-5 text-slate-300" />
                      </div>
                      {a.available ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-medium text-blue-400">
                          Disponível
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-slate-500">
                          <Clock className="w-2.5 h-2.5" /> Em breve
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white mb-1">{a.name}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{a.description}</p>
                    </div>

                    {a.available && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 group-hover:text-white transition-colors">
                        Abrir
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </motion.div>
          ) : (
            <motion.div
              key="tool"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Back button */}
              <button
                onClick={() => setSelected(null)}
                className="group flex items-center gap-2 mb-4 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                Voltar para automações
              </button>

              <div className="rounded-2xl border border-white/10 bg-[#111118] overflow-hidden">
                {selected === 'captions' && <CaptionGenerator />}
                {selected === 'reels' && <ScriptGenerator />}
              </div>
            </motion.div>
          )}
      </div>
    </div>
  )
}

// ── Preset Field (chips + outros) ────────────────────────────────────────────────

const TEMA_PRESETS = [
  'Promoção ou oferta',
  'Dica de cuidado',
  'Bastidores do dia a dia',
  'Depoimento de cliente',
  'Lançamento de novidade',
  'Data comemorativa',
]

const OBJETIVO_PRESETS = [
  'Captar agendamentos',
  'Atrair novos leads',
  'Engajar seguidores',
  'Gerar autoridade',
  'Divulgar promoção',
]

function PresetField({
  label, presets, value, onChange, placeholder,
}: {
  label: string
  presets: string[]
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  // "custom" mode = user wants to type their own
  const isPreset = presets.includes(value)
  const [custom, setCustom] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const showInput = custom || (!isPreset && value !== '')

  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-2">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {presets.map(p => {
          const active = value === p && !custom
          return (
            <button
              key={p}
              type="button"
              onClick={() => { setCustom(false); onChange(p) }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                active
                  ? 'bg-white text-gray-900 border-white'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white',
              )}
            >
              {p}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => { setCustom(true); onChange(''); setTimeout(() => inputRef.current?.focus(), 50) }}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            showInput
              ? 'bg-white text-gray-900 border-white'
              : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white',
          )}
        >
          Outros
        </button>
      </div>

      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full h-10 mt-2 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/30"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Client Select (custom dropdown) ──────────────────────────────────────────────

function ClientSelect({
  clients, value, onChange, loading,
}: {
  clients: AutomationClient[]
  value: string
  onChange: (id: string) => void
  loading: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selected = clients.find(c => c.id === value)
  const label = loading
    ? 'Carregando...'
    : selected
      ? `${selected.name}${selected.company ? ` — ${selected.company}` : ''}`
      : 'Sem cliente específico'

  const options = [
    { id: '', name: 'Sem cliente específico', company: '' },
    ...clients,
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full h-10 rounded-xl bg-[#1c1c24] border px-3 text-sm text-left flex items-center justify-between gap-2 transition-colors disabled:opacity-50',
          open ? 'border-white/30' : 'border-white/10 hover:border-white/20',
        )}
      >
        <span className={cn('truncate', selected ? 'text-white' : 'text-slate-400')}>{label}</span>
        <ChevronDown className={cn('w-4 h-4 text-slate-500 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 mt-1.5 w-full max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#1c1c24] shadow-xl shadow-black/40 p-1"
          >
            {options.map(opt => {
              const isSelected = opt.id === value
              return (
                <button
                  key={opt.id || 'none'}
                  type="button"
                  onClick={() => { onChange(opt.id); setOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm transition-colors',
                    isSelected ? 'bg-white/8 text-white' : 'text-slate-300 hover:bg-white/5',
                  )}
                >
                  {opt.id ? (
                    <span className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-3 h-3 text-slate-400" />
                    </span>
                  ) : (
                    <span className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[10px] text-slate-500">—</span>
                  )}
                  <span className="flex-1 min-w-0 truncate">
                    {opt.name}{opt.company ? <span className="text-slate-500"> — {opt.company}</span> : ''}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Caption Generator ──────────────────────────────────────────────────────────

const ANGULO_META: Record<string, { label: string; color: string }> = {
  emocional: { label: 'Emocional', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  racional: { label: 'Racional', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  provocativa: { label: 'Provocativa', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
}

function CaptionGenerator() {
  const [clients, setClients] = useState<AutomationClient[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)
  const [clientId, setClientId] = useState('')
  const [tema, setTema] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [captions, setCaptions] = useState<{ angulo: string; texto: string }[]>([])
  const [tab, setTab] = useState<'generate' | 'history'>('generate')
  const [history, setHistory] = useState<CaptionRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const loadHistory = () => {
    fetch('/api/ai/captions')
      .then(r => r.json())
      .then((data: CaptionRecord[]) => { if (Array.isArray(data)) setHistory(data) })
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then((data: Array<{ id: string; name: string; company_name?: string; niche?: string; tone_of_voice?: string }>) => {
        if (Array.isArray(data)) {
          setClients(data.map(c => ({
            id: c.id,
            name: c.name || 'Sem nome',
            company: c.company_name || '',
            niche: c.niche,
            toneOfVoice: c.tone_of_voice,
          })))
        }
      })
      .catch(() => {})
      .finally(() => setClientsLoading(false))
    loadHistory()
  }, [])

  const selectedClient = clients.find(c => c.id === clientId)
  const missingProfile = selectedClient && (!selectedClient.niche || !selectedClient.toneOfVoice)

  const generate = async () => {
    if (!tema.trim() || loading) return
    setLoading(true)
    setError('')
    setCaptions([])
    try {
      const res = await fetch('/api/ai/captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId || undefined, tema, objetivo }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao gerar legendas')
        return
      }
      setCaptions(Array.isArray(data.captions) ? data.captions : [])
      loadHistory()
    } catch {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <MessageSquareText className="w-5 h-5 text-slate-300" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Gerador de Legendas</h2>
          <p className="text-xs text-slate-500">3 opções de legenda no tom de voz do cliente</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit mb-5">
        {([
          { id: 'generate', label: 'Gerar' },
          { id: 'history', label: `Histórico${history.length ? ` (${history.length})` : ''}` },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'relative px-4 py-1.5 rounded-lg text-xs font-medium transition-colors',
              tab === t.id ? 'text-gray-900' : 'text-slate-400 hover:text-white',
            )}
          >
            {tab === t.id && (
              <motion.span
                layoutId="captionTabPill"
                className="absolute inset-0 rounded-lg bg-white"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'history' ? (
        <HistoryList history={history} loading={historyLoading} />
      ) : (
      <>
      {/* Form */}
      <div className="space-y-4 rounded-2xl border border-white/8 bg-white/3 p-5">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Cliente</label>
          <ClientSelect
            clients={clients}
            value={clientId}
            onChange={setClientId}
            loading={clientsLoading}
          />
          {missingProfile && (
            <p className="text-[11px] text-amber-400/80 mt-1.5">
              Este cliente não tem nicho/tom de voz preenchidos. As legendas usarão um tom genérico.
            </p>
          )}
        </div>

        <PresetField
          label="Tema do post *"
          presets={TEMA_PRESETS}
          value={tema}
          onChange={setTema}
          placeholder="Ex: promoção de limpeza de pele para o verão"
        />

        <PresetField
          label="Objetivo"
          presets={OBJETIVO_PRESETS}
          value={objetivo}
          onChange={setObjetivo}
          placeholder="Ex: captar agendamentos, engajar seguidores"
        />

        <button
          onClick={generate}
          disabled={!tema.trim() || loading}
          className="w-full h-11 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 bg-white hover:bg-white/90 text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</>
            : <><Sparkles className="w-4 h-4" /> Gerar legendas</>}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Results */}
      {captions.length > 0 && (
        <div className="mt-6 space-y-3">
          {captions.map((c, idx) => (
            <CaptionCard key={idx} angulo={c.angulo} texto={c.texto} delay={idx * 0.08} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && captions.length === 0 && !error && (
        <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-white/3 border border-white/8 flex items-center justify-center">
            <MessageSquareText className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-sm text-slate-500">Preencha o tema e clique em gerar</p>
        </div>
      )}
      </>
      )}
    </div>
  )
}

// ── Caption card + history ───────────────────────────────────────────────────────

interface CaptionRecord {
  id: string
  client_name: string | null
  tema: string | null
  objetivo: string | null
  captions: { angulo: string; texto: string }[]
  created_at: string
}

function CaptionCard({ angulo, texto, delay = 0 }: { angulo: string; texto: string; delay?: number }) {
  const [copied, setCopied] = useState(false)
  const meta = ANGULO_META[angulo] ?? { label: angulo, color: 'bg-white/10 text-slate-300 border-white/10' }

  const copy = () => {
    navigator.clipboard.writeText(texto).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="rounded-2xl border border-white/8 bg-white/3 p-4"
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className={cn('px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide', meta.color)}>
          {meta.label}
        </span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          {copied
            ? <><Check className="w-3 h-3 text-emerald-400" /> Copiado</>
            : <><Copy className="w-3 h-3" /> Copiar</>}
        </button>
      </div>
      <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{texto}</p>
    </motion.div>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function HistoryList({ history, loading }: { history: CaptionRecord[]; loading: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center py-16">
        <div className="w-12 h-12 rounded-2xl bg-white/3 border border-white/8 flex items-center justify-center">
          <Clock className="w-5 h-5 text-slate-600" />
        </div>
        <p className="text-sm text-slate-500">Suas legendas geradas vão aparecer aqui</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {history.map(rec => {
        const isOpen = openId === rec.id
        return (
          <div key={rec.id} className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
            <button
              onClick={() => setOpenId(isOpen ? null : rec.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{rec.tema || 'Sem tema'}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {rec.client_name ? rec.client_name + ' · ' : ''}{formatDate(rec.created_at)}
                </p>
              </div>
              <ChevronDown className={cn('w-4 h-4 text-slate-500 shrink-0 transition-transform', isOpen && 'rotate-180')} />
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-2.5">
                    {rec.captions.map((c, idx) => (
                      <CaptionCard key={idx} angulo={c.angulo} texto={c.texto} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

// ── Script de Reels ──────────────────────────────────────────────────────────────

interface Script { gancho: string; desenvolvimento: string; cta: string }

interface ScriptRecord {
  id: string
  client_name: string | null
  tema: string | null
  duracao: string | null
  script: Script
  created_at: string
}

const DURATIONS = ['15', '30', '60', '90']

function ScriptGenerator() {
  const [clients, setClients] = useState<AutomationClient[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)
  const [clientId, setClientId] = useState('')
  const [tema, setTema] = useState('')
  const [duracao, setDuracao] = useState('30')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [script, setScript] = useState<Script | null>(null)
  const [tab, setTab] = useState<'generate' | 'history'>('generate')
  const [history, setHistory] = useState<ScriptRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const loadHistory = () => {
    fetch('/api/ai/script')
      .then(r => r.json())
      .then((data: ScriptRecord[]) => { if (Array.isArray(data)) setHistory(data) })
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then((data: Array<{ id: string; name: string; company_name?: string; niche?: string; tone_of_voice?: string }>) => {
        if (Array.isArray(data)) {
          setClients(data.map(c => ({
            id: c.id,
            name: c.name || 'Sem nome',
            company: c.company_name || '',
            niche: c.niche,
            toneOfVoice: c.tone_of_voice,
          })))
        }
      })
      .catch(() => {})
      .finally(() => setClientsLoading(false))
    loadHistory()
  }, [])

  const selectedClient = clients.find(c => c.id === clientId)
  const missingProfile = selectedClient && (!selectedClient.niche || !selectedClient.toneOfVoice)

  const generate = async () => {
    if (!tema.trim() || loading) return
    setLoading(true)
    setError('')
    setScript(null)
    try {
      const res = await fetch('/api/ai/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId || undefined, tema, duracao }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao gerar roteiro')
        return
      }
      setScript(data.script ?? null)
      loadHistory()
    } catch {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Film className="w-5 h-5 text-slate-300" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Script de Reels</h2>
          <p className="text-xs text-slate-500">Roteiro pronto para gravar — gancho, desenvolvimento e CTA</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit mb-5">
        {([
          { id: 'generate', label: 'Gerar' },
          { id: 'history', label: `Histórico${history.length ? ` (${history.length})` : ''}` },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'relative px-4 py-1.5 rounded-lg text-xs font-medium transition-colors',
              tab === t.id ? 'text-gray-900' : 'text-slate-400 hover:text-white',
            )}
          >
            {tab === t.id && (
              <motion.span
                layoutId="scriptTabPill"
                className="absolute inset-0 rounded-lg bg-white"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'history' ? (
        <ScriptHistoryList history={history} loading={historyLoading} />
      ) : (
      <>
      {/* Form */}
      <div className="space-y-4 rounded-2xl border border-white/8 bg-white/3 p-5">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Cliente</label>
          <ClientSelect clients={clients} value={clientId} onChange={setClientId} loading={clientsLoading} />
          {missingProfile && (
            <p className="text-[11px] text-amber-400/80 mt-1.5">
              Este cliente não tem nicho/tom de voz preenchidos. O roteiro usará um tom genérico.
            </p>
          )}
        </div>

        <PresetField
          label="Tema do vídeo *"
          presets={TEMA_PRESETS}
          value={tema}
          onChange={setTema}
          placeholder="Ex: 3 erros que afastam clientes da sua clínica"
        />

        {/* Duração */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Duração</label>
          <div className="flex flex-wrap gap-1.5">
            {DURATIONS.map(d => {
              const active = duracao === d
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuracao(d)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    active
                      ? 'bg-white text-gray-900 border-white'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white',
                  )}
                >
                  {d}s
                </button>
              )
            })}
          </div>
        </div>

        <button
          onClick={generate}
          disabled={!tema.trim() || loading}
          className="w-full h-11 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 bg-white hover:bg-white/90 text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Gerando...</>
            : <><Sparkles className="w-4 h-4" /> Gerar roteiro</>}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Result */}
      {script && <div className="mt-6"><ScriptOutput script={script} /></div>}

      {/* Empty state */}
      {!loading && !script && !error && (
        <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-white/3 border border-white/8 flex items-center justify-center">
            <Film className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-sm text-slate-500">Preencha o tema e clique em gerar</p>
        </div>
      )}
      </>
      )}
    </div>
  )
}

function ScriptOutput({ script, delay = 0 }: { script: Script; delay?: number }) {
  const [copied, setCopied] = useState(false)
  const fullText = [script.gancho, script.desenvolvimento, script.cta].filter(Boolean).join('\n\n')

  const copyAll = () => {
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const blocks = [
    { label: 'Gancho', hint: '0-3s', text: script.gancho },
    { label: 'Desenvolvimento', hint: '', text: script.desenvolvimento },
    { label: 'CTA', hint: 'chamada final', text: script.cta },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <span className="text-xs font-semibold text-slate-300">Roteiro</span>
        <button
          onClick={copyAll}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          {copied
            ? <><Check className="w-3 h-3 text-emerald-400" /> Copiado</>
            : <><Copy className="w-3 h-3" /> Copiar roteiro</>}
        </button>
      </div>
      <div className="p-4 space-y-4">
        {blocks.map((b, i) => (
          b.text ? (
            <div key={i}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{b.label}</span>
                {b.hint && <span className="text-[10px] text-slate-600">{b.hint}</span>}
              </div>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{b.text}</p>
            </div>
          ) : null
        ))}
      </div>
    </motion.div>
  )
}

function ScriptHistoryList({ history, loading }: { history: ScriptRecord[]; loading: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center py-16">
        <div className="w-12 h-12 rounded-2xl bg-white/3 border border-white/8 flex items-center justify-center">
          <Clock className="w-5 h-5 text-slate-600" />
        </div>
        <p className="text-sm text-slate-500">Seus roteiros gerados vão aparecer aqui</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {history.map(rec => {
        const isOpen = openId === rec.id
        return (
          <div key={rec.id} className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
            <button
              onClick={() => setOpenId(isOpen ? null : rec.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{rec.tema || 'Sem tema'}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {rec.client_name ? rec.client_name + ' · ' : ''}{rec.duracao ? rec.duracao + 's · ' : ''}{formatDate(rec.created_at)}
                </p>
              </div>
              <ChevronDown className={cn('w-4 h-4 text-slate-500 shrink-0 transition-transform', isOpen && 'rotate-180')} />
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    <ScriptOutput script={rec.script} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
