export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function getScrollPosition(): { x: number; y: number } {
  if (!isBrowser()) return { x: 0, y: 0 }
  return { x: window.scrollX, y: window.scrollY }
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function downloadFile(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
