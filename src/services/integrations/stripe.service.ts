import { post, get } from '@/services/api/api'
import type { Subscription } from '@/types/finance.types'
import type { ApiResponse } from '@/types/global.types'

export async function createCheckoutSession(priceId: string): Promise<ApiResponse<{ url: string }>> {
  return post('/integrations/stripe/checkout', { priceId })
}

export async function createPortalSession(): Promise<ApiResponse<{ url: string }>> {
  return post('/integrations/stripe/portal')
}

export async function getSubscription(): Promise<ApiResponse<Subscription>> {
  return get('/integrations/stripe/subscription')
}

export async function cancelSubscription(): Promise<ApiResponse<Subscription>> {
  return post('/integrations/stripe/cancel')
}
