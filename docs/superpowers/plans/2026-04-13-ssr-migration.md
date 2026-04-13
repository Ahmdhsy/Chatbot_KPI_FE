# SSR Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate auth from localStorage to httpOnly cookie, add Next.js middleware for route protection, and convert admin pages to async Server Components that fetch data server-side from FastAPI.

**Architecture:** On login, a Next.js API route proxies the FastAPI call and sets an httpOnly cookie. `middleware.ts` reads this cookie to protect all admin routes. Async Server Component pages call `serverFetch()` (a server-only helper using `cookies()`) to fetch initial data and pass it as props to Client Components. After mutations, Client Components call `router.refresh()` to re-run the Server Component fetch.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, FastAPI backend at `FASTAPI_INTERNAL_URL`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/server-api.ts` | Create | Server-side fetch helper using httpOnly cookie |
| `src/app/api/auth/session/route.ts` | Create | POST: proxy login to FastAPI, set httpOnly cookie |
| `src/app/api/auth/logout/route.ts` | Create | POST: clear httpOnly cookie |
| `middleware.ts` | Create | Protect `/` and `/users`, `/ingestion` routes |
| `.env.local` | Modify | Add `FASTAPI_INTERNAL_URL` |
| `src/components/auth/SignInForm.tsx` | Modify | Call `/api/auth/session` instead of `authService.login` directly |
| `src/context/AuthContext.tsx` | Modify | Call `/api/auth/logout` in `logout()` to clear cookie |
| `src/app/page.tsx` | Modify | Remove `ProtectedRoute`, remove `"use client"` + layout (layout moves to admin group) |
| `src/app/(admin)/layout.tsx` | No change | Already handles layout for admin routes |
| `src/app/(admin)/(others-pages)/ingestion/page.tsx` | Modify | Async Server Component, fetch scheduler config + logs |
| `src/components/ingestion/SchedulerConfigCard.tsx` | Modify | Accept `initialConfig` prop, handle save/trigger + `router.refresh()` internally |
| `src/components/ingestion/KpiMasterIngestionCard.tsx` | Modify | Handle ingestion internally + call `router.refresh()` after success |
| `src/components/ingestion/IngestionLogsTable.tsx` | Modify | Accept `initialLogs`/`initialTotal` props, fetch internally for filter/pagination |
| `src/app/(admin)/users/page.tsx` | Modify | Async Server Component, fetch users list |
| `src/components/user/UsersClient.tsx` | Create | Client Component wrapper for user management with modals |
| `src/components/common/ProtectedRoute.tsx` | Delete | Replaced by middleware |

---

## Task 1: Add env var and server-side fetch helper

**Files:**
- Modify: `.env.local`
- Create: `src/lib/server-api.ts`

- [ ] **Step 1: Add env var to .env.local**

Open `.env.local` (create if it doesn't exist) and add:
```
FASTAPI_INTERNAL_URL=http://localhost:8000
```

- [ ] **Step 2: Create src/lib/server-api.ts**

```ts
import { cookies } from "next/headers"

const FASTAPI_URL = process.env.FASTAPI_INTERNAL_URL ?? "http://localhost:8000"

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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd Chatbot_KPI_FE && npx tsc --noEmit
```

Expected: no errors in `src/lib/server-api.ts`

- [ ] **Step 4: Commit**

```bash
rtk git add src/lib/server-api.ts .env.local && rtk git commit -m "feat: add server-side fetch helper with httpOnly cookie auth"
```

---

## Task 2: Create Next.js API routes for auth

**Files:**
- Create: `src/app/api/auth/session/route.ts`
- Create: `src/app/api/auth/logout/route.ts`

- [ ] **Step 1: Create session route**

Create file `src/app/api/auth/session/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server"

const FASTAPI_URL = process.env.FASTAPI_INTERNAL_URL ?? "http://localhost:8000"

export async function POST(req: NextRequest) {
  const body = await req.json()

  const fastapiRes = await fetch(`${FASTAPI_URL}/api/v1/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
    maxAge: data.expires_in,
  })

  return res
}
```

- [ ] **Step 2: Create logout route**

Create file `src/app/api/auth/logout/route.ts`:

```ts
import { NextResponse } from "next/server"

export async function POST() {
  const res = NextResponse.json({ message: "Logged out" })
  res.cookies.set("access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  return res
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors in new route files

- [ ] **Step 4: Commit**

```bash
rtk git add src/app/api/auth/session/route.ts src/app/api/auth/logout/route.ts && rtk git commit -m "feat: add Next.js API routes for cookie-based auth"
```

---

## Task 3: Update SignInForm to use /api/auth/session

**Files:**
- Modify: `src/components/auth/SignInForm.tsx`

- [ ] **Step 1: Replace authService.login call**

In `src/components/auth/SignInForm.tsx`, find the `handleSubmit` function and replace the `authService.login` block:

Old code (lines 35–57):
```ts
const response = await authService.login({
  identifier,
  password,
});

// Check if user role is admin (only admin can access)
if (response.user.role !== "admin") {
  addToast(
    "error",
    "Only admin users are allowed to access this dashboard",
    "Access Denied"
  );
  setIsLoading(false);
  return;
}

// Login successful - pass refresh token and expiry time
login(
  response.access_token,
  response.refresh_token,
  response.expires_in,
  response.user
);
```

New code:
```ts
const res = await fetch("/api/auth/session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identifier, password }),
})

const response = await res.json()

if (!res.ok) {
  const msg = response?.detail?.[0]?.msg ?? response?.detail ?? "Login failed"
  throw new Error(msg)
}

// Check if user role is admin (only admin can access)
if (response.user.role !== "admin") {
  addToast(
    "error",
    "Only admin users are allowed to access this dashboard",
    "Access Denied"
  );
  setIsLoading(false);
  return;
}

// Login successful - cookie is set by /api/auth/session
// Also store in AuthContext for client-side state
login(
  response.access_token,
  response.refresh_token,
  response.expires_in,
  response.user
);
```

- [ ] **Step 2: Remove unused authService import if no longer needed**

Check the imports at the top of `SignInForm.tsx`. If `authService` is only used in `handleSubmit`, remove:
```ts
import { authService } from "@/services/authService";
```

- [ ] **Step 3: Manual verification**

Start dev server (`npm run dev`), open browser, sign in. Verify:
- Login succeeds
- Browser DevTools → Application → Cookies → `access_token` cookie exists with `HttpOnly` flag checked
- Redirect to dashboard works

- [ ] **Step 4: Commit**

```bash
rtk git add src/components/auth/SignInForm.tsx && rtk git commit -m "feat: sign-in sets httpOnly access_token cookie via Next.js API route"
```

---

## Task 4: Update AuthContext logout to clear cookie

**Files:**
- Modify: `src/context/AuthContext.tsx`

- [ ] **Step 1: Add cookie clear call in logout function**

In `src/context/AuthContext.tsx`, find the `logout` function. After the `authService.logout(refreshToken)` call (inside the try block), add:

```ts
// Clear httpOnly cookie
await fetch("/api/auth/logout", { method: "POST" })
```

The updated try block in logout should look like:
```ts
try {
  if (refreshToken) {
    await authService.logout(refreshToken);
  }
  // Clear httpOnly cookie
  await fetch("/api/auth/logout", { method: "POST" })
} catch (error) {
  console.error("Logout API call failed:", error);
}
```

- [ ] **Step 2: Manual verification**

Sign in, then sign out. Verify:
- Browser DevTools → Application → Cookies → `access_token` cookie is gone after logout

- [ ] **Step 3: Commit**

```bash
rtk git add src/context/AuthContext.tsx && rtk git commit -m "feat: logout clears httpOnly cookie"
```

---

## Task 5: Create middleware.ts for route protection

**Files:**
- Create: `middleware.ts` (at `Chatbot_KPI_FE/middleware.ts`, next to `package.json`)

- [ ] **Step 1: Create middleware.ts**

```ts
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
```

- [ ] **Step 2: Manual verification**

With dev server running:
1. Clear all cookies, navigate to `/` → should redirect to `/signin`
2. Sign in → cookie is set → redirected to `/`
3. While logged in, navigate to `/signin` → should redirect to `/`

- [ ] **Step 3: Commit**

```bash
rtk git add middleware.ts && rtk git commit -m "feat: middleware protects admin routes via httpOnly cookie"
```

---

## Task 6: Remove ProtectedRoute from root page.tsx

**Files:**
- Modify: `src/app/page.tsx`
- Delete: `src/components/common/ProtectedRoute.tsx`

- [ ] **Step 1: Update src/app/page.tsx**

The root page currently duplicates the layout (sidebar, header) from `src/app/(admin)/layout.tsx`. Replace the entire file with a redirect to keep the root page clean — the `/` route will now use the admin layout via the `(admin)` route group:

```ts
import { redirect } from "next/navigation"

export default function RootPage() {
  redirect("/dashboard")
}
```

Wait — check the actual route structure first. The `(admin)` group has its own `page.tsx` at `/`. Since both `app/page.tsx` and `app/(admin)/page.tsx` resolve to `/`, this causes a conflict. The fix: rename `app/(admin)/page.tsx` to be the real dashboard, and have `app/page.tsx` simply redirect there, OR delete `app/page.tsx` entirely and let `app/(admin)/page.tsx` be the root page.

The correct approach: **delete `src/app/page.tsx`** entirely. The `src/app/(admin)/page.tsx` will then serve `/` through the admin layout.

- [ ] **Step 2: Delete src/app/page.tsx**

```bash
rm Chatbot_KPI_FE/src/app/page.tsx
```

- [ ] **Step 3: Delete ProtectedRoute component**

```bash
rm Chatbot_KPI_FE/src/components/common/ProtectedRoute.tsx
```

- [ ] **Step 4: Remove ProtectedRoute from ClientLayout if present**

Check `src/app/ClientLayout.tsx` — if it imports or uses `ProtectedRoute`, remove that usage.

- [ ] **Step 5: Manual verification**

Navigate to `/` → dashboard renders via `(admin)/layout.tsx` + `(admin)/page.tsx`, no ProtectedRoute flash, sidebar and header appear correctly.

- [ ] **Step 6: Commit**

```bash
rtk git add -A && rtk git commit -m "feat: remove ProtectedRoute, root page served by admin layout group"
```

---

## Task 7: Convert ingestion page to async Server Component

**Files:**
- Modify: `src/app/(admin)/(others-pages)/ingestion/page.tsx`

- [ ] **Step 1: Rewrite ingestion page.tsx**

```ts
import PageBreadCrumb from "@/components/common/PageBreadCrumb"
import SchedulerConfigCard from "@/components/ingestion/SchedulerConfigCard"
import KpiMasterIngestionCard from "@/components/ingestion/KpiMasterIngestionCard"
import IngestionLogsTable from "@/components/ingestion/IngestionLogsTable"
import { serverFetch } from "@/lib/server-api"
import { SchedulerConfig } from "@/hooks/useScheduler"
import { LogEntry } from "@/hooks/useIngestion"

interface LogsResponse {
  total: number
  logs: LogEntry[]
}

export default async function IngestionPage() {
  let config: SchedulerConfig | null = null
  let initialLogs: LogEntry[] = []
  let initialTotal = 0

  try {
    config = await serverFetch<SchedulerConfig>("/api/v1/scheduler")
  } catch {
    // 404 means no config yet — that's fine
    config = null
  }

  try {
    const logsData = await serverFetch<LogsResponse>("/api/v1/ingest/logs?limit=10")
    initialLogs = logsData.logs
    initialTotal = logsData.total
  } catch {
    initialLogs = []
    initialTotal = 0
  }

  return (
    <div>
      <PageBreadCrumb pageTitle="Ingestion" />
      <div className="flex flex-col gap-6">
        <SchedulerConfigCard initialConfig={config} />
        <KpiMasterIngestionCard />
        <IngestionLogsTable initialLogs={initialLogs} initialTotal={initialTotal} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: errors about props mismatch — these will be fixed in Tasks 8–10.

- [ ] **Step 3: Commit stub (after Tasks 8-10 pass)**

Hold this commit until child components are updated.

---

## Task 8: Refactor SchedulerConfigCard

**Files:**
- Modify: `src/components/ingestion/SchedulerConfigCard.tsx`

- [ ] **Step 1: Rewrite SchedulerConfigCard.tsx**

```ts
"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Badge from "@/components/ui/badge/Badge"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import Select from "@/components/form/Select"
import Switch from "@/components/form/switch/Switch"
import { SchedulerConfig } from "@/hooks/useScheduler"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

interface Props {
  initialConfig: SchedulerConfig | null
}

const UNIT_OPTIONS = [
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
]

function formatDatetime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString()
}

export default function SchedulerConfigCard({ initialConfig }: Props) {
  const router = useRouter()
  const [url, setUrl] = useState(initialConfig?.sheet_url ?? "")
  const [intervalVal, setIntervalVal] = useState(String(initialConfig?.interval_value ?? 12))
  const [intervalUnit, setIntervalUnit] = useState(initialConfig?.interval_unit ?? "hours")
  const [enabled, setEnabled] = useState(initialConfig?.is_enabled ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null)

  const statusLabel = !initialConfig ? "Not Configured" : initialConfig.is_enabled ? "Active" : "Paused"
  const statusColor = !initialConfig ? "light" : initialConfig.is_enabled ? "success" : "warning"

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    try {
      const method = initialConfig ? "PATCH" : "POST"
      const res = await fetch(`${API_BASE}/api/v1/scheduler`, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({
          sheet_url: url,
          interval_value: parseInt(intervalVal, 10) || 12,
          interval_unit: intervalUnit,
          is_enabled: enabled,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).detail ?? "Save failed")
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const handleTrigger = async () => {
    setLoading(true)
    setTriggerMsg(null)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/v1/scheduler/trigger`, {
        method: "POST",
        headers: { ...getAuthHeader() },
      })
      if (!res.ok) throw new Error((await res.json()).detail ?? "Trigger failed")
      const data = await res.json()
      setTriggerMsg(data.message)
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/5 dark:bg-white/3">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Scheduler Configuration
        </h3>
        <Badge size="sm" color={statusColor}>{statusLabel}</Badge>
      </div>

      <div className="mb-4">
        <Label htmlFor="sched-url">Sheet URL</Label>
        <Input
          id="sched-url"
          placeholder="https://docs.google.com/spreadsheets/d/..."
          defaultValue={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      <div className="mb-4 flex gap-3">
        <div className="w-28">
          <Label htmlFor="sched-interval-val">Interval</Label>
          <Input
            id="sched-interval-val"
            type="number"
            min="1"
            defaultValue={intervalVal}
            onChange={(e) => setIntervalVal(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="sched-unit">Unit</Label>
          <Select options={UNIT_OPTIONS} defaultValue={intervalUnit} onChange={setIntervalUnit} />
        </div>
      </div>

      <div className="mb-5">
        <Switch
          key={String(initialConfig?.is_enabled)}
          label="Enable Scheduler"
          defaultChecked={enabled}
          onChange={setEnabled}
        />
      </div>

      {initialConfig && (
        <div className="mb-5 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-white/3">
          <div>
            <span className="block text-gray-500 dark:text-gray-400 text-theme-xs">Last Run</span>
            <span className="font-medium text-gray-700 dark:text-white/80">
              {formatDatetime(initialConfig.last_run_at)}
            </span>
          </div>
          <div>
            <span className="block text-gray-500 dark:text-gray-400 text-theme-xs">Next Run</span>
            <span className="font-medium text-gray-700 dark:text-white/80">
              {formatDatetime(initialConfig.next_run_at)}
            </span>
          </div>
        </div>
      )}

      {error && <p className="mb-3 text-sm text-error-500">{error}</p>}
      {triggerMsg && <p className="mb-3 text-sm text-success-500">{triggerMsg}</p>}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={loading || !url}>
          {loading ? "Saving…" : "Save Scheduler"}
        </Button>
        {initialConfig && (
          <Button variant="outline" onClick={handleTrigger} disabled={loading}>
            Run Now
          </Button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors in `SchedulerConfigCard.tsx`

---

## Task 9: Refactor KpiMasterIngestionCard

**Files:**
- Modify: `src/components/ingestion/KpiMasterIngestionCard.tsx`

- [ ] **Step 1: Rewrite KpiMasterIngestionCard.tsx**

```ts
"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Badge from "@/components/ui/badge/Badge"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

type IngestionStatus = "success" | "partial" | "failed"

interface IngestionResult {
  status: IngestionStatus
  ingested: number
  failed: number
  errors: string[]
}

export default function KpiMasterIngestionCard() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [tahun, setTahun] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IngestionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const tahunNum = parseInt(tahun, 10)
  const isValidTahun =
    !isNaN(tahunNum) &&
    tahun.trim() === String(tahunNum) &&
    tahunNum >= 2001 &&
    tahunNum <= new Date().getFullYear() + 1
  const canSubmit = !loading && url.trim() !== "" && isValidTahun

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/ingest/kpi-master?sheet_url=${encodeURIComponent(url)}&tahun=${tahunNum}`,
        { method: "POST", headers: { ...getAuthHeader() } },
      )
      if (!res.ok) throw new Error((await res.json()).detail ?? "Ingestion failed")
      const data = await res.json()
      setResult({ status: data.status, ingested: data.ingested, failed: data.failed, errors: data.errors })
      setUrl("")
      setTahun("")
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const statusColor =
    result?.status === "success" ? "success" : result?.status === "partial" ? "warning" : "error"

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
      <h3 className="mb-1 text-base font-semibold text-gray-800 dark:text-white/90">
        KPI Master — Manual Ingestion
      </h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Upserts KPI Master records for the given year. Data tahun lain tidak terpengaruh.
      </p>

      <div className="mb-4">
        <Label htmlFor="master-url">Google Sheet URL</Label>
        <Input
          id="master-url"
          value={url}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <Label htmlFor="master-tahun">Tahun</Label>
        <Input
          id="master-tahun"
          value={tahun}
          placeholder="2024"
          type="number"
          onChange={(e) => setTahun(e.target.value)}
        />
      </div>

      <Button onClick={handleSubmit} disabled={!canSubmit}>
        {loading ? "Ingesting…" : "Ingest Master"}
      </Button>

      {error && <p className="mt-3 text-sm text-error-500">{error}</p>}

      {result && (
        <div className="mt-4 flex items-center gap-3">
          <Badge size="sm" color={statusColor}>{result.status}</Badge>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {result.ingested} records ingested
          </span>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

---

## Task 10: Refactor IngestionLogsTable

**Files:**
- Modify: `src/components/ingestion/IngestionLogsTable.tsx`

- [ ] **Step 1: Rewrite IngestionLogsTable.tsx**

```ts
"use client"
import React, { useEffect, useState } from "react"
import Badge from "@/components/ui/badge/Badge"
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "@/components/ui/table"
import Pagination from "@/components/tables/Pagination"
import { LogEntry } from "@/hooks/useIngestion"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const PAGE_SIZE = 10

type FilterType = "all" | "kpi_tracker" | "kpi_master"

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

interface Props {
  initialLogs: LogEntry[]
  initialTotal: number
}

const TABS: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "KPI Tracker", value: "kpi_tracker" },
  { label: "KPI Master", value: "kpi_master" },
]

export default function IngestionLogsTable({ initialLogs, initialTotal }: Props) {
  const [filter, setFilter] = useState<FilterType>("all")
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [isInitial, setIsInitial] = useState(true)

  // Keep initial SSR data on first render; fetch client-side on filter/page change
  useEffect(() => {
    if (isInitial && filter === "all" && page === 1) {
      setIsInitial(false)
      return
    }
    setIsInitial(false)
    setLoading(true)
    const sourceType = filter === "all" ? "" : `&source_type=${filter}`
    fetch(
      `${API_BASE}/api/v1/ingest/logs?limit=${PAGE_SIZE * page}${sourceType}`,
      { headers: { ...getAuthHeader() } },
    )
      .then((r) => r.json())
      .then((data: { total: number; logs: LogEntry[] }) => {
        setLogs(data.logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE))
        setTotal(data.total)
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [filter, page])

  // When SSR data changes (router.refresh), reset to SSR data
  useEffect(() => {
    if (filter === "all" && page === 1) {
      setLogs(initialLogs)
      setTotal(initialTotal)
    }
  }, [initialLogs, initialTotal])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const statusColor = (status: string) => {
    if (status === "success") return "success"
    if (status === "partial") return "warning"
    return "error"
  }

  const typeColor = (type: string) => (type === "kpi_master" ? "info" : "primary")

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/[0.05]">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Ingestion Logs
        </h3>
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setFilter(tab.value); setPage(1) }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === tab.value
                  ? "bg-brand-500 text-white"
                  : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.05]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {["Date", "Type", "Sheet Name", "Person", "Total", "Ingested", "Failed", "Status"].map(
                (h) => (
                  <TableCell
                    key={h}
                    isHeader
                    className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    {h}
                  </TableCell>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {loading ? (
              <TableRow>
                <TableCell className="px-5 py-4 text-center text-sm text-gray-400" colSpan={8}>
                  Loading…
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell className="px-5 py-4 text-center text-sm text-gray-400" colSpan={8}>
                  No logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="px-5 py-3">
                    <Badge size="sm" color={typeColor(log.source_type)}>
                      {log.source_type === "kpi_master" ? "KPI Master" : "KPI Tracker"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                    {log.sheet_name ?? "—"}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                    {log.nama_orang ?? "—"}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                    {log.total_rows}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                    {log.ingested}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                    {log.failed}
                  </TableCell>
                  <TableCell className="px-5 py-3">
                    <Badge size="sm" color={statusColor(log.status)}>
                      {log.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end border-t border-gray-100 px-6 py-3 dark:border-white/[0.05]">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript and commit Tasks 7–10 together**

```bash
npx tsc --noEmit
```

Expected: no errors.

```bash
rtk git add src/app/(admin)/(others-pages)/ingestion/page.tsx src/components/ingestion/SchedulerConfigCard.tsx src/components/ingestion/KpiMasterIngestionCard.tsx src/components/ingestion/IngestionLogsTable.tsx && rtk git commit -m "feat: convert ingestion page to SSR, refactor child components"
```

- [ ] **Step 3: Manual verification**

Navigate to `/ingestion`. Verify:
- Page source (View Source in browser) contains scheduler config data and log rows (not empty divs)
- No loading flicker on initial render
- After saving scheduler config, data updates (router.refresh works)
- After triggering ingestion, logs table updates

---

## Task 11: Convert users page to async Server Component

**Files:**
- Modify: `src/app/(admin)/users/page.tsx`
- Create: `src/components/user/UsersClient.tsx`

- [ ] **Step 1: Create UsersClient.tsx**

```ts
"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/context/ToastContext"
import { useUser } from "@/context/UserContext"
import ComponentCard from "@/components/common/ComponentCard"
import CreateUserModal from "@/components/user/CreateUserModal"
import EditUserModal from "@/components/user/EditUserModal"
import DeleteUserModal from "@/components/user/DeleteUserModal"
import UserTable from "@/components/user/UserTable"
import { User } from "@/services/userService"

interface Props {
  initialUsers: User[]
}

export default function UsersClient({ initialUsers }: Props) {
  const router = useRouter()
  const { addToast } = useToast()
  const { addUser, editUser, removeUser } = useUser()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const handleCreate = async (userData: Parameters<typeof addUser>[0]) => {
    await addUser(userData)
    addToast("success", "User created successfully", "Success")
    setIsCreateModalOpen(false)
    router.refresh()
  }

  const handleEdit = async (userId: string, userData: Parameters<typeof editUser>[1]) => {
    await editUser(userId, userData)
    addToast("success", "User updated successfully", "Success")
    setIsEditModalOpen(false)
    setSelectedUser(null)
    router.refresh()
  }

  const handleDelete = async (userId: string) => {
    await removeUser(userId)
    addToast("success", "User deleted successfully", "Success")
    setIsDeleteModalOpen(false)
    setSelectedUser(null)
    router.refresh()
  }

  return (
    <>
      <ComponentCard
        title="Users"
        subtitle="Manage all system users"
        actionButton={{
          label: "Add New User",
          onClick: () => setIsCreateModalOpen(true),
          variant: "primary",
        }}
      >
        {initialUsers.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No users found. Create one to get started.
            </p>
          </div>
        ) : (
          <UserTable
            users={initialUsers}
            onEdit={(user) => { setSelectedUser(user); setIsEditModalOpen(true) }}
            onDelete={(user) => { setSelectedUser(user); setIsDeleteModalOpen(true) }}
          />
        )}
      </ComponentCard>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />

      {selectedUser && (
        <>
          <EditUserModal
            isOpen={isEditModalOpen}
            user={selectedUser}
            onClose={() => { setIsEditModalOpen(false); setSelectedUser(null) }}
            onSubmit={(data) => handleEdit(selectedUser.id, data)}
          />
          <DeleteUserModal
            isOpen={isDeleteModalOpen}
            user={selectedUser}
            onClose={() => { setIsDeleteModalOpen(false); setSelectedUser(null) }}
            onConfirm={() => handleDelete(selectedUser.id)}
          />
        </>
      )}
    </>
  )
}
```

> **Note:** If `CreateUserModal`, `EditUserModal`, `DeleteUserModal` don't have `onSubmit`/`onConfirm` props yet, check their current prop interfaces and adapt the `UsersClient` accordingly. The pattern is: pass mutation handler as prop, modal calls it on submit.

- [ ] **Step 2: Rewrite users/page.tsx**

```ts
import PageBreadCrumb from "@/components/common/PageBreadCrumb"
import UsersClient from "@/components/user/UsersClient"
import { serverFetch } from "@/lib/server-api"
import { User } from "@/services/userService"

export default async function UsersPage() {
  let users: User[] = []

  try {
    const data = await serverFetch<User[] | { users: User[] } | Record<string, User>>("/api/v1/users")
    if (Array.isArray(data)) {
      users = data
    } else if ("users" in data && Array.isArray((data as { users: User[] }).users)) {
      users = (data as { users: User[] }).users
    } else {
      users = Object.values(data as Record<string, User>).filter(
        (item): item is User => item && typeof item === "object" && "id" in item,
      )
    }
  } catch {
    users = []
  }

  return (
    <>
      <PageBreadCrumb pageTitle="User Management" />
      <UsersClient initialUsers={users} />
    </>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

If there are errors about modal prop types (onSubmit/onConfirm not in existing modals), check `CreateUserModal`, `EditUserModal`, `DeleteUserModal` props and adjust `UsersClient` to match existing interfaces.

- [ ] **Step 4: Manual verification**

Navigate to `/users`. Verify:
- Page source contains user rows (SSR data visible)
- Create user modal works, user list refreshes after create
- Edit and delete work, list refreshes after each

- [ ] **Step 5: Commit**

```bash
rtk git add src/app/(admin)/users/page.tsx src/components/user/UsersClient.tsx && rtk git commit -m "feat: convert users page to SSR, extract UsersClient component"
```

---

## Task 12: Final cleanup and verification

- [ ] **Step 1: Remove unused imports from useIngestion.ts**

In `src/hooks/useIngestion.ts`, the `ingestKpiMaster` function is now handled inside `KpiMasterIngestionCard`. Remove it from the hook if it's no longer used anywhere else (check with grep first):

```bash
rtk grep "ingestKpiMaster" src/
```

If only used in the old ingestion page (now deleted), remove the function from `useIngestion.ts`.

- [ ] **Step 2: Remove unused fetchConfig from useScheduler.ts**

```bash
rtk grep "fetchConfig" src/
```

If `fetchConfig` is only called in the old ingestion page, remove it from `useScheduler.ts`.

- [ ] **Step 3: Full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: build succeeds with no errors. Note any warnings.

- [ ] **Step 5: End-to-end manual smoke test**

1. Clear all cookies
2. Navigate to `/` → redirected to `/signin` ✓
3. Sign in → cookie set, redirected to dashboard ✓
4. Navigate to `/ingestion` → data visible immediately (no loading spinner) ✓
5. Save scheduler config → data refreshes ✓
6. Run ingestion → logs table updates ✓
7. Navigate to `/users` → users visible immediately ✓
8. Create/edit/delete user → list refreshes ✓
9. Sign out → cookie cleared, redirected to `/signin` ✓
10. Try navigating to `/` without cookie → redirected to `/signin` ✓

- [ ] **Step 6: Final commit**

```bash
rtk git add -A && rtk git commit -m "feat: complete SSR migration - httpOnly cookie auth + Server Components"
```
