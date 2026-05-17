import type { Metadata } from 'next'
import Image from 'next/image'
import { LoginForm } from '@/components/ui/auth/LoginForm'
import { LoginPageHeader } from '@/components/ui/auth/LoginPageHeader'

export const metadata: Metadata = { title: 'Entrar — Startsette CRM' }

export default function LoginPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#04070f]">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-indigo-700/10 blur-[100px]" />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-2">
            <Image src="/startsette.png" alt="Startsette" width={200} height={50} unoptimized className="object-contain" />
          </div>
          <p className="text-slate-400 mt-2 text-sm">Plataforma inteligente de gestão de vendas</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
          <div className="mb-6">
            <LoginPageHeader />
          </div>

          <LoginForm />

          {/* Demo hint — only on login step */}
          <LoginDemoHint />
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          © 2025 Startsette. Todos os direitos reservados.
        </p>
      </div>
    </main>
  )
}

function LoginDemoHint() {
  // This is a server component so it always renders — the hint is hidden via CSS on the change-password step
  // We keep it simple: always show. The ChangePasswordStep banner replaces the visual focus anyway.
  return (
    <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
      <p className="text-xs font-semibold text-blue-400 mb-2">✦ Acesso demo</p>
      <div className="space-y-1 text-xs text-slate-400 font-mono">
        <p><span className="text-slate-300">demo@startsette.com</span> · demo123</p>
      </div>
    </div>
  )
}
