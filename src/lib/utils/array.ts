export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const group = String(item[key])
      acc[group] = acc[group] ?? []
      acc[group].push(item)
      return acc
    },
    {} as Record<string, T[]>,
  )
}

export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

export function uniqueBy<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set()
  return arr.filter((item) => {
    const val = item[key]
    if (seen.has(val)) return false
    seen.add(val)
    return true
  })
}

export function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  )
}

export function sortBy<T>(arr: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...arr].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return direction === 'asc' ? comparison : -comparison
  })
}

export function sumBy<T>(arr: T[], key: keyof T): number {
  return arr.reduce((sum, item) => sum + Number(item[key]), 0)
}
