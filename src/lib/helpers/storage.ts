import { STORAGE_KEYS } from '@/lib/constants/app'

export function getLocalStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const item = localStorage.getItem(key)
    return item ? (JSON.parse(item) as T) : null
  } catch {
    return null
  }
}

export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.warn(`Failed to set localStorage key "${key}"`)
  }
}

export function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}

export function clearAuthStorage(): void {
  removeLocalStorage(STORAGE_KEYS.AUTH_TOKEN)
  removeLocalStorage(STORAGE_KEYS.REFRESH_TOKEN)
}
