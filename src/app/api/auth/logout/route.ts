import { NextRequest, NextResponse } from "next/server"

const FASTAPI_URL = process.env.FASTAPI_INTERNAL_URL ?? "http://localhost:8000"

export async function POST(req: NextRequest) {
  const refresh_token = req.cookies.get("refresh_token")?.value

  if (refresh_token) {
    try {
      await fetch(`${FASTAPI_URL}/api/v1/users/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refresh_token}`,
        },
        body: JSON.stringify({ refresh_token }),
      })
    } catch {
      // Ignore backend logout errors; still clear cookies below.
    }
  }

  const res = NextResponse.json({ message: "Logged out" })
  res.cookies.set("access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  res.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  return res
}
