import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Check if the user is trying to access a protected route
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')

  if (isProtectedRoute) {
    // Check for auth token in cookies
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      // Redirect to login if no token
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verify token with API (optional - you can also just check existence)
    // For now, we trust the cookie since API will validate on requests
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
