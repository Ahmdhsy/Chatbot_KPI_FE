import "server-only"

import { cookies } from "next/headers"

/**
 * Base URL for server-side API calls
 */
const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export async function serverFetch<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")?.value

  const res = await fetch(`${FASTAPI_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`API ${res.status} on ${path}`)
  }

  return res.json() as Promise<T>
}
