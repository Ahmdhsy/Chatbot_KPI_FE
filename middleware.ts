import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Middleware is optional since we're using client-side ProtectedRoute
  // This can be extended in the future for additional server-side checks
  return NextResponse.next();
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
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
