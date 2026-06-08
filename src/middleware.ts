import { NextResponse, type NextRequest } from 'next/server'
import { publicRoutes } from '@/config/routes'

// Rotas abertas: acessíveis com OU sem login, sem redirecionar (ex: sala de reunião p/ convidados externos)
const openRoutes = ['/sala']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value

  const isOpen = openRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'))
  if (isOpen) return NextResponse.next()

  const isPublic = publicRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'))

  if (!token && !isPublic) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (token && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.webp|.*\\.gif|.*\\.ico).*)'],
}
