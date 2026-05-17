'use client'

import { useAuthContext } from '@/context/auth.context'

export function LoginPageHeader() {
  const { requiresPasswordChange } = useAuthContext()

  if (requiresPasswordChange) {
    return (
      <>
        <h2 className="text-xl font-semibold text-white">Crie sua senha</h2>
        <p className="text-slate-400 text-sm mt-1">Primeiro acesso — defina uma senha pessoal segura</p>
      </>
    )
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-white">Bem-vindo de volta</h2>
      <p className="text-slate-400 text-sm mt-1">Entre com suas credenciais para acessar</p>
    </>
  )
}
