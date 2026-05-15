export function formatCurrency(
  value: number,
  currency = 'BRL',
  locale = 'pt-BR',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatCompactCurrency(value: number, currency = 'BRL'): string {
  if (value >= 1_000_000) return `${formatCurrency(value / 1_000_000, currency)}M`
  if (value >= 1_000) return `${formatCurrency(value / 1_000, currency)}K`
  return formatCurrency(value, currency)
}

export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.'))
}
