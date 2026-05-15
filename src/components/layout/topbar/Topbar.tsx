'use client'

import { Bell, Search } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils/cn'

export function Topbar() {
  const { user } = useAuthStore()

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-white/8 bg-[#070d1a]/80 backdrop-blur-md shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2.5 flex-1 max-w-sm">
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
        <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 border-2 border-[#070d1a]" />
        </button>

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
