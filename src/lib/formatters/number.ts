export function formatNumber(value: number, locale = 'pt-BR'): string {
  return new Intl.NumberFormat(locale).format(value)
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatChange(value: number): string {
  return value >= 0 ? `+${formatPercent(value)}` : formatPercent(value)
}
