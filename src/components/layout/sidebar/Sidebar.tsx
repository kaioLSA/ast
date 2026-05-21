'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useRef, useState, useLayoutEffect, useCallback, useEffect } from 'react'
import {
  LayoutDashboard, Users, MessageCircle,
  BarChart3, DollarSign, Calendar, FileText, Settings, UsersRound,
  ChevronLeft, ChevronRight, LogOut, Building2, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useSidebar } from '@/hooks/useSidebar'
import { useAuthContext } from '@/context/auth.context'
import { useAuthStore } from '@/store/auth.store'
import { routes } from '@/config/routes'
import { useWhatsAppStore } from '@/store/whatsapp.store'

const navItems = [
  { label: 'Dashboard', href: routes.dashboard, icon: LayoutDashboard, group: 'main' },
  { label: 'Leads', href: routes.leads.root, icon: Users, group: 'main' },
  { label: 'Clientes', href: routes.clients, icon: Building2, group: 'main' },
  { label: 'WhatsApp', href: routes.whatsapp, icon: MessageCircle, group: 'tools' },
  { label: 'IA', href: routes.ai, icon: Sparkles, group: 'tools' },
  { label: 'Analytics', href: routes.analytics, icon: BarChart3, group: 'tools' },
  { label: 'Financeiro', href: routes.finance.root, icon: DollarSign, group: 'tools' },
  { label: 'Calendário', href: routes.calendar, icon: Calendar, group: 'tools' },
  { label: 'Relatórios', href: routes.reports, icon: FileText, group: 'tools' },
  { label: 'Equipe', href: routes.team, icon: UsersRound, group: 'admin' },
  { label: 'Configurações', href: routes.settings.root, icon: Settings, group: 'admin' },
]

export function Sidebar() {
  const pathname  = usePathname()
  const { isCollapsed, toggle } = useSidebar()
  const { logout } = useAuthContext()
  const { user }  = useAuthStore()
  const { pendingCount } = useWhatsAppStore()
  const waBadge = pendingCount > 4 ? '4+' : pendingCount > 0 ? String(pendingCount) : null

  /* ── Sliding pill ─────────────────────────────────────────────────────────── */
  const navRef  = useRef<HTMLElement>(null)
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const [pill, setPill] = useState({ top: 0, height: 0, ready: false })

  const movePill = useCallback(() => {
    const active = navItems.find(item =>
      pathname === item.href ||
      (item.href !== '/dashboard' && pathname.startsWith(item.href))
    )
    if (!active) return
    const el = itemRefs.current[active.href]
    if (el) setPill({ top: el.offsetTop, height: el.offsetHeight, ready: true })
  }, [pathname])

  useLayoutEffect(() => { movePill() }, [movePill])

  // Re-measure when sidebar collapses/expands (item height/position may shift)
  useEffect(() => {
    requestAnimationFrame(movePill)
  }, [isCollapsed, movePill])

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen border-r border-white/8 bg-[#111118] transition-all duration-300 shrink-0',
        isCollapsed ? 'w-[68px]' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 border-b border-white/8',
        isCollapsed ? 'justify-center px-0' : 'px-5',
      )}>
        {isCollapsed ? (
          <Image src="/st.png" alt="Startsette" width={32} height={32} className="object-contain" />
        ) : (
          <Image src="/startsette.png" alt="Startsette" width={120} height={32} className="object-contain" />
        )}
      </div>

      {/* Nav */}
      <nav ref={navRef} className="relative flex-1 overflow-y-auto py-4 px-2">

        {/* Sliding pill */}
        {pill.ready && (
          <div
            className="absolute rounded-xl bg-white shadow-sm pointer-events-none z-0"
            style={{
              top:    pill.top,
              height: pill.height,
              left:   isCollapsed ? '50%' : 4,
              width:  isCollapsed ? 40 : 'calc(100% - 8px)',
              transform: isCollapsed ? 'translateX(-50%)' : 'none',
              transition: [
                'top 0.22s cubic-bezier(0.4,0,0.2,1)',
                'height 0.22s cubic-bezier(0.4,0,0.2,1)',
                'left 0.3s cubic-bezier(0.4,0,0.2,1)',
                'width 0.3s cubic-bezier(0.4,0,0.2,1)',
              ].join(', '),
            }}
          />
        )}

        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          const isWA    = href === routes.whatsapp
          const badge   = isWA ? waBadge : null
          return (
            <Link
              key={href}
              href={href}
              ref={el => { itemRefs.current[href] = el }}
              title={isCollapsed ? label : undefined}
              className={cn(
                'relative z-10 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 group',
                isActive
                  ? 'text-gray-900'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/5',
                isCollapsed && 'justify-center px-0 w-10 mx-auto',
              )}
            >
              {/* Icon */}
              <span className="relative shrink-0">
                <Icon className={cn(
                  'w-[18px] h-[18px]',
                  isActive ? 'text-gray-900' : 'text-slate-500 group-hover:text-slate-300',
                )} />
                {badge && isCollapsed && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
                    {badge}
                  </span>
                )}
              </span>

              {/* Label + badge */}
              {!isCollapsed && (
                <>
                  <span className="truncate flex-1">{label}</span>
                  {badge && (
                    <span className="ml-auto min-w-[18px] h-[18px] rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none shrink-0">
                      {badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="p-3 border-t border-white/8">
        {!isCollapsed && user && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl mb-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          title="Sair"
          className={cn(
            'flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150',
            isCollapsed && 'justify-center px-0 w-10 mx-auto',
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>

      {/* Toggle */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-[72px] flex items-center justify-center w-6 h-6 rounded-full bg-[#1c1c24] border border-white/15 hover:border-blue-500/40 hover:text-blue-400 text-slate-500 transition-all z-20"
      >
        {isCollapsed
          ? <ChevronRight className="w-3 h-3" />
          : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}
