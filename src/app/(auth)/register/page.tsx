import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Criar conta' }

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">Criar conta</h1>
          <p className="text-muted-foreground mt-2">Comece sua jornada com o Startsette CRM</p>
        </div>
      </div>
    </main>
  )
}
