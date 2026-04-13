"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Badge from "@/components/ui/badge/Badge"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const MAX_URLS = 20

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

interface UrlIngestionResult {
  sheet_url: string
  status: "success" | "partial" | "failed" | "error"
  total_sheets_processed: number
  grand_total_rows: number
  grand_ingested: number
  grand_failed: number
  error?: string
}

interface BatchResult {
  total_urls: number
  succeeded: number
  failed: number
  results: UrlIngestionResult[]
}

function statusColor(status: string) {
  if (status === "success") return "success" as const
  if (status === "partial") return "warning" as const
  return "error" as const
}

export default function KpiTrackerIngestionCard() {
  const router = useRouter()
  const [urls, setUrls] = useState<string[]>([""])
  const [loading, setLoading] = useState(false)
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const validUrls = urls.filter((u) => u.trim() !== "")
  const canSubmit = !loading && validUrls.length > 0

  const handleUrlChange = (index: number, value: string) => {
    setUrls((prev) => prev.map((u, i) => (i === index ? value : u)))
  }

  const handleAddUrl = () => {
    if (urls.length < MAX_URLS) setUrls((prev) => [...prev, ""])
  }

  const handleRemoveUrl = (index: number) => {
    if (urls.length === 1) {
      setUrls([""])
    } else {
      setUrls((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setBatchResult(null)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/v1/ingest/google-sheets/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ sheet_urls: validUrls, skip_on_error: true }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail ?? "Batch ingestion failed")
      }
      const data: BatchResult = await res.json()
      setBatchResult(data)
      setUrls([""])
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
      <h3 className="mb-1 text-base font-semibold text-gray-800 dark:text-white/90">
        KPI Tracker — Batch Ingestion
      </h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Ingest KPI Tracker dari beberapa Google Sheets sekaligus (maks. {MAX_URLS} URL).
      </p>

      <div className="mb-4 flex flex-col gap-2">
        {urls.map((url, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1">
              {index === 0 && <Label htmlFor="tracker-url-0">Google Sheet URL(s)</Label>}
              <Input
                id={`tracker-url-${index}`}
                value={url}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                onChange={(e) => handleUrlChange(index, e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemoveUrl(index)}
              className="mb-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-error-300 hover:text-error-500 dark:border-white/[0.1] dark:hover:border-error-400"
              aria-label="Remove URL"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="mb-5 flex gap-3">
        {urls.length < MAX_URLS && (
          <button
            type="button"
            onClick={handleAddUrl}
            className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
          >
            + Add URL
          </button>
        )}
        <span className="text-sm text-gray-400 dark:text-gray-500">
          {validUrls.length} / {MAX_URLS} URLs
        </span>
      </div>

      <Button onClick={handleSubmit} disabled={!canSubmit}>
        {loading ? "Ingesting…" : `Ingest ${validUrls.length > 1 ? `${validUrls.length} Sheets` : "Sheet"}`}
      </Button>

      {error && <p className="mt-3 text-sm text-error-500">{error}</p>}

      {batchResult && (
        <div className="mt-5">
          <div className="mb-3 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-800 dark:text-white/90">
              {batchResult.total_urls} URL{batchResult.total_urls !== 1 ? "s" : ""}
            </span>
            <span className="text-success-600 dark:text-success-400">
              {batchResult.succeeded} succeeded
            </span>
            {batchResult.failed > 0 && (
              <span className="text-error-500">{batchResult.failed} failed</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {batchResult.results.map((r, i) => (
              <div
                key={i}
                className="flex items-start justify-between rounded-lg border border-gray-100 px-4 py-3 dark:border-white/[0.05]"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <p className="truncate text-sm text-gray-700 dark:text-white/80">
                    {r.sheet_url}
                  </p>
                  {r.error ? (
                    <p className="mt-0.5 text-xs text-error-500">{r.error}</p>
                  ) : (
                    <p className="mt-0.5 text-xs text-gray-400">
                      {r.total_sheets_processed} tab
                      {r.total_sheets_processed !== 1 ? "s" : ""} · {r.grand_ingested} ingested
                      {r.grand_failed > 0 ? ` · ${r.grand_failed} failed` : ""}
                    </p>
                  )}
                </div>
                <Badge size="sm" color={statusColor(r.status)}>
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
