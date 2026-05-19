'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import {
  Send, Search, RefreshCw, Users, MessageCircle, Loader2,
  MoreVertical, X, Check, UserPlus, Briefcase, UsersRound, Contact,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useWhatsAppStore } from '@/store/whatsapp.store'

// ── Types ────────────────────────────────────────────────────────────────────

type Chat = {
  id: string
  name: string
  phone: string
  participantJid: string | null
  lastMsg: string
  timestamp: number
  unread: number
  isGroup: boolean
  lastFromMe: boolean
}

type Msg = {
  id: string
  from: 'me' | 'them'
  text: string
  time: string
  timestamp: number
  senderName?: string | null
}

type ModalType = 'lead' | 'client' | 'group' | 'contact'

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeLabel(ts: number) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const diffDays = Math.floor(diff / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Ontem'
  if (diffDays < 7) return `${diffDays}d`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function formatMsgTime(ts: number) {
  if (!ts) return ''
  return new Date(ts * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
}

const GRADIENTS = [
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-rose-500 to-pink-500',
  'from-indigo-500 to-blue-600',
]

function chatGradient(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % GRADIENTS.length
  return GRADIENTS[Math.abs(h) % GRADIENTS.length]
}

/** Returns true if the name looks like a formatted phone (e.g. "(11) 91234-5678") */
function isPhoneName(name: string) {
  return /^\(\d{2}\)/.test(name) || /^\d{8,}$/.test(name)
}

// ── Form field helper ─────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5 font-medium">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 transition-colors'
const selectCls = `${inputCls} cursor-pointer`

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WhatsappPage() {
  usePageTitle('WhatsApp')
  const { setTotalUnread, clearPending, localUnread, clearChatUnread } = useWhatsAppStore()

  useEffect(() => { clearPending() }, [clearPending])

  // ── Chat list state ──
  const [chats, setChats] = useState<Chat[]>([])
  const [chatsLoading, setChatsLoading] = useState(true)
  const [chatsError, setChatsError] = useState('')

  // ── Conversation state ──
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [msgsLoading, setMsgsLoading] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'chats' | 'groups'>('chats')

  // ── Context menu state ──
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; chat: Chat } | null>(null)

  // ── Modal state ──
  const [activeModal, setActiveModal] = useState<ModalType | null>(null)
  const [modalChat, setModalChat] = useState<Chat | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Context menu helpers ──────────────────────────────────────────────────

  const openCtxMenu = (e: React.MouseEvent, chat: Chat) => {
    e.preventDefault()
    e.stopPropagation()
    const x = Math.min(e.clientX, window.innerWidth - 224)
    const y = Math.min(e.clientY, window.innerHeight - 220)
    setCtxMenu({ x, y, chat })
  }

  // Close context menu on click outside — add listener on next tick so the
  // click that opened the menu doesn't immediately trigger the close handler
  useEffect(() => {
    if (!ctxMenu) return
    const close = () => setCtxMenu(null)
    const timer = setTimeout(() => {
      document.addEventListener('click', close, { once: true })
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', close)
    }
  }, [ctxMenu])

  // ── Modal helpers ────────────────────────────────────────────────────────

  const openModal = (type: ModalType, chat: Chat) => {
    setCtxMenu(null)
    setActiveModal(type)
    setModalChat(chat)
    setSuccess(false)
    setSubmitError('')

    const phoneName = isPhoneName(chat.name) ? '' : chat.name
    const phoneVal = chat.phone || chat.name

    if (type === 'contact') {
      setForm({ name: '', phone: phoneVal })
    } else if (type === 'lead') {
      setForm({
        name: phoneName,
        phone: phoneVal,
        email: '',
        company: '',
        status: 'new',
        temperature: 'warm',
        value: '0',
        score: '70',
        notes: '',
      })
    } else if (type === 'client') {
      setForm({
        name: phoneName,
        phone: phoneVal,
        email: '',
        company_name: '',
        status: 'prospect',
        value: '0',
        deals: '0',
        score: '70',
        since: new Date().toISOString().split('T')[0],
      })
    } else if (type === 'group') {
      setForm({ subject: '' })
    }
  }

  const closeModal = () => {
    setActiveModal(null)
    setModalChat(null)
    setSuccess(false)
    setSubmitError('')
  }

  const setField = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  // ── Submit handlers ───────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!modalChat || submitting) return
    setSubmitting(true)
    setSubmitError('')

    try {
      if (activeModal === 'contact') {
        if (!form.name?.trim()) { setSubmitError('Nome é obrigatório'); setSubmitting(false); return }
        const res = await fetch('/api/whatsapp/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: modalChat.phone, name: form.name.trim() }),
        })
        if (!res.ok) throw new Error(await res.text())
        // Update local chat name immediately
        setChats(prev => prev.map(c =>
          c.id === modalChat.id ? { ...c, name: form.name.trim() } : c
        ))

      } else if (activeModal === 'lead') {
        if (!form.name?.trim()) { setSubmitError('Nome é obrigatório'); setSubmitting(false); return }
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone,
            email: form.email,
            company: form.company,
            status: form.status || 'new',
            source: 'whatsapp',
            temperature: form.temperature || 'warm',
            value: Number(form.value) || 0,
            score: Number(form.score) || 70,
            notes: form.notes,
          }),
        })
        if (!res.ok) throw new Error(await res.text())

      } else if (activeModal === 'client') {
        if (!form.name?.trim()) { setSubmitError('Nome é obrigatório'); setSubmitting(false); return }
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone,
            email: form.email,
            company_name: form.company_name,
            status: form.status || 'prospect',
            value: Number(form.value) || 0,
            deals: Number(form.deals) || 0,
            score: Number(form.score) || 70,
            since: form.since || new Date().toISOString().split('T')[0],
          }),
        })
        if (!res.ok) throw new Error(await res.text())

      } else if (activeModal === 'group') {
        if (!form.subject?.trim()) { setSubmitError('Nome do grupo é obrigatório'); setSubmitting(false); return }
        const participant = modalChat.participantJid || modalChat.id
        const res = await fetch('/api/whatsapp/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: form.subject.trim(),
            participants: [participant],
          }),
        })
        if (!res.ok) throw new Error(await res.text())
      }

      setSuccess(true)
      setTimeout(() => closeModal(), 1800)
    } catch (err) {
      setSubmitError(String(err).replace('Error: ', ''))
    } finally {
      setSubmitting(false)
    }
  }

  // ── Chat list loader ──────────────────────────────────────────────────────

  const loadChats = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/chats')
      const data = await res.json()
      if (Array.isArray(data)) {
        setChats(data)
        setChatsError('')
        const total = data.reduce((s: number, c: Chat) => s + (c.unread || 0), 0)
        setTotalUnread(total)
      } else {
        setChatsError(data.error ?? 'Erro ao carregar conversas')
      }
    } catch {
      setChatsError('Sem conexão com a API')
    } finally {
      setChatsLoading(false)
    }
  }, [setTotalUnread])

  useEffect(() => { loadChats() }, [loadChats])

  // ── Messages loader ────────────────────────────────────────────────────────

  const loadMessages = useCallback(async (chatId: string, silent = false) => {
    if (!silent) setMsgsLoading(true)
    try {
      const res = await fetch(`/api/whatsapp/chats/${encodeURIComponent(chatId)}/messages`)
      const data = await res.json()
      if (Array.isArray(data)) setMessages(data)
    } catch { /* ignore */ }
    finally { setMsgsLoading(false) }
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setMessages([])
    loadMessages(selectedId)
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(() => loadMessages(selectedId, true), 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [selectedId, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // ── Send message ─────────────────────────────────────────────────────────

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || !selectedId || sending) return
    setMessages(prev => [...prev, { id: `opt-${Date.now()}`, from: 'me', text, time: '', timestamp: Math.floor(Date.now() / 1000) }])
    setInput('')
    setSending(true)
    try {
      const number = selectedId.replace('@s.whatsapp.net', '').replace('@g.us', '').replace('@lid', '')
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, text }),
      })
    } catch { /* keep optimistic */ }
    finally { setSending(false) }
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const selectedChat = chats.find(c => c.id === selectedId)
  const filtered = chats.filter(c =>
    c.isGroup === (tab === 'groups') &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()))
  )
  const individualChats = chats.filter(c => !c.isGroup)
  const groupChats = chats.filter(c => c.isGroup)
  const individualUnread = individualChats.reduce((s, c) => s + (c.unread || 0), 0)
  const groupUnread = groupChats.reduce((s, c) => s + (c.unread || 0), 0)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp"
        description="Central de mensagens e conversas"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'WhatsApp' }]}
        actions={
          <button
            onClick={() => { setChatsLoading(true); loadChats() }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', chatsLoading && 'animate-spin')} />
            Atualizar
          </button>
        }
      />

      <div className="rounded-2xl border border-white/10 bg-white/3 overflow-hidden flex" style={{ height: 'calc(100vh - 220px)', minHeight: 520 }}>

        {/* ── Sidebar ── */}
        <div className="w-80 shrink-0 border-r border-white/10 flex flex-col">

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {(['chats', 'groups'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setSelectedId(null) }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors relative',
                  tab === t ? 'text-white' : 'text-slate-500 hover:text-slate-300',
                )}
              >
                {t === 'chats' ? <MessageCircle className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                {t === 'chats' ? 'Conversas' : 'Grupos'}
                {t === 'chats' && individualUnread > 0 && (
                  <span className="min-w-[16px] h-4 rounded-full bg-green-500 text-white text-[9px] flex items-center justify-center font-bold px-1">
                    {individualUnread > 9 ? '9+' : individualUnread}
                  </span>
                )}
                {t === 'groups' && groupUnread > 0 && (
                  <span className="min-w-[16px] h-4 rounded-full bg-green-500 text-white text-[9px] flex items-center justify-center font-bold px-1">
                    {groupUnread > 9 ? '9+' : groupUnread}
                  </span>
                )}
                {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={tab === 'chats' ? 'Buscar conversas...' : 'Buscar grupos...'}
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto">
            {chatsLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="text-xs">Carregando conversas...</p>
              </div>
            ) : chatsError ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
                <MessageCircle className="w-8 h-8 text-slate-600" />
                <p className="text-xs text-red-400">{chatsError}</p>
                <button onClick={() => { setChatsLoading(true); loadChats() }} className="text-xs text-blue-400 hover:text-blue-300">Tentar novamente</button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-500">
                {tab === 'groups' ? <Users className="w-8 h-8 text-slate-600" /> : <MessageCircle className="w-8 h-8 text-slate-600" />}
                <p className="text-xs">{tab === 'groups' ? 'Nenhum grupo encontrado' : 'Nenhuma conversa encontrada'}</p>
              </div>
            ) : (
              filtered.map(c => {
                const count = localUnread[c.id] ?? c.unread
                const badgeLabel = count > 4 ? '4+' : String(count)
                return (
                  <div
                    key={c.id}
                    onContextMenu={e => openCtxMenu(e, c)}
                    onClick={() => {
                      setSelectedId(c.id)
                      clearChatUnread(c.id)
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      ;(window as any).__waSetSelectedChat?.(c.id)
                      setChats(prev => {
                        const updated = prev.map(x => x.id === c.id ? { ...x, unread: 0 } : x)
                        setTotalUnread(updated.reduce((s, x) => s + (x.unread || 0), 0))
                        return updated
                      })
                    }}
                    className={cn(
                      'group relative w-full flex items-center gap-3 px-3 py-3 text-left border-b border-white/5 transition-colors cursor-pointer select-none',
                      selectedId === c.id ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : 'hover:bg-white/5',
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn('w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white shrink-0', chatGradient(c.id))}>
                      {c.isGroup ? <Users className="w-4 h-4" /> : initials(c.name)}
                    </div>

                    {/* Name + last msg */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-xs font-semibold text-white truncate pr-1">{c.name}</p>
                        <span className="text-[10px] text-slate-500 shrink-0">{timeLabel(c.timestamp)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{c.lastMsg}</p>
                    </div>

                    {/* Badge + three-dot */}
                    <div className="flex items-center gap-1 shrink-0">
                      {count > 0 && (
                        <span className="min-w-[18px] h-[18px] rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center font-bold px-1">
                          {badgeLabel}
                        </span>
                      )}
                      {/* Three-dot button */}
                      <button
                        onClick={e => { e.stopPropagation(); openCtxMenu(e, c) }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/15 transition-all"
                        title="Mais opções"
                      >
                        <MoreVertical className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Stats bar */}
          {!chatsLoading && !chatsError && (
            <div className="px-4 py-2 border-t border-white/10 flex items-center gap-3 text-[11px] text-slate-500">
              {tab === 'chats' ? (
                <><span>{individualChats.length} conversas</span><span>·</span><span>{individualChats.filter(c => c.unread > 0).length} não lidas</span></>
              ) : (
                <><span>{groupChats.length} grupos</span><span>·</span><span>{groupChats.filter(c => c.unread > 0).length} não lidos</span></>
              )}
            </div>
          )}
        </div>

        {/* ── Active chat ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                {tab === 'groups' ? <Users className="w-8 h-8 text-slate-600" /> : <MessageCircle className="w-8 h-8 text-slate-600" />}
              </div>
              <p className="text-sm">{tab === 'groups' ? 'Selecione um grupo' : 'Selecione uma conversa'}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10">
                <div className={cn('w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white shrink-0', chatGradient(selectedChat.id))}>
                  {selectedChat.isGroup ? <Users className="w-4 h-4" /> : initials(selectedChat.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{selectedChat.name}</p>
                  <p className="text-xs text-slate-500 truncate">{selectedChat.phone || selectedChat.id.split('@')[0]}</p>
                </div>
                {/* Quick action button in header */}
                {!selectedChat.isGroup && (
                  <button
                    onClick={e => openCtxMenu(e, selectedChat)}
                    className="p-2 rounded-xl hover:bg-white/8 text-slate-400 hover:text-white transition-colors"
                    title="Mais opções"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {msgsLoading ? (
                  <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">Nenhuma mensagem encontrada</div>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className={cn('flex', m.from === 'me' ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[65%] rounded-2xl px-4 py-2.5 text-sm',
                        m.from === 'me' ? 'bg-green-600 text-white rounded-br-sm' : 'bg-white/8 border border-white/10 text-slate-200 rounded-bl-sm',
                      )}>
                        {m.from === 'them' && selectedChat.isGroup && m.senderName && (
                          <p className="text-[11px] font-semibold mb-1 text-blue-400">{m.senderName}</p>
                        )}
                        <p className="break-words whitespace-pre-wrap">{m.text}</p>
                        <p className={cn('text-[10px] mt-1', m.from === 'me' ? 'text-green-200 text-right' : 'text-slate-500')}>
                          {formatMsgTime(m.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <div className="px-5 py-4 border-t border-white/10">
                <div className="flex gap-3">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Digite uma mensagem..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500/50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Context menu ── */}
      {ctxMenu && (
        <div
          className="fixed z-50 bg-[#0d1526] border border-white/12 rounded-xl shadow-2xl py-1.5 w-52 overflow-hidden"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <p className="px-3 py-1.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wide truncate border-b border-white/8 mb-1">
            {ctxMenu.chat.name}
          </p>

          <button
            onClick={() => openModal('lead', ctxMenu.chat)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/8 transition-colors text-left"
          >
            <UserPlus className="w-4 h-4 text-blue-400" />
            Adicionar como Lead
          </button>

          <button
            onClick={() => openModal('client', ctxMenu.chat)}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/8 transition-colors text-left"
          >
            <Briefcase className="w-4 h-4 text-violet-400" />
            Adicionar como Cliente
          </button>

          {!ctxMenu.chat.isGroup && (
            <button
              onClick={() => openModal('group', ctxMenu.chat)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/8 transition-colors text-left"
            >
              <UsersRound className="w-4 h-4 text-emerald-400" />
              Criar Grupo com Contato
            </button>
          )}

          {/* Only show "Save Contact" for contacts whose name looks like a phone number */}
          {!ctxMenu.chat.isGroup && isPhoneName(ctxMenu.chat.name) && (
            <>
              <div className="my-1 border-t border-white/8" />
              <button
                onClick={() => openModal('contact', ctxMenu.chat)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/8 transition-colors text-left"
              >
                <Contact className="w-4 h-4 text-green-400" />
                Salvar Contato
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Modal ── */}
      {activeModal && modalChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={closeModal}>
          <div
            className="relative bg-[#0a1020] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md max-h-[88vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                {activeModal === 'contact' && <Contact className="w-4 h-4 text-green-400" />}
                {activeModal === 'lead' && <UserPlus className="w-4 h-4 text-blue-400" />}
                {activeModal === 'client' && <Briefcase className="w-4 h-4 text-violet-400" />}
                {activeModal === 'group' && <UsersRound className="w-4 h-4 text-emerald-400" />}
                <h2 className="text-sm font-semibold text-white">
                  {activeModal === 'contact' && 'Salvar Contato'}
                  {activeModal === 'lead' && 'Adicionar como Lead'}
                  {activeModal === 'client' && 'Adicionar como Cliente'}
                  {activeModal === 'group' && 'Criar Grupo WhatsApp'}
                </h2>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-white/8 text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Success state */}
            {success ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
                <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-7 h-7 text-green-400" />
                </div>
                <p className="text-sm font-semibold text-white">
                  {activeModal === 'contact' && 'Contato salvo com sucesso!'}
                  {activeModal === 'lead' && 'Lead criado com sucesso!'}
                  {activeModal === 'client' && 'Cliente criado com sucesso!'}
                  {activeModal === 'group' && 'Grupo criado com sucesso!'}
                </p>
              </div>
            ) : (
              <>
                {/* Form body */}
                <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

                  {/* ── Contact fields ── */}
                  {activeModal === 'contact' && (
                    <div className="space-y-3">
                      <Field label="Nome" required>
                        <input
                          value={form.name}
                          onChange={e => setField('name', e.target.value)}
                          placeholder="Como você quer chamar esse contato?"
                          className={inputCls}
                          autoFocus
                        />
                      </Field>
                      <Field label="Telefone">
                        <input value={form.phone} readOnly className={`${inputCls} opacity-60 cursor-not-allowed`} />
                      </Field>
                    </div>
                  )}

                  {/* ── Lead fields ── */}
                  {activeModal === 'lead' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Field label="Nome" required>
                            <input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Nome do lead" className={inputCls} />
                          </Field>
                        </div>
                        <Field label="Telefone">
                          <input value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="(11) 9 9999-9999" className={inputCls} />
                        </Field>
                        <Field label="E-mail">
                          <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="email@exemplo.com" className={inputCls} />
                        </Field>
                        <div className="col-span-2">
                          <Field label="Empresa">
                            <input value={form.company} onChange={e => setField('company', e.target.value)} placeholder="Nome da empresa" className={inputCls} />
                          </Field>
                        </div>
                        <Field label="Status">
                          <select value={form.status} onChange={e => setField('status', e.target.value)} className={selectCls}>
                            <option value="new">Novo</option>
                            <option value="contacted">Em Contato</option>
                            <option value="qualified">Qualificado</option>
                            <option value="proposal">Proposta Enviada</option>
                            <option value="negotiation">Em Negociação</option>
                            <option value="closed_won">Fechado (Ganho)</option>
                            <option value="closed_lost">Fechado (Perdido)</option>
                          </select>
                        </Field>
                        <Field label="Temperatura">
                          <select value={form.temperature} onChange={e => setField('temperature', e.target.value)} className={selectCls}>
                            <option value="cold">❄️ Frio</option>
                            <option value="warm">🌡️ Morno</option>
                            <option value="hot">🔥 Quente</option>
                          </select>
                        </Field>
                        <Field label="Valor estimado (R$)">
                          <input type="number" min="0" value={form.value} onChange={e => setField('value', e.target.value)} placeholder="0" className={inputCls} />
                        </Field>
                        <Field label="Score (0-100)">
                          <input type="number" min="0" max="100" value={form.score} onChange={e => setField('score', e.target.value)} placeholder="70" className={inputCls} />
                        </Field>
                        <div className="col-span-2">
                          <Field label="Notas">
                            <textarea value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Observações sobre o lead..." rows={3} className={`${inputCls} resize-none`} />
                          </Field>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── Client fields ── */}
                  {activeModal === 'client' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <Field label="Nome" required>
                            <input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Nome do cliente" className={inputCls} />
                          </Field>
                        </div>
                        <Field label="Telefone">
                          <input value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="(11) 9 9999-9999" className={inputCls} />
                        </Field>
                        <Field label="E-mail">
                          <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="email@exemplo.com" className={inputCls} />
                        </Field>
                        <div className="col-span-2">
                          <Field label="Empresa / Razão Social">
                            <input value={form.company_name} onChange={e => setField('company_name', e.target.value)} placeholder="Nome da empresa" className={inputCls} />
                          </Field>
                        </div>
                        <Field label="Status">
                          <select value={form.status} onChange={e => setField('status', e.target.value)} className={selectCls}>
                            <option value="prospect">Prospect</option>
                            <option value="active">Ativo</option>
                            <option value="inactive">Inativo</option>
                            <option value="vip">⭐ VIP</option>
                          </select>
                        </Field>
                        <Field label="Qtd. negócios">
                          <input type="number" min="0" value={form.deals} onChange={e => setField('deals', e.target.value)} placeholder="0" className={inputCls} />
                        </Field>
                        <Field label="Valor total (R$)">
                          <input type="number" min="0" value={form.value} onChange={e => setField('value', e.target.value)} placeholder="0" className={inputCls} />
                        </Field>
                        <Field label="Score (0-100)">
                          <input type="number" min="0" max="100" value={form.score} onChange={e => setField('score', e.target.value)} placeholder="70" className={inputCls} />
                        </Field>
                        <div className="col-span-2">
                          <Field label="Cliente desde">
                            <input type="date" value={form.since} onChange={e => setField('since', e.target.value)} className={inputCls} />
                          </Field>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── Group fields ── */}
                  {activeModal === 'group' && (
                    <>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/8 flex items-center gap-2.5 mb-1">
                        <div className={cn('w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white shrink-0', chatGradient(modalChat.id))}>
                          {initials(modalChat.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{modalChat.name}</p>
                          <p className="text-[11px] text-slate-500">será adicionado ao grupo</p>
                        </div>
                      </div>
                      <Field label="Nome do grupo" required>
                        <input
                          value={form.subject}
                          onChange={e => setField('subject', e.target.value)}
                          placeholder="Ex: Equipe de Vendas"
                          className={inputCls}
                          autoFocus
                        />
                      </Field>
                    </>
                  )}

                  {submitError && (
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{submitError}</p>
                  )}
                </div>

                {/* Modal footer */}
                <div className="px-5 py-4 border-t border-white/10 flex gap-3 shrink-0">
                  <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm transition-colors">
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    {submitting
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : activeModal === 'contact' ? 'Salvar Contato'
                      : activeModal === 'group' ? 'Criar Grupo'
                      : activeModal === 'lead' ? 'Criar Lead'
                      : 'Criar Cliente'
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
