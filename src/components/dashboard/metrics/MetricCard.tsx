'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatCompactCurrency, formatCompact, formatPercent } from '@/lib/formatters'
import type { MetricCard as MetricCardType } from '@/types/analytics.types'

interface MetricCardProps {
  metric: MetricCardType
  className?: string
}

export function MetricCard({ metric, className }: MetricCardProps) {
  const { label, value, change, trend, prefix, suffix } = metric

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground'

  const formattedValue =
    typeof value === 'number'
      ? prefix === 'R$'
        ? formatCompactCurrency(value)
        : formatCompact(value)
      : value

  return (
    <div
      className={cn(
        'glass rounded-xl p-5 flex flex-col gap-3 hover:border-primary/30 transition-all duration-200 group',
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">{label}</p>

      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-bold tabular-nums">
          {formattedValue}
          {suffix}
        </span>
        <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
          <TrendIcon className="w-3.5 h-3.5" />
          {formatPercent(Math.abs(change))}
        </div>
      </div>

      {metric.sparkline && (
        <div className="flex items-end gap-0.5 h-8">
          {metric.sparkline.map((v, i) => {
            const max = Math.max(...metric.sparkline!)
            const height = max > 0 ? (v / max) * 100 : 0
            return (
              <div
                key={i}
                className="flex-1 rounded-sm bg-primary/20 group-hover:bg-primary/30 transition-colors"
                style={{ height: `${height}%` }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
