import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL = process.env.FASTAPI_INTERNAL_URL ?? "http://localhost:8000";

type JwtPayload = {
  sub?: string;
  username?: string;
  role?: string;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(Buffer.from(padded, "base64").toString("utf-8")) as JwtPayload;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const payload = decodeJwtPayload(token);
  if (!payload?.sub) {
    return NextResponse.json({ detail: "Invalid token" }, { status: 401 });
  }

  const role = String(payload.role ?? "").toLowerCase();

  if (role === "admin") {
    try {
      const res = await fetch(`${FASTAPI_URL}/api/v1/users/${payload.sub}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fall back to token payload below.
    }
  }

  return NextResponse.json({
    id: payload.sub,
    username: payload.username ?? "",
    email: "",
    full_name: payload.username ?? "",
    role: role || "karyawan",
    is_active: true,
    created_at: "",
    updated_at: "",
  });
}
