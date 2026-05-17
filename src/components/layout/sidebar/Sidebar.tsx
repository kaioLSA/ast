'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
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
  const pathname = usePathname()
  const { isCollapsed, toggle } = useSidebar()
  const { logout } = useAuthContext()
  const { user } = useAuthStore()

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen border-r border-white/8 bg-[#070d1a] transition-all duration-300 shrink-0',
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
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
          return (
            <Link
              key={href}
              href={href}
              title={isCollapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent',
                isCollapsed && 'justify-center px-0 w-10 mx-auto',
              )}
            >
              <Icon className={cn('w-[18px] h-[18px] shrink-0', isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300')} />
              {!isCollapsed && <span className="truncate">{label}</span>}
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
        className="absolute -right-3 top-[72px] flex items-center justify-center w-6 h-6 rounded-full bg-[#0d1425] border border-white/15 hover:border-blue-500/40 hover:text-blue-400 text-slate-500 transition-all z-20"
      >
        {isCollapsed
          ? <ChevronRight className="w-3 h-3" />
          : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}
