import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected app routes
const PROTECTED_ROUTES = [
  '/swap',
  '/history',
  '/feedback',
  '/badges',
  '/referral',
  '/earn',
  '/track',
]

// Public routes that don't require access
const PUBLIC_ROUTES = [
  '/access',
]

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const searchParams = request.nextUrl.searchParams.toString()
  const queryString = searchParams ? `?${searchParams}` : ''
  const accessCookie = request.cookies.get('ks_access')
  const hasAccess = accessCookie && accessCookie.value === '1'
  
  // Handle root path: redirect to /access if no access, or /swap if has access
  if (pathname === '/') {
    if (hasAccess) {
      return NextResponse.redirect(new URL('/swap?mode=intent', request.url))
    } else {
      return NextResponse.redirect(new URL('/access', request.url))
    }
  }
  
  // If user has access and tries to access /access page, redirect to /swap
  if (pathname === '/access' && hasAccess) {
    const next = request.nextUrl.searchParams.get('next')
    if (next) {
      try {
        const decodedNext = decodeURIComponent(next)
        if (decodedNext.startsWith('/')) {
          return NextResponse.redirect(new URL(decodedNext, request.url))
        }
      } catch {
        // Invalid next param, fallback to default
      }
    }
    return NextResponse.redirect(new URL('/swap?mode=intent', request.url))
  }
  
  // Check access for protected routes
  const isProtected = PROTECTED_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))
  const isPublic = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))
  
  if (isProtected && !isPublic) {
    if (!hasAccess) {
      // Redirect to access page with next parameter
      const nextUrl = encodeURIComponent(`${pathname}${queryString}`)
      const accessUrl = new URL(`/access?next=${nextUrl}`, request.url)
      return NextResponse.redirect(accessUrl)
    }
  }
  
  const response = NextResponse.next()
  
  // Add performance headers for static assets
  if (pathname.startsWith('/chain-logos/') || 
      pathname.startsWith('/icons/') || 
      pathname.startsWith('/networks/') ||
      pathname === '/logo.png') {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }
  
  // Add security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon.png (favicon files)
     * - robots.txt, sitemap.xml (SEO files)
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|favicon\\.png|robots\\.txt|sitemap\\.xml).*)',
  ],
}

