'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react'
import { useAuthContext } from '@/context/auth.context'
import { loginSchema, type LoginSchema } from '@/lib/validators/auth'
import { cn } from '@/lib/utils/cn'

// ─── Step 1: Login ────────────────────────────────────────────────────────────

function LoginStep() {
  const { login, isLoggingIn, loginError } = useAuthContext()
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <form onSubmit={handleSubmit(login)} className="space-y-4">
      {/* Email */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-300">Email</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            className={cn(
              'w-full h-11 rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 text-sm text-white placeholder:text-slate-600',
              'focus:outline-none focus:border-blue-500/60 focus:bg-white/8 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200',
              errors.email && 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/20',
            )}
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle className="w-3 h-3" /> {errors.email.message}
          </p>
        )}
      </div>

      {/* Senha */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-300">Senha</label>
          <a href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Esqueceu?
          </a>
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type={showPass ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="current-password"
            className={cn(
              'w-full h-11 rounded-xl bg-white/5 border border-white/10 pl-10 pr-11 text-sm text-white placeholder:text-slate-600',
              'focus:outline-none focus:border-blue-500/60 focus:bg-white/8 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200',
              errors.password && 'border-red-500/60 focus:border-red-500/60 focus:ring-red-500/20',
            )}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPass(p => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertCircle className="w-3 h-3" /> {errors.password.message}
          </p>
        )}
      </div>

      {loginError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{loginError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoggingIn}
        className={cn(
          'relative w-full h-11 rounded-xl font-semibold text-sm text-white overflow-hidden',
          'bg-gradient-to-r from-blue-600 to-cyan-500',
          'shadow-[0_0_20px_rgba(59,130,246,0.4)]',
          'hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:scale-[1.01]',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100',
          'transition-all duration-200 flex items-center justify-center gap-2',
        )}
      >
        {isLoggingIn ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Entrando...
          </>
        ) : (
          <>Entrar <ArrowRight className="w-4 h-4" /></>
        )}
      </button>
    </form>
  )
}

// ─── Step 2: Force password change ───────────────────────────────────────────

function ChangePasswordStep() {
  const { changePassword, isChangingPassword, changePasswordError } = useAuthContext()
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    if (newPassword.length < 6) return setLocalError('A senha deve ter pelo menos 6 caracteres')
    if (newPassword !== confirm) return setLocalError('As senhas não coincidem')
    changePassword(newPassword)
  }

  const error = localError || changePasswordError

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header banner */}
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-300">Defina sua senha pessoal</p>
          <p className="text-xs text-amber-400/80 mt-0.5 leading-relaxed">
            Por segurança, você precisa criar uma nova senha antes de acessar o sistema. Esta senha é pessoal e não deve ser compartilhada.
          </p>
        </div>
      </div>

      {/* Nova senha */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-300">Nova senha</label>
        <div className="relative">
          <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type={showPass ? 'text' : 'password'}
            placeholder="Mínimo 6 caracteres"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            autoFocus
            className="w-full h-11 rounded-xl bg-white/5 border border-white/10 pl-10 pr-11 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60 focus:bg-white/8 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
          />
          <button
            type="button"
            onClick={() => setShowPass(p => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Confirmar senha */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-300">Confirmar nova senha</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type={showPass ? 'text' : 'password'}
            placeholder="Repita a nova senha"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className={cn(
              'w-full h-11 rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 text-sm text-white placeholder:text-slate-600',
              'focus:outline-none focus:border-blue-500/60 focus:bg-white/8 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200',
              confirm && newPassword && confirm !== newPassword && 'border-red-500/40',
            )}
          />
        </div>
      </div>

      {/* Strength indicator */}
      {newPassword && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[1,2,3,4].map(i => (
              <div key={i} className={cn(
                'h-1 flex-1 rounded-full transition-all',
                newPassword.length >= i * 3
                  ? i <= 1 ? 'bg-red-500' : i <= 2 ? 'bg-amber-500' : i <= 3 ? 'bg-blue-500' : 'bg-emerald-500'
                  : 'bg-white/10'
              )} />
            ))}
          </div>
          <p className="text-[11px] text-slate-500">
            {newPassword.length < 3 ? 'Muito fraca' : newPassword.length < 6 ? 'Fraca' : newPassword.length < 9 ? 'Boa' : 'Forte'}
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isChangingPassword || !newPassword || !confirm}
        className={cn(
          'relative w-full h-11 rounded-xl font-semibold text-sm text-white overflow-hidden',
          'bg-gradient-to-r from-blue-600 to-cyan-500',
          'shadow-[0_0_20px_rgba(59,130,246,0.4)]',
          'hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:scale-[1.01]',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100',
          'transition-all duration-200 flex items-center justify-center gap-2',
        )}
      >
        {isChangingPassword ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Salvando...
          </>
        ) : (
          <><ShieldCheck className="w-4 h-4" /> Salvar senha e entrar</>
        )}
      </button>
    </form>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function LoginForm() {
  const { requiresPasswordChange } = useAuthContext()
  return requiresPasswordChange ? <ChangePasswordStep /> : <LoginStep />
}
