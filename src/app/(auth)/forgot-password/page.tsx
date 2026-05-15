import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Recuperar senha' }

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Recuperar senha</h1>
          <p className="text-muted-foreground mt-2">Enviaremos um link para seu email</p>
        </div>
      </div>
    </main>
  )
}
