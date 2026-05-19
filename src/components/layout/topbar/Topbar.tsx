'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Search, X, CheckCheck, Trash2, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useNotificationsStore } from '@/store/notifications.store'
import { mockNotifications } from '@/services/mocks/notifications.mock'
import type { Notification } from '@/services/mocks/notifications.mock'
import Link from 'next/link'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/leads': 'Leads',
  '/clients': 'Clientes',
  '/campaigns': 'Campanhas',
  '/automations': 'Automações',
  '/ai': 'IA',
  '/whatsapp': 'WhatsApp',
  '/analytics': 'Analytics',
  '/finance': 'Financeiro',
  '/calendar': 'Calendário',
  '/reports': 'Relatórios',
  '/team': 'Equipe',
  '/settings': 'Configurações',
}

const typeIcon: Record<Notification['type'], React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />,
  info: <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />,
  error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />,
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export function Topbar() {
  const { user } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, addNotification } =
    useNotificationsStore()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const autoDeleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // When bell opens → mark all read + schedule auto-delete after 2min
  // When bell closes → mark all read (remove unread dot)
  useEffect(() => {
    markAllAsRead()
    if (open) {
      // Snapshot current notification ids and delete them after 2min
      const ids = notifications.map(n => n.id)
      if (autoDeleteTimerRef.current) clearTimeout(autoDeleteTimerRef.current)
      autoDeleteTimerRef.current = setTimeout(() => {
        ids.forEach(id => removeNotification(id))
      }, 2 * 60 * 1000)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const pageTitle =
    pageTitles[pathname] ??
    pageTitles[Object.keys(pageTitles).find((k) => pathname.startsWith(k + '/')) ?? ''] ??
    'Startsette'

  // Seed mock notifications for demo users
  useEffect(() => {
    if (user?.isDemo && notifications.length === 0) {
      mockNotifications.forEach((n) => addNotification(n))
    }
  }, [user?.isDemo])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <header className="relative z-10 h-14 flex items-center justify-between px-6 border-b border-white/8 bg-[#070d1a]/80 backdrop-blur-md shrink-0">
      {/* Left: page title */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-white">{pageTitle}</span>
        <span className="text-slate-700 text-sm">|</span>
        <span className="text-xs text-slate-500">Startsette</span>
      </div>

      {/* Center: Search */}
      <div className="flex items-center gap-2.5 flex-1 max-w-sm mx-6">
        <div className="flex items-center gap-2.5 w-full h-9 rounded-xl bg-white/5 border border-white/8 px-3 hover:border-white/15 transition-colors">
          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
          />
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-slate-600 font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 border-2 border-[#070d1a]" />
            )}
          </button>

          {/* Panel */}
          {open && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/10 bg-[#0a1628] shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Notificações</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      title="Marcar todas como lidas"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Bell className="w-8 h-8 text-slate-700" />
                    <p className="text-sm text-slate-500">Nenhuma notificação</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`group flex items-start gap-3 px-4 py-3 border-b border-white/5 transition-colors hover:bg-white/3 ${!n.read ? 'bg-blue-500/5' : ''}`}
                    >
                      {typeIcon[n.type]}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-medium leading-snug ${n.read ? 'text-slate-400' : 'text-white'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-600 shrink-0">{timeAgo(n.createdAt)}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.description}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {n.action && (
                            <Link
                              href={n.action.href as never}
                              onClick={() => { markAsRead(n.id); setOpen(false) }}
                              className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              {n.action.label} →
                            </Link>
                          )}
                          {!n.read && (
                            <button
                              onClick={() => markAsRead(n.id)}
                              className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
                            >
                              Marcar como lida
                            </button>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeNotification(n.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pl-2 ml-1 border-l border-white/8">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]">
            {user?.name?.charAt(0) ?? 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-slate-200 leading-none">{user?.name ?? 'Usuário'}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{user?.role ?? 'agent'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
