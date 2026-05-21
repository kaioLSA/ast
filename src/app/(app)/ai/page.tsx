'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import {
  Sparkles, Send, Bot, User,
  Users, CalendarDays, UserCheck, Search,
  RefreshCw, Plus, Pencil, Trash2, MessageSquare, Loader2, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

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

const TOOL_LABELS: Record<string, { label: string; icon: string }> = {
  create_lead:    { label: 'Criando lead',        icon: '👤' },
  update_lead:    { label: 'Atualizando lead',    icon: '✏️' },
  list_leads:     { label: 'Buscando leads',      icon: '🔍' },
  get_lead:       { label: 'Buscando lead',       icon: '🔍' },
  create_client:  { label: 'Criando cliente',     icon: '🏢' },
  list_clients:   { label: 'Buscando clientes',   icon: '🔍' },
  create_event:   { label: 'Agendando evento',    icon: '📅' },
  list_events:    { label: 'Consultando agenda',  icon: '📅' },
  delete_event:   { label: 'Removendo evento',    icon: '🗑️' },
}

const SUGGESTIONS = [
  { label: 'Criar um lead',        icon: Users,       desc: 'Adicionar novo contato' },
  { label: 'Ver meus leads',       icon: Search,      desc: 'Listar todos os leads' },
  { label: 'Agendar uma reunião',  icon: CalendarDays, desc: 'Criar evento na agenda' },
  { label: 'Ver clientes',         icon: UserCheck,   desc: 'Consultar clientes ativos' },
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

export default function AIPage() {
  usePageTitle('IA')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [convsLoading, setConvsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [msgsLoading, setMsgsLoading] = useState(false)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [activeTools, setActiveTools] = useState<string[]>([])

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/ai/warmup').catch(() => {})
  }, [])

  const loadConversations = useCallback(async () => {
    setConvsLoading(true)
    try {
      const res = await fetch('/api/ai/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(Array.isArray(data) ? data : [])
      }
    } catch { /* ignore */ } finally { setConvsLoading(false) }
  }, [])

  useEffect(() => { loadConversations() }, [loadConversations])

  const loadMessages = useCallback(async (convId: string) => {
    setMsgsLoading(true)
    setMessages([])
    try {
      const res = await fetch(`/api/ai/conversations/${convId}/messages`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setMessages(data.map((m: { id: string; role: Role; content: string; created_at: string }) => ({
            id: m.id, role: m.role, text: m.content,
            time: new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          })))
        }
      }
    } catch { /* ignore */ } finally { setMsgsLoading(false) }
  }, [])

  useEffect(() => {
    if (selectedId) loadMessages(selectedId)
    else setMessages([])
  }, [selectedId, loadMessages])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, activeTools])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [input])

  useEffect(() => {
    if (renamingId) setTimeout(() => renameInputRef.current?.focus(), 50)
  }, [renamingId])

  const createConversation = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/ai/conversations', { method: 'POST' })
      if (!res.ok) return null
      const conv: Conversation = await res.json()
      setConversations(prev => [conv, ...prev])
      setSelectedId(conv.id)
      setMessages([])
      setTimeout(() => textareaRef.current?.focus(), 100)
      return conv.id
    } catch { return null }
  }, [])

  const deleteConversation = useCallback(async (id: string) => {
    await fetch(`/api/ai/conversations/${id}`, { method: 'DELETE' })
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id)
      if (selectedId === id) setSelectedId(next[0]?.id ?? null)
      return next
    })
  }, [selectedId])

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

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || streaming) return

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

    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.text }))
    const aiId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { id: aiId, role: 'assistant', text: '', time: now(), pending: true }])

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
          setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: parsed.content, tools, pending: true } : m))
        } else if (parsedOnce) {
          setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: parseStream(raw).content } : m))
        } else {
          setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: raw } : m))
        }
      }

      const finalParsed = parseStream(raw)
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: finalParsed.content, tools: finalParsed.tools, pending: false } : m))

      setTimeout(async () => {
        try {
          const r = await fetch('/api/ai/conversations')
          if (r.ok) { const d = await r.json(); if (Array.isArray(d)) setConversations(d) }
        } catch { /* ignore */ }
      }, 1000)

    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: 'Erro ao conectar com o assistente.', pending: false } : m))
      }
    } finally {
      setStreaming(false)
      setActiveTools([])
      abortRef.current = null
    }
  }, [input, messages, streaming, selectedId, createConversation])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const selectedConv = conversations.find(c => c.id === selectedId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="IA Startsette"
        description="Assistente com acesso total ao CRM — cria leads, agenda eventos e muito mais"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'IA' }]}
      />

      <div
        className="rounded-2xl border border-white/10 overflow-hidden flex bg-[#111118]"
        style={{ height: 'calc(100vh - 220px)', minHeight: 520 }}
      >
        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="w-64 shrink-0 border-r border-white/8 flex flex-col bg-[#0d0d12]">

          {/* Sidebar header */}
          <div className="px-3 pt-4 pb-3 border-b border-white/8">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Conversas</span>
            </div>
            <button
              onClick={() => createConversation()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-xs font-semibold transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.35)]"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova conversa
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto py-1">
            {convsLoading ? (
              <div className="flex items-center justify-center h-24 gap-2 text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Carregando...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 px-4 text-center">
                <MessageSquare className="w-7 h-7 text-slate-700" />
                <p className="text-xs text-slate-600">Nenhuma conversa ainda</p>
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
            <div className="px-4 py-2.5 border-t border-white/8 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-slate-600">
                {conversations.length} conversa{conversations.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* ── Chat area ───────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/8 shrink-0 bg-[#111118]">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-600/20 border border-white/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-none mb-0.5">
                {selectedConv ? selectedConv.title : 'Assistente IA'}
              </p>
              <p className="text-[10px] text-slate-600">Claude Haiku 4.5 · Anthropic</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-400/10 border border-green-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-green-400 font-medium">Online</span>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* Empty — no conversation selected */}
            {!selectedId && (
              <div className="flex flex-col items-center justify-center h-full gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-600/20 border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(99,102,241,0.15)]">
                    <Sparkles className="w-7 h-7 text-blue-400" />
                  </div>
                  <p className="text-white font-semibold text-lg mb-1.5">Olá! Como posso ajudar?</p>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
                    Posso criar leads, agendar reuniões, consultar clientes e muito mais.
                  </p>
                </div>
                <SuggestionGrid onSelect={sendMessage} />
              </div>
            )}

            {/* Loading messages */}
            {selectedId && msgsLoading && (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
              </div>
            )}

            {/* New conversation — empty */}
            {selectedId && !msgsLoading && messages.length === 0 && !streaming && (
              <div className="flex flex-col items-center justify-center h-full gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/15 to-violet-600/15 border border-white/8 flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-white font-medium mb-1">Nova conversa</p>
                  <p className="text-slate-500 text-sm">O que você precisa hoje?</p>
                </div>
                <SuggestionGrid onSelect={sendMessage} />
              </div>
            )}

            {/* Messages */}
            {messages.map(m => (
              <div key={m.id} className={cn('flex gap-3', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                {/* Avatar */}
                <div className={cn(
                  'w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5 shadow-sm',
                  m.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                    : 'bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10',
                )}>
                  {m.role === 'user'
                    ? <User className="w-3.5 h-3.5 text-white" />
                    : <Bot className="w-3.5 h-3.5 text-blue-400" />}
                </div>

                <div className={cn('max-w-[72%] space-y-1.5', m.role === 'user' && 'items-end flex flex-col')}>
                  {/* Tool badges */}
                  {m.tools && m.tools.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {m.tools.map((t, i) => {
                        const info = TOOL_LABELS[t]
                        return (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-300 font-medium">
                            {info?.icon ?? '⚙️'} {info?.label ?? t}
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={cn(
                    'rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm shadow-[0_4px_12px_rgba(37,99,235,0.25)]'
                      : 'bg-white/[0.04] text-slate-200 border border-white/8 rounded-tl-sm',
                  )}>
                    {m.text || (
                      <span className="flex items-center gap-1.5 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                    {m.pending && m.text && (
                      <span className="inline-block w-0.5 h-3.5 bg-blue-400 ml-0.5 animate-pulse rounded-full align-middle" />
                    )}
                    <p className={cn('text-[10px] mt-2 select-none', m.role === 'user' ? 'text-blue-200/60 text-right' : 'text-slate-600')}>
                      {m.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Active tool indicator */}
            {streaming && activeTools.length > 0 && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                </div>
                <div className="bg-white/[0.04] border border-white/8 rounded-2xl rounded-tl-sm px-4 py-2.5 flex flex-wrap gap-1.5 items-center">
                  {activeTools.map((t, i) => {
                    const info = TOOL_LABELS[t]
                    return (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 font-medium">
                        {info?.icon ?? '⚙️'} {info?.label ?? t}
                        <span className="ml-0.5 w-1 h-1 rounded-full bg-blue-400 animate-ping" />
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
                    className="whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/4 border border-white/8 text-xs text-slate-500 hover:text-white hover:bg-blue-500/10 hover:border-blue-500/20 transition-all shrink-0"
                  >
                    <Icon className="w-3 h-3 text-blue-500" />
                    {s.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Input */}
          <div className="px-5 py-4 border-t border-white/8 shrink-0">
            <div className="flex gap-3 items-end">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedId ? 'Peça para criar um lead, agendar reunião, ver clientes...' : 'Comece digitando para criar uma nova conversa...'}
                disabled={streaming}
                className="flex-1 resize-none px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.06] disabled:opacity-50 transition-all leading-relaxed"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || streaming}
                className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-all flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
              >
                {streaming
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Suggestion grid ────────────────────────────────────────────────────────────

function SuggestionGrid({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
      {SUGGESTIONS.map(s => {
        const Icon = s.icon
        return (
          <button
            key={s.label}
            onClick={() => onSelect(s.label)}
            className="group flex flex-col gap-2 p-4 rounded-2xl bg-white/[0.03] border border-white/8 hover:bg-blue-500/8 hover:border-blue-500/25 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 group-hover:bg-blue-500/15 group-hover:border-blue-500/25 flex items-center justify-center transition-all">
              <Icon className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors leading-snug">{s.label}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{s.desc}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── ConversationItem ───────────────────────────────────────────────────────────

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
  conv, isSelected, isRenaming, renameValue, renameInputRef,
  onSelect, onRenameStart, onRenameChange, onRenameCommit, onRenameCancel, onDelete,
}: ConversationItemProps) {
  return (
    <div
      onClick={() => { if (!isRenaming) onSelect() }}
      className={cn(
        'group relative flex items-center gap-2.5 px-3 py-2.5 mx-2 my-0.5 rounded-xl cursor-pointer transition-all',
        isSelected
          ? 'bg-gradient-to-r from-blue-500/15 to-violet-500/10 border border-blue-500/20'
          : 'hover:bg-white/4 border border-transparent',
      )}
    >
      <MessageSquare className={cn(
        'w-3.5 h-3.5 shrink-0 transition-colors',
        isSelected ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400',
      )} />

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
            className="w-full bg-transparent text-xs text-white outline-none border-b border-blue-500/50 pb-0.5"
          />
        ) : (
          <>
            <p className={cn('text-xs font-medium truncate transition-colors', isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200')}>
              {conv.title}
            </p>
            <p className="text-[10px] text-slate-600 mt-0.5">{relativeDate(conv.updated_at)}</p>
          </>
        )}
      </div>

      {!isRenaming && (
        <div className={cn(
          'flex items-center gap-0.5 shrink-0 transition-opacity',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}>
          <button
            onClick={e => { e.stopPropagation(); onRenameStart() }}
            className="p-1 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}
