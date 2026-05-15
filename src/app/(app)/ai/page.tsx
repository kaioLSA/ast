'use client'

import { useState, useRef, useEffect } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import { Button } from '@/components/ui/button'
import { Sparkles, Send, Bot, User, Zap, BarChart3, FileText, TrendingUp } from 'lucide-react'
import { mockInsights } from '@/services/mocks/ai.mock'
import { cn } from '@/lib/utils/cn'

const initialMessages = [
  {
    id: '1',
    role: 'user' as const,
    text: 'Quais leads devo priorizar essa semana?',
    time: '09:12',
  },
  {
    id: '2',
    role: 'ai' as const,
    text: 'Analisando seus 342 leads... Identifiquei 5 com alta probabilidade de conversão. Pedro Oliveira (95%) e Mariana Costa (92%) estão no topo da lista. Recomendo entrar em contato nas próximas 24h com uma proposta personalizada.',
    time: '09:12',
  },
  {
    id: '3',
    role: 'user' as const,
    text: 'Como está minha taxa de conversão?',
    time: '09:14',
  },
  {
    id: '4',
    role: 'ai' as const,
    text: 'Sua taxa atual é 24,7%, ligeiramente abaixo do mês passado (-2,1%). O principal gargalo está entre qualificação e proposta. Sugiro revisar o script de qualificação para aumentar em 3-5 pontos percentuais.',
    time: '09:14',
  },
  {
    id: '5',
    role: 'user' as const,
    text: 'Quais campanhas estão performando melhor?',
    time: '09:16',
  },
  {
    id: '6',
    role: 'ai' as const,
    text: 'O Google Search - Produto X está com ROAS de 11,2x — o melhor do portfólio. A campanha Meta tem mais volume (284K impressões) com ROAS 8,4x. Recomendo aumentar o budget do Google em 30% para aproveitar o momento.',
    time: '09:16',
  },
]

const quickActions = [
  { label: 'Analisar leads', icon: User },
  { label: 'Otimizar campanhas', icon: BarChart3 },
  { label: 'Gerar relatório', icon: FileText },
  { label: 'Prever conversões', icon: TrendingUp },
]

export default function AIPage() {
  usePageTitle('IA')
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (text?: string) => {
    const msg = text ?? input.trim()
    if (!msg) return
    const userMsg = { id: Date.now().toString(), role: 'user' as const, text: msg, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: 'Analisando os dados em tempo real... Com base no histórico dos últimos 30 dias, identifiquei padrões importantes que podem ajudar a otimizar seus resultados. Posso detalhar mais algum aspecto específico?',
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }])
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="IA Startsette"
        description="Insights e análises inteligentes para seu negócio"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'IA' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 220px)', minHeight: 500 }}>
        {/* Chat — left 2/3 */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/3 backdrop-blur-sm flex flex-col overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">IA Startsette</p>
              <p className="text-xs text-slate-500">Powered by GPT-4o</p>
            </div>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-green-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Online
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.map(m => (
              <div key={m.id} className={cn('flex gap-3', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                <div className={cn(
                  'w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs',
                  m.role === 'user' ? 'bg-blue-600' : 'bg-purple-600/30',
                )}>
                  {m.role === 'user' ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <div className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-white/5 text-slate-200 border border-white/10 rounded-tl-sm',
                )}>
                  {m.text}
                  <p className={cn('text-[10px] mt-1', m.role === 'user' ? 'text-blue-200' : 'text-slate-600')}>{m.time}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-600/30 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-5 py-4 border-t border-white/10">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Pergunte algo para a IA..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
              />
              <button
                onClick={() => sendMessage()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right panel — 1/3 */}
        <div className="space-y-5 overflow-y-auto">
          {/* Quick actions */}
          <div className="rounded-2xl border border-white/10 bg-white/3 p-5 backdrop-blur-sm">
            <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              Ações Rápidas
            </p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map(a => {
                const Icon = a.icon
                return (
                  <button
                    key={a.label}
                    onClick={() => sendMessage(a.label)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 hover:text-white hover:bg-blue-500/10 hover:border-blue-500/30 transition-all"
                  >
                    <Icon className="w-3 h-3" />
                    {a.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Insights */}
          <div className="rounded-2xl border border-white/10 bg-white/3 p-5 backdrop-blur-sm">
            <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              IA Insights
            </p>
            <div className="space-y-4">
              {mockInsights.map(ins => (
                <div key={ins.id} className="rounded-xl border border-white/10 bg-white/3 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs font-semibold text-white leading-tight flex-1">{ins.title}</p>
                    {ins.score && (
                      <span className="ml-2 text-xs font-bold text-green-400 shrink-0">{ins.score}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">{ins.description}</p>
                  <ul className="space-y-1 mb-3">
                    {ins.recommendations.map((r, i) => (
                      <li key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                        <span className="text-blue-400 mt-0.5">•</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-xs text-blue-400 hover:bg-blue-600/30 transition-colors font-medium">
                    Aplicar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
