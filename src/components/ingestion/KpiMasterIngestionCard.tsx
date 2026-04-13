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
