# SSR Migration Design: localStorage → httpOnly Cookie + Server Components

**Date:** 2026-04-13  
**Scope:** Chatbot_KPI_FE (Next.js frontend)

---

## Goal

Migrate the frontend from a pure CSR (Client-Side Rendering) SPA pattern to proper Next.js SSR using:
1. httpOnly cookie-based auth (replacing localStorage)
2. Async Server Components for initial data fetching
3. Next.js middleware for route protection
4. Client Components retain interactivity only, no fetch-on-mount logic

---

## Section 1: Auth Migration

### Current State
- JWT `access_token` stored in `localStorage`
- `ProtectedRoute` client component checks auth on render (causes flash)
- Server Components cannot access `localStorage`

### Target State
- JWT stored in `httpOnly` cookie (set via Next.js API route)
- Next.js `middleware.ts` protects `/admin/*` routes server-side
- Server Components read token via `cookies()` from `next/headers`

### New Sign-In Flow
```
SignInForm → POST /api/auth/session (Next.js API Route)
                  ↓
           Calls FastAPI /api/v1/auth/login
                  ↓
           Sets httpOnly cookie "access_token"
                  ↓
           Redirects to /admin
```

### Files to Create/Modify
- `src/app/api/auth/session/route.ts` — new Next.js API route, sets httpOnly cookie
- `src/app/api/auth/logout/route.ts` — new, clears cookie on sign-out
- `src/components/auth/SignInForm.tsx` — call `/api/auth/session` instead of FastAPI directly
- `src/lib/server-api.ts` — new server-side fetch helper using `cookies()`
- `middleware.ts` (project root) — route protection
- `src/components/common/ProtectedRoute.tsx` — remove, replaced by middleware

### Server-Side Fetch Helper
```ts
// src/lib/server-api.ts
import { cookies } from "next/headers"

export async function serverFetch(path: string, options?: RequestInit) {
  const token = (await cookies()).get("access_token")?.value
  const res = await fetch(`${process.env.FASTAPI_INTERNAL_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}
```

### Middleware
```ts
// middleware.ts
import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin") ||
                       req.nextUrl.pathname === "/"
  if (isAdminRoute && !token) {
    return NextResponse.redirect(new URL("/signin", req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/admin/:path*"],
}
```

### Environment Variables
Add to `.env.local`:
```
FASTAPI_INTERNAL_URL=http://localhost:8000
```

---

## Section 2: Server Components for Pages

### Ingestion Page
`src/app/(admin)/(others-pages)/ingestion/page.tsx` → async Server Component

Fetches in parallel:
- `GET /api/v1/scheduler` → scheduler config
- `GET /api/v1/ingest/logs?limit=10` → initial logs page 1

Passes data as props to Client Components. No `"use client"` on the page itself.

### Users Page
`src/app/(admin)/users/page.tsx` → async Server Component

Fetches:
- `GET /api/v1/users` → users list

Wraps a `UsersClient` Client Component that handles modals.

### Dashboard Page
`src/app/(admin)/page.tsx` — already close to a Server Component, remove `"use client"` and `useSidebar` call. Layout handles sidebar state.

### After Mutations: router.refresh()
After any mutation (save, trigger, create, edit, delete), Client Components call:
```ts
router.refresh()
```
This re-runs the Server Component fetch and re-renders with fresh data. No duplicate fetch logic needed in the client.

---

## Section 3: Client Component Refactoring

### SchedulerConfigCard
- Remove: internal config fetch, `useEffect` for fetch on mount
- Add: `initialConfig: SchedulerConfig | null` prop
- Keep: save and trigger mutations → call `router.refresh()` after each

### IngestionLogsTable
- Remove: `fetchLogs` function prop, internal fetch-on-mount logic
- Add: `initialLogs: LogEntry[]`, `initialTotal: number` props for initial render
- Keep: filter tabs and pagination → these still fetch client-side (dynamic query params require it)
- After ingestion completes in parent: parent calls `router.refresh()` instead of passing `refreshKey`

### KpiMasterIngestionCard
- Add: call `router.refresh()` internally after successful ingestion (replaces the `refreshKey` prop passed from parent)
- Server Components cannot pass function callbacks to Client Components to trigger re-renders, so refresh must originate from within this component

### UserTable + Modals
- Remove: `useUser` context dependency for initial fetch
- Add: `initialUsers: User[]` prop
- Keep: create/edit/delete mutations → call `router.refresh()` after each

### ProtectedRoute
- Deleted entirely — replaced by `middleware.ts`

---

## Data Flow Summary

```
Request hits /admin/* route
       ↓
middleware.ts reads httpOnly cookie
       ↓ (no token → redirect /signin)
       ↓ (token valid → continue)
async Server Component runs on server
       ↓
serverFetch() calls FastAPI with token from cookie
       ↓
Initial data passed as props to Client Components
       ↓
Page renders with data — no loading flicker
       ↓
User interacts (mutations)
       ↓
Client Component calls router.refresh()
       ↓
Server Component re-fetches, page re-renders
```

---

## What Changes, What Stays

| | Before | After |
|---|---|---|
| Auth storage | localStorage | httpOnly cookie |
| Route protection | `ProtectedRoute` (CSR, flash) | `middleware.ts` (server-side) |
| Initial data fetch | `useEffect` on mount (CSR) | `async` Server Component |
| Mutations | client `fetch` | client `fetch` (unchanged) |
| Post-mutation refresh | `refreshKey` state / re-fetch | `router.refresh()` |
| Filter/pagination | CSR (unchanged) | CSR (unchanged) |

---

## Out of Scope
- Server Actions for mutations
- Token refresh / refresh token flow
- Role-based access beyond middleware token check
