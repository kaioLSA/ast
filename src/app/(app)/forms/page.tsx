'use client'

import { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import { ClipboardList, Phone, Clock, ChevronDown, ChevronUp, RefreshCw, Filter } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

function toTitleCase(str: string): string {
  return str
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .trim()
}

interface FormLead {
  id: string
  form_id: string
  form_name: string
  name: string
  phone: string
  created_time: string
  answers: { question: string; answer: string }[]
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d atrás`
  if (h > 0) return `${h}h atrás`
  if (m > 0) return `${m}min atrás`
  return 'agora'
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const brt = new Date(d.getTime() - 3 * 60 * 60 * 1000)
  const day  = brt.getUTCDate().toString().padStart(2, '0')
  const mon  = (brt.getUTCMonth() + 1).toString().padStart(2, '0')
  const hr   = brt.getUTCHours().toString().padStart(2, '0')
  const min  = brt.getUTCMinutes().toString().padStart(2, '0')
  return `${day}/${mon} às ${hr}:${min}`
}

const ANSWER_COLORS = [
  'bg-blue-500/10 text-blue-300 border-blue-500/20',
  'bg-violet-500/10 text-violet-300 border-violet-500/20',
  'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  'bg-amber-500/10 text-amber-300 border-amber-500/20',
  'bg-rose-500/10 text-rose-300 border-rose-500/20',
]

function LeadCard({ lead }: { lead: FormLead }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-all duration-200">
      {/* Header */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{lead.name}</p>
              {lead.phone && (
                <a
                  href={`tel:${lead.phone.replace(/\D/g, '')}`}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-colors mt-0.5"
                  onClick={e => e.stopPropagation()}
                >
                  <Phone className="w-3 h-3" />
                  {lead.phone}
                </a>
              )}
            </div>
          </div>

          {/* Meta + tempo */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="w-3 h-3" />
              {timeAgo(lead.created_time)}
            </span>
            <span className="text-[10px] text-slate-600">{formatDate(lead.created_time)}</span>
          </div>
        </div>

        {/* Preview da primeira resposta */}
        {!expanded && lead.answers.length > 0 && (
          <div className="mt-3 pl-13">
            <p className="text-[11px] text-slate-500 truncate">{toTitleCase(lead.answers[0].answer)}</p>
          </div>
        )}
      </div>

      {/* Respostas expandidas */}
      {expanded && (
        <div className="px-5 pb-4 space-y-3 border-t border-white/6 pt-4">
          {lead.answers.map((a, i) => (
            <div key={i}>
              <p className="text-[11px] text-slate-500 mb-1.5">{toTitleCase(a.question)}</p>
              <span className={cn(
                'inline-block text-xs px-3 py-1.5 rounded-lg border font-medium',
                ANSWER_COLORS[i % ANSWER_COLORS.length]
              )}>
                {toTitleCase(a.answer)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Toggle */}
      {lead.answers.length > 0 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[11px] text-slate-500 hover:text-slate-300 border-t border-white/6 hover:bg-white/3 transition-all"
        >
          {expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Ocultar respostas</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Ver {lead.answers.length} {lead.answers.length === 1 ? 'resposta' : 'respostas'}</>
          )}
        </button>
      )}
    </div>
  )
}

export default function FormsPage() {
  usePageTitle('Formulários')

  const [leads, setLeads]       = useState<FormLead[]>([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeForm, setActiveForm] = useState<string>('all')

  // Sliding pill (aba ativa)
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false })
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const movePill = useCallback(() => {
    const el = tabRefs.current[activeForm]
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth, ready: true })
  }, [activeForm])
  useLayoutEffect(() => { movePill() }, [movePill])

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch('/api/forms/leads')
      if (res.ok) setLeads(await res.json())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  // Lista de forms únicos
  const forms = useMemo(() => {
    const map: Record<string, string> = {}
    leads.forEach(l => { map[l.form_id] = l.form_name })
    return Object.entries(map).map(([id, name]) => ({ id, name }))
  }, [leads])

  const filtered = useMemo(() =>
    activeForm === 'all' ? leads : leads.filter(l => l.form_id === activeForm),
    [leads, activeForm]
  )

  // Re-medir a pílula quando as abas mudam (novos forms / contadores)
  useEffect(() => { requestAnimationFrame(movePill) }, [leads, forms, movePill])

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Formulários"
        description="Respostas dos formulários nativos do Meta Ads"
      />

      <div className="flex-1 overflow-auto px-6 py-5">

        {/* Filtros + refresh */}
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
            <button
              ref={el => { tabRefs.current['all'] = el }}
              onClick={() => setActiveForm('all')}
              className={cn(
                'relative z-10 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150',
                activeForm === 'all' ? 'text-black' : 'text-slate-400 hover:text-white'
              )}
            >
              Todos ({leads.length})
            </button>
            {forms.map(f => (
              <button
                key={f.id}
                ref={el => { tabRefs.current[f.id] = el }}
                onClick={() => setActiveForm(f.id)}
                className={cn(
                  'relative z-10 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 whitespace-nowrap',
                  activeForm === f.id ? 'text-black' : 'text-slate-400 hover:text-white'
                )}
              >
                {f.name.replace('FORMS 01 - ', '')} ({leads.filter(l => l.form_id === f.id).length})
              </button>
            ))}
          </div>

          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-400 hover:text-white hover:bg-white/8 transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
            Atualizar
          </button>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <p className="text-sm text-slate-500">Buscando respostas...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-300">Nenhuma resposta ainda</p>
            <p className="text-xs text-slate-500">As respostas dos formulários Meta Ads aparecem aqui automaticamente</p>
          </div>
        ) : (
          <>
            {/* Estatísticas rápidas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Total de respostas</p>
                <p className="text-2xl font-bold text-white">{filtered.length}</p>
              </div>
              {forms.slice(0, 2).map(f => (
                <div key={f.id} className="bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-500 mb-1 truncate">{f.name.replace('FORMS 01 - ', '')}</p>
                  <p className="text-2xl font-bold text-white">{leads.filter(l => l.form_id === f.id).length}</p>
                </div>
              ))}
            </div>

            {/* Grid de cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(lead => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
