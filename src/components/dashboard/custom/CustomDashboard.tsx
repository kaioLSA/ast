'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Check, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { WidgetCard } from './WidgetCard'
import { WidgetBuilder } from './WidgetBuilder'
import type { DBWidget, DBDashboard, WidgetType } from './types'

interface Props {
  dashboard: DBDashboard
  onDelete: () => void
}

export function CustomDashboard({ dashboard, onDelete }: Props) {
  const [widgets, setWidgets] = useState<DBWidget[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [builderOpen, setBuilderOpen] = useState(false)

  const loadWidgets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboards/${dashboard.id}/widgets`)
      if (res.ok) setWidgets(await res.json())
    } finally {
      setLoading(false)
    }
  }, [dashboard.id])

  useEffect(() => { loadWidgets() }, [loadWidgets])

  const handleAddWidget = async (config: {
    widget_type: WidgetType
    data_source: string
    title: string
    color: string
    col_span: 3 | 6 | 9 | 12
    tall: boolean
    merged: boolean
    config: Record<string, unknown>
  }) => {
    const res = await fetch(`/api/dashboards/${dashboard.id}/widgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    if (res.ok) await loadWidgets()
  }

  const handleDeleteWidget = async (id: string) => {
    await fetch(`/api/dashboards/${dashboard.id}/widgets/${id}`, { method: 'DELETE' })
    setWidgets(prev => prev.filter(w => w.id !== id))
  }

  const handleMove = async (index: number, dir: -1 | 1) => {
    const newWidgets = [...widgets]
    const target = index + dir
    if (target < 0 || target >= newWidgets.length) return
    ;[newWidgets[index], newWidgets[target]] = [newWidgets[target], newWidgets[index]]
    setWidgets(newWidgets)
    // persist positions
    await Promise.all([
      fetch(`/api/dashboards/${dashboard.id}/widgets/${newWidgets[index].id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: index }),
      }),
      fetch(`/api/dashboards/${dashboard.id}/widgets/${newWidgets[target].id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ position: target }),
      }),
    ])
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditMode(e => !e)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors',
              editMode ? 'bg-blue-600 text-white' : 'bg-white/8 hover:bg-white/12 text-slate-300'
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            {editMode ? 'Concluir edição' : 'Editar layout'}
          </button>
          <button
            onClick={() => setBuilderOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Widget
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-slate-500 text-sm">Carregando...</div>
      ) : widgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 h-64 rounded-[24px] border border-dashed border-white/10 bg-white/[0.02]">
          <p className="text-slate-500 text-sm">Nenhum widget ainda.</p>
          <button
            onClick={() => setBuilderOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-600/30 transition-colors"
          >
            <Plus className="w-4 h-4" /> Adicionar primeiro widget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {widgets.map((w, i) => (
            <WidgetCard
              key={w.id}
              widget={w}
              editMode={editMode}
              onDelete={() => handleDeleteWidget(w.id)}
              onMoveUp={() => handleMove(i, -1)}
              onMoveDown={() => handleMove(i, 1)}
              isFirst={i === 0}
              isLast={i === widgets.length - 1}
            />
          ))}
          {/* Add slot in edit mode */}
          {editMode && (
            <button
              onClick={() => setBuilderOpen(true)}
              className="col-span-3 h-32 rounded-[24px] border border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.04] hover:border-blue-500/40 text-slate-600 hover:text-blue-400 flex flex-col items-center justify-center gap-2 transition-all text-xs font-medium"
            >
              <Plus className="w-5 h-5" />
              Adicionar widget
            </button>
          )}
        </div>
      )}

      <WidgetBuilder open={builderOpen} onClose={() => setBuilderOpen(false)} onAdd={handleAddWidget} />
    </div>
  )
}
