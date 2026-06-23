"use client"
import React, { useState } from "react"
import Badge from "@/components/ui/badge/Badge"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import { Modal } from "@/components/ui/modal"
import { useToast } from "@/context/ToastContext"
import { apiClientWithAuth } from "@/services/apiClientWithAuth"
import { extractFriendlyErrorMessage } from "@/utils/errorHelper"
const INVITE_HELP_MESSAGE =
  "Pastikan email Google Sheets sudah di-invite ke spreadsheet ini, lalu coba lagi."

async function getIngestionErrorMessage(res: Response): Promise<string> {
  if (res.status === 500) {
    return INVITE_HELP_MESSAGE
  }

  try {
    const body = await res.json()
    return body?.detail ?? body?.message ?? "Ingestion gagal"
  } catch {
    return "Ingestion gagal"
  }
}

type IngestionStatus = "success" | "failed"

interface IngestionResult {
  status: IngestionStatus
  ingested: number
  failed: number
  errors: string[]
}

interface Props {
  onSuccess?: () => void | Promise<void>
}

export default function KpiMasterIngestionModal({ onSuccess }: Props) {
  const { addToast } = useToast()
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
      const { data } = await apiClientWithAuth.post(
        `/api/v1/ingest/kpi-master?sheet_url=${encodeURIComponent(url)}&tahun=${tahunNum}`,
      )
      setResult({ status: data.status, ingested: data.ingested, failed: data.failed, errors: data.errors })
      addToast("success", `KPI Master berhasil diimpor: ${data.ingested} data.`, "Sukses")
      handleClose()
      await onSuccess?.()
    } catch (e: unknown) {
      const msg = extractFriendlyErrorMessage(e, "Gagal memproses KPI Master")
      setError(msg)
      addToast("error", msg, "Gagal")
    } finally {
      setLoading(false)
    }
  }

  const statusColor = result?.status === "success" ? "success" : "error"

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>+ Ingestion Baru</Button>

      <Modal isOpen={open} onClose={handleClose} className="max-w-2xl p-6">
        <h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">
          Ingestion KPI Master Baru
        </h4>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Upserts KPI Master records untuk tahun yang dipilih — tahun lain tidak terpengaruh.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {/* ── Form ── */}
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="modal-master-url">URL Google Sheet</Label>
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
                <Badge size="sm" color={statusColor as "success" | "warning" | "error"}>{result.status === "success" ? "Sukses" : "Gagal"}</Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {result.ingested} data berhasil diimpor
                </span>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-1">
              <Button variant="outline" onClick={handleClose} disabled={loading}>Batal</Button>
              <Button onClick={handleSubmit} disabled={!canSubmit}>
                {loading ? "Memproses…" : "Impor Master"}
              </Button>
            </div>
          </div>

          {/* ── Panduan ── */}
          <div className="rounded-xl border border-gray-100 bg-yellow-50 p-4 dark:border-white/5 dark:bg-white/5">
            <h5 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">Panduan Ingestion</h5>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>
                Invite spreadsheet ke akun berikut (minimal <strong>Viewer</strong>):
                <div className="mt-1.5 rounded-lg bg-orange-200 px-3 py-2 text-xs font-mono text-gray-800 dark:bg-white/10 dark:text-gray-200 break-all">
                  sheet-access-bot@impressive-hull-429606-b3.iam.gserviceaccount.com
                </div>
              </li>
              <li>
                Gunakan format dari sheet contoh berikut agar proses ingestion lebih konsisten: {" "}
                <a
                  href="https://docs.google.com/spreadsheets/d/1iDMoJIIMZGbrWrXTaEQkChlBmeHgzpk5fWN4nWRL0vE/edit?usp=sharing"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                >
                  Contoh format KPI Master
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  )
}
