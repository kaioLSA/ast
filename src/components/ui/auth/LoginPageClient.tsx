'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { LoginForm } from './LoginForm'
import { LoginPageHeader } from './LoginPageHeader'
import { useAuthContext } from '@/context/auth.context'

/* ─── Animation phases ───────────────────────────────────────────────────────
  idle → everything visible
  out  → logo/footer fade (120ms), then card collapses ellipse (220ms)
  done → navigate immediately — dashboard page-in handles the transition
────────────────────────────────────────────────────────────────────────────── */
type Phase = 'idle' | 'out' | 'done'

export function LoginPageClient() {
  const [phase, setPhase] = useState<Phase>('idle')
  const callbackRef = useRef<() => void>(() => {})
  const { setExitTrigger } = useAuthContext()

  const triggerExit = useCallback((onDone: () => void) => {
    callbackRef.current = onDone
    setPhase('out')

    // fade 80ms delay + collapse 200ms = 280ms total, navigate right after
    setTimeout(() => {
      setPhase('done')
      callbackRef.current()
    }, 280)
  }, [])

  // Register the trigger with auth context so login() can call it
  useEffect(() => {
    setExitTrigger(triggerExit)
  }, [triggerExit, setExitTrigger])

  const isOut = phase === 'out' || phase === 'done'

  return (
    <>

      <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0b0b0f]">
        {/* Ambient blobs — fade out */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: isOut ? 0 : 1,
            transition: isOut ? 'opacity 120ms ease' : 'none',
          }}
        >
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-indigo-700/10 blur-[100px]" />
        </div>

        {/* Grid overlay — fade out */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: isOut ? 0 : 0.03,
            transition: isOut ? 'opacity 250ms ease' : 'none',
          }}
        />

        <div className="relative z-10 w-full max-w-md px-4">
          {/* Logo animated — fades out on exit */}
          <div
            className="flex flex-col items-center mb-10"
            style={{
              opacity: isOut ? 0 : 1,
              transform: isOut ? 'translateY(-8px)' : 'translateY(0)',
              transition: isOut ? 'opacity 120ms ease, transform 120ms ease' : 'none',
            }}
          >
            <Image src="/startsette.png" alt="Startsette" width={200} height={50} unoptimized className="object-contain" />
            <p className="text-slate-400 mt-3 text-sm">Plataforma inteligente de gestão de vendas</p>
          </div>

          {/* Card — CRT TV collapse: ellipse shrinks vertically to a line with rounded ends */}
          <div
            style={{
              clipPath: isOut
                ? 'ellipse(55% 0% at 50% 50%)'
                : 'ellipse(80% 80% at 50% 50%)',
              transition: isOut
                ? 'clip-path 200ms cubic-bezier(0.55, 0, 1, 1) 80ms'
                : 'none',
            }}
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
              <div className="mb-6">
                <LoginPageHeader />
              </div>
              <LoginForm />
              {/* Demo hint */}
              <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                <p className="text-xs font-semibold text-blue-400 mb-2">✦ Acesso demo</p>
                <div className="space-y-1 text-xs text-slate-400 font-mono">
                  <p><span className="text-slate-300">demo@startsette.com</span> · demo123</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer — fades out */}
          <p
            className="text-center text-xs text-slate-600 mt-6"
            style={{
              opacity: isOut ? 0 : 1,
              transform: isOut ? 'translateY(8px)' : 'translateY(0)',
              transition: isOut ? 'opacity 120ms ease, transform 120ms ease' : 'none',
            }}
          >
            © 2025 Startsette. Todos os direitos reservados.
          </p>
        </div>
      </main>
    </>
  )
}
