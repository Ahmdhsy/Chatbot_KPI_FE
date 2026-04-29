import { NextRequest, NextResponse } from "next/server"

const FASTAPI_URL = process.env.FASTAPI_INTERNAL_URL ?? "http://localhost:8000"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { refresh_token } = body

  if (!refresh_token) {
    return NextResponse.json({ detail: "refresh_token required" }, { status: 400 })
  }

  const fastapiRes = await fetch(`${FASTAPI_URL}/api/v1/users/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${refresh_token}`,
    },
    body: JSON.stringify({ refresh_token }),
  })

  const data = await fastapiRes.json()

  if (!fastapiRes.ok) {
    return NextResponse.json(data, { status: fastapiRes.status })
  }

  const res = NextResponse.json(data)
  res.cookies.set("access_token", data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: data.expires_in ?? 3600,
  })

  return res
}
