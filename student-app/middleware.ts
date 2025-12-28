import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to public pages without auth
  const publicPaths = ['/login', '/forgot-password', '/reset-password', '/auth/callback']

  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // For protected routes, let the client-side handle auth checks
  // The API will validate the token from localStorage on each request
  // If unauthorized, the API will return 401 and client will redirect to login

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
