import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    // Refresh session if expired
    const {
        data: { session },
    } = await supabase.auth.getSession()

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/signup', '/', '/tracking.js', '/test-tracking.html']
    const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))

    // API routes don't need authentication middleware
    if (req.nextUrl.pathname.startsWith('/api/')) {
        return res
    }

    // If accessing a protected route without session, redirect to login
    if (!session && !isPublicRoute) {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/login'
        return NextResponse.redirect(redirectUrl)
    }

    // If accessing login/signup with session, redirect to dashboard
    if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup')) {
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/dashboard'
        return NextResponse.redirect(redirectUrl)
    }

    return res
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