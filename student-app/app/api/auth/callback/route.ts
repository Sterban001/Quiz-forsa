import { NextResponse } from 'next/server'

// This callback route is no longer needed for API-based auth
// Keeping it for backward compatibility, but it just redirects to dashboard
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  return NextResponse.redirect(requestUrl.origin + '/dashboard')
}
