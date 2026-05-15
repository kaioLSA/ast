type PixelEvent =
  | 'PageView'
  | 'Lead'
  | 'Purchase'
  | 'InitiateCheckout'
  | 'AddToCart'
  | 'ViewContent'
  | 'CompleteRegistration'

declare global {
  interface Window {
    fbq?: (method: string, event: string, params?: object) => void
  }
}

export function trackPixelEvent(event: PixelEvent, params?: object): void {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, params)
  }
}

export function initMetaPixel(pixelId: string): void {
  if (typeof window === 'undefined') return
  // Meta Pixel init - injected via script tag in layout
  window.fbq?.('init', pixelId)
  window.fbq?.('track', 'PageView')
}
