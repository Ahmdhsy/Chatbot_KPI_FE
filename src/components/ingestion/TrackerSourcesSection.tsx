"use client"
import React, { useMemo, useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Modal } from "@/components/ui/modal"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import Switch from "@/components/form/switch/Switch"
import { TrackerSource } from "@/hooks/useTrackerSources"
import apiClientWithAuth from "@/services/apiClientWithAuth"

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail
    if (typeof detail === "string") return detail
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
    if (error.response?.status === 401) return "Unauthorized. Please sign in again."
    return error.message || fallback
  }
  return error instanceof Error ? error.message : fallback
}

function truncateUrl(url: string, max = 55): string {
  return url.length > max ? url.slice(0, max) + "…" : url
}

interface Props {
  initialSources: TrackerSource[]
}

const MAX_BATCH_SOURCES = 6

export default function TrackerSourcesSection({ initialSources }: Props) {
  const router = useRouter()

  // ── Add modal ─────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false)
  const [newUrl, setNewUrl] = useState("")
  const [newTahun, setNewTahun] = useState("")
  const [newIsScheduled, setNewIsScheduled] = useState(true)

  // ── Edit modal ────────────────────────────────────────────────────────
  const [editSource, setEditSource] = useState<TrackerSource | null>(null)
  const [editUrl, setEditUrl] = useState("")
  const [editTahun, setEditTahun] = useState("")
  const [editIsScheduled, setEditIsScheduled] = useState(true)
  const [editIsActive, setEditIsActive] = useState(true)

  // ── Delete confirm ────────────────────────────────────────────────────
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // ── Ingestion state ───────────────────────────────────────────────────
  const [ingestingId, setIngestingId] = useState<string | null>(null)
  const [runningAll, setRunningAll] = useState(false)
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const [ingestResult, setIngestResult] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCloseAdd = () => {
    setAddOpen(false); setNewUrl(""); setNewTahun("")
    setNewIsScheduled(true); setError(null)
  }

  const handleOpenEdit = (source: TrackerSource) => {
    setEditSource(source)
    setEditUrl(source.sheet_url)
    setEditTahun(source.tahun != null ? String(source.tahun) : "")
    setEditIsScheduled(source.is_scheduled)
    setEditIsActive(source.is_active)
    setError(null); setDeleteConfirmId(null)
  }

  const handleCloseEdit = () => {
    setEditSource(null); setEditUrl(""); setEditTahun("")
    setEditIsScheduled(true); setEditIsActive(true); setError(null)
  }

  const selectableSources = useMemo(
    () => initialSources.filter((s) => s.is_active && s.is_scheduled),
    [initialSources],
  )

  const selectedSources = useMemo(
    () => selectableSources.filter((s) => selectedSourceIds.includes(s.id)),
    [selectableSources, selectedSourceIds],
  )

  const toggleSourceSelection = (source: TrackerSource) => {
    if (!(source.is_active && source.is_scheduled)) return

    setSelectedSourceIds((prev) => {
      if (prev.includes(source.id)) {
        return prev.filter((id) => id !== source.id)
      }
      if (prev.length >= MAX_BATCH_SOURCES) {
        setError(`Maksimal ${MAX_BATCH_SOURCES} sumber untuk sekali Run Selected.`)
        return prev
      }
      return [...prev, source.id]
    })
  }

  const handleEnableBatchMode = () => {
    setIsBatchMode(true)
    setError(null)
  }

  const handleCancelBatchMode = () => {
    setIsBatchMode(false)
    setSelectedSourceIds([])
    setError(null)
  }

  // ── Add → POST /api/v1/kpi/ ───────────────────────────────────────────
  const handleAdd = async () => {
    if (!newUrl.trim()) return
    setSaving(true); setError(null)
    try {
      await apiClientWithAuth.post("/api/v1/kpi/", {
        group_type: "tracker",
        sheet_url: newUrl.trim(),
        tahun: newTahun ? parseInt(newTahun) : null,
        is_scheduled: newIsScheduled,
        is_active: true,
      })
      handleCloseAdd(); router.refresh()
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Add failed"))
    } finally { setSaving(false) }
  }

  // ── Edit → PATCH /api/v1/kpi/{id} ─────────────────────────────────────
  const handleEditSave = async () => {
    if (!editSource || !editUrl.trim()) return
    setSaving(true); setError(null)
    try {
      await apiClientWithAuth.patch(`/api/v1/kpi/${editSource.id}`, {
        sheet_url: editUrl.trim(),
        tahun: editTahun ? parseInt(editTahun) : null,
        is_scheduled: editIsScheduled,
        is_active: editIsActive,
      })
      handleCloseEdit(); router.refresh()
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Update failed"))
    } finally { setSaving(false) }
  }

  // ── Delete → DELETE /api/v1/kpi/{id} ──────────────────────────────────
  const handleDelete = async (id: string) => {
    setSaving(true); setError(null)
    try {
      await apiClientWithAuth.delete(`/api/v1/kpi/${id}`)
      setDeleteConfirmId(null); handleCloseEdit(); router.refresh()
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Delete failed"))
    } finally { setSaving(false) }
  }

  // ── Ingest satu sumber ────────────────────────────────────────────────
  const handleIngestOne = async (source: TrackerSource) => {
    setIngestingId(source.id); setIngestResult(null); setError(null)
    try {
      const params: Record<string, string> = { sheet_url: source.sheet_url }
      if (source.tahun) params.tahun = String(source.tahun)
      const res = await apiClientWithAuth.post("/api/v1/ingest/google-sheets", null, { params })
      const data = res.data
      const isSuccess = data.overall_status === "success"
      const marker = isSuccess ? "✓" : "✕"
      setIngestResult(`${marker} ${source.nama_grup}: ${data.grand_ingested ?? 0} records ingested (${data.overall_status})`)
      router.refresh()
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Ingest failed"))
    } finally { setIngestingId(null) }
  }

  // ── Run All → POST /api/v1/ingest/google-sheets/batch ─────────────────
  const handleRunAll = async () => {
    if (!selectedSources.length) {
      setError("Pilih minimal 1 sumber untuk dijalankan.")
      return
    }
    if (selectedSources.length > MAX_BATCH_SOURCES) {
      setError(`Maksimal ${MAX_BATCH_SOURCES} sumber untuk sekali Run Selected.`)
      return
    }

    setRunningAll(true); setIngestResult(null); setError(null)
    try {
      const res = await apiClientWithAuth.post("/api/v1/ingest/google-sheets/batch", {
        sources: selectedSources.map((s) => ({ sheet_url: s.sheet_url, tahun: s.tahun })),
        skip_on_error: true,
      })
      const data = res.data
      const totalIngested =
        typeof data.grand_ingested === "number"
          ? data.grand_ingested
          : Array.isArray(data.results)
            ? data.results.reduce(
                (sum: number, item: { grand_ingested?: number }) =>
                  sum + (item.grand_ingested ?? 0),
                0,
              )
            : 0

      const isSuccess = (data.failed ?? 0) === 0
      const marker = isSuccess ? "✓" : "✕"
      setIngestResult(
        `${marker} Run Selected: ${totalIngested} records dari ${data.succeeded ?? 0}/${data.total_urls ?? selectedSources.length} sumber`,
      )
      setIsBatchMode(false)
      setSelectedSourceIds([])
      router.refresh()
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Batch ingest failed"))
    } finally { setRunningAll(false) }
  }

  return (
    <>
      {/* ── Table card ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/5">
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              KPI Tracker Sources
            </h3>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              Daftar Google Sheets yang digunakan sebagai sumber data KPI Tracker.
            </p>
            {isBatchMode && !!selectableSources.length && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Pilih sumber untuk batch ingest: {selectedSources.length}/{MAX_BATCH_SOURCES}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!!selectableSources.length && !isBatchMode && (
              <Button variant="outline" size="sm" onClick={handleEnableBatchMode} disabled={runningAll || !!ingestingId}>
                Run Batch
              </Button>
            )}
            {!!selectableSources.length && isBatchMode && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelBatchMode}
                  disabled={runningAll}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRunAll}
                  disabled={runningAll || !!ingestingId || selectedSources.length === 0}
                >
                  {runningAll ? "Running…" : `Run Selected (${selectedSources.length})`}
                </Button>
              </>
            )}
            <Button size="sm" onClick={() => setAddOpen(true)}>+ Add Source</Button>
          </div>
        </div>

        {/* Banner hasil ingest */}
        {ingestResult && (
          <div className={`border-b px-6 py-2.5 text-sm ${
            ingestResult.startsWith("✕")
              ? "border-error-100 bg-error-50 text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400"
              : "border-success-100 bg-success-50 text-success-700 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-400"
          }`}>
            {ingestResult}
            <button onClick={() => setIngestResult(null)} className="ml-3 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}
        {error && (
          <div className="border-b border-error-100 bg-error-50 px-6 py-2.5 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
            {error}
            <button onClick={() => setError(null)} className="ml-3 opacity-60 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Table */}
        {initialSources.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
            Belum ada sumber. Klik <span className="font-medium">+ Add Source</span> untuk menambahkan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400 dark:border-white/5">
                  {isBatchMode && <th className="px-6 py-3 font-medium">Pilih</th>}
                  <th className="px-6 py-3 font-medium">Nama File</th>
                  <th className="px-6 py-3 font-medium">Sheet URL</th>
                  <th className="px-6 py-3 font-medium">Tahun</th>
                  <th className="px-6 py-3 font-medium">Scheduled</th>
                  <th className="px-6 py-3 font-medium">Active</th>
                  <th className="px-6 py-3 font-medium">Ingest</th>
                  <th className="px-6 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {initialSources.map((source) => (
                  <React.Fragment key={source.id}>
                    <tr className="text-gray-700 dark:text-white/80">
                      {isBatchMode && (
                        <td className="px-6 py-3">
                          <input
                            type="checkbox"
                            checked={selectedSourceIds.includes(source.id)}
                            disabled={
                              !(source.is_active && source.is_scheduled) ||
                              (!selectedSourceIds.includes(source.id) && selectedSourceIds.length >= MAX_BATCH_SOURCES)
                            }
                            onChange={() => toggleSourceSelection(source)}
                            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
                            title={
                              source.is_active && source.is_scheduled
                                ? "Pilih sumber ini untuk batch ingest"
                                : "Hanya sumber Active dan Scheduled yang bisa dipilih"
                            }
                          />
                        </td>
                      )}
                      <td className="px-6 py-3 font-medium">{source.nama_grup}</td>
                      <td className="px-6 py-3 font-mono text-xs text-gray-400" title={source.sheet_url}>
                        {truncateUrl(source.sheet_url)}
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {source.tahun ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-6 py-3">
                        <Badge active={source.is_scheduled} label={source.is_scheduled ? "Ya" : "Tidak"} color="blue" />
                      </td>
                      <td className="px-6 py-3">
                        <Badge active={source.is_active} label={source.is_active ? "Ya" : "Tidak"} color="green" />
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleIngestOne(source)}
                          disabled={ingestingId === source.id || runningAll}
                          className="rounded-lg border border-brand-200 px-3 py-1 text-xs font-medium text-brand-600 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-brand-500/30 dark:text-brand-400 dark:hover:bg-brand-500/10"
                        >
                          {ingestingId === source.id ? "Ingesting…" : "Ingest"}
                        </button>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleOpenEdit(source)}
                            className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { setDeleteConfirmId(source.id); setEditSource(null) }}
                            className="text-xs font-medium text-gray-400 hover:text-error-500"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>

                    {deleteConfirmId === source.id && (
                      <tr>
                        <td colSpan={isBatchMode ? 8 : 7} className="px-6 pb-3 pt-1">
                          <div className="flex items-center gap-3 rounded-lg bg-error-50 px-4 py-2.5 text-sm dark:bg-error-500/10">
                            <span className="text-error-600 dark:text-error-400">
                              Hapus &quot;{source.nama_grup}&quot; beserta semua data terkait? Tidak bisa dibatalkan.
                            </span>
                            <button onClick={() => handleDelete(source.id)} disabled={saving}
                              className="font-semibold text-error-600 hover:text-error-700 disabled:opacity-40">
                              Ya, hapus
                            </button>
                            <button onClick={() => setDeleteConfirmId(null)} className="text-gray-500 hover:text-gray-700">
                              Batal
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add Modal ────────────────────────────────────────────────── */}
      <Modal isOpen={addOpen} onClose={handleCloseAdd} className="max-w-md p-6">
        <h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Tambah Sumber Baru</h4>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Nama file akan diambil otomatis dari Google Sheets saat disimpan.
        </p>
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="add-url">Sheet URL</Label>
            <Input id="add-url" placeholder="https://docs.google.com/spreadsheets/d/..."
              value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="add-tahun">Tahun</Label>
            <Input id="add-tahun" type="number" placeholder="2025"
              value={newTahun} onChange={(e) => setNewTahun(e.target.value)} />
          </div>
          <Switch label="Include in Scheduler" defaultChecked={newIsScheduled} onChange={setNewIsScheduled} />
          {error && <p className="text-sm text-error-500">{error}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={handleCloseAdd} disabled={saving}>Batal</Button>
            <Button onClick={handleAdd} disabled={saving || !newUrl.trim()}>
              {saving ? "Menyimpan…" : "Add Source"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Modal ───────────────────────────────────────────────── */}
      <Modal isOpen={!!editSource} onClose={handleCloseEdit} className="max-w-md p-6">
        <h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Edit Sumber</h4>
        <p className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">{editSource?.nama_grup}</p>
        <p className="mb-5 font-mono text-xs text-gray-300 dark:text-gray-600">
          {editSource && truncateUrl(editSource.sheet_url, 60)}
        </p>
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="edit-url">Sheet URL</Label>
            <Input id="edit-url" placeholder="https://docs.google.com/spreadsheets/d/..."
              value={editUrl} onChange={(e) => setEditUrl(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-tahun">Tahun</Label>
            <Input id="edit-tahun" type="number" placeholder="2025"
              value={editTahun} onChange={(e) => setEditTahun(e.target.value)} />
          </div>
          <Switch key={`sched-${editSource?.id}`} label="Include in Scheduler"
            defaultChecked={editIsScheduled} onChange={setEditIsScheduled} />
          <Switch key={`active-${editSource?.id}`} label="Active"
            defaultChecked={editIsActive} onChange={setEditIsActive} />
          {error && <p className="text-sm text-error-500">{error}</p>}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => { setDeleteConfirmId(editSource!.id); handleCloseEdit() }}
              className="text-sm font-medium text-gray-400 hover:text-error-500"
            >
              Delete
            </button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCloseEdit} disabled={saving}>Batal</Button>
              <Button onClick={handleEditSave} disabled={saving || !editUrl.trim()}>
                {saving ? "Menyimpan…" : "Simpan"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

function Badge({ active, label, color }: { active: boolean; label: string; color: "blue" | "green" }) {
  const cls = active
    ? color === "blue"
      ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
      : "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
    : "bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500"
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
