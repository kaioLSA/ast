'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import {
  Sparkles, Send, Bot, User, Zap,
  Users, CalendarDays, UserCheck, Search,
  RefreshCw, Plus, Pencil, Trash2, MessageSquare, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ── Types ──────────────────────────────────────────────────────────────────────

type Role = 'user' | 'assistant'

interface Message {
  id: string
  role: Role
  text: string
  time: string
  tools?: string[]
  pending?: boolean
}

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TOOL_LABELS: Record<string, { label: string; icon: string }> = {
  create_lead:    { label: 'Criando lead',       icon: '👤' },
  update_lead:    { label: 'Atualizando lead',   icon: '✏️' },
  list_leads:     { label: 'Buscando leads',     icon: '🔍' },
  get_lead:       { label: 'Buscando lead',      icon: '🔍' },
  create_client:  { label: 'Criando cliente',    icon: '🏢' },
  list_clients:   { label: 'Buscando clientes',  icon: '🔍' },
  create_event:   { label: 'Agendando evento',   icon: '📅' },
  list_events:    { label: 'Consultando agenda', icon: '📅' },
  delete_event:   { label: 'Removendo evento',   icon: '🗑️' },
}

const SUGGESTIONS = [
  { label: 'Criar um lead',       icon: Users },
  { label: 'Ver meus leads',      icon: Search },
  { label: 'Agendar uma reunião', icon: CalendarDays },
  { label: 'Ver clientes',        icon: UserCheck },
]

function now() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function relativeDate(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (days === 1) return 'Ontem'
  if (days < 7) return `${days}d atrás`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function parseStream(text: string): { tools: string[]; content: string } {
  const newline = text.indexOf('\n')
  if (newline === -1) return { tools: [], content: text }
  const firstLine = text.slice(0, newline)
  try {
    const parsed = JSON.parse(firstLine)
    if (parsed._tools) return { tools: parsed._tools as string[], content: text.slice(newline + 1) }
  } catch { /* not JSON */ }
  return { tools: [], content: text }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function AIPage() {
  usePageTitle('IA')

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [convsLoading, setConvsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  // Messages
  const [messages, setMessages] = useState<Message[]>([])
  const [msgsLoading, setMsgsLoading] = useState(false)

  // Chat input / streaming
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [activeTools, setActiveTools] = useState<string[]>([])

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  // ── Warm-up ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/ai/warmup').catch(() => { /* silently ignore */ })
  }, [])

  // ── Load conversations ────────────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    setConvsLoading(true)
    try {
      const res = await fetch('/api/ai/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(Array.isArray(data) ? data : [])
      }
    } catch { /* ignore */ } finally {
      setConvsLoading(false)
    }
  }, [])

  useEffect(() => { loadConversations() }, [loadConversations])

  // ── Load messages when conversation selected ──────────────────────────────────

  const loadMessages = useCallback(async (convId: string) => {
    setMsgsLoading(true)
    setMessages([])
    try {
      const res = await fetch(`/api/ai/conversations/${convId}/messages`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setMessages(data.map((m: { id: string; role: Role; content: string; created_at: string }) => ({
            id: m.id,
            role: m.role,
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          })))
        }
      }
    } catch { /* ignore */ } finally {
      setMsgsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedId) loadMessages(selectedId)
    else setMessages([])
  }, [selectedId, loadMessages])

  // ── Auto-scroll ───────────────────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeTools])

  // ── Auto-grow textarea ────────────────────────────────────────────────────────

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [input])

  // ── Focus rename input when rename starts ─────────────────────────────────────

  useEffect(() => {
    if (renamingId) setTimeout(() => renameInputRef.current?.focus(), 50)
  }, [renamingId])

  // ── Create conversation ───────────────────────────────────────────────────────

  const createConversation = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/ai/conversations', { method: 'POST' })
      if (!res.ok) return null
      const conv: Conversation = await res.json()
      setConversations(prev => [conv, ...prev])
      setSelectedId(conv.id)
      setMessages([])
      return conv.id
    } catch {
      return null
    }
  }, [])

  // ── Delete conversation ───────────────────────────────────────────────────────

  const deleteConversation = useCallback(async (id: string) => {
    await fetch(`/api/ai/conversations/${id}`, { method: 'DELETE' })
    setConversations(prev => prev.filter(c => c.id !== id))
    if (selectedId === id) {
      const remaining = conversations.filter(c => c.id !== id)
      setSelectedId(remaining[0]?.id ?? null)
    }
  }, [selectedId, conversations])

  // ── Rename conversation ───────────────────────────────────────────────────────

  const commitRename = useCallback(async () => {
    if (!renamingId || !renameValue.trim()) { setRenamingId(null); return }
    const title = renameValue.trim()
    setConversations(prev => prev.map(c => c.id === renamingId ? { ...c, title } : c))
    setRenamingId(null)
    await fetch(`/api/ai/conversations/${renamingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
  }, [renamingId, renameValue])

  // ── Send message ──────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim()
      if (!msg || streaming) return

      // Ensure we have a conversation
      let convId = selectedId
      if (!convId) {
        convId = await createConversation()
        if (!convId) return
      }

      const userMsg: Message = { id: Date.now().toString(), role: 'user', text: msg, time: now() }
      setMessages(prev => [...prev, userMsg])
      setInput('')
      setStreaming(true)
      setActiveTools([])

      // Build history for API — all previous messages + new user message
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.text }))

      const aiId = (Date.now() + 1).toString()
      const aiMsg: Message = { id: aiId, role: 'assistant', text: '', time: now(), pending: true }
      setMessages(prev => [...prev, aiMsg])

      try {
        const abort = new AbortController()
        abortRef.current = abort

        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history, conversationId: convId }),
          signal: abort.signal,
        })

        if (!res.ok || !res.body) {
          const err = await res.text().catch(() => 'Erro desconhecido')
          setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: `Erro: ${err}`, pending: false } : m))
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let raw = ''
        let parsedOnce = false
        let tools: string[] = []

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          raw += decoder.decode(value, { stream: true })

          if (!parsedOnce && raw.includes('\n')) {
            const parsed = parseStream(raw)
            tools = parsed.tools
            parsedOnce = true
            if (tools.length) setActiveTools(tools)
            setMessages(prev => prev.map(m =>
              m.id === aiId ? { ...m, text: parsed.content, tools, pending: true } : m,
            ))
          } else if (parsedOnce) {
            const content = parseStream(raw).content
            setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: content } : m))
          } else {
            setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: raw } : m))
          }
        }

        const finalParsed = parseStream(raw)
        setMessages(prev => prev.map(m =>
          m.id === aiId ? { ...m, text: finalParsed.content, tools: finalParsed.tools, pending: false } : m,
        ))

        // Update conversation title in sidebar (might have changed)
        setTimeout(async () => {
          try {
            const r = await fetch('/api/ai/conversations')
            if (r.ok) {
              const data = await r.json()
              if (Array.isArray(data)) setConversations(data)
            }
          } catch { /* ignore */ }
        }, 1000)

      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setMessages(prev => prev.map(m =>
            m.id === aiId ? { ...m, text: 'Erro ao conectar com o assistente.', pending: false } : m,
          ))
        }
      } finally {
        setStreaming(false)
        setActiveTools([])
        abortRef.current = null
      }
    },
    [input, messages, streaming, selectedId, createConversation],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const selectedConv = conversations.find(c => c.id === selectedId)

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="IA Startsette"
        description="Assistente com acesso total ao CRM — cria leads, agenda eventos e muito mais"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'IA' }]}
      />

      <div
        className="rounded-2xl border border-white/10 bg-white/3 overflow-hidden flex"
        style={{ height: 'calc(100vh - 220px)', minHeight: 520 }}
      >
        {/* ── Sidebar ── */}
        <div className="w-72 shrink-0 border-r border-white/10 flex flex-col">
          {/* New conversation button */}
          <div className="p-3 border-b border-white/10">
            <button
              onClick={() => createConversation().then(() => setTimeout(() => inputRef.current?.focus(), 100))}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Nova conversa
            </button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {convsLoading ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p className="text-xs">Carregando...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-500 px-4 text-center">
                <MessageSquare className="w-8 h-8 text-slate-600" />
                <p className="text-xs">Nenhuma conversa ainda</p>
              </div>
            ) : (
              conversations.map(conv => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isSelected={selectedId === conv.id}
                  isRenaming={renamingId === conv.id}
                  renameValue={renameValue}
                  renameInputRef={renameInputRef as React.RefObject<HTMLInputElement>}
                  onSelect={() => { setSelectedId(conv.id); setRenamingId(null) }}
                  onRenameStart={() => { setRenamingId(conv.id); setRenameValue(conv.title) }}
                  onRenameChange={setRenameValue}
                  onRenameCommit={commitRename}
                  onRenameCancel={() => setRenamingId(null)}
                  onDelete={() => deleteConversation(conv.id)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {!convsLoading && conversations.length > 0 && (
            <div className="px-4 py-2 border-t border-white/10 text-[11px] text-slate-500">
              {conversations.length} conversa{conversations.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* ── Chat area ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {selectedConv ? selectedConv.title : 'Assistente IA'}
              </p>
              <p className="text-xs text-slate-500">Claude Haiku 4.5 · Anthropic · acesso total ao CRM</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Online
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* No conversation selected — empty state */}
            {!selectedId && (
              <div className="flex flex-col items-center justify-center h-full gap-6 pb-10">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/15 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-violet-400" />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-lg mb-1">Olá! Como posso ajudar?</p>
                  <p className="text-slate-500 text-sm max-w-sm">
                    Posso criar leads, agendar reuniões, consultar clientes e muito mais — direto aqui.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 max-w-sm w-full">
                  {SUGGESTIONS.map(s => {
                    const Icon = s.icon
                    return (
                      <button
                        key={s.label}
                        onClick={() => sendMessage(s.label)}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:text-white hover:bg-violet-500/10 hover:border-violet-500/30 transition-all text-left"
                      >
                        <Icon className="w-4 h-4 text-violet-400 shrink-0" />
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Loading messages */}
            {selectedId && msgsLoading && (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            )}

            {/* Conversation selected but empty */}
            {selectedId && !msgsLoading && messages.length === 0 && !streaming && (
              <div className="flex flex-col items-center justify-center h-full gap-4 pb-10">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-violet-400" />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium mb-1">Nova conversa</p>
                  <p className="text-slate-500 text-sm">Digite sua mensagem para começar</p>
                </div>
                <div className="grid grid-cols-2 gap-2 max-w-sm w-full">
                  {SUGGESTIONS.map(s => {
                    const Icon = s.icon
                    return (
                      <button
                        key={s.label}
                        onClick={() => sendMessage(s.label)}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:text-white hover:bg-violet-500/10 hover:border-violet-500/30 transition-all text-left"
                      >
                        <Icon className="w-4 h-4 text-violet-400 shrink-0" />
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map(m => (
              <div key={m.id} className={cn('flex gap-3', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                <div className={cn(
                  'w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5',
                  m.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                    : 'bg-gradient-to-br from-violet-600 to-purple-800',
                )}>
                  {m.role === 'user' ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
                </div>

                <div className="max-w-[78%] space-y-1.5">
                  {m.tools && m.tools.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {m.tools.map((t, i) => {
                        const info = TOOL_LABELS[t]
                        return (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] text-violet-300 font-medium">
                            <span>{info?.icon ?? '⚙️'}</span>
                            {info?.label ?? t}
                          </span>
                        )
                      })}
                    </div>
                  )}
                  <div className={cn(
                    'rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-sm',
                  )}>
                    {m.text || (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                    {m.pending && m.text && (
                      <span className="inline-block w-0.5 h-3.5 bg-violet-400 ml-0.5 animate-pulse rounded-full align-middle" />
                    )}
                    <p className={cn('text-[10px] mt-1.5', m.role === 'user' ? 'text-blue-200/70' : 'text-slate-600')}>
                      {m.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Active tool indicator */}
            {streaming && activeTools.length > 0 && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                </div>
                <div className="bg-white/5 border border-violet-500/20 rounded-2xl rounded-tl-sm px-4 py-2.5 flex flex-wrap gap-1.5 items-center">
                  {activeTools.map((t, i) => {
                    const info = TOOL_LABELS[t]
                    return (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-[11px] text-violet-300 font-medium">
                        <span>{info?.icon ?? '⚙️'}</span>
                        {info?.label ?? t}
                        <span className="ml-0.5 w-1 h-1 rounded-full bg-violet-400 animate-ping" />
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions strip */}
          {selectedId && messages.length > 0 && !streaming && (
            <div className="px-5 pb-2 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
              {SUGGESTIONS.map(s => {
                const Icon = s.icon
                return (
                  <button
                    key={s.label}
                    onClick={() => sendMessage(s.label)}
                    className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-400 hover:text-white hover:bg-violet-500/10 hover:border-violet-500/30 transition-all shrink-0"
                  >
                    <Icon className="w-3 h-3 text-violet-400" />
                    {s.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Input */}
          <div className="px-5 py-4 border-t border-white/10 shrink-0">
            <div className="flex gap-3 items-end">
              <textarea
                ref={el => {
                  // assign both refs
                  (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
                  (inputRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el
                }}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedId ? 'Peça para criar um lead, agendar reunião, ver clientes... (Enter para enviar)' : 'Comece digitando para criar uma nova conversa...'}
                disabled={streaming}
                className="flex-1 resize-none px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 disabled:opacity-50 transition-colors leading-relaxed"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || streaming}
                className="shrink-0 w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center"
              >
                {streaming ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-600 mt-2 text-center">
              Claude Haiku 4.5 · Anthropic · acesso total ao CRM
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ConversationItem sub-component ─────────────────────────────────────────────

interface ConversationItemProps {
  conv: Conversation
  isSelected: boolean
  isRenaming: boolean
  renameValue: string
  renameInputRef: React.RefObject<HTMLInputElement>
  onSelect: () => void
  onRenameStart: () => void
  onRenameChange: (v: string) => void
  onRenameCommit: () => void
  onRenameCancel: () => void
  onDelete: () => void
}

function ConversationItem({
  conv,
  isSelected,
  isRenaming,
  renameValue,
  renameInputRef,
  onSelect,
  onRenameStart,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
  onDelete,
}: ConversationItemProps) {
  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 px-3 py-2.5 border-b border-white/5 cursor-pointer transition-colors',
        isSelected ? 'bg-violet-500/10 border-l-2 border-l-violet-500' : 'hover:bg-white/5',
      )}
      onClick={() => { if (!isRenaming) onSelect() }}
    >
      <MessageSquare className={cn('w-3.5 h-3.5 shrink-0', isSelected ? 'text-violet-400' : 'text-slate-500')} />

      <div className="flex-1 min-w-0">
        {isRenaming ? (
          <input
            ref={renameInputRef}
            value={renameValue}
            onChange={e => onRenameChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); onRenameCommit() }
              if (e.key === 'Escape') onRenameCancel()
            }}
            onBlur={onRenameCommit}
            onClick={e => e.stopPropagation()}
            className="w-full bg-transparent text-xs text-white outline-none border-b border-violet-500/50 pb-0.5"
          />
        ) : (
          <>
            <p className="text-xs font-medium text-white truncate">{conv.title}</p>
            <p className="text-[10px] text-slate-500">{relativeDate(conv.updated_at)}</p>
          </>
        )}
      </div>

      {/* Action buttons — visible on hover or when selected */}
      {!isRenaming && (
        <div className={cn(
          'flex items-center gap-0.5 shrink-0 transition-opacity',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}>
          <button
            onClick={e => { e.stopPropagation(); onRenameStart() }}
            title="Renomear"
            className="p-1 rounded text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            title="Excluir"
            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}
