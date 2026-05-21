import type { Metadata } from 'next'
import { LoginPageClient } from '@/components/ui/auth/LoginPageClient'

export const metadata: Metadata = { title: 'Entrar — Startsette CRM' }

export default function LoginPage() {
  return <LoginPageClient />
}
