export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj }
  keys.forEach((key) => delete result[key])
  return result
}

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  return keys.reduce(
    (acc, key) => {
      if (key in obj) acc[key] = obj[key]
      return acc
    },
    {} as Pick<T, K>,
  )
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

export function isEmptyObject(obj: object): boolean {
  return Object.keys(obj).length === 0
}

export function flattenObject(
  obj: Record<string, unknown>,
  prefix = '',
): Record<string, unknown> {
  return Object.keys(obj).reduce(
    (acc, key) => {
      const pre = prefix ? `${prefix}.${key}` : key
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(acc, flattenObject(obj[key] as Record<string, unknown>, pre))
      } else {
        acc[pre] = obj[key]
      }
      return acc
    },
    {} as Record<string, unknown>,
  )
}
