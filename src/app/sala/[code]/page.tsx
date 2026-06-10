'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LiveKitRoom, useLocalParticipant, usePreviewTracks,
  useTracks, ParticipantTile, RoomAudioRenderer, useChat,
  useMediaDeviceSelect, useTrackToggle, useDataChannel, useParticipants, useRoomContext,
  type LocalUserChoices,
} from '@livekit/components-react'
import { Track, type LocalVideoTrack } from 'livekit-client'
import '@livekit/components-styles'
import { Loader2, Video, VideoOff, Check, X, Users, Image as ImageIcon, CircleOff, Camera, Mic, MicOff, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, MonitorUp, Smile, MessageSquare, PhoneOff, Send, Clock, Star, MoreVertical, UserX } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? ''

type Phase = 'loading' | 'notfound' | 'expired' | 'scheduled' | 'prejoin' | 'knocking' | 'denied' | 'connected' | 'left'

const SEG_OPTS = { delegate: 'GPU' as const }

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
  const [scheduledAt, setScheduledAt] = useState<string | null>(null)
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
      if (info.scheduled_at && new Date(info.scheduled_at).getTime() > Date.now()) {
        if (!cancelled) { setScheduledAt(info.scheduled_at); setPhase('scheduled') }
        return
      }

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
      <div data-lk-theme="default" style={{ height: '100dvh' }} className="bg-[#171717]">
        <LiveKitRoom
          serverUrl={LIVEKIT_URL}
          token={token}
          connect
          audio={choices.audioEnabled ? (choices.audioDeviceId ? { deviceId: choices.audioDeviceId } : true) : false}
          video={choices.videoEnabled
            ? { deviceId: choices.videoDeviceId || undefined, resolution: { width: 1280, height: 720, frameRate: 60 } }
            : false}
          options={{
            videoCaptureDefaults: { resolution: { width: 1280, height: 720, frameRate: 60 } },
            publishDefaults: { videoEncoding: { maxFramerate: 60, maxBitrate: 3_000_000 } },
          }}
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
        <div className="w-full max-w-md">
          <PermissionGate>
            <CustomPreJoin
              defaults={{ username: ownerName || '', videoEnabled: true, audioEnabled: true }}
              isHost={isHost}
              onSubmit={handlePreJoin}
            />
          </PermissionGate>
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
          {phase === 'scheduled' && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-white font-medium">{meetingTitle}</p>
              <p className="text-sm text-slate-400">
                Esta reunião está agendada para<br />
                <strong className="text-white">{scheduledAt ? new Date(scheduledAt).toLocaleString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''}</strong>
              </p>
              <button onClick={() => location.reload()} className="mt-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 text-sm font-medium transition-colors">
                Atualizar
              </button>
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

// ── Tela de preparação customizada (preview + fundo no menu da câmera) ──────────

function CustomPreJoin({
  defaults, isHost, onSubmit,
}: {
  defaults: { username?: string; videoEnabled?: boolean; audioEnabled?: boolean }
  isHost: boolean
  onSubmit: (c: LocalUserChoices) => void
}) {
  const [audioEnabled, setAudioEnabled] = useState(defaults.audioEnabled ?? true)
  const [videoEnabled, setVideoEnabled] = useState(defaults.videoEnabled ?? true)
  const [audioDeviceId, setAudioDeviceId] = useState('')
  const [videoDeviceId, setVideoDeviceId] = useState('')
  const [username, setUsername] = useState(defaults.username ?? '')
  const [bg, setBg] = useState<SavedBg>(() => (typeof window !== 'undefined' ? loadBg() : { type: 'none' }))
  const [customImg, setCustomImg] = useState<string>(() => {
    const b = typeof window !== 'undefined' ? loadBg() : { type: 'none' as const }
    return b.type === 'image' && b.value?.startsWith('data:') ? b.value : ''
  })
  const [menu, setMenu] = useState<'none' | 'cam' | 'mic'>('none')
  const [micMode, setMicModeState] = useState<MicMode>(() => (typeof window !== 'undefined' ? loadMic() : { mode: 'open', code: 'Space', label: 'Espaço' }))
  const [capturing, setCapturing] = useState(false)
  const [liveBlur, setLiveBlur] = useState<number>(() => {
    const b = typeof window !== 'undefined' ? loadBg() : { type: 'none' as const }
    return b.type === 'blur' && b.radius ? b.radius : DEFAULT_BLUR
  })

  const setMic = (m: MicMode) => { setMicModeState(m); saveMic(m) }

  // captura a tecla do push-to-talk
  useEffect(() => {
    if (!capturing) return
    const h = (e: KeyboardEvent) => {
      e.preventDefault()
      setMic({ mode: 'ptt', code: e.code, label: keyLabel(e.code) })
      setCapturing(false)
    }
    window.addEventListener('keydown', h, { once: true })
    return () => window.removeEventListener('keydown', h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturing])
  const [cams, setCams] = useState<MediaDeviceInfo[]>([])
  const [mics, setMics] = useState<MediaDeviceInfo[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const opts = useMemo(() => ({
    audio: audioEnabled ? (audioDeviceId ? { deviceId: audioDeviceId } : true) : false,
    video: videoEnabled ? (videoDeviceId ? { deviceId: videoDeviceId } : true) : false,
  }), [audioEnabled, videoEnabled, audioDeviceId, videoDeviceId])

  const tracks = usePreviewTracks(opts)
  const videoTrack = useMemo(
    () => (tracks ?? []).find(t => t.kind === Track.Kind.Video) as LocalVideoTrack | undefined,
    [tracks],
  )

  useEffect(() => {
    const el = videoRef.current
    if (el && videoTrack) videoTrack.attach(el)
    return () => { if (videoTrack && el) videoTrack.detach(el) }
  }, [videoTrack])

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(d => {
      setCams(d.filter(x => x.kind === 'videoinput'))
      setMics(d.filter(x => x.kind === 'audioinput'))
    }).catch(() => {})
  }, [tracks])

  // aplica o fundo no preview ao vivo
  useEffect(() => {
    if (!videoTrack) return
    let cancelled = false
    ;(async () => {
      try {
        if (bg.type === 'none') await videoTrack.stopProcessor()
        else if (bg.type === 'blur') {
          const { BackgroundBlur } = await import('@livekit/track-processors')
          if (!cancelled) await videoTrack.setProcessor(BackgroundBlur(bg.radius ?? DEFAULT_BLUR, SEG_OPTS))
        } else if (bg.type === 'image' && bg.value) {
          const { VirtualBackground } = await import('@livekit/track-processors')
          if (!cancelled) await videoTrack.setProcessor(VirtualBackground(bg.value, SEG_OPTS))
        }
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [videoTrack, bg])

  useEffect(() => {
    if (menu === 'none') return
    const h = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenu('none') }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menu])

  const pickBg = (b: SavedBg) => { setBg(b); saveBg(b) }
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader()
    r.onload = () => { const d = r.result as string; setCustomImg(d); pickBg({ type: 'image', value: d }) }
    r.readAsDataURL(f)
  }
  const selKey = bg.type === 'image' ? (bg.value || 'none') : bg.type

  return (
    <div ref={wrapRef} className="rounded-2xl border border-white/10 bg-[#111118] p-4 space-y-3">
      {/* Preview */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
        {videoEnabled ? (
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-semibold text-white">
              {(username || 'C').charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Botões mic / câmera, cada um com seta */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex">
          <button onClick={() => setAudioEnabled(v => !v)} className={cn('flex-1 flex items-center gap-2 h-10 px-3 rounded-l-xl text-sm border border-r-0 transition-colors', audioEnabled ? 'bg-white/5 border-white/10 text-white' : 'bg-red-500/15 border-red-500/20 text-red-300')}>
            <Mic className="w-4 h-4 shrink-0" /> {audioEnabled ? 'Microfone' : 'Mudo'}
          </button>
          <button onClick={() => setMenu(m => m === 'mic' ? 'none' : 'mic')} className="w-9 h-10 rounded-r-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white flex items-center justify-center">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        <div className="flex">
          <button onClick={() => setVideoEnabled(v => !v)} className={cn('flex-1 flex items-center gap-2 h-10 px-3 rounded-l-xl text-sm border border-r-0 transition-colors', videoEnabled ? 'bg-white/5 border-white/10 text-white' : 'bg-red-500/15 border-red-500/20 text-red-300')}>
            <Camera className="w-4 h-4 shrink-0" /> {videoEnabled ? 'Câmera' : 'Desligada'}
          </button>
          <button onClick={() => setMenu(m => m === 'cam' ? 'none' : 'cam')} className="w-9 h-10 rounded-r-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white flex items-center justify-center">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Menu microfone */}
      <AnimatePresence>
        {menu === 'mic' && (
          <motion.div
            key="micmenu"
            initial={{ opacity: 0, y: -6, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{ transformOrigin: 'top' }}
            className="rounded-xl border border-white/10 bg-[#1c1c24] p-1.5"
          >
            <p className="text-[10px] uppercase tracking-wide text-slate-500 px-2 py-1">Microfone</p>
            {mics.length === 0 && <p className="text-xs text-slate-600 px-2 py-1">Nenhum encontrado</p>}
            {mics.map(d => (
              <button key={d.deviceId} onClick={() => { setAudioDeviceId(d.deviceId) }} className={cn('w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex items-center gap-2', audioDeviceId === d.deviceId ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5')}>
                {audioDeviceId === d.deviceId && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                <span className="truncate">{d.label || 'Microfone'}</span>
              </button>
            ))}

            <div className="border-t border-white/10 mt-1.5 pt-1.5">
              <p className="text-[10px] uppercase tracking-wide text-slate-500 px-2 pb-1">Modo do microfone</p>
              <button onClick={() => setMic({ ...micMode, mode: 'open' })} className={cn('w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex items-center gap-2', micMode.mode === 'open' ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5')}>
                {micMode.mode === 'open' && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                <span>Falar automaticamente</span>
              </button>
              <button onClick={() => setMic({ ...micMode, mode: 'ptt' })} className={cn('w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex items-center gap-2', micMode.mode === 'ptt' ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5')}>
                {micMode.mode === 'ptt' && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                <span>Apertar para falar</span>
              </button>
              {micMode.mode === 'ptt' && (
                <div className="flex items-center justify-between px-2.5 py-1.5 mt-1">
                  <span className="text-[11px] text-slate-400">
                    Tecla: <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px] font-mono">{micMode.label}</kbd>
                  </span>
                  <button onClick={() => setCapturing(true)} className="text-[11px] text-blue-400 hover:text-blue-300">
                    {capturing ? 'Pressione uma tecla...' : 'Alterar'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu câmera + plano de fundo */}
      <AnimatePresence>
        {menu === 'cam' && (
          <motion.div
            key="cammenu"
            initial={{ opacity: 0, y: -6, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{ transformOrigin: 'top' }}
            className="rounded-xl border border-white/10 bg-[#1c1c24] p-2 space-y-2"
          >
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500 px-1 py-1">Câmera</p>
            {cams.length === 0 && <p className="text-xs text-slate-600 px-1 py-1">Nenhuma encontrada</p>}
            {cams.map(d => (
              <button key={d.deviceId} onClick={() => setVideoDeviceId(d.deviceId)} className={cn('w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex items-center gap-2', videoDeviceId === d.deviceId ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5')}>
                {videoDeviceId === d.deviceId && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                <span className="truncate">{d.label || 'Câmera'}</span>
              </button>
            ))}
          </div>
          <div className="border-t border-white/10 pt-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 px-1 pb-1.5">Plano de fundo</p>
            <div className="grid grid-cols-4 gap-1.5">
              <EffectTile selected={selKey === 'none'} onClick={() => pickBg({ type: 'none' })}>
                <CircleOff className="w-4 h-4 text-slate-300" /><span className="text-[9px] text-slate-400 mt-0.5">Nenhum</span>
              </EffectTile>
              <EffectTile selected={selKey === 'blur'} onClick={() => pickBg({ type: 'blur', radius: liveBlur })}>
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-400/60 to-slate-600/60 blur-[2px]" />
              </EffectTile>
              {BG_IMAGES.map(img => (
                <EffectTile key={img.url} selected={selKey === img.url} onClick={() => pickBg({ type: 'image', value: img.url })}>
                  <img src={img.url} alt={img.label} className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                </EffectTile>
              ))}
              {customImg && (
                <EffectTile selected={selKey === customImg} onClick={() => pickBg({ type: 'image', value: customImg })}>
                  <img src={customImg} alt="Sua imagem" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                </EffectTile>
              )}
              <EffectTile selected={false} onClick={() => fileRef.current?.click()}>
                <ImageIcon className="w-4 h-4 text-slate-300" /><span className="text-[9px] text-slate-400 mt-0.5">Enviar</span>
              </EffectTile>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
            {bg.type === 'blur' && (
              <div className="mt-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400">Intensidade do desfoque</span>
                  <span className="text-[10px] font-medium text-white">{radiusToPct(liveBlur)}%</span>
                </div>
                <input
                  type="range" min={0} max={100} value={radiusToPct(liveBlur)}
                  onChange={e => setLiveBlur(pctToRadius(Number(e.target.value)))}
                  onPointerUp={() => pickBg({ type: 'blur', radius: liveBlur })}
                  onKeyUp={() => pickBg({ type: 'blur', radius: liveBlur })}
                  className="w-full accent-blue-500"
                />
              </div>
            )}
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nome */}
      <input
        value={username}
        onChange={e => setUsername(e.target.value)}
        placeholder="Seu nome"
        className="w-full h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
      />

      {/* Entrar */}
      <button
        onClick={() => onSubmit({ username: username.trim() || 'Convidado', videoEnabled, audioEnabled, videoDeviceId, audioDeviceId })}
        disabled={!username.trim()}
        className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-40"
      >
        {isHost ? 'Entrar agora' : 'Pedir para entrar'}
      </button>
    </div>
  )
}

// ── Permissão de câmera/microfone ──────────────────────────────────────────────

function PermissionGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'idle' | 'requesting' | 'granted' | 'error'>('idle')
  const [errName, setErrName] = useState('')
  const [diag, setDiag] = useState('')
  const [skipped, setSkipped] = useState(false)

  const buildDiag = async (errLine: string) => {
    const parts: string[] = []
    parts.push(`url: ${window.location.protocol}//${window.location.host}`)
    parts.push(`mediaDevices: ${navigator.mediaDevices ? 'sim' : 'NAO'}`)
    parts.push(`getUserMedia: ${typeof navigator.mediaDevices?.getUserMedia === 'function' ? 'sim' : 'NAO'}`)
    try {
      const devs = await navigator.mediaDevices.enumerateDevices()
      parts.push(`cams: ${devs.filter(d => d.kind === 'videoinput').length} | mics: ${devs.filter(d => d.kind === 'audioinput').length}`)
    } catch { parts.push('enumerateDevices: falhou') }
    try {
      const cam = await navigator.permissions.query({ name: 'camera' as PermissionName })
      const mic = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      parts.push(`perm camera: ${cam.state} | mic: ${mic.state}`)
    } catch { parts.push('permissions API: indisponivel') }
    parts.push(`erro: ${errLine}`)
    setDiag(parts.join('\n'))
  }

  const request = async () => {
    setState('requesting'); setErrName(''); setDiag('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrName('NoMediaDevices'); await buildDiag('navigator.mediaDevices.getUserMedia indisponivel'); setState('error'); return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      stream.getTracks().forEach(t => t.stop())
      setState('granted')
    } catch (e) {
      const err = e as { name?: string; message?: string }
      setErrName(err?.name || 'Error')
      await buildDiag(`${err?.name || 'Error'}: ${err?.message || ''}`)
      setState('error')
    }
  }

  const messages: Record<string, { title: string; hint: string }> = {
    NotAllowedError: {
      title: 'Permissão negada',
      hint: 'Clique no ícone à esquerda do endereço (cadeado/câmera), defina Câmera e Microfone como "Permitir" e clique em Tentar novamente. No Opera: Configurações do site → Câmera/Microfone → Permitir.',
    },
    NotFoundError: {
      title: 'Nenhuma câmera/microfone encontrado',
      hint: 'Conecte uma câmera/microfone e tente novamente.',
    },
    NotReadableError: {
      title: 'Dispositivo em uso ou bloqueado pelo sistema',
      hint: 'Feche outros apps usando a câmera (OBS, Zoom, Meet) e verifique no Windows: Configurações → Privacidade e segurança → Câmera e Microfone → permita o acesso para apps de desktop / o Opera.',
    },
    SecureContext: {
      title: 'Conexão não segura',
      hint: 'Câmera/microfone só funcionam em HTTPS. Acesse por https://crm.startsette.com.',
    },
    NoMediaDevices: {
      title: 'Navegador sem acesso a mídia',
      hint: 'O navegador não expôs a API de câmera/microfone (geralmente contexto não seguro). Tente por HTTPS.',
    },
  }
  const info = messages[errName] || { title: 'Não foi possível acessar', hint: `Erro: ${errName}. Verifique as permissões do navegador.` }

  const showChildren = state === 'granted' || skipped

  return (
    <AnimatePresence mode="wait" initial={false}>
      {showChildren ? (
        <motion.div
          key="granted"
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      ) : state === 'idle' ? (
        <motion.div
          key="idle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -12, transition: { duration: 0.18 } }}
          transition={{ duration: 0.2 }}
          className="p-6 bg-[#111118]"
        >
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex gap-2.5">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-white/10 flex items-center justify-center">
                <Camera className="w-5 h-5 text-blue-400" />
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-white/10 flex items-center justify-center">
                <Mic className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="text-white font-medium">Câmera e microfone</p>
            <p className="text-sm text-slate-500 max-w-xs">Para entrar na reunião, libere o acesso. O navegador vai pedir sua permissão.</p>
            <button
              onClick={request}
              className="h-11 px-6 mt-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              Ativar câmera e microfone
            </button>
            <button
              onClick={() => setSkipped(true)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors mt-1"
            >
              Entrar sem câmera/microfone
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12, transition: { duration: 0.18 } }}
          transition={{ duration: 0.2 }}
          className="p-6 bg-[#111118]"
        >
          {state === 'requesting' ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex gap-2">
                <Camera className="w-6 h-6 text-blue-400" />
                <Mic className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-white font-medium">Pedindo acesso à câmera e microfone...</p>
              <p className="text-sm text-slate-500">Clique em <strong className="text-slate-300">Permitir</strong> quando o navegador perguntar.</p>
              <Loader2 className="w-5 h-5 animate-spin text-slate-600 mt-1" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-white font-medium">{info.title}</p>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">{info.hint}</p>
              {diag && (
                <pre className="text-[10px] text-slate-500 bg-black/40 border border-white/10 rounded-lg p-2.5 mt-1 max-w-sm w-full text-left whitespace-pre-wrap leading-relaxed">{diag}</pre>
              )}
              <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
                <button
                  onClick={request}
                  className="h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Tentar novamente
                </button>
                {errName !== 'SecureContext' && (
                  <button
                    onClick={() => setSkipped(true)}
                    className="h-10 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 text-sm font-medium transition-colors"
                  >
                    Entrar sem câmera/microfone
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Dentro da sala ───────────────────────────────────────────────────────────

const ROOM_CSS = `
/* Layout de vídeo estilo Meet (tiles dimensionados pelo espaço, sem sobrepor) */
.meet-tile {
  width: 100%;
  height: 100%;
  background: transparent; /* o wrapper segura o fundo escuro + cantos */
}
.meet-tile .lk-participant-media-video,
.meet-tile video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.meet-tile--screen .lk-participant-media-video,
.meet-tile--screen video {
  object-fit: contain;
}
/* esconde o placeholder cinza padrão do LiveKit (usamos avatar próprio) */
.meet-tile .lk-participant-placeholder { display: none !important; }
/* Anel ao redor de quem está falando (interno, pra não ser cortado pelo overflow) */
.lk-participant-tile[data-lk-speaking="true"] {
  box-shadow: inset 0 0 0 3px #3b82f6;
  transition: box-shadow 0.15s ease;
}
.meet-strip::-webkit-scrollbar { height: 6px; }
.meet-strip::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 99px; }
`

type TrackRef = ReturnType<typeof useTracks>[number]
interface ReactionItem { id: number; emoji: string; identity: string }
interface StageProps {
  tracks: TrackRef[]
  isHost: boolean
  localIdentity: string
  avatarMap: Record<string, string>
  reactions: ReactionItem[]
  onRemove: (identity: string, name: string) => void
}

function trackKey(t: TrackRef) {
  const sid = t.publication?.trackSid ?? 'placeholder'
  return `${t.participant.identity}__${t.source}__${sid}`
}

// cor de fundo estável a partir do nome (estilo Meet)
function colorFromName(name: string) {
  let h = 0
  const s = name || '?'
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360
  return `hsl(${h}, 55%, 42%)`
}

function TileAvatar({ name, avatar }: { name: string; avatar?: string | null }) {
  const initial = (name?.trim()?.[0] || '?').toUpperCase()
  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center">
      {avatar ? (
        <img src={avatar} alt={name} className="w-16 h-16 sm:w-28 sm:h-28 rounded-full object-cover border border-white/10" />
      ) : (
        <div
          className="w-16 h-16 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-2xl sm:text-4xl font-semibold text-white select-none"
          style={{ background: colorFromName(name) }}
        >
          {initial}
        </div>
      )}
    </div>
  )
}

function Tile({ t, isHost, localIdentity, avatar, reactions, onRemove }: {
  t: TrackRef
  isHost: boolean
  localIdentity: string
  avatar?: string | null
  reactions: ReactionItem[]
  onRemove: (identity: string, name: string) => void
}) {
  const p = t.participant
  const identity = p?.identity || ''
  const isScreen = t.source === Track.Source.ScreenShare
  const pub = t.publication
  const camOff = !isScreen && (!pub || pub.isMuted)
  const name = p?.name || (identity.startsWith('host-') ? 'Anfitrião' : 'Convidado')
  const canRemove = isHost && !isScreen && identity !== localIdentity
  const [menu, setMenu] = useState(false)
  const myReactions = reactions.filter(r => r.identity === identity)

  return (
    <div
      className="group relative w-full h-full rounded-2xl overflow-hidden bg-[#0f0f13]"
      onContextMenu={canRemove ? (e) => { e.preventDefault(); setMenu(true) } : undefined}
    >
      {camOff && <TileAvatar name={name} avatar={avatar} />}
      <ParticipantTile trackRef={t} className={cn('meet-tile', isScreen && 'meet-tile--screen')} />

      {/* reações da pessoa (sobem no card dela) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center">
        <AnimatePresence>
          {myReactions.map(r => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12, scale: 0.6 }}
              animate={{ opacity: 1, y: -90, scale: 1.25 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.6, ease: 'easeOut' }}
              className="absolute text-4xl sm:text-5xl select-none drop-shadow-lg"
            >
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* opções do host (expulsar) — botão + clique direito */}
      {canRemove && (
        <>
          <button
            onClick={() => setMenu(v => !v)}
            title="Opções"
            className="absolute top-2 right-2 z-30 w-8 h-8 rounded-lg bg-black/45 hover:bg-black/65 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 max-sm:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {menu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.14 }}
                  className="absolute top-11 right-2 z-40 rounded-xl border border-white/10 bg-[#1c1c24] shadow-2xl p-1.5 w-48"
                >
                  <button
                    onClick={() => { setMenu(false); onRemove(identity, name) }}
                    className="w-full text-left px-2.5 py-2 rounded-lg text-sm text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                  >
                    <UserX className="w-4 h-4" /> Remover da reunião
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}

// mede o elemento (largura/altura) de forma reativa
function useElementSize() {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect
      if (r) setSize({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

// escolhe nº de colunas/linhas e tamanho do tile (16:9) que melhor preenche o espaço
function bestGrid(n: number, W: number, H: number, gap: number) {
  if (n <= 0 || W <= 0 || H <= 0) return { tileW: 0, tileH: 0 }
  let best = { tileW: 0, tileH: 0, area: 0 }
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols)
    const cellW = (W - gap * (cols - 1)) / cols
    const cellH = (H - gap * (rows - 1)) / rows
    if (cellW <= 0 || cellH <= 0) continue
    let tW = cellW
    let tH = (cellW * 9) / 16
    if (tH > cellH) { tH = cellH; tW = (cellH * 16) / 9 }
    const area = tW * tH
    if (area > best.area) best = { tileW: Math.floor(tW), tileH: Math.floor(tH), area }
  }
  return { tileW: best.tileW, tileH: best.tileH }
}

function VideoStage({ tracks, isHost, localIdentity, avatarMap, reactions, onRemove }: StageProps) {
  const [ref, { w, h }] = useElementSize()
  const screen = tracks.find((t) => t.source === Track.Source.ScreenShare)
  const cams = tracks.filter((t) => t.source !== Track.Source.ScreenShare)

  const tileProps = (t: TrackRef) => ({
    t, isHost, localIdentity, reactions, onRemove,
    avatar: avatarMap[t.participant?.identity || ''],
  })

  // Modo foco: alguém compartilhando a tela
  if (screen) {
    return (
      <div className="h-full w-full flex flex-col gap-3 p-2 sm:p-4">
        <div className="flex-1 min-h-0 min-w-0">
          <Tile {...tileProps(screen)} />
        </div>
        {cams.length > 0 && (
          <div className="meet-strip h-[88px] sm:h-[132px] shrink-0 flex gap-2 sm:gap-3 justify-center overflow-x-auto">
            {cams.map((t) => (
              <div key={trackKey(t)} className="aspect-video h-full shrink-0">
                <Tile {...tileProps(t)} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Grid adaptável (igual ao Meet)
  const g = bestGrid(cams.length, w, h, 12)
  return (
    <div ref={ref} className="h-full w-full p-2 sm:p-4">
      <div className="flex flex-wrap items-center justify-center content-center gap-2 sm:gap-3 h-full w-full">
        {cams.map((t) => (
          <div
            key={trackKey(t)}
            className="min-w-0"
            style={g.tileW ? { width: g.tileW, height: g.tileH } : { width: '100%', aspectRatio: '16 / 9' }}
          >
            <Tile {...tileProps(t)} />
          </div>
        ))}
      </div>
    </div>
  )
}

function RoomShell({ title, code, isHost }: { title: string; code: string; isHost: boolean }) {
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const [chatOpen, setChatOpen] = useState(false)
  const [micMode, setMicModeState] = useState<MicMode>(() => (typeof window !== 'undefined' ? loadMic() : { mode: 'open', code: 'Space', label: 'Espaço' }))
  const setMic = (m: MicMode) => { setMicModeState(m); saveMic(m) }
  const [reactions, setReactions] = useState<ReactionItem[]>([])
  const [avatarMap, setAvatarMap] = useState<Record<string, string>>({})

  // fotos dos participantes do CRM (ex.: foto do anfitrião) — todos veem
  useEffect(() => {
    fetch(`/api/meetings/${code}/avatars`)
      .then(r => r.ok ? r.json() : {})
      .then((d: Record<string, string>) => { if (d && typeof d === 'object') setAvatarMap(d) })
      .catch(() => {})
  }, [code])

  const pushReaction = useCallback((emoji: string, identity: string) => {
    const id = Date.now() + Math.random()
    setReactions(r => [...r, { id, emoji, identity }])
    setTimeout(() => setReactions(r => r.filter(z => z.id !== id)), 2800)
  }, [])

  const { send } = useDataChannel('reactions', (msg) => {
    try {
      const d = JSON.parse(new TextDecoder().decode(msg.payload))
      if (d?.emoji) pushReaction(d.emoji, d.identity || msg.from?.identity || '')
    } catch { /* ignore */ }
  })
  const sendReaction = (emoji: string) => {
    const identity = localParticipant.identity
    pushReaction(emoji, identity)
    try { send(new TextEncoder().encode(JSON.stringify({ emoji, identity })), {}) } catch { /* ignore */ }
  }

  const removeParticipant = (identity: string, name: string) => {
    if (!confirm(`Remover ${name} da reunião?`)) return
    fetch(`/api/meetings/${code}/remove`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity }),
    }).catch(() => {})
  }

  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }, { source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false },
  )

  return (
    <div className="relative flex flex-col h-full bg-[#171717]">
      <style>{ROOM_CSS}</style>

      {/* Top bar cinza */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 shrink-0 bg-[#171717] border-b border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <Video className="w-4 h-4 text-slate-200" />
          </div>
          <span className="text-sm font-medium text-white truncate">{title}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 shrink-0">
          <Users className="w-3.5 h-3.5" /> {participants.length}
        </div>
      </div>

      {isHost && <HostLobby code={code} />}
      <PushToTalk mic={micMode} />

      {/* Vídeo + chat */}
      <div className="flex-1 min-h-0 flex relative">
        <div className="flex-1 min-h-0 min-w-0">
          <VideoStage
            tracks={tracks}
            isHost={isHost}
            localIdentity={localParticipant.identity}
            avatarMap={avatarMap}
            reactions={reactions}
            onRemove={removeParticipant}
          />
        </div>
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 z-40 bg-[#171717] sm:static sm:inset-auto sm:w-80 sm:shrink-0 sm:border-l border-white/10"
            >
              <CustomChat code={code} onClose={() => setChatOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <RoomAudioRenderer />
      <ControlBar
        code={code}
        isHost={isHost}
        micMode={micMode}
        setMic={setMic}
        chatOpen={chatOpen}
        onToggleChat={() => setChatOpen(o => !o)}
        onReact={sendReaction}
      />
    </div>
  )
}

function isTypingTarget() {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || (el as HTMLElement).isContentEditable
}

interface Msg { ts: number; identity: string; name: string; text: string }

function CustomChat({ code, onClose }: { code: string; onClose?: () => void }) {
  const { localParticipant } = useLocalParticipant()
  const { chatMessages, send, isSending } = useChat()
  const [text, setText] = useState('')
  const [typers, setTypers] = useState<Record<string, string>>({})
  const [messages, setMessages] = useState<Msg[]>([])
  const seen = useRef<Set<string>>(new Set())
  const listRef = useRef<HTMLDivElement>(null)

  const keyOf = (m: Msg) => `${m.ts}_${m.identity}_${m.text}`

  // histórico do banco (persiste ao sair e voltar)
  useEffect(() => {
    fetch(`/api/meetings/${code}/messages`)
      .then(r => r.json())
      .then((rows: Array<{ sender_id: string; sender_name: string; text: string; created_at: string }>) => {
        if (!Array.isArray(rows)) return
        const items: Msg[] = rows.map(r => ({ ts: new Date(r.created_at).getTime(), identity: r.sender_id || '', name: r.sender_name || 'Participante', text: r.text }))
        setMessages(prev => {
          const add = items.filter(it => !seen.current.has(keyOf(it)))
          add.forEach(it => seen.current.add(keyOf(it)))
          return [...add, ...prev].sort((a, b) => a.ts - b.ts)
        })
      })
      .catch(() => {})
  }, [code])

  // mensagens ao vivo (LiveKit) → mescla sem duplicar
  useEffect(() => {
    const add: Msg[] = []
    for (const m of chatMessages) {
      const it: Msg = { ts: m.timestamp, identity: m.from?.identity || '', name: m.from?.name || m.from?.identity || 'Participante', text: m.message }
      const k = keyOf(it)
      if (!seen.current.has(k)) { seen.current.add(k); add.push(it) }
    }
    if (add.length) setMessages(prev => [...prev, ...add].sort((a, b) => a.ts - b.ts))
  }, [chatMessages])
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const lastSentRef = useRef(0)
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { send: sendTyping } = useDataChannel('typing', (msg) => {
    try {
      const d = JSON.parse(new TextDecoder().decode(msg.payload))
      const id = msg.from?.identity || 'x'
      if (d.typing) {
        setTypers(p => ({ ...p, [id]: d.name || 'Alguém' }))
        clearTimeout(typingTimers.current[id])
        typingTimers.current[id] = setTimeout(() => setTypers(p => { const n = { ...p }; delete n[id]; return n }), 4000)
      } else {
        setTypers(p => { const n = { ...p }; delete n[id]; return n })
      }
    } catch { /* ignore */ }
  })

  const broadcastTyping = (typing: boolean) => {
    try { sendTyping(new TextEncoder().encode(JSON.stringify({ typing, name: localParticipant.name || 'Convidado' })), {}) } catch { /* ignore */ }
  }

  const onChange = (v: string) => {
    setText(v)
    const now = Date.now()
    if (v && now - lastSentRef.current > 1500) { lastSentRef.current = now; broadcastTyping(true) }
    if (stopTimer.current) clearTimeout(stopTimer.current)
    stopTimer.current = setTimeout(() => broadcastTyping(false), 2500)
  }

  const submit = async () => {
    const t = text.trim()
    if (!t || isSending) return
    setText('')
    broadcastTyping(false)
    if (stopTimer.current) clearTimeout(stopTimer.current)
    try { await send(t) } catch { /* ignore */ }
    // persiste no banco (fica salvo ao sair e voltar)
    fetch(`/api/meetings/${code}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: localParticipant.name, identity: localParticipant.identity, text: t }),
    }).catch(() => {})
  }

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const typingNames = Object.values(typers)

  return (
    <div className="flex flex-col h-full bg-[#171717]">
      <div className="px-4 py-3 border-b border-white/10 shrink-0 flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Mensagens</span>
        {onClose && (
          <button onClick={onClose} className="sm:hidden p-1.5 -mr-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors" title="Fechar">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {messages.length === 0 && (
          <p className="text-center text-xs text-slate-600 mt-8">Nenhuma mensagem ainda.<br />Diga olá! 👋</p>
        )}
        {messages.map((m, i) => {
          const mine = m.identity === localParticipant.identity
          return (
            <div key={`${m.ts}-${i}`} className={cn('flex flex-col max-w-[85%]', mine ? 'items-end ml-auto' : 'items-start')}>
              {!mine && <span className="text-[10px] text-slate-500 mb-0.5 px-1">{m.name}</span>}
              <div className={cn('px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words', mine ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white/8 text-slate-100 rounded-bl-md')}>
                {m.text}
              </div>
              <span className="text-[9px] text-slate-600 mt-0.5 px-1">{new Date(m.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )
        })}
      </div>

      <AnimatePresence>
        {typingNames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-1.5 text-[11px] text-slate-400 flex items-center gap-2 overflow-hidden"
          >
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            {typingNames.length === 1 ? `${typingNames[0]} está escrevendo...` : `${typingNames.length} pessoas escrevendo...`}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-3 border-t border-white/10 shrink-0">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
            placeholder="Escreva uma mensagem..."
            className="flex-1 h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
          />
          <button onClick={submit} disabled={!text.trim() || isSending} className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function PushToTalk({ mic }: { mic: MicMode }) {
  const { localParticipant } = useLocalParticipant()
  const [talking, setTalking] = useState(false)

  useEffect(() => {
    if (mic.mode !== 'ptt') return
    let held = false
    localParticipant.setMicrophoneEnabled(false).catch(() => {})
    const down = (e: KeyboardEvent) => {
      if (e.code !== mic.code || held || isTypingTarget()) return
      held = true
      setTalking(true)
      localParticipant.setMicrophoneEnabled(true).catch(() => {})
      if (mic.code === 'Space') e.preventDefault()
    }
    const up = (e: KeyboardEvent) => {
      if (e.code !== mic.code || !held) return
      held = false
      setTalking(false)
      localParticipant.setMicrophoneEnabled(false).catch(() => {})
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [localParticipant, mic])

  if (mic.mode !== 'ptt') return null

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium shadow-lg transition-colors',
        talking ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#1c1c24]/90 border-white/10 text-slate-300',
      )}>
        <Mic className="w-4 h-4" />
        {talking ? 'Falando...' : <>Segure <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-white text-[11px] font-mono">{mic.label}</kbd> para falar</>}
      </div>
    </div>
  )
}

const BG_KEY = 'startsette-meeting-bg'
type SavedBg = { type: 'none' | 'blur' | 'image'; value?: string; radius?: number }
const DEFAULT_BLUR = 15
// % (0-100) -> raio do desfoque (3 = leve, 60 = muito fosco)
const pctToRadius = (pct: number) => Math.max(3, Math.round((pct / 100) * 60))
const radiusToPct = (r: number) => Math.round((r / 60) * 100)
function loadBg(): SavedBg {
  try { const s = localStorage.getItem(BG_KEY); if (s) return JSON.parse(s) } catch { /* ignore */ }
  return { type: 'none' }
}
function saveBg(b: SavedBg) { try { localStorage.setItem(BG_KEY, JSON.stringify(b)) } catch { /* ignore */ } }

// Modo do microfone: aberto (sempre) ou push-to-talk (apertar pra falar)
const MIC_KEY = 'startsette-mic-mode'
type MicMode = { mode: 'open' | 'ptt'; code: string; label: string }
function loadMic(): MicMode {
  try { const s = localStorage.getItem(MIC_KEY); if (s) return JSON.parse(s) } catch { /* ignore */ }
  return { mode: 'open', code: 'Space', label: 'Espaço' }
}
function saveMic(m: MicMode) { try { localStorage.setItem(MIC_KEY, JSON.stringify(m)) } catch { /* ignore */ } }
function keyLabel(code: string): string {
  if (code === 'Space') return 'Espaço'
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  if (code.startsWith('Arrow')) return code.slice(5)
  if (code.startsWith('Control')) return 'Ctrl'
  if (code.startsWith('Shift')) return 'Shift'
  if (code.startsWith('Alt')) return 'Alt'
  return code
}

// Qualidade do compartilhamento de tela (resolução + fps + bitrate)
const SCREENQ_KEY = 'startsette-screen-quality'
type ScreenQ = { label: string; w: number; h: number; fps: number; bitrate: number }
const SCREEN_PRESETS: ScreenQ[] = [
  { label: '1080p · 60fps', w: 1920, h: 1080, fps: 60, bitrate: 6_000_000 },
  { label: '1080p · 30fps', w: 1920, h: 1080, fps: 30, bitrate: 3_000_000 },
  { label: '720p · 60fps', w: 1280, h: 720, fps: 60, bitrate: 3_500_000 },
  { label: '720p · 30fps', w: 1280, h: 720, fps: 30, bitrate: 2_000_000 },
]
function loadScreenQ(): ScreenQ {
  try { const s = localStorage.getItem(SCREENQ_KEY); if (s) return JSON.parse(s) } catch { /* ignore */ }
  return SCREEN_PRESETS[1] // 1080p · 30fps (bom p/ apresentação)
}
function saveScreenQ(q: ScreenQ) { try { localStorage.setItem(SCREENQ_KEY, JSON.stringify(q)) } catch { /* ignore */ } }

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '🎉', '👏', '🔥', '🙌']

function ControlBar({ code, isHost, micMode, setMic, chatOpen, onToggleChat, onReact }: {
  code: string
  isHost: boolean
  micMode: MicMode
  setMic: (m: MicMode) => void
  chatOpen: boolean
  onToggleChat: () => void
  onReact: (e: string) => void
}) {
  const room = useRoomContext()
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [ending, setEnding] = useState(false)

  const endForAll = async () => {
    setEnding(true)
    try { await fetch(`/api/meetings/${code}/end`, { method: 'POST' }) } catch { /* ignore */ }
    room.disconnect()
  }
  const onLeaveClick = () => { if (isHost) setConfirmEnd(true); else room.disconnect() }
  const { localParticipant } = useLocalParticipant()
  const [highlighted, setHighlighted] = useState(false)
  const highlight = () => {
    fetch(`/api/meetings/${code}/highlights`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: localParticipant.name || 'Participante', label: '' }),
    }).catch(() => {})
    setHighlighted(true); setTimeout(() => setHighlighted(false), 1500)
  }
  const micTgl = useTrackToggle({ source: Track.Source.Microphone })
  const camTgl = useTrackToggle({ source: Track.Source.Camera })
  const screenTgl = useTrackToggle({ source: Track.Source.ScreenShare })
  const micSel = useMediaDeviceSelect({ kind: 'audioinput' })
  const camSel = useMediaDeviceSelect({ kind: 'videoinput' })
  const [menu, setMenu] = useState<'none' | 'mic' | 'cam' | 'react' | 'screen'>('none')
  const [capturing, setCapturing] = useState(false)
  const [screenQ, setScreenQState] = useState<ScreenQ>(() => (typeof window !== 'undefined' ? loadScreenQ() : SCREEN_PRESETS[1]))
  const wrapRef = useRef<HTMLDivElement>(null)

  const initial = typeof window !== 'undefined' ? loadBg() : { type: 'none' as const }
  const [bgActive, setBgActive] = useState<string>(initial.type === 'image' ? (initial.value || 'none') : initial.type)
  const [customImg, setCustomImg] = useState<string>(initial.type === 'image' && initial.value?.startsWith('data:') ? initial.value : '')
  const [blurRadius, setBlurRadius] = useState<number>(initial.type === 'blur' && initial.radius ? initial.radius : DEFAULT_BLUR)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const appliedRef = useRef(false)

  const getCamTrack = () => localParticipant.getTrackPublication(Track.Source.Camera)?.track

  const applyBg = async (type: 'none' | 'blur' | 'image', url?: string, persist = true, radius?: number) => {
    if (busy) return
    setBusy(true)
    try {
      const track = getCamTrack()
      if (!track) { setBusy(false); return }
      if (type === 'none') { await track.stopProcessor(); setBgActive('none'); if (persist) saveBg({ type: 'none' }) }
      else if (type === 'blur') {
        const r = radius ?? blurRadius
        const { BackgroundBlur } = await import('@livekit/track-processors')
        await track.setProcessor(BackgroundBlur(r, SEG_OPTS)); setBgActive('blur'); if (persist) saveBg({ type: 'blur', radius: r })
      } else if (type === 'image' && url) {
        const { VirtualBackground } = await import('@livekit/track-processors')
        await track.setProcessor(VirtualBackground(url, SEG_OPTS)); setBgActive(url); if (persist) saveBg({ type: 'image', value: url })
      }
    } catch { /* ignore */ } finally { setBusy(false) }
  }

  useEffect(() => {
    if (appliedRef.current) return
    const saved = loadBg()
    if (saved.type === 'none') { appliedRef.current = true; return }
    let tries = 0
    const iv = setInterval(() => {
      tries++
      if (getCamTrack()) {
        clearInterval(iv); appliedRef.current = true
        if (saved.type === 'blur') applyBg('blur', undefined, false)
        else if (saved.type === 'image' && saved.value) applyBg('image', saved.value, false)
      } else if (tries > 60) clearInterval(iv)
    }, 500)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localParticipant])

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = () => { const d = r.result as string; setCustomImg(d); applyBg('image', d) }; r.readAsDataURL(f)
  }

  useEffect(() => {
    if (menu === 'none') return
    const h = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenu('none') }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menu])

  useEffect(() => {
    if (!capturing) return
    const h = (e: KeyboardEvent) => { e.preventDefault(); setMic({ mode: 'ptt', code: e.code, label: keyLabel(e.code) }); setCapturing(false) }
    window.addEventListener('keydown', h, { once: true })
    return () => window.removeEventListener('keydown', h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capturing])

  const pickMode = (mode: 'open' | 'ptt') => {
    setMic({ ...micMode, mode })
    if (mode === 'open') localParticipant.setMicrophoneEnabled(true).catch(() => {})
  }

  const startScreen = (q: ScreenQ) => {
    localParticipant.setScreenShareEnabled(
      true,
      { resolution: { width: q.w, height: q.h, frameRate: q.fps }, contentHint: (q.fps >= 60 ? 'motion' : 'detail') as 'motion' | 'detail' },
      { videoEncoding: { maxFramerate: q.fps, maxBitrate: q.bitrate } },
    ).catch(() => {})
  }
  const toggleScreen = () => {
    if (screenTgl.enabled) localParticipant.setScreenShareEnabled(false).catch(() => {})
    else startScreen(screenQ)
  }
  const pickScreenQ = (q: ScreenQ) => {
    setScreenQState(q); saveScreenQ(q)
    if (screenTgl.enabled) {
      localParticipant.setScreenShareEnabled(false).catch(() => {})
      setTimeout(() => startScreen(q), 300)
    }
  }

  const menuCls = 'absolute bottom-full mb-2 rounded-xl border border-white/10 bg-[#1c1c24] shadow-2xl shadow-black/50 p-2 z-50'
  const anim = { initial: { opacity: 0, y: 8, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 8, scale: 0.97 }, transition: { duration: 0.16, ease: 'easeOut' as const } }

  return (
    <div ref={wrapRef} className="relative shrink-0 bg-[#171717] border-t border-white/10">
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 sm:py-3 flex-wrap">

        {/* Microfone */}
        <div className="relative flex">
          <button onClick={() => micTgl.toggle()} className={cn('flex items-center gap-2 h-10 pl-3 pr-2.5 rounded-l-xl text-sm border border-r-0 transition-colors', micTgl.enabled ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-red-500/15 border-red-500/20 text-red-300')}>
            {micTgl.enabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            <span className="hidden sm:inline">Microfone</span>
          </button>
          <button onClick={() => setMenu(m => m === 'mic' ? 'none' : 'mic')} className="w-8 h-10 rounded-r-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white flex items-center justify-center"><ChevronUp className="w-4 h-4" /></button>
          <AnimatePresence>
            {menu === 'mic' && (
              <motion.div {...anim} style={{ transformOrigin: 'bottom left' }} className={cn(menuCls, 'left-0 w-64')}>
                <p className="text-[10px] uppercase tracking-wide text-slate-500 px-2 py-1">Microfone</p>
                {micSel.devices.map(d => (
                  <button key={d.deviceId} onClick={() => micSel.setActiveMediaDevice(d.deviceId)} className={cn('w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex items-center gap-2', micSel.activeDeviceId === d.deviceId ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5')}>
                    {micSel.activeDeviceId === d.deviceId && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                    <span className="truncate">{d.label || 'Microfone'}</span>
                  </button>
                ))}
                <div className="border-t border-white/10 mt-1.5 pt-1.5">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500 px-2 pb-1">Modo do microfone</p>
                  <button onClick={() => pickMode('open')} className={cn('w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex items-center gap-2', micMode.mode === 'open' ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5')}>
                    {micMode.mode === 'open' && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}<span>Falar automaticamente</span>
                  </button>
                  <button onClick={() => pickMode('ptt')} className={cn('w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex items-center gap-2', micMode.mode === 'ptt' ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5')}>
                    {micMode.mode === 'ptt' && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}<span>Apertar para falar</span>
                  </button>
                  {micMode.mode === 'ptt' && (
                    <div className="flex items-center justify-between px-2.5 py-1.5 mt-1">
                      <span className="text-[11px] text-slate-400">Tecla: <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white text-[10px] font-mono">{micMode.label}</kbd></span>
                      <button onClick={() => setCapturing(true)} className="text-[11px] text-blue-400 hover:text-blue-300">{capturing ? 'Pressione...' : 'Alterar'}</button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Câmera */}
        <div className="relative flex">
          <button onClick={() => camTgl.toggle()} className={cn('flex items-center gap-2 h-10 pl-3 pr-2.5 rounded-l-xl text-sm border border-r-0 transition-colors', camTgl.enabled ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-red-500/15 border-red-500/20 text-red-300')}>
            {camTgl.enabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            <span className="hidden sm:inline">Câmera</span>
          </button>
          <button onClick={() => setMenu(m => m === 'cam' ? 'none' : 'cam')} className="w-8 h-10 rounded-r-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white flex items-center justify-center"><ChevronUp className="w-4 h-4" /></button>
          <AnimatePresence>
            {menu === 'cam' && (
              <motion.div {...anim} style={{ transformOrigin: 'bottom left' }} className={cn(menuCls, 'left-0 w-72')}>
                <p className="text-[10px] uppercase tracking-wide text-slate-500 px-2 py-1">Câmera</p>
                {camSel.devices.map(d => (
                  <button key={d.deviceId} onClick={() => camSel.setActiveMediaDevice(d.deviceId)} className={cn('w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex items-center gap-2', camSel.activeDeviceId === d.deviceId ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5')}>
                    {camSel.activeDeviceId === d.deviceId && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                    <span className="truncate">{d.label || 'Câmera'}</span>
                  </button>
                ))}
                <div className="border-t border-white/10 mt-1.5 pt-1.5">
                  <div className="flex items-center justify-between px-1 pb-1.5">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Plano de fundo</p>
                    {busy && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <EffectTile selected={bgActive === 'none'} onClick={() => applyBg('none')}><CircleOff className="w-4 h-4 text-slate-300" /><span className="text-[9px] text-slate-400 mt-0.5">Nenhum</span></EffectTile>
                    <EffectTile selected={bgActive === 'blur'} onClick={() => applyBg('blur')}><div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-400/60 to-slate-600/60 blur-[2px]" /></EffectTile>
                    {BG_IMAGES.map(img => (
                      <EffectTile key={img.url} selected={bgActive === img.url} onClick={() => applyBg('image', img.url)}><img src={img.url} alt={img.label} className="absolute inset-0 w-full h-full object-cover rounded-lg" /></EffectTile>
                    ))}
                    {customImg && (<EffectTile selected={bgActive === customImg} onClick={() => applyBg('image', customImg)}><img src={customImg} alt="Sua imagem" className="absolute inset-0 w-full h-full object-cover rounded-lg" /></EffectTile>)}
                    <EffectTile selected={false} onClick={() => fileRef.current?.click()}><ImageIcon className="w-4 h-4 text-slate-300" /><span className="text-[9px] text-slate-400 mt-0.5">Enviar</span></EffectTile>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
                  {bgActive === 'blur' && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1"><span className="text-[10px] text-slate-400">Intensidade</span><span className="text-[10px] font-medium text-white">{radiusToPct(blurRadius)}%</span></div>
                      <input type="range" min={0} max={100} value={radiusToPct(blurRadius)} onChange={e => setBlurRadius(pctToRadius(Number(e.target.value)))} onPointerUp={() => applyBg('blur', undefined, true, blurRadius)} onKeyUp={() => applyBg('blur', undefined, true, blurRadius)} className="w-full accent-blue-500" />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Compartilhar tela */}
        <div className="relative flex">
          <button onClick={toggleScreen} className={cn('flex items-center gap-2 h-10 pl-3 pr-2.5 rounded-l-xl text-sm border border-r-0 transition-colors', screenTgl.enabled ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white hover:bg-white/10')}>
            <MonitorUp className="w-4 h-4" /><span className="hidden md:inline">Tela</span>
          </button>
          <button onClick={() => setMenu(m => m === 'screen' ? 'none' : 'screen')} className="w-8 h-10 rounded-r-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white flex items-center justify-center"><ChevronUp className="w-4 h-4" /></button>
          <AnimatePresence>
            {menu === 'screen' && (
              <motion.div {...anim} style={{ transformOrigin: 'bottom center' }} className={cn(menuCls, 'left-1/2 -translate-x-1/2 w-52')}>
                <p className="text-[10px] uppercase tracking-wide text-slate-500 px-2 py-1">Qualidade da tela</p>
                {SCREEN_PRESETS.map(p => {
                  const sel = p.w === screenQ.w && p.h === screenQ.h && p.fps === screenQ.fps
                  return (
                    <button key={p.label} onClick={() => pickScreenQ(p)} className={cn('w-full text-left px-2.5 py-1.5 rounded-lg text-sm flex items-center gap-2', sel ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5')}>
                      {sel && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}<span>{p.label}</span>
                    </button>
                  )
                })}
                <p className="text-[10px] text-slate-600 px-2 pt-1 leading-snug">60fps em 1080p depende do seu PC e do conteúdo.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reações */}
        <div className="relative">
          <button onClick={() => setMenu(m => m === 'react' ? 'none' : 'react')} className="flex items-center gap-2 h-10 px-3 rounded-xl text-sm border bg-white/5 border-white/10 text-white hover:bg-white/10">
            <Smile className="w-4 h-4" /><span className="hidden md:inline">Reagir</span>
          </button>
          <AnimatePresence>
            {menu === 'react' && (
              <motion.div {...anim} style={{ transformOrigin: 'bottom center' }} className={cn(menuCls, 'left-1/2 -translate-x-1/2 flex gap-1')}>
                {REACTION_EMOJIS.map(e => (
                  <button key={e} onClick={() => { onReact(e); setMenu('none') }} className="w-9 h-9 rounded-lg hover:bg-white/10 text-xl flex items-center justify-center transition-colors">{e}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Destacar momento */}
        <button onClick={highlight} title="Marcar um destaque deste momento" className={cn('flex items-center gap-2 h-10 px-3 rounded-xl text-sm border transition-colors', highlighted ? 'bg-amber-500 border-amber-400 text-white' : 'bg-white/5 border-white/10 text-white hover:bg-white/10')}>
          <Star className="w-4 h-4" /><span className="hidden md:inline">{highlighted ? 'Marcado!' : 'Destacar'}</span>
        </button>

        {/* Chat */}
        <button onClick={onToggleChat} className={cn('flex items-center gap-2 h-10 px-3 rounded-xl text-sm border transition-colors', chatOpen ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white hover:bg-white/10')}>
          <MessageSquare className="w-4 h-4" /><span className="hidden md:inline">Chat</span>
        </button>

        {/* Sair */}
        <button onClick={onLeaveClick} className="flex items-center gap-2 h-10 px-3 rounded-xl text-sm bg-red-600 hover:bg-red-500 text-white transition-colors">
          <PhoneOff className="w-4 h-4" /><span className="hidden md:inline">Sair</span>
        </button>
      </div>

      {/* Confirmação de encerramento (host) */}
      <AnimatePresence>
        {confirmEnd && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !ending && setConfirmEnd(false)} />
            <motion.div
              className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#1c1c24] shadow-2xl p-5"
              initial={{ scale: 0.94, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 8, opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0"><PhoneOff className="w-4 h-4 text-red-400" /></div>
                <h3 className="text-base font-semibold text-white">Encerrar reunião?</h3>
              </div>
              <p className="text-sm text-slate-400 mb-5">Como você é o anfitrião, ao sair a reunião será encerrada para todos e <span className="text-slate-200">ninguém poderá entrar de novo neste link</span>. A transcrição é gerada automaticamente depois.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmEnd(false)} disabled={ending} className="flex-1 h-10 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition-colors disabled:opacity-50">Cancelar</button>
                <button onClick={endForAll} disabled={ending} className="flex-1 h-10 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {ending ? <><Loader2 className="w-4 h-4 animate-spin" /> Encerrando...</> : 'Encerrar reunião'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
