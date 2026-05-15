import { useTheme as useNextTheme } from 'next-themes'
import { useUIStore } from '@/store/ui.store'

export function useTheme() {
  const { theme, setTheme: nextSetTheme, resolvedTheme, systemTheme } = useNextTheme()
  const { setTheme: storeSetTheme } = useUIStore()

  function setTheme(t: 'dark' | 'light' | 'system') {
    nextSetTheme(t)
    storeSetTheme(t)
  }

  return {
    theme,
    resolvedTheme,
    systemTheme,
    isDark: resolvedTheme === 'dark',
    setTheme,
  }
}
