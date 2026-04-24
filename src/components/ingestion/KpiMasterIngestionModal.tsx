"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Badge from "@/components/ui/badge/Badge"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import { Modal } from "@/components/ui/modal"

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

export default function KpiMasterIngestionModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
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

  const handleClose = () => {
    setOpen(false)
    setUrl("")
    setTahun("")
    setResult(null)
    setError(null)
  }

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
      handleClose()
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
    <>
      <Button size="sm" onClick={() => setOpen(true)}>+ New Ingestion</Button>

      <Modal isOpen={open} onClose={handleClose} className="max-w-2xl p-6">
        <h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          New KPI Master Ingestion
        </h4>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Upserts KPI Master records untuk tahun yang dipilih — tahun lain tidak terpengaruh.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {/* ── Form ── */}
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="modal-master-url">Google Sheet URL</Label>
              <Input
                id="modal-master-url"
                value={url}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="modal-master-tahun">Tahun</Label>
              <Input
                id="modal-master-tahun"
                value={tahun}
                placeholder="2024"
                type="number"
                onChange={(e) => setTahun(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-error-500">{error}</p>}
            {result && (
              <div className="flex items-center gap-3">
                <Badge size="sm" color={statusColor as "success" | "warning" | "error"}>{result.status}</Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {result.ingested} records ingested
                </span>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-1">
              <Button variant="outline" onClick={handleClose} disabled={loading}>Batal</Button>
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                {loading ? "Ingesting…" : "Ingest Master"}
              </Button>
            </div>
          </div>

          {/* ── Panduan ── */}
          <div className="rounded-xl border border-gray-100 bg-yellow-50 p-4 dark:border-white/5 dark:bg-white/5">
            <h5 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">Panduan Ingestion</h5>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>
                Bagikan spreadsheet ke akun berikut (minimal <strong>Viewer</strong>):
                <div className="mt-1.5 rounded-lg bg-orange-200 px-3 py-2 text-xs font-mono text-gray-800 dark:bg-white/10 dark:text-gray-200 break-all">
                  sheet-access-bot@impressive-hull-429606-b3.iam.gserviceaccount.com
                </div>
              </li>
              <li>
                Sheet pertama harus bernama <strong>KPI</strong>.
              </li>
              <li>
                Format baris dalam sheet:
                <ul className="mt-1 ml-3 list-none space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                  <li>• <em>Category row</em> — hanya kolom pertama terisi, diawali &ldquo;KPI &rdquo;</li>
                  <li>• <em>Header row</em> — kolom pertama bernilai tepat &ldquo;KPI&rdquo;</li>
                  <li>• <em>Data row</em> — baris data KPI</li>
                </ul>
              </li>
              <li>
                Kolom <strong>wajib</strong>: <code className="text-xs">KPI</code>, <code className="text-xs">Responsibility Persons</code>
              </li>
              <li>
                Kolom <strong>opsional</strong>: Definisi Operasional, Target, Achieve, Partial, Fail
              </li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  )
}
