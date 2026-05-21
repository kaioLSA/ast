'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  Search, X, ArrowRight,
  LayoutDashboard, Users, Building2, MessageCircle, Sparkles,
  BarChart3, DollarSign, Calendar, FileText, UsersRound, Settings,
  ArrowUpRight, ArrowDownRight, CornerDownLeft, Phone,
} from 'lucide-react'

/* ─── Static pages ───────────────────────────────────────────────────────── */

const PAGES = [
  { label: 'Dashboard',     href: '/dashboard',  icon: LayoutDashboard, keywords: 'dashboard início home' },
  { label: 'Leads',         href: '/leads',       icon: Users,           keywords: 'leads prospectos contatos' },
  { label: 'Clientes',      href: '/clients',     icon: Building2,       keywords: 'clientes customers empresa' },
  { label: 'WhatsApp',      href: '/whatsapp',    icon: MessageCircle,   keywords: 'whatsapp mensagens chat conversa' },
  { label: 'IA',            href: '/ai',          icon: Sparkles,        keywords: 'ia inteligencia artificial ai assistente' },
  { label: 'Analytics',     href: '/analytics',   icon: BarChart3,       keywords: 'analytics análises métricas gráficos' },
  { label: 'Financeiro',    href: '/finance',     icon: DollarSign,      keywords: 'financeiro finanças dinheiro transações receita despesa' },
  { label: 'Calendário',    href: '/calendar',    icon: Calendar,        keywords: 'calendário agenda reuniões eventos' },
  { label: 'Relatórios',    href: '/reports',     icon: FileText,        keywords: 'relatórios reports exportar' },
  { label: 'Equipe',        href: '/team',        icon: UsersRound,      keywords: 'equipe team membros colaboradores' },
  { label: 'Configurações', href: '/settings',    icon: Settings,        keywords: 'configurações settings perfil conta' },
]

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(n)
}

const STATUS_COLOR: Record<string, string> = {
  new:          'text-blue-400  bg-blue-500/10',
  contacted:    'text-yellow-400 bg-yellow-500/10',
  qualified:    'text-purple-400 bg-purple-500/10',
  converted:    'text-green-400  bg-green-500/10',
  lost:         'text-slate-400  bg-slate-500/10',
  active:       'text-green-400  bg-green-500/10',
  prospect:     'text-blue-400   bg-blue-500/10',
  inactive:     'text-slate-400  bg-slate-500/10',
  completed:    'text-green-400  bg-green-500/10',
  pending:      'text-yellow-400 bg-yellow-500/10',
}

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface FlatResult {
  id: string
  group: string
  title: string
  subtitle?: string
  badge?: string
  badgeColor?: string
  href: string
  icon: React.ReactNode
}

interface Props {
  open: boolean
  onClose: () => void
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export function GlobalSearch({ open, onClose }: Props) {
  const router   = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef  = useRef<HTMLDivElement>(null)

  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<{ leads: any[]; clients: any[]; transactions: any[]; contacts: any[] }>({ leads: [], clients: [], transactions: [], contacts: [] }) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(false)
  const [cursor,  setCursor]  = useState(-1)

  /* ── Portal target (client-side only) ───────────────────────────── */
  const [portalEl, setPortalEl] = useState<Element | null>(null)
  useEffect(() => { setPortalEl(document.body) }, [])

  /* ── Animation state ─────────────────────────────────────────────── */
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const DURATION = 200

  useEffect(() => {
    if (open) {
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), DURATION)
      return () => clearTimeout(t)
    }
  }, [open])

  /* ── Focus on open ───────────────────────────────────────────────── */
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults({ leads: [], clients: [], transactions: [], contacts: [] })
      setCursor(-1)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  /* ── Esc to close ────────────────────────────────────────────────── */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  /* ── Debounced fetch ─────────────────────────────────────────────── */
  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) { setResults({ leads: [], clients: [], transactions: [], contacts: [] }); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (res.ok) setResults(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchResults(query), 220)
    return () => clearTimeout(t)
  }, [query, fetchResults])

  /* ── Build results ───────────────────────────────────────────────── */

  const filteredPages: FlatResult[] = PAGES
    .filter(p => {
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return p.label.toLowerCase().includes(q) || p.keywords.includes(q)
    })
    .slice(0, query.trim() ? 3 : PAGES.length)
    .map(p => ({
      id: `page:${p.href}`, group: 'Páginas',
      title: p.label, subtitle: p.href, href: p.href,
      icon: <p.icon className="w-4 h-4" />,
    }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leadResults: FlatResult[] = results.leads.map((l: any) => ({
    id: `lead:${l.id}`, group: 'Leads',
    title: l.name || '—',
    subtitle: [l.company, l.email, l.phone].filter(Boolean).join(' · ') || '',
    badge: l.status, badgeColor: STATUS_COLOR[l.status] ?? 'text-slate-400 bg-slate-500/10',
    href: '/leads', icon: <Users className="w-4 h-4" />,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientResults: FlatResult[] = results.clients.map((c: any) => ({
    id: `client:${c.id}`, group: 'Clientes',
    title: c.name || '—',
    subtitle: [c.company_name, c.email, c.phone].filter(Boolean).join(' · ') || '',
    badge: c.status, badgeColor: STATUS_COLOR[c.status] ?? 'text-slate-400 bg-slate-500/10',
    href: '/clients', icon: <Building2 className="w-4 h-4" />,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contactResults: FlatResult[] = results.contacts.map((c: any) => ({
    id: `contact:${c.id ?? c.phone}`, group: 'WhatsApp',
    title: c.name || c.phone || '—',
    subtitle: c.phone ? `Contato · ${c.phone}` : 'Contato WhatsApp',
    badge: 'WhatsApp', badgeColor: 'text-green-400 bg-green-500/10',
    href: '/whatsapp', icon: <MessageCircle className="w-4 h-4 text-green-400" />,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const txResults: FlatResult[] = results.transactions.map((t: any) => ({
    id: `tx:${t.id}`, group: 'Financeiro',
    title: t.description || '—',
    subtitle: fmt(t.amount),
    badge: t.type === 'income' ? 'Receita' : 'Despesa',
    badgeColor: t.type === 'income' ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10',
    href: '/finance',
    icon: t.type === 'income'
      ? <ArrowUpRight className="w-4 h-4 text-green-400" />
      : <ArrowDownRight className="w-4 h-4 text-red-400" />,
  }))

  const groups: { label: string; items: FlatResult[] }[] = []
  if (filteredPages.length)  groups.push({ label: 'Páginas',    items: filteredPages   })
  if (leadResults.length)    groups.push({ label: 'Leads',      items: leadResults     })
  if (clientResults.length)  groups.push({ label: 'Clientes',   items: clientResults   })
  if (contactResults.length) groups.push({ label: 'WhatsApp',   items: contactResults  })
  if (txResults.length)      groups.push({ label: 'Financeiro', items: txResults       })

  const flat = groups.flatMap(g => g.items)
  const isEmpty = flat.length === 0
  const showSkeleton = loading && query.length >= 2

  /* ── Navigate ────────────────────────────────────────────────────── */
  const go = useCallback((item: FlatResult) => {
    router.push(item.href)
    onClose()
  }, [router, onClose])

  /* ── Keyboard nav ────────────────────────────────────────────────── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, flat.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)) }
    else if (e.key === 'Enter' && cursor >= 0 && flat[cursor]) { go(flat[cursor]) }
  }

  useEffect(() => {
    if (cursor < 0) return
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`) as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  /* ── Render ──────────────────────────────────────────────────────── */
  if (!mounted || !portalEl) return null

  const easing = 'cubic-bezier(0.4,0,0.2,1)'

  return createPortal(
    <>
      {/* ── Backdrop: fixed on body, covers EVERYTHING including sidebar ── */}
      <div
        onClick={onClose}
        style={{ transition: `opacity ${DURATION}ms ${easing}` }}
        className={`fixed inset-0 z-[99998] bg-black/55 backdrop-blur-[10px] transition-opacity ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* ── Panel wrapper ── */}
      <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-[10vh] px-4 pointer-events-none">
        <div
          style={{
            transition: `opacity ${DURATION}ms ${easing}, transform ${DURATION}ms ${easing}`,
            opacity:   visible ? 1 : 0,
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.97)',
          }}
          className="pointer-events-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#16161e] shadow-[0_32px_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[72vh]"
        >
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setCursor(-1) }}
              onKeyDown={handleKeyDown}
              placeholder="Pesquisar leads, clientes, contatos, transações..."
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setCursor(-1) }}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:flex items-center px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-slate-600 font-mono">
              esc
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain">

            {/* Skeleton */}
            {showSkeleton && (
              <div className="p-3 space-y-1.5">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
                    <div className="w-7 h-7 rounded-lg bg-white/5 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-white/5 rounded-full w-2/3" />
                      <div className="h-2 bg-white/5 rounded-full w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!showSkeleton && isEmpty && query.length >= 2 && (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Phone className="w-8 h-8 text-slate-700" />
                <p className="text-sm text-slate-500">Nenhum resultado para <span className="text-slate-300">"{query}"</span></p>
                <p className="text-xs text-slate-600">Tente um nome, telefone, e-mail ou empresa</p>
              </div>
            )}

            {/* Groups */}
            {!showSkeleton && groups.map(group => {
              let offset = 0
              for (const g of groups) {
                if (g.label === group.label) break
                offset += g.items.length
              }

              return (
                <div key={group.label}>
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                      {group.label}
                    </span>
                    <span className="text-[10px] text-slate-700">{group.items.length}</span>
                  </div>
                  <div className="px-2 pb-2 space-y-0.5">
                    {group.items.map((item, localIdx) => {
                      const globalIdx = offset + localIdx
                      const active = cursor === globalIdx

                      return (
                        <button
                          key={item.id}
                          data-idx={globalIdx}
                          onClick={() => go(item)}
                          onMouseEnter={() => setCursor(globalIdx)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                            active ? 'bg-white/8' : 'hover:bg-white/5'
                          }`}
                        >
                          {/* Icon */}
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            active ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-400'
                          }`}>
                            {item.icon}
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate leading-snug">
                              <Highlight text={item.title} query={query} />
                            </p>
                            {item.subtitle && (
                              <p className="text-[11px] text-slate-500 truncate leading-snug mt-0.5">
                                <Highlight text={item.subtitle} query={query} />
                              </p>
                            )}
                          </div>

                          {/* Badge */}
                          {item.badge && (
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                          )}

                          {/* Arrow */}
                          {active
                            ? <CornerDownLeft className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            : <ArrowRight    className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                          }
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            <div className="h-2" />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/8 text-[10px] text-slate-600">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-mono">↑↓</kbd> navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-mono">↵</kbd> abrir
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-mono">esc</kbd> fechar
              </span>
            </div>
            {flat.length > 0 && !loading && (
              <span>{flat.length} resultado{flat.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>
    </>,
    portalEl
  )
}

/* ─── Highlight ──────────────────────────────────────────────────────────── */

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const safe  = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${safe})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} className="bg-blue-500/20 text-blue-300 rounded-sm px-[1px] not-italic">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  )
}
