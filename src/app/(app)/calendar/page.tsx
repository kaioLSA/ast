'use client'

import { useState } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuthStore } from '@/store/auth.store'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import { Plus, ChevronLeft, ChevronRight, X, CheckCircle2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

type CalEvent = {
  id: string
  label: string
  color: string
  time: string
  description: string
  day: number
  month: number
  year: number
}

const colorOptions = [
  { label: 'Azul', value: 'bg-blue-500/20 text-blue-300 border-blue-500/30', dot: 'bg-blue-400' },
  { label: 'Verde', value: 'bg-green-500/20 text-green-300 border-green-500/30', dot: 'bg-green-400' },
  { label: 'Roxo', value: 'bg-purple-500/20 text-purple-300 border-purple-500/30', dot: 'bg-purple-400' },
  { label: 'Amarelo', value: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', dot: 'bg-yellow-400' },
  { label: 'Laranja', value: 'bg-orange-500/20 text-orange-300 border-orange-500/30', dot: 'bg-orange-400' },
  { label: 'Ciano', value: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', dot: 'bg-cyan-400' },
  { label: 'Vermelho', value: 'bg-red-500/20 text-red-300 border-red-500/30', dot: 'bg-red-400' },
]

const initialEvents: CalEvent[] = [
  { id: '1', label: 'Reunião Pedro Oliveira', color: colorOptions[0].value, time: '10:00', description: 'Apresentação da proposta comercial para o lead Pedro Oliveira da Startup X. Discutir escopo e condições de pagamento.', day: 1, month: 4, year: 2026 },
  { id: '2', label: 'Demo Varejo Plus', color: colorOptions[2].value, time: '14:00', description: 'Demonstração da plataforma para a equipe de vendas da Varejo Plus. Foco nas funcionalidades de automação e relatórios.', day: 5, month: 4, year: 2026 },
  { id: '3', label: 'Follow-up Carlos Mendes', color: colorOptions[3].value, time: '09:30', description: 'Retorno à proposta enviada para Carlos Mendes da TechSolutions. Prazo limite para resposta.', day: 8, month: 4, year: 2026 },
  { id: '4', label: 'Apresentação AgriTech', color: colorOptions[0].value, time: '15:00', description: 'Reunião com Juliana Santos para apresentação dos casos de uso no setor agro. Levar material impresso.', day: 12, month: 4, year: 2026 },
  { id: '5', label: 'Fechamento Startup X', color: colorOptions[1].value, time: '11:00', description: 'Assinatura do contrato com Pedro Oliveira. R$ 72.000 anuais. Presença do jurídico necessária.', day: 15, month: 4, year: 2026 },
  { id: '6', label: 'Revisão de Pipeline', color: colorOptions[0].value, time: '13:00', description: 'Reunião interna de equipe para revisar todos os deals em aberto e definir prioridades da semana.', day: 19, month: 4, year: 2026 },
  { id: '7', label: 'Campanha Black Friday', color: colorOptions[4].value, time: '16:00', description: 'Kick-off da campanha de Black Friday com o time de marketing. Definir orçamento e criativos das campanhas Meta e Google.', day: 22, month: 4, year: 2026 },
  { id: '8', label: 'Relatório Mensal', color: colorOptions[5].value, time: '09:00', description: 'Compilação e envio do relatório de performance de Maio para toda a equipe e stakeholders.', day: 28, month: 4, year: 2026 },
]

function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function getFirstDay(y: number, m: number) { return new Date(y, m, 1).getDay() }

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

export default function CalendarPage() {
  usePageTitle('Calendário')
  const { user } = useAuthStore()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents] = useState<CalEvent[]>(user?.teamId === 'gabriel-team' ? [] : initialEvents)
  const [createModal, setCreateModal] = useState(false)
  const [viewEvent, setViewEvent] = useState<CalEvent | null>(null)
  const [form, setForm] = useState({ label: '', time: '10:00', color: colorOptions[0].value, day: '', month: String(4), year: String(2026), description: '' })
  const [saved, setSaved] = useState(false)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDay(year, month)
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const eventsForDay = (day: number) => events.filter(e => e.day === day && e.month === month && e.year === year)
  const upcomingEvents = events.filter(e => e.month === month && e.year === year).sort((a, b) => a.day - b.day)

  const openCreate = (day?: number) => {
    setForm({ label: '', time: '10:00', color: colorOptions[0].value, day: day ? String(day) : '', month: String(month), year: String(year), description: '' })
    setSaved(false)
    setCreateModal(true)
  }

  const handleSave = () => {
    if (!form.label || !form.day) return
    const newEvent: CalEvent = {
      id: String(Date.now()),
      label: form.label,
      color: form.color,
      time: form.time,
      description: form.description,
      day: Number(form.day),
      month: Number(form.month),
      year: Number(form.year),
    }
    setEvents(prev => [...prev, newEvent])
    setSaved(true)
    setTimeout(() => { setCreateModal(false); setSaved(false) }, 700)
  }

  const handleDelete = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
    if (viewEvent?.id === id) setViewEvent(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendário"
        description="Gerencie reuniões, demos e compromissos"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Calendário' }]}
        actions={
          <button onClick={() => openCreate()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Novo Evento
          </button>
        }
      />

      <div className="rounded-2xl border border-white/10 bg-white/3 backdrop-blur-sm p-6">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prev} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <h2 className="text-lg font-semibold text-white">{MONTHS[month]} {year}</h2>
          <button onClick={next} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"><ChevronRight className="w-5 h-5" /></button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-slate-500 py-2">{d}</div>)}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            const isToday = isCurrentMonth && day === today.getDate()
            const dayEvs = day ? eventsForDay(day) : []
            return (
              <div key={idx}
                onClick={() => day && openCreate(day)}
                className={cn('min-h-[90px] p-2 rounded-xl border transition-colors', day ? 'border-white/5 hover:border-white/15 hover:bg-white/3 cursor-pointer' : 'border-transparent')}>
                {day && (
                  <>
                    <span className={cn('flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mb-1', isToday ? 'bg-blue-600 text-white' : 'text-slate-400')}>
                      {day}
                    </span>
                    <div className="space-y-0.5">
                      {dayEvs.map(ev => (
                        <div key={ev.id}
                          onClick={e => { e.stopPropagation(); setViewEvent(ev) }}
                          className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium border truncate cursor-pointer hover:opacity-80 transition-opacity', ev.color)}>
                          {ev.time && <span className="opacity-70 mr-1">{ev.time}</span>}{ev.label}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming list */}
      <div className="rounded-2xl border border-white/10 bg-white/3 p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Eventos — {MONTHS[month]} {year}</h3>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">Nenhum evento neste mês.</p>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map(ev => (
              <div key={ev.id} className="flex items-center gap-4 py-2.5 border-b border-white/5 last:border-0 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sm font-bold text-white shrink-0">{ev.day}</div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setViewEvent(ev)}>
                  <p className="text-sm font-medium text-white hover:text-blue-300 transition-colors">{ev.label}</p>
                  <p className="text-xs text-slate-500">{ev.time && `${ev.time} · `}{MONTHS[ev.month]} {ev.year}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('px-2 py-0.5 rounded-md text-[11px] font-medium border', ev.color)}>Agendado</span>
                  <button onClick={() => handleDelete(ev.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View event modal */}
      <Modal open={!!viewEvent} onClose={() => setViewEvent(null)} title="Detalhes do Evento">
        {viewEvent && (
          <div className="space-y-4">
            <div className={cn('rounded-xl border p-4', viewEvent.color)}>
              <p className="text-base font-semibold">{viewEvent.label}</p>
              <p className="text-sm opacity-80 mt-1">{viewEvent.time && `${viewEvent.time} · `}{MONTHS[viewEvent.month]} {viewEvent.day}, {viewEvent.year}</p>
            </div>
            {viewEvent.description && (
              <div>
                <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wide font-medium">Descrição</p>
                <p className="text-sm text-slate-300 leading-relaxed">{viewEvent.description}</p>
              </div>
            )}
            <button
              onClick={() => handleDelete(viewEvent.id)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Excluir evento
            </button>
          </div>
        )}
      </Modal>

      {/* Create event modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Novo Evento">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Título *</label>
            <input placeholder="Ex: Reunião com cliente" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Dia *</label>
              <input type="number" min={1} max={31} placeholder="15" value={form.day} onChange={e => setForm(p => ({ ...p, day: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Mês</label>
              <select value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-2 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors">
                {MONTHS.map((m, i) => <option key={i} value={i} className="bg-[#0d1425]">{m.slice(0, 3)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Ano</label>
              <select value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-2 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors">
                {[2025, 2026, 2027].map(y => <option key={y} value={y} className="bg-[#0d1425]">{y}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Horário</label>
            <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
              className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/60 transition-colors" />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Descrição</label>
            <textarea placeholder="Detalhes sobre o evento..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors resize-none" />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Cor</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map(opt => (
                <button key={opt.value} type="button" onClick={() => setForm(p => ({ ...p, color: opt.value }))}
                  className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all', opt.value, form.color === opt.value ? 'ring-2 ring-white/40 scale-105' : 'opacity-70 hover:opacity-100')}>
                  <span className={cn('w-2 h-2 rounded-full', opt.dot)} />{opt.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSave}
            className={cn('w-full h-10 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2', saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white')}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Salvo!</> : <><Plus className="w-4 h-4" /> Adicionar Evento</>}
          </button>
        </div>
      </Modal>
    </div>
  )
}
