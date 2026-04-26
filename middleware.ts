import { NextRequest, NextResponse } from "next/server"

const PROTECTED_PATHS = ["/", "/users", "/chatbots", "/ingestion", "/chat"]
const AUTH_PATHS = ["/signin", "/signup"]

type TokenState = "missing" | "valid" | "invalid"
type UserRole = "admin" | "hrd" | "unknown"

const ROLE_ALLOWED_PREFIXES: Record<UserRole, string[]> = {
  admin: ["/", "/users", "/chatbots"],
  hrd: ["/", "/ingestion"],
  unknown: [],
}

type JwtPayload = {
  exp?: number
  role?: string
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
    return JSON.parse(atob(padded)) as JwtPayload
  } catch {
    return null
  }
}

function getTokenState(token: string | undefined): TokenState {
  if (!token) return "missing"

  const payload = decodeJwtPayload(token)
  if (!payload) return "invalid"
  if (typeof payload.exp !== "number") return "invalid"

  const nowSec = Math.floor(Date.now() / 1000)
  return payload.exp > nowSec ? "valid" : "invalid"
}

function getRoleFromToken(token: string | undefined): UserRole {
  if (!token) return "unknown"

  const payload = decodeJwtPayload(token)
  const role = String(payload?.role ?? "").toLowerCase()
  if (role === "admin" || role === "hrd") {
    return role
  }
  return "unknown"
}

function getHomePathByRole(role: UserRole): string {
  if (role === "admin") return "/users"
  if (role === "hrd") return "/ingestion"
  return "/signin"
}

function isPathAllowedForRole(pathname: string, role: UserRole): boolean {
  const allowedPrefixes = ROLE_ALLOWED_PREFIXES[role] ?? []
  return allowedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))
}

function redirectToSigninAndClearCookie(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/signin", req.url))
  res.cookies.set("access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  return res
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value
  const { pathname } = req.nextUrl
  const tokenState = getTokenState(token)
  const role = getRoleFromToken(token)

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  )
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p))

  if (isProtected && tokenState !== "valid") {
    return redirectToSigninAndClearCookie(req)
  }

  if (tokenState === "valid" && role === "unknown") {
    if (isAuthPath) {
      const res = NextResponse.next()
      res.cookies.set("access_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      })
      return res
    }
    return redirectToSigninAndClearCookie(req)
  }

  if (pathname === "/" && tokenState === "valid") {
    return NextResponse.redirect(new URL(getHomePathByRole(role), req.url))
  }

  if (isProtected && tokenState === "valid" && !isPathAllowedForRole(pathname, role)) {
    return NextResponse.redirect(new URL(getHomePathByRole(role), req.url))
  }

  if (isAuthPath && tokenState === "valid") {
    return NextResponse.redirect(new URL(getHomePathByRole(role), req.url))
  }

  if (isAuthPath && tokenState === "invalid") {
    const res = NextResponse.next()
    res.cookies.set("access_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)",
  ],
}
