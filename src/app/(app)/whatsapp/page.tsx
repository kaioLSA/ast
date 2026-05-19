'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import { Send, Search, RefreshCw, Users, MessageCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useWhatsAppStore } from '@/store/whatsapp.store'

type Chat = {
  id: string
  name: string
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

function timeLabel(ts: number) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  // Slightly in the future (clock skew) → treat as now
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
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
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

export default function WhatsappPage() {
  usePageTitle('WhatsApp')
  const { setTotalUnread, clearPending, localUnread, clearChatUnread } = useWhatsAppStore()

  // Clear sidebar badge when entering WhatsApp page
  useEffect(() => { clearPending() }, [clearPending])

  const [chats, setChats] = useState<Chat[]>([])
  const [chatsLoading, setChatsLoading] = useState(true)
  const [chatsError, setChatsError] = useState('')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [msgsLoading, setMsgsLoading] = useState(false)

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'chats' | 'groups'>('chats')

  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load chat list
  const loadChats = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/chats')
      const data = await res.json()
      if (Array.isArray(data)) {
        setChats(data)
        setChatsError('')
        // Sync unread count into global store
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
  }, [])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  // Load messages for selected chat
  const loadMessages = useCallback(async (chatId: string, silent = false) => {
    if (!silent) setMsgsLoading(true)
    try {
      const res = await fetch(`/api/whatsapp/chats/${encodeURIComponent(chatId)}/messages`)
      const data = await res.json()
      if (Array.isArray(data)) setMessages(data)
    } catch {
      // ignore polling errors
    } finally {
      setMsgsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setMessages([])
    loadMessages(selectedId)

    // Poll for new messages every 5s
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(() => loadMessages(selectedId, true), 5000)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [selectedId, loadMessages])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || !selectedId || sending) return

    const optimistic: Msg = {
      id: `opt-${Date.now()}`,
      from: 'me',
      text,
      time: '',
      timestamp: Math.floor(Date.now() / 1000),
    }

    setMessages(prev => [...prev, optimistic])
    setInput('')
    setSending(true)

    try {
      // Evolution API expects the number without @s.whatsapp.net
      const number = selectedId.replace('@s.whatsapp.net', '').replace('@g.us', '')
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, text }),
      })
    } catch {
      // keep optimistic msg
    } finally {
      setSending(false)
    }
  }

  const selectedChat = chats.find(c => c.id === selectedId)
  const filtered = chats.filter(c =>
    c.isGroup === (tab === 'groups') &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()))
  )

  const individualChats = chats.filter(c => !c.isGroup)
  const groupChats = chats.filter(c => c.isGroup)
  const individualUnread = individualChats.reduce((s, c) => s + (c.unread || 0), 0)
  const groupUnread = groupChats.reduce((s, c) => s + (c.unread || 0), 0)

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

      <div
        className="rounded-2xl border border-white/10 bg-white/3 overflow-hidden flex"
        style={{ height: 'calc(100vh - 220px)', minHeight: 520 }}
      >
        {/* ── Chat list ── */}
        <div className="w-80 shrink-0 border-r border-white/10 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => { setTab('chats'); setSelectedId(null) }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors relative',
                tab === 'chats'
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-300',
              )}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Conversas
              {individualUnread > 0 && (
                <span className="min-w-[16px] h-4 rounded-full bg-green-500 text-white text-[9px] flex items-center justify-center font-bold px-1">
                  {individualUnread > 9 ? '9+' : individualUnread}
                </span>
              )}
              {tab === 'chats' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => { setTab('groups'); setSelectedId(null) }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors relative',
                tab === 'groups'
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-300',
              )}
            >
              <Users className="w-3.5 h-3.5" />
              Grupos
              {groupUnread > 0 && (
                <span className="min-w-[16px] h-4 rounded-full bg-green-500 text-white text-[9px] flex items-center justify-center font-bold px-1">
                  {groupUnread > 9 ? '9+' : groupUnread}
                </span>
              )}
              {tab === 'groups' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
              )}
            </button>
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
                <button
                  onClick={() => { setChatsLoading(true); loadChats() }}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Tentar novamente
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-500">
                {tab === 'groups'
                  ? <Users className="w-8 h-8 text-slate-600" />
                  : <MessageCircle className="w-8 h-8 text-slate-600" />
                }
                <p className="text-xs">
                  {tab === 'groups' ? 'Nenhum grupo encontrado' : 'Nenhuma conversa encontrada'}
                </p>
              </div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedId(c.id)
                    clearChatUnread(c.id)
                    // Tell the notifier this chat is now active
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ;(window as any).__waSetSelectedChat?.(c.id)
                    // Mark as read in local chat list
                    setChats(prev => {
                      const updated = prev.map(x => x.id === c.id ? { ...x, unread: 0 } : x)
                      const total = updated.reduce((s, x) => s + (x.unread || 0), 0)
                      setTotalUnread(total)
                      return updated
                    })
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left border-b border-white/5 transition-colors',
                    selectedId === c.id ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : 'hover:bg-white/5',
                  )}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white shrink-0',
                    chatGradient(c.id)
                  )}>
                    {c.isGroup ? <Users className="w-4 h-4" /> : initials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                      <span className="text-[10px] text-slate-500 shrink-0 ml-1">{timeLabel(c.timestamp)}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{c.lastMsg}</p>
                  </div>
                  {(() => {
                    const count = localUnread[c.id] ?? c.unread
                    if (count <= 0) return null
                    const label = count > 4 ? '4+' : String(count)
                    return (
                      <span className="min-w-[18px] h-[18px] rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center font-bold shrink-0 px-1">
                        {label}
                      </span>
                    )
                  })()}
                </button>
              ))
            )}
          </div>

          {/* Stats bar */}
          {!chatsLoading && !chatsError && (
            <div className="px-4 py-2 border-t border-white/10 flex items-center gap-3 text-[11px] text-slate-500">
              {tab === 'chats' ? (
                <>
                  <span>{individualChats.length} conversas</span>
                  <span>·</span>
                  <span>{individualChats.filter(c => c.unread > 0).length} não lidas</span>
                </>
              ) : (
                <>
                  <span>{groupChats.length} grupos</span>
                  <span>·</span>
                  <span>{groupChats.filter(c => c.unread > 0).length} não lidos</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Active conversation ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                {tab === 'groups'
                  ? <Users className="w-8 h-8 text-slate-600" />
                  : <MessageCircle className="w-8 h-8 text-slate-600" />
                }
              </div>
              <p className="text-sm">
                {tab === 'groups' ? 'Selecione um grupo' : 'Selecione uma conversa'}
              </p>
            </div>
          ) : (
            <>
              {/* Contact header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10">
                <div className={cn(
                  'w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white shrink-0',
                  chatGradient(selectedChat.id)
                )}>
                  {selectedChat.isGroup ? <Users className="w-4 h-4" /> : initials(selectedChat.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{selectedChat.name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {selectedChat.id.replace('@s.whatsapp.net', '').replace('@g.us', '')}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {msgsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                    Nenhuma mensagem encontrada
                  </div>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className={cn('flex', m.from === 'me' ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[65%] rounded-2xl px-4 py-2.5 text-sm',
                        m.from === 'me'
                          ? 'bg-green-600 text-white rounded-br-sm'
                          : 'bg-white/8 border border-white/10 text-slate-200 rounded-bl-sm',
                      )}>
                        {/* Show sender name inside group messages */}
                        {m.from === 'them' && selectedChat?.isGroup && m.senderName && (
                          <p className="text-[11px] font-semibold mb-1 text-blue-400">
                            {m.senderName}
                          </p>
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

              {/* Input */}
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
    </div>
  )
}
