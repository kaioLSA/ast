'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import {
  Video, Plus, Copy, Check, ExternalLink, Clock, X, Loader2, Link2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Meeting {
  id: string
  code: string
  title: string | null
  created_at: string
  expires_at: string
  active: boolean
}

function meetingLink(code: string) {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/sala/${code}`
}

function isExpired(m: Meeting) {
  return !m.active || new Date(m.expires_at).getTime() < Date.now()
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function MeetingsPage() {
  usePageTitle('Reuniões')
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [title, setTitle] = useState('')
  const [hours, setHours] = useState('12')
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<Meeting | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch('/api/meetings')
      .then(r => r.json())
      .then((d: Meeting[]) => { if (Array.isArray(d)) setMeetings(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const create = async () => {
    setCreating(true)
    try {
      const r = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || 'Reunião', hours: Number(hours) }),
      })
      if (r.ok) {
        const m = await r.json()
        setCreated(m)
        setMeetings(prev => [m, ...prev])
      }
    } finally {
      setCreating(false)
    }
  }

  const copy = (code: string) => {
    navigator.clipboard.writeText(meetingLink(code)).then(() => {
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 1500)
    })
  }

  const openModal = () => { setTitle(''); setHours('12'); setCreated(null); setModal(true) }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reuniões"
        description="Crie uma sala, mande o link e controle quem entra — câmera, microfone e fundo borrado"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Reuniões' }]}
      />

      <div className="flex justify-end">
        <button
          onClick={openModal}
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
          <button onClick={openModal} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nova reunião
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {meetings.map(m => {
            const expired = isExpired(m)
            return (
              <div key={m.id} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/3 px-4 py-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-white/10 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{m.title || 'Reunião'}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {expired ? 'Expirada' : `Expira ${fmt(m.expires_at)}`}
                  </p>
                </div>
                {!expired && (
                  <>
                    <button
                      onClick={() => copy(m.code)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {copiedCode === m.code ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar link</>}
                    </button>
                    <a
                      href={`/sala/${m.code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Entrar
                    </a>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modal && <CreateModal
        title={title} setTitle={setTitle}
        hours={hours} setHours={setHours}
        creating={creating} created={created}
        onCreate={create}
        onCopy={copy} copiedCode={copiedCode}
        onClose={() => setModal(false)}
      />}
    </div>
  )
}

function CreateModal({
  title, setTitle, hours, setHours, creating, created, onCreate, onCopy, copiedCode, onClose,
}: {
  title: string; setTitle: (v: string) => void
  hours: string; setHours: (v: string) => void
  creating: boolean; created: Meeting | null
  onCreate: () => void; onCopy: (code: string) => void; copiedCode: string | null
  onClose: () => void
}) {
  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#1c1c24] shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h3 className="text-base font-semibold text-white">{created ? 'Reunião criada' : 'Nova reunião'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {created ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">Compartilhe este link. Quem abrir vai pedir entrada e você admite na sala.</p>
              <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
                <Link2 className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="flex-1 min-w-0 truncate text-sm text-slate-200">{meetingLink(created.code)}</span>
                <button
                  onClick={() => onCopy(created.code)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-xs text-white hover:bg-white/20 transition-colors shrink-0"
                >
                  {copiedCode === created.code ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
                </button>
              </div>
              <a
                href={`/sala/${created.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" /> Entrar na sala
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Título</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Reunião com cliente"
                  className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">O link expira em</label>
                <select
                  value={hours}
                  onChange={e => setHours(e.target.value)}
                  className="w-full h-10 rounded-xl bg-[#1c1c24] border border-white/10 px-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="1">1 hora</option>
                  <option value="12">12 horas</option>
                  <option value="24">24 horas</option>
                  <option value="72">3 dias</option>
                </select>
              </div>
              <button
                onClick={onCreate}
                disabled={creating}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando...</> : <><Plus className="w-4 h-4" /> Criar reunião</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
