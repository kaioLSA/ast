'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import {
  Sparkles, Send, Bot, User, Zap, Trash2,
  Users, CalendarDays, UserCheck, Search, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type Role = 'user' | 'assistant'

interface Message {
  id: string
  role: Role
  text: string
  time: string
  tools?: string[]   // tools that were called to produce this response
  pending?: boolean  // streaming in progress
}

const TOOL_LABELS: Record<string, { label: string; icon: string }> = {
  create_lead:   { label: 'Criando lead',     icon: '👤' },
  update_lead:   { label: 'Atualizando lead', icon: '✏️' },
  list_leads:    { label: 'Buscando leads',   icon: '🔍' },
  get_lead:      { label: 'Buscando lead',    icon: '🔍' },
  create_client: { label: 'Criando cliente',  icon: '🏢' },
  list_clients:  { label: 'Buscando clientes',icon: '🔍' },
  create_event:  { label: 'Agendando evento', icon: '📅' },
  list_events:   { label: 'Consultando agenda',icon: '📅' },
  delete_event:  { label: 'Removendo evento', icon: '🗑️' },
}

const SUGGESTIONS = [
  { label: 'Criar um lead', icon: Users },
  { label: 'Ver meus leads', icon: Search },
  { label: 'Agendar uma reunião', icon: CalendarDays },
  { label: 'Ver clientes', icon: UserCheck },
]

function now() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// Parse the first line if it's a tool metadata JSON
function parseStream(text: string): { tools: string[]; content: string } {
  const newline = text.indexOf('\n')
  if (newline === -1) return { tools: [], content: text }
  const firstLine = text.slice(0, newline)
  try {
    const parsed = JSON.parse(firstLine)
    if (parsed._tools) {
      return { tools: parsed._tools as string[], content: text.slice(newline + 1) }
    }
  } catch { /* not JSON */ }
  return { tools: [], content: text }
}

export default function AIPage() {
  usePageTitle('IA')

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [activeTools, setActiveTools] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Warm up the Ollama model as soon as the page opens so the first
  // message doesn't have to wait for the 13-second cold-start load
  useEffect(() => {
    fetch('/api/ai/warmup').catch(() => { /* silently ignore */ })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeTools])

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [input])

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim()
      if (!msg || streaming) return

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: msg,
        time: now(),
      }
      setMessages(prev => [...prev, userMsg])
      setInput('')
      setStreaming(true)
      setActiveTools([])

      // Build history for the API (all previous messages + new user message)
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
          body: JSON.stringify({ messages: history }),
          signal: abort.signal,
        })

        if (!res.ok || !res.body) {
          const err = await res.text().catch(() => 'Erro desconhecido')
          setMessages(prev =>
            prev.map(m => (m.id === aiId ? { ...m, text: `❌ ${err}`, pending: false } : m)),
          )
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

          // Parse tool metadata from first line once
          if (!parsedOnce && raw.includes('\n')) {
            const parsed = parseStream(raw)
            tools = parsed.tools
            parsedOnce = true
            if (tools.length) setActiveTools(tools)
            setMessages(prev =>
              prev.map(m =>
                m.id === aiId
                  ? { ...m, text: parsed.content, tools, pending: true }
                  : m,
              ),
            )
          } else if (parsedOnce) {
            const content = parseStream(raw).content
            setMessages(prev =>
              prev.map(m => (m.id === aiId ? { ...m, text: content } : m)),
            )
          } else {
            // Still in first line, no newline yet
            setMessages(prev =>
              prev.map(m => (m.id === aiId ? { ...m, text: raw } : m)),
            )
          }
        }

        // Finalize
        const finalParsed = parseStream(raw)
        setMessages(prev =>
          prev.map(m =>
            m.id === aiId
              ? { ...m, text: finalParsed.content, tools: finalParsed.tools, pending: false }
              : m,
          ),
        )
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setMessages(prev =>
            prev.map(m =>
              m.id === aiId
                ? { ...m, text: '❌ Erro ao conectar com o assistente.', pending: false }
                : m,
            ),
          )
        }
      } finally {
        setStreaming(false)
        setActiveTools([])
        abortRef.current = null
      }
    },
    [input, messages, streaming],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    abortRef.current?.abort()
    setMessages([])
    setStreaming(false)
    setActiveTools([])
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="IA Startsette"
        description="Assistente com acesso total ao CRM — cria leads, agenda eventos e muito mais"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'IA' }]}
      />

      <div
        className="rounded-2xl border border-white/10 bg-white/3 backdrop-blur-sm flex flex-col overflow-hidden"
        style={{ height: 'calc(100vh - 220px)', minHeight: 500 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Assistente IA</p>
            <p className="text-xs text-slate-500">Claude 3 Haiku · Anthropic · acesso total ao CRM</p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-green-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Online
          </span>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              title="Limpar conversa"
              className="ml-3 p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Empty state */}
          {messages.length === 0 && !streaming && (
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

          {/* Message list */}
          {messages.map(m => (
            <div
              key={m.id}
              className={cn('flex gap-3', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5',
                  m.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                    : 'bg-gradient-to-br from-violet-600 to-purple-800',
                )}
              >
                {m.role === 'user' ? (
                  <User className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-white" />
                )}
              </div>

              {/* Bubble */}
              <div className="max-w-[78%] space-y-1.5">
                {/* Tool badges */}
                {m.tools && m.tools.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.tools.map((t, i) => {
                      const info = TOOL_LABELS[t]
                      return (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] text-violet-300 font-medium"
                        >
                          <span>{info?.icon ?? '⚙️'}</span>
                          {info?.label ?? t}
                        </span>
                      )
                    })}
                  </div>
                )}

                <div
                  className={cn(
                    'rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-sm',
                  )}
                >
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
                  <p
                    className={cn(
                      'text-[10px] mt-1.5',
                      m.role === 'user' ? 'text-blue-200/70' : 'text-slate-600',
                    )}
                  >
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
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-[11px] text-violet-300 font-medium"
                    >
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
        {messages.length > 0 && !streaming && (
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
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Peça para criar um lead, agendar reunião, ver clientes... (Enter para enviar)"
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
            Claude 3 Haiku · Anthropic · acesso total ao CRM
          </p>
        </div>
      </div>
    </div>
  )
}
