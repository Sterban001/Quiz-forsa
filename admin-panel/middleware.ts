import { NextResponse, type NextRequest } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to login page without auth
  if (pathname === '/login') {
    // If user has token, verify it and redirect to dashboard if valid
    const token = request.cookies.get('auth_token')?.value

    if (token) {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data.profile?.role === 'admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url))
          }
        }
      } catch (error) {
        // Token is invalid, continue to login page
      }
    }

    return NextResponse.next()
  }

  // For all other routes, check authentication
  const token = request.cookies.get('auth_token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verify token with API
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      // Token is invalid, redirect to login
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url))
      redirectResponse.cookies.delete('auth_token')
      return redirectResponse
    }

    const data = await response.json()

    // Check if user is admin
    if (!data.success || data.data.profile?.role !== 'admin') {
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url))
      redirectResponse.cookies.delete('auth_token')
      return redirectResponse
    }

    // User is authenticated and is admin
    return NextResponse.next()
  } catch (error) {
    // API error, redirect to login
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url))
    redirectResponse.cookies.delete('auth_token')
    return redirectResponse
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
