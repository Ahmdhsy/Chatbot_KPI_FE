import { NextRequest, NextResponse } from "next/server"

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  let fastapiRes;
  let data;
  try {
    fastapiRes = await fetch(`${FASTAPI_URL}/api/v1/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    data = await fastapiRes.json()
  } catch (error) {
    console.error("Auth login fetch error:", error)
    return NextResponse.json({ detail: "Internal Server Error: Unable to reach auth service." }, { status: 502 })
  }

  if (!fastapiRes.ok) {
    return NextResponse.json(data, { status: fastapiRes.status })
  }

  if (!data.access_token) {
    return NextResponse.json({ detail: "Unexpected response from auth service" }, { status: 502 })
  }

  const res = NextResponse.json(data)
  
  // Only set secure=true if the request is actually HTTPS.
  // Otherwise, browsers will drop the cookie over HTTP (e.g., via ALB).
  const isSecure = req.headers.get("x-forwarded-proto") === "https" || req.nextUrl.protocol === "https:";

  res.cookies.set("access_token", data.access_token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production" && isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: data.expires_in ?? 3600,
  })

  if (data.refresh_token) {
    res.cookies.set("refresh_token", data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" && isSecure,
      sameSite: "lax",
      path: "/",
      maxAge: data.refresh_expires_in ?? 60 * 60 * 24 * 7,
    })
  }

  return res
}
