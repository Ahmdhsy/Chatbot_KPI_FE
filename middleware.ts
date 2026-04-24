import { NextRequest, NextResponse } from "next/server"

const PROTECTED_PATHS = ["/", "/users", "/ingestion", "/chat"]
const AUTH_PATHS = ["/signin", "/signup"]

type TokenState = "missing" | "valid" | "invalid"

function getTokenState(token: string | undefined): TokenState {
  if (!token) return "missing"

  try {
    const parts = token.split(".")
    if (parts.length !== 3) return "invalid"

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
    const payload = JSON.parse(atob(padded)) as { exp?: number }

    if (typeof payload.exp !== "number") return "invalid"

    const nowSec = Math.floor(Date.now() / 1000)
    return payload.exp > nowSec ? "valid" : "invalid"
  } catch {
    return "invalid"
  }
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

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  )
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p))

  if (isProtected && tokenState !== "valid") {
    return redirectToSigninAndClearCookie(req)
  }

  if (isAuthPath && tokenState === "valid") {
    return NextResponse.redirect(new URL("/", req.url))
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
