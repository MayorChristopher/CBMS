import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/signup', '/', '/tracking.js', '/test-tracking.html']
    const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))

    // API routes don't need authentication middleware
    if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.next()
    }

    // For now, allow all routes to pass through
    // Authentication will be handled by the individual pages
    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
} 