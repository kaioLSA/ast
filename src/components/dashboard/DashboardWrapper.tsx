'use client'

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { LayoutDashboard, BarChart2, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { DashboardOverview } from './overview/DashboardOverview'
import { AnalyticsDashboard } from './analytics/AnalyticsDashboard'
import { CustomDashboard } from './custom/CustomDashboard'
import type { DBDashboard } from './custom/types'

const FIXED_TABS = [
  { key: 'overview',  label: 'Visão Geral', icon: LayoutDashboard },
  { key: 'analytics', label: 'Analytics',   icon: BarChart2 },
] as const

interface CtxMenu { x: number; y: number; dashboardId: string }

export function DashboardWrapper() {
  const [tab, setTab]              = useState<string>('overview')
  const [customDashboards, setCDs] = useState<DBDashboard[]>([])
  const [creating, setCreating]    = useState(false)
  const [newName, setNewName]      = useState('')
  const [migrated, setMigrated]    = useState(false)
  const [ctx, setCtx]              = useState<CtxMenu | null>(null)
  const [renamingId, setRenamingId]= useState<string | null>(null)
  const [renameVal, setRenameVal]  = useState('')

  // Sliding pill state
  const [pill, setPill]            = useState({ left: 0, width: 0, ready: false })
  const tabRefs                    = useRef<Record<string, HTMLButtonElement | null>>({})

  const inputRef  = useRef<HTMLInputElement>(null)
  const renameRef = useRef<HTMLInputElement>(null)

  /* ── Move the pill to the active tab ─────────────────────────────────────── */
  const movePill = useCallback(() => {
    const el = tabRefs.current[tab]
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth, ready: true })
  }, [tab])

  useLayoutEffect(() => { movePill() }, [movePill])

  // Re-measure if custom dashboards change (new tab might appear)
  useEffect(() => {
    requestAnimationFrame(movePill)
  }, [customDashboards, movePill])

  /* ── Init ─────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    async function init() {
      if (!migrated) {
        await fetch('/api/dashboards/migrate', { method: 'POST' })
        setMigrated(true)
      }
      const res = await fetch('/api/dashboards')
      if (res.ok) setCDs(await res.json())
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { if (creating)   setTimeout(() => inputRef.current?.focus(),  50) }, [creating])
  useEffect(() => { if (renamingId) setTimeout(() => renameRef.current?.focus(), 50) }, [renamingId])

  useEffect(() => {
    if (!ctx) return
    const close = () => setCtx(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [ctx])

  /* ── Actions ──────────────────────────────────────────────────────────────── */

  const handleCreate = async () => {
    const nm = newName.trim() || 'Meu Dashboard'
    const res = await fetch('/api/dashboards', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nm }),
    })
    if (res.ok) {
      const d: DBDashboard = await res.json()
      setCDs(prev => [...prev, d])
      setTab(d.id)
      setNewName(''); setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/dashboards/${id}`, { method: 'DELETE' })
    setCDs(prev => prev.filter(d => d.id !== id))
    if (tab === id) setTab('overview')
    setCtx(null)
  }

  const startRename = (id: string, name: string) => {
    setRenamingId(id); setRenameVal(name); setCtx(null)
  }

  const commitRename = async () => {
    if (!renamingId || !renameVal.trim()) { setRenamingId(null); return }
    await fetch(`/api/dashboards/${renamingId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: renameVal.trim() }),
    })
    setCDs(prev => prev.map(d => d.id === renamingId ? { ...d, name: renameVal.trim() } : d))
    setRenamingId(null)
  }

  const handleCopy = async (id: string) => {
    const original = customDashboards.find(d => d.id === id)
    if (!original) return
    setCtx(null)
    const res = await fetch('/api/dashboards', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `${original.name} (cópia)` }),
    })
    if (!res.ok) return
    const newDash: DBDashboard = await res.json()
    const wRes = await fetch(`/api/dashboards/${id}/widgets`)
    if (wRes.ok) {
      const widgets = await wRes.json()
      await Promise.all(widgets.map((w: Record<string, unknown>) =>
        fetch(`/api/dashboards/${newDash.id}/widgets`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ widget_type: w.widget_type, data_source: w.data_source, title: w.title, color: w.color, col_span: w.col_span, tall: w.tall, merged: w.merged, config: w.config }),
        })
      ))
    }
    setCDs(prev => [...prev, newDash])
    setTab(newDash.id)
  }

  const activeCustom = customDashboards.find(d => d.id === tab)

  /* ── Render ───────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* ── Tab bar ───────────────────────────────────────────────────────────── */}
      <div className="relative flex items-center gap-1 bg-white/5 border border-white/8 rounded-xl p-1 w-fit">

        {/* Sliding pill */}
        {pill.ready && (
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm pointer-events-none"
            style={{
              left:  pill.left,
              width: pill.width,
              transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1), width 0.22s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        )}

        {/* Fixed tabs */}
        {FIXED_TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              ref={el => { tabRefs.current[t.key] = el }}
              onClick={() => setTab(t.key)}
              className={cn(
                'relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150',
                active ? 'text-black' : 'text-slate-400 hover:text-white',
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          )
        })}

        {/* Divider */}
        {customDashboards.length > 0 && (
          <div className="relative z-10 w-px h-4 bg-white/15 mx-0.5 self-center" />
        )}

        {/* Custom tabs */}
        {customDashboards.map(d => {
          const active = tab === d.id
          return (
            <div key={d.id}>
              {renamingId === d.id ? (
                <div className="relative z-10 flex items-center gap-1 px-1">
                  <input
                    ref={renameRef}
                    value={renameVal}
                    onChange={e => setRenameVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingId(null) }}
                    onBlur={commitRename}
                    className="h-7 px-2 w-32 rounded-lg bg-white/10 border border-blue-500/50 text-sm text-white focus:outline-none"
                  />
                </div>
              ) : (
                <button
                  ref={el => { tabRefs.current[d.id] = el }}
                  onClick={() => setTab(d.id)}
                  onContextMenu={e => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY, dashboardId: d.id }) }}
                  className={cn(
                    'relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 select-none',
                    active ? 'text-black' : 'text-slate-400 hover:text-white',
                  )}
                >
                  {d.name}
                </button>
              )}
            </div>
          )
        })}

        {/* Create input or + button */}
        {creating ? (
          <div className="relative z-10 flex items-center gap-1 pl-1">
            <input
              ref={inputRef}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(false); setNewName('') } }}
              placeholder="Nome..."
              className="h-7 px-2 w-28 rounded-lg bg-white/10 border border-blue-500/50 text-sm text-white placeholder:text-slate-600 focus:outline-none"
            />
            <button onClick={handleCreate} className="px-2.5 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors">
              Criar
            </button>
            <button onClick={() => { setCreating(false); setNewName('') }} className="p-1 rounded-lg text-slate-500 hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            title="Criar dashboard personalizado"
            className="relative z-10 flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all ml-0.5"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Context menu ──────────────────────────────────────────────────────── */}
      {ctx && (() => {
        const d = customDashboards.find(x => x.id === ctx.dashboardId)
        if (!d) return null
        return (
          <div
            className="fixed z-[9999] min-w-[160px] rounded-xl border border-white/10 bg-[#1c1c24] shadow-2xl overflow-hidden py-1"
            style={{ left: ctx.x, top: ctx.y }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => startRename(d.id, d.name)} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-200 hover:bg-white/8 transition-colors text-left">
              ✏️ Renomear
            </button>
            <button onClick={() => handleCopy(d.id)} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-200 hover:bg-white/8 transition-colors text-left">
              📋 Criar cópia
            </button>
            <div className="h-px bg-white/8 mx-2 my-1" />
            <button onClick={() => handleDelete(d.id)} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left">
              🗑️ Excluir
            </button>
          </div>
        )
      })()}

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      {tab === 'overview'  && <DashboardOverview />}
      {tab === 'analytics' && <AnalyticsDashboard />}
      {activeCustom && (
        <CustomDashboard key={activeCustom.id} dashboard={activeCustom} onDelete={() => handleDelete(activeCustom.id)} />
      )}
    </div>
  )
}
