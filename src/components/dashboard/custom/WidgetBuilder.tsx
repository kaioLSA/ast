'use client'

import { useState } from 'react'
import {
  X, ChevronRight, ChevronLeft, Check,
  Hash, BarChart2, TrendingUp, PieChart, MapPin, List,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { WIDGET_TYPES, DATA_SOURCES, COLORS, GRADIENTS, type WidgetType } from './types'

/* ── Icon map ─────────────────────────────────────────────────────────────── */
const ICON_MAP: Record<string, React.ElementType> = {
  Hash, BarChart2, TrendingUp, PieChart, MapPin, List,
}

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (w: {
    widget_type: WidgetType
    data_source: string
    title: string
    color: string
    col_span: 3 | 6 | 9 | 12
    tall: boolean
    merged: boolean
    config: Record<string, unknown>
  }) => Promise<void>
}

const SIZE_OPTIONS: { value: 3 | 6 | 9 | 12; label: string; desc: string; frac: number }[] = [
  { value: 3,  label: '¼',    desc: 'Pequeno',  frac: 0.25 },
  { value: 6,  label: '½',    desc: 'Médio',    frac: 0.50 },
  { value: 9,  label: '¾',    desc: 'Grande',   frac: 0.75 },
  { value: 12, label: 'Full', desc: 'Completo', frac: 1.00 },
]

export function WidgetBuilder({ open, onClose, onAdd }: Props) {
  const [step, setStep]           = useState(1)
  const [widgetType, setWT]       = useState<WidgetType>('metric')
  const [dataSource, setDS]       = useState('')
  const [title, setTitle]         = useState('')
  const [colorMode, setColorMode] = useState<'solid' | 'gradient'>('solid')
  const [color, setColor]         = useState(COLORS[0])
  const [colSpan, setColSpan]     = useState<3 | 6 | 9 | 12>(6)
  const [tall, setTall]           = useState(false)
  const [merged, setMerged]       = useState(false)
  const [saving, setSaving]       = useState(false)

  if (!open) return null

  const compatibleSources = DATA_SOURCES.filter(s => s.compatibleTypes.includes(widgetType))

  function reset() {
    setStep(1); setWT('metric'); setDS(''); setTitle('')
    setColorMode('solid'); setColor(COLORS[0])
    setColSpan(6); setTall(false); setMerged(false); setSaving(false)
  }

  const handleClose = () => { reset(); onClose() }
  const handleNext  = () => {
    if (step === 1 && widgetType) setStep(2)
    else if (step === 2 && dataSource) setStep(3)
  }

  const handleAdd = async () => {
    if (!dataSource) return
    setSaving(true)
    try {
      const autoTitle = title || DATA_SOURCES.find(s => s.key === dataSource)?.label || ''
      await onAdd({ widget_type: widgetType, data_source: dataSource, title: autoTitle, color, col_span: colSpan, tall, merged, config: {} })
      reset(); onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-[#1c1c24] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h3 className="text-base font-semibold text-white">Adicionar Widget</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === 1 ? 'Passo 1 — Escolha o tipo' : step === 2 ? 'Passo 2 — Escolha os dados' : 'Passo 3 — Aparência'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {[1,2,3].map(s => (
                <div key={s} className={cn('h-1.5 rounded-full transition-all', s === step ? 'bg-blue-500 w-5' : s < step ? 'bg-blue-500/40 w-1.5' : 'bg-white/10 w-1.5')} />
              ))}
            </div>
            <button onClick={handleClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">

          {/* Step 1: Widget type */}
          {step === 1 && (
            <div className="grid grid-cols-3 gap-3">
              {WIDGET_TYPES.map(t => {
                const Icon = ICON_MAP[t.icon]
                const active = widgetType === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => { setWT(t.key); setDS('') }}
                    className={cn(
                      'flex flex-col items-center gap-3 p-4 rounded-xl border transition-all text-center',
                      active
                        ? 'border-blue-500/60 bg-blue-500/10'
                        : 'border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]',
                    )}
                  >
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', active ? 'bg-blue-500/20' : 'bg-white/8')}>
                      {Icon && <Icon className={cn('w-5 h-5', active ? 'text-blue-400' : 'text-slate-400')} strokeWidth={1.5} />}
                    </div>
                    <div>
                      <p className={cn('text-xs font-semibold', active ? 'text-white' : 'text-slate-300')}>{t.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{t.desc}</p>
                    </div>
                    {active && <Check className="w-3 h-3 text-blue-400" />}
                  </button>
                )
              })}
            </div>
          )}

          {/* Step 2: Data source */}
          {step === 2 && (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {compatibleSources.map(s => (
                <button
                  key={s.key}
                  onClick={() => setDS(s.key)}
                  className={cn(
                    'flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all',
                    dataSource === s.key
                      ? 'border-blue-500/60 bg-blue-500/10'
                      : 'border-white/8 bg-white/[0.03] hover:border-white/20',
                  )}
                >
                  <div className={cn('w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center', dataSource === s.key ? 'border-blue-500 bg-blue-500' : 'border-slate-600')}>
                    {dataSource === s.key && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className={cn('text-sm font-medium', dataSource === s.key ? 'text-white' : 'text-slate-300')}>{s.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Appearance */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Título <span className="text-slate-600">(opcional)</span></label>
                <input
                  placeholder={DATA_SOURCES.find(s => s.key === dataSource)?.label ?? 'Título do widget'}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors"
                />
              </div>

              {/* Color mode toggle */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Cor</label>
                <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit mb-3">
                  {(['solid', 'gradient'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => { setColorMode(m); setColor(m === 'solid' ? COLORS[0] : GRADIENTS[0]) }}
                      className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all', colorMode === m ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-slate-300')}
                    >
                      {m === 'solid' ? 'Sólido' : 'Gradiente'}
                    </button>
                  ))}
                </div>

                {colorMode === 'solid' ? (
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={cn('w-7 h-7 rounded-lg transition-all shrink-0', color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1c1c24] scale-110' : 'hover:scale-110')}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {GRADIENTS.map(g => (
                      <button
                        key={g}
                        onClick={() => setColor(g)}
                        className={cn('w-10 h-7 rounded-lg transition-all shrink-0', color === g ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1c1c24] scale-110' : 'hover:scale-110')}
                        style={{ background: g }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Size */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Largura</label>
                <div className="grid grid-cols-4 gap-2">
                  {SIZE_OPTIONS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => setColSpan(s.value)}
                      className={cn(
                        'flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-center transition-all',
                        colSpan === s.value ? 'border-blue-500/60 bg-blue-500/10 text-white' : 'border-white/8 bg-white/[0.03] text-slate-400 hover:text-white hover:border-white/20',
                      )}
                    >
                      <div className="w-full h-1.5 rounded-full bg-current opacity-50 mb-1 overflow-hidden">
                        <div className="h-full rounded-full bg-current" style={{ width: `${s.frac * 100}%` }} />
                      </div>
                      <p className="text-xs font-semibold">{s.label}</p>
                      <p className="text-[10px] text-slate-500">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div className="flex gap-3">
                {([
                  { key: 'tall',   label: 'Alto',       desc: 'Dobra a altura',  val: tall,   set: setTall },
                  { key: 'merged', label: 'Sem borda',  desc: 'Visual flutuante', val: merged, set: setMerged },
                ] as const).map(opt => (
                  <label
                    key={opt.key}
                    className={cn('flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all', opt.val ? 'border-blue-500/60 bg-blue-500/10' : 'border-white/8 hover:border-white/20')}
                  >
                    <input type="checkbox" checked={opt.val} onChange={e => (opt.set as (v: boolean) => void)(e.target.checked)} className="hidden" />
                    <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center shrink-0', opt.val ? 'border-blue-500 bg-blue-500' : 'border-slate-600')}>
                      {opt.val && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-200">{opt.label}</p>
                      <p className="text-[10px] text-slate-500">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Preview swatch */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/8">
                <div className="w-8 h-8 rounded-lg shrink-0" style={{ background: color }} />
                <p className="text-xs text-slate-400">Cor selecionada</p>
                <p className="text-xs text-slate-600 font-mono truncate flex-1">{color.length > 30 ? 'gradiente' : color}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-white/10">
          <button
            onClick={step === 1 ? handleClose : () => setStep(s => s - 1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? 'Cancelar' : 'Voltar'}
          </button>

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={step === 1 ? !widgetType : !dataSource}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-40"
            >
              {saving ? 'Adicionando...' : <><Check className="w-4 h-4" /> Adicionar Widget</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
