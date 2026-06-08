'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
  LiveKitRoom, VideoConference, PreJoin, useLocalParticipant,
  type LocalUserChoices,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import '@livekit/components-styles'
import { Loader2, Video, Sparkles, Check, X, Users, Image as ImageIcon, CircleOff } from 'lucide-react'

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? ''

type Phase = 'loading' | 'notfound' | 'expired' | 'prejoin' | 'knocking' | 'denied' | 'connected' | 'left'

const BG_IMAGES = [
  { label: 'Praia', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1280&q=80&auto=format&fit=crop' },
  { label: 'Escritório', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&q=80&auto=format&fit=crop' },
  { label: 'Sala', url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1280&q=80&auto=format&fit=crop' },
  { label: 'Natureza', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1280&q=80&auto=format&fit=crop' },
]

export default function SalaPage() {
  const params = useParams<{ code: string }>()
  const code = params.code

  const [phase, setPhase] = useState<Phase>('loading')
  const [isHost, setIsHost] = useState(false)
  const [ownerName, setOwnerName] = useState('')
  const [ownerAvatar, setOwnerAvatar] = useState<string | null>(null)
  const [hostToken, setHostToken] = useState('')
  const [token, setToken] = useState('')
  const [meetingTitle, setMeetingTitle] = useState('Reunião')
  const [choices, setChoices] = useState<LocalUserChoices | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const infoRes = await fetch(`/api/meetings/${code}`)
      if (!infoRes.ok) { if (!cancelled) setPhase('notfound'); return }
      const info = await infoRes.json()
      if (info.expired) { if (!cancelled) setPhase('expired'); return }
      if (info.title) setMeetingTitle(info.title)

      const hostRes = await fetch(`/api/meetings/${code}/host-token`, { method: 'POST' })
      if (hostRes.ok) {
        const d = await hostRes.json()
        if (!cancelled) {
          setHostToken(d.token); setIsHost(true)
          setOwnerName(d.name || ''); setOwnerAvatar(d.avatar || null)
        }
      }
      if (!cancelled) setPhase('prejoin')
    })()
    return () => { cancelled = true }
  }, [code])

  const startPolling = useCallback((reqId: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      const r = await fetch(`/api/meetings/${code}/knock/${reqId}`)
      if (!r.ok) return
      const d = await r.json()
      if (d.status === 'approved' && d.token) {
        if (pollRef.current) clearInterval(pollRef.current)
        setToken(d.token); setPhase('connected')
      } else if (d.status === 'denied') {
        if (pollRef.current) clearInterval(pollRef.current)
        setPhase('denied')
      }
    }, 2500)
  }, [code])

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const handlePreJoin = async (values: LocalUserChoices) => {
    setChoices(values)
    if (isHost) {
      setToken(hostToken)
      setPhase('connected')
      return
    }
    // convidado: bate na porta
    setPhase('knocking')
    const r = await fetch(`/api/meetings/${code}/knock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: values.username }),
    })
    if (!r.ok) { setPhase('prejoin'); return }
    const d = await r.json()
    startPolling(d.requestId)
  }

  // ── Sala conectada ───────────────────────────────────────────────────────────
  if (phase === 'connected' && token && choices) {
    return (
      <div data-lk-theme="default" style={{ height: '100dvh' }} className="bg-[#0a0a0f]">
        <LiveKitRoom
          serverUrl={LIVEKIT_URL}
          token={token}
          connect
          audio={choices.audioEnabled ? (choices.audioDeviceId ? { deviceId: choices.audioDeviceId } : true) : false}
          video={choices.videoEnabled ? (choices.videoDeviceId ? { deviceId: choices.videoDeviceId } : true) : false}
          onDisconnected={() => setPhase('left')}
          style={{ height: '100%' }}
        >
          <RoomShell title={meetingTitle} code={code} isHost={isHost} />
        </LiveKitRoom>
      </div>
    )
  }

  // ── Pré-join ─────────────────────────────────────────────────────────────────
  if (phase === 'prejoin') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0a0a0f] p-4 gap-6">
        <Brand />
        <div className="text-center">
          {isHost && ownerAvatar ? (
            <img src={ownerAvatar} alt={ownerName} className="w-14 h-14 rounded-full mx-auto mb-2 object-cover border border-white/10" />
          ) : isHost ? (
            <div className="w-14 h-14 rounded-full mx-auto mb-2 bg-blue-600 flex items-center justify-center text-lg font-semibold text-white">
              {ownerName.charAt(0) || 'A'}
            </div>
          ) : null}
          <h1 className="text-lg font-semibold text-white">{meetingTitle}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isHost ? `Entrando como ${ownerName}` : 'Ajuste sua câmera e microfone para entrar'}
          </p>
        </div>
        <div data-lk-theme="default" className="w-full max-w-md rounded-2xl overflow-hidden border border-white/10">
          <PreJoin
            defaults={{ username: ownerName || '', videoEnabled: true, audioEnabled: true }}
            onSubmit={handlePreJoin}
            joinLabel={isHost ? 'Entrar agora' : 'Pedir para entrar'}
            micLabel="Microfone"
            camLabel="Câmera"
            userLabel="Seu nome"
            persistUserChoices={false}
          />
        </div>
      </div>
    )
  }

  // ── Demais estados ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#0a0a0f] p-4">
      <div className="w-full max-w-sm">
        <Brand className="mb-6" />
        <div className="rounded-2xl border border-white/10 bg-[#111118] p-6">
          {phase === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              <p className="text-sm text-slate-500">Carregando reunião...</p>
            </div>
          )}
          {phase === 'notfound' && (
            <div className="text-center py-4">
              <p className="text-white font-medium mb-1">Reunião não encontrada</p>
              <p className="text-sm text-slate-500">O link pode estar incorreto.</p>
            </div>
          )}
          {phase === 'expired' && (
            <div className="text-center py-4">
              <p className="text-white font-medium mb-1">Link expirado</p>
              <p className="text-sm text-slate-500">Esta reunião não está mais disponível.</p>
            </div>
          )}
          {phase === 'knocking' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              <p className="text-white font-medium">Aguardando o anfitrião...</p>
              <p className="text-sm text-slate-500">Você entra assim que for admitido.</p>
            </div>
          )}
          {phase === 'denied' && (
            <div className="text-center py-4">
              <p className="text-white font-medium mb-1">Entrada não permitida</p>
              <p className="text-sm text-slate-500">O anfitrião recusou seu pedido.</p>
            </div>
          )}
          {phase === 'left' && (
            <div className="text-center py-4">
              <p className="text-white font-medium mb-3">Você saiu da reunião</p>
              <button onClick={() => location.reload()} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
                Entrar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Brand({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
        <Video className="w-5 h-5 text-white" />
      </div>
      <span className="text-lg font-semibold text-white">Startsette · Reuniões</span>
    </div>
  )
}

// ── Dentro da sala ───────────────────────────────────────────────────────────

function RoomShell({ title, code, isHost }: { title: string; code: string; isHost: boolean }) {
  return (
    <div className="relative flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#111118] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white truncate">{title}</span>
        </div>
        <EffectsButton />
      </div>

      {isHost && <HostLobby code={code} />}

      <div className="flex-1 min-h-0">
        <VideoConference />
      </div>
    </div>
  )
}

function EffectsButton() {
  const { localParticipant } = useLocalParticipant()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string>('none')
  const [busy, setBusy] = useState(false)

  const apply = async (type: 'none' | 'blur' | 'image', url?: string) => {
    if (busy) return
    setBusy(true)
    try {
      const pub = localParticipant.getTrackPublication(Track.Source.Camera)
      const track = pub?.track
      if (!track) { setBusy(false); return }
      if (type === 'none') {
        await track.stopProcessor()
        setActive('none')
      } else if (type === 'blur') {
        const { BackgroundBlur } = await import('@livekit/track-processors')
        await track.setProcessor(BackgroundBlur(15))
        setActive('blur')
      } else if (type === 'image' && url) {
        const { VirtualBackground } = await import('@livekit/track-processors')
        await track.setProcessor(VirtualBackground(url))
        setActive(url)
      }
    } catch { /* ignora */ } finally { setBusy(false) }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5" /> Efeitos de fundo
      </button>

      {open && (
        <div className="absolute top-10 right-0 z-50 w-72 rounded-2xl border border-white/10 bg-[#1c1c24] shadow-2xl shadow-black/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white">Plano de fundo</span>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <EffectTile selected={active === 'none'} onClick={() => apply('none')}>
              <CircleOff className="w-5 h-5 text-slate-300" />
              <span className="text-[10px] text-slate-400 mt-1">Nenhum</span>
            </EffectTile>
            <EffectTile selected={active === 'blur'} onClick={() => apply('blur')}>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-400/60 to-slate-600/60 blur-[2px]" />
              <span className="text-[10px] text-slate-400 mt-1">Borrado</span>
            </EffectTile>
            {BG_IMAGES.map(img => (
              <EffectTile key={img.url} selected={active === img.url} onClick={() => apply('image', img.url)}>
                <img src={img.url} alt={img.label} className="absolute inset-0 w-full h-full object-cover rounded-lg" />
              </EffectTile>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 mt-2 flex items-center gap-1">
            <ImageIcon className="w-3 h-3" /> Ligue a câmera para aplicar
          </p>
        </div>
      )}
    </div>
  )
}

function EffectTile({ children, selected, onClick }: { children: React.ReactNode; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative h-16 rounded-lg border flex flex-col items-center justify-center overflow-hidden transition-colors ${
        selected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-white/10 bg-white/5 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

interface PendingReq { id: string; guest_name: string }

function HostLobby({ code }: { code: string }) {
  const [pending, setPending] = useState<PendingReq[]>([])

  useEffect(() => {
    let active = true
    const load = async () => {
      const r = await fetch(`/api/meetings/${code}/knock`)
      if (!r.ok) return
      const d = await r.json()
      if (active && Array.isArray(d)) setPending(d)
    }
    load()
    const t = setInterval(load, 3000)
    return () => { active = false; clearInterval(t) }
  }, [code])

  const decide = async (id: string, approve: boolean) => {
    setPending(prev => prev.filter(p => p.id !== id))
    await fetch(`/api/meetings/${code}/knock/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approve }),
    })
  }

  if (pending.length === 0) return null

  return (
    <div className="absolute top-16 right-4 z-50 w-72 rounded-2xl border border-white/10 bg-[#1c1c24] shadow-2xl shadow-black/50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
        <Users className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-semibold text-white">Pedidos de entrada ({pending.length})</span>
      </div>
      <div className="max-h-72 overflow-y-auto p-2 space-y-1.5">
        {pending.map(p => (
          <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5">
            <span className="flex-1 min-w-0 text-sm text-slate-200 truncate">{p.guest_name}</span>
            <button onClick={() => decide(p.id, true)} className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 flex items-center justify-center transition-colors" title="Admitir">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => decide(p.id, false)} className="w-7 h-7 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 flex items-center justify-center transition-colors" title="Recusar">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
