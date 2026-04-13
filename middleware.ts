import { NextRequest, NextResponse } from "next/server"

const PROTECTED_PATHS = ["/", "/users", "/ingestion"]
const AUTH_PATHS = ["/signin", "/signup"]

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value
  const { pathname } = req.nextUrl

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  )
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p))

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/signin", req.url))
  }

  if (isAuthPath && token) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)",
  ],
}
