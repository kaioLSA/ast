'use client'

import { useState, useRef, useEffect } from 'react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuthStore } from '@/store/auth.store'
import { PageHeader } from '@/components/layout/page-header/PageHeader'
import { Send, Search } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type Msg = { id: string; from: 'me' | 'them'; text: string; time: string }

const conversations = [
  {
    id: '1',
    name: 'Carlos Mendes',
    lastMsg: 'Quando posso receber a proposta?',
    time: '10:23',
    unread: 2,
    avatar: 'CM',
    color: 'from-blue-500 to-cyan-500',
    messages: [
      { id: 'm1', from: 'them', text: 'Bom dia! Tudo bem?', time: '09:50' },
      { id: 'm2', from: 'me', text: 'Olá Carlos! Tudo ótimo, e você?', time: '09:52' },
      { id: 'm3', from: 'them', text: 'Muito bem! Estou interessado na solução de vocês.', time: '09:54' },
      { id: 'm4', from: 'me', text: 'Ótimo! Vou preparar uma proposta personalizada para a TechSolutions.', time: '09:55' },
      { id: 'm5', from: 'them', text: 'Perfeito. Vocês atendem empresas do setor de tecnologia?', time: '10:00' },
      { id: 'm6', from: 'me', text: 'Sim! Temos vários cases no setor. Posso enviar alguns exemplos.', time: '10:02' },
      { id: 'm7', from: 'them', text: 'Ótimo! Aguardo.', time: '10:05' },
      { id: 'm8', from: 'them', text: 'Quando posso receber a proposta?', time: '10:23' },
    ] as Msg[],
  },
  {
    id: '2',
    name: 'Mariana Costa',
    lastMsg: 'Obrigada pelas informações!',
    time: '09:45',
    unread: 0,
    avatar: 'MC',
    color: 'from-purple-500 to-pink-500',
    messages: [
      { id: 'm1', from: 'me', text: 'Olá Mariana! Segue o material solicitado.', time: '09:20' },
      { id: 'm2', from: 'them', text: 'Recebi! Vou analisar agora.', time: '09:30' },
      { id: 'm3', from: 'me', text: 'Qualquer dúvida é só falar!', time: '09:32' },
      { id: 'm4', from: 'them', text: 'Obrigada pelas informações!', time: '09:45' },
    ] as Msg[],
  },
  {
    id: '3',
    name: 'Pedro Oliveira',
    lastMsg: 'Topei! Quando assinamos?',
    time: '08:59',
    unread: 5,
    avatar: 'PO',
    color: 'from-green-500 to-emerald-500',
    messages: [
      { id: 'm1', from: 'me', text: 'Pedro, enviei a proposta final para seu email.', time: '08:30' },
      { id: 'm2', from: 'them', text: 'Vi agora! Os valores estão ótimos.', time: '08:45' },
      { id: 'm3', from: 'me', text: 'Que ótimo! Podemos seguir com a assinatura?', time: '08:48' },
      { id: 'm4', from: 'them', text: 'Sim! Só preciso alinhar internamente.', time: '08:52' },
      { id: 'm5', from: 'them', text: 'Alinhei tudo aqui.', time: '08:55' },
      { id: 'm6', from: 'them', text: 'Aprovado pela diretoria!', time: '08:57' },
      { id: 'm7', from: 'them', text: 'Topei! Quando assinamos?', time: '08:59' },
    ] as Msg[],
  },
  {
    id: '4',
    name: 'Roberto Alves',
    lastMsg: 'Preciso pensar mais...',
    time: 'Ontem',
    unread: 1,
    avatar: 'RA',
    color: 'from-yellow-500 to-orange-500',
    messages: [
      { id: 'm1', from: 'them', text: 'Olá! Vi o anúncio de vocês no Instagram.', time: '14:00' },
      { id: 'm2', from: 'me', text: 'Oi Roberto! Posso apresentar nossas soluções?', time: '14:05' },
      { id: 'm3', from: 'them', text: 'Sim, pode falar.', time: '14:10' },
      { id: 'm4', from: 'me', text: 'Temos planos a partir de R$500/mês com ROI médio de 8x.', time: '14:15' },
      { id: 'm5', from: 'them', text: 'Preciso pensar mais...', time: '14:30' },
    ] as Msg[],
  },
  {
    id: '5',
    name: 'Juliana Santos',
    lastMsg: 'Você tem casos no agro?',
    time: 'Ontem',
    unread: 0,
    avatar: 'JS',
    color: 'from-teal-500 to-cyan-500',
    messages: [
      { id: 'm1', from: 'them', text: 'Boa tarde! Vocês atendem o agronegócio?', time: '15:00' },
      { id: 'm2', from: 'me', text: 'Sim! Temos cases excelentes no setor.', time: '15:05' },
      { id: 'm3', from: 'them', text: 'Que ótimo! Você tem casos no agro?', time: '15:10' },
    ] as Msg[],
  },
  {
    id: '6',
    name: 'Ana Ferreira',
    lastMsg: 'Oi, vi o anúncio de vocês',
    time: '2d',
    unread: 3,
    avatar: 'AF',
    color: 'from-rose-500 to-pink-500',
    messages: [
      { id: 'm1', from: 'them', text: 'Oi, vi o anúncio de vocês', time: '10:00' },
    ] as Msg[],
  },
  {
    id: '7',
    name: 'Marcos Lima',
    lastMsg: 'Qual o valor mensal?',
    time: '3d',
    unread: 0,
    avatar: 'ML',
    color: 'from-indigo-500 to-blue-500',
    messages: [
      { id: 'm1', from: 'them', text: 'Boa tarde!', time: '09:00' },
      { id: 'm2', from: 'me', text: 'Oi Marcos! Como posso ajudar?', time: '09:05' },
      { id: 'm3', from: 'them', text: 'Qual o valor mensal?', time: '09:10' },
    ] as Msg[],
  },
  {
    id: '8',
    name: 'Beatriz Nunes',
    lastMsg: 'Perfeito, vamos marcar?',
    time: '4d',
    unread: 2,
    avatar: 'BN',
    color: 'from-violet-500 to-purple-500',
    messages: [
      { id: 'm1', from: 'me', text: 'Olá Beatriz! Tudo bem?', time: '11:00' },
      { id: 'm2', from: 'them', text: 'Tudo! Vi que vocês fazem automação de WhatsApp.', time: '11:10' },
      { id: 'm3', from: 'me', text: 'Sim! Podemos agendar uma demo?', time: '11:12' },
      { id: 'm4', from: 'them', text: 'Perfeito, vamos marcar?', time: '11:15' },
    ] as Msg[],
  },
]

export default function WhatsappPage() {
  usePageTitle('WhatsApp')
  const { user } = useAuthStore()
  const activeConversations = user?.teamId === 'gabriel-team' ? [] : conversations
  const [selectedId, setSelectedId] = useState(activeConversations[0]?.id ?? '')
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [msgMap, setMsgMap] = useState<Record<string, Msg[]>>(
    Object.fromEntries(activeConversations.map(c => [c.id, c.messages])),
  )
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const conv = activeConversations.find(c => c.id === selectedId)
  const msgs = msgMap[selectedId] ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedId, msgs.length])

  const sendMsg = () => {
    const text = (inputs[selectedId] ?? '').trim()
    if (!text) return
    const newMsg: Msg = {
      id: Date.now().toString(),
      from: 'me',
      text,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }
    setMsgMap(prev => ({ ...prev, [selectedId]: [...(prev[selectedId] ?? []), newMsg] }))
    setInputs(prev => ({ ...prev, [selectedId]: '' }))
  }

  const filtered = activeConversations.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp"
        description="Central de mensagens e conversas"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'WhatsApp' }]}
      />

      <div className="rounded-2xl border border-white/10 bg-white/3 backdrop-blur-sm overflow-hidden flex" style={{ height: 'calc(100vh - 220px)', minHeight: 500 }}>
        {/* Conversation list */}
        <div className="w-80 shrink-0 border-r border-white/10 flex flex-col">
          <div className="p-3 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar conversas..."
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left border-b border-white/5 transition-colors',
                  selectedId === c.id ? 'bg-blue-500/10' : 'hover:bg-white/5',
                )}
              >
                <div className={cn('w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white shrink-0', c.color)}>
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs font-semibold text-white truncate">{c.name}</p>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-1">{c.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{c.lastMsg}</p>
                </div>
                {c.unread > 0 && (
                  <span className="w-4 h-4 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                    {c.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Active conversation */}
        <div className="flex-1 flex flex-col">
          {!conv ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-slate-500 text-sm">Nenhuma conversa ainda.</p>
            </div>
          ) : (<>
          {/* Contact header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10">
            <div className={cn('w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white', conv.color)}>
              {conv.avatar}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{conv.name}</p>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Online
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {msgs.map(m => (
              <div key={m.id} className={cn('flex', m.from === 'me' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[65%] rounded-2xl px-4 py-2.5 text-sm',
                  m.from === 'me'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white/8 border border-white/10 text-slate-200 rounded-bl-sm',
                )}>
                  {m.text}
                  <p className={cn('text-[10px] mt-1', m.from === 'me' ? 'text-blue-200 text-right' : 'text-slate-500')}>{m.time}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-5 py-4 border-t border-white/10">
            <div className="flex gap-3">
              <input
                value={inputs[selectedId] ?? ''}
                onChange={e => setInputs(prev => ({ ...prev, [selectedId]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && sendMsg()}
                placeholder="Digite uma mensagem..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
              />
              <button
                onClick={sendMsg}
                className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          </>)}
        </div>
      </div>
    </div>
  )
}
