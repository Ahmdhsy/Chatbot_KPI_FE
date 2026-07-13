"use client"
import React, { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Modal } from "@/components/ui/modal"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import Switch from "@/components/form/switch/Switch"
import { TrackerSource } from "@/hooks/useTrackerSources"
import apiClientWithAuth from "@/services/apiClientWithAuth"
import { useToast } from "@/context/ToastContext"
import useDebounce from "@/hooks/useDebounce"
import { extractFriendlyErrorMessage } from "@/utils/errorHelper"
import Pagination from "@/components/tables/Pagination"

function getErrorMessage(error: unknown, fallback: string): string {
  return extractFriendlyErrorMessage(error, fallback)
}

function truncateUrl(url: string, max = 55): string {
  return url.length > max ? url.slice(0, max) + "…" : url
}

interface KpiTrackerGroupListResponse {
  total: number
  page: number
  limit: number
  total_pages: number
  data: TrackerSource[]
}

interface Props {
  initialData: KpiTrackerGroupListResponse
}

const MAX_BATCH_SOURCES = 6

export default function TrackerSourcesSection({ initialData }: Props) {
  const router = useRouter()
  const { addToast } = useToast()
  const [rows, setRows] = useState<TrackerSource[]>(initialData.data ?? [])
  const [page, setPage] = useState(initialData.page || 1)
  const [totalPages, setTotalPages] = useState(Math.max(1, initialData.total_pages || 1))
  const [total, setTotal] = useState(initialData.total || 0)
  const [pageSize] = useState(initialData.limit || 10)
  const [search, setSearch] = useState("")
  const [yearFilter, setYearFilter] = useState("")
  const [loadingRows, setLoadingRows] = useState(false)
  const normalizedQuery = search.trim()
  const debouncedSearch = useDebounce(normalizedQuery, 1000)
  const debouncedYearFilter = useDebounce(yearFilter, 1000)

  // ── Add modal ─────────────────────────────────────────────────────────
  const [addOpen, setAddOpen] = useState(false)
  const [newUrl, setNewUrl] = useState("")
  const [newTahun, setNewTahun] = useState("")

  // ── Edit modal ────────────────────────────────────────────────────────
  const [editSource, setEditSource] = useState<TrackerSource | null>(null)
  const [editUrl, setEditUrl] = useState("")
  const [editTahun, setEditTahun] = useState("")
  const [editIsActive, setEditIsActive] = useState(true)

  // ── Delete confirm ────────────────────────────────────────────────────
  const [deleteCandidate, setDeleteCandidate] = useState<TrackerSource | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Ingestion state ───────────────────────────────────────────────────
  const [ingestingId, setIngestingId] = useState<string | null>(null)
  const [runningAll, setRunningAll] = useState(false)
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([])
  const [ingestResult, setIngestResult] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) {
      setRows(initialData.data ?? [])
      setPage(initialData.page || 1)
      setTotalPages(Math.max(1, initialData.total_pages || 1))
      setTotal(initialData.total || 0)
    }
  }, [initialData])

  const fetchSources = async (targetPage: number) => {
    setLoadingRows(true)
    setError(null)
    try {
      const parsedYear = debouncedYearFilter.trim() ? Number.parseInt(debouncedYearFilter, 10) : null
      const validYear = parsedYear !== null && !Number.isNaN(parsedYear) ? parsedYear : null
      const { data } = await apiClientWithAuth.get<KpiTrackerGroupListResponse>("/api/v1/kpi/", {
        params: {
          group_type: "tracker",
          page: targetPage,
          limit: pageSize,
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
          ...(validYear !== null ? { tahun: validYear } : {}),
        },
      })
      setRows(data.data ?? [])
      setPage(data.page || targetPage)
      setTotal(data.total || 0)
      setTotalPages(Math.max(1, data.total_pages || 1))
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Gagal memuat sumber tracker"))
      setRows([])
    } finally {
      setLoadingRows(false)
    }
  }

  useEffect(() => {
    void fetchSources(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, debouncedYearFilter])

  const handleCloseAdd = () => {
    setAddOpen(false); setNewUrl(""); setNewTahun("")
    setError(null)
  }

  const handleOpenEdit = (source: TrackerSource) => {
    setEditSource(source)
    setEditUrl(source.sheet_url)
    setEditTahun(source.tahun != null ? String(source.tahun) : "")
    setEditIsActive(source.is_active)
    setError(null); setDeleteCandidate(null)
  }

  const handleCloseEdit = () => {
    setEditSource(null); setEditUrl(""); setEditTahun("")
    setEditIsActive(true); setError(null)
  }

  const openDeleteConfirmation = (source: TrackerSource) => {
    setDeleteCandidate(source)
    setError(null)
  }

  const closeDeleteConfirmation = () => {
    if (!deletingId) {
      setDeleteCandidate(null)
    }
  }

  const selectableSources = useMemo(
    () => rows.filter((s) => s.is_active),
    [rows],
  )

  const selectedSources = useMemo(
    () => selectableSources.filter((s) => selectedSourceIds.includes(s.id)),
    [selectableSources, selectedSourceIds],
  )

  const toggleSourceSelection = (source: TrackerSource) => {
    if (!source.is_active) return

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

  // ── Add → create → ingest → rollback jika gagal ─────────────────────
  const handleAdd = async () => {
    if (!newUrl.trim()) return
    setSaving(true)
    setError(null)
    const url = newUrl.trim()
    const tahunParsed = newTahun ? parseInt(newTahun) : null

    // Step 1: Buat record group
    let groupId: string | null = null
    try {
      const createRes = await apiClientWithAuth.post<{ id: string }>("/api/v1/kpi/", {
        group_type: "tracker",
        sheet_url: url,
        tahun: tahunParsed,
        is_active: true,
      })
      groupId = createRes.data.id
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Gagal menambahkan sumber"))
      setSaving(false)
      return
    }

    // Step 2: Langsung ingest — validasi akses + template implisit
    try {
      const params: Record<string, string> = { sheet_url: url }
      if (tahunParsed) params.tahun = String(tahunParsed)
      const res = await apiClientWithAuth.post("/api/v1/ingest/google-sheets", null, { params })
      const data = res.data
      const nIngested: number = data.grand_ingested ?? 0

      if (nIngested === 0) {
        // Tidak ada data teringest — rollback group
        if (groupId) await apiClientWithAuth.delete(`/api/v1/kpi/${groupId}`).catch(() => {})
        const sheets: Array<{ status: string; errors?: string[]; reason?: string }> = data.sheets ?? []
        const firstBad = sheets.find((s) => s.status === "failed" || s.status === "skipped")
        setError(firstBad?.errors?.[0] ?? firstBad?.reason ?? "Tidak ada data yang berhasil diingest.")
        setSaving(false)
        return
      }

      addToast("success", `Sumber berhasil ditambahkan: ${nIngested} data berhasil diingest.`, "Sukses")
      handleCloseAdd()
      await fetchSources(1)
      router.refresh()
    } catch (ingestErr: unknown) {
      // HTTP error (misal 404 = belum di-invite ke service account)
      if (groupId) await apiClientWithAuth.delete(`/api/v1/kpi/${groupId}`).catch(() => {})
      setError(getErrorMessage(ingestErr, "Gagal mengakses atau membaca sheet"))
    } finally {
      setSaving(false)
    }
  }

  // ── Edit → PATCH /api/v1/kpi/{id} ─────────────────────────────────────
  const handleEditSave = async () => {
    if (!editSource || !editUrl.trim()) return
    setSaving(true); setError(null)
    try {
      await apiClientWithAuth.patch(`/api/v1/kpi/${editSource.id}`, {
        sheet_url: editUrl.trim(),
        tahun: editTahun ? parseInt(editTahun) : null,
        is_active: editIsActive,
      })
      addToast("success", "Sumber KPI Tracker berhasil diperbarui.", "Sukses")
      handleCloseEdit()
      await fetchSources(page)
      router.refresh()
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Gagal memperbarui"))
    } finally { setSaving(false) }
  }

  // ── Delete → DELETE /api/v1/kpi/{id} ──────────────────────────────────
  const handleDelete = async () => {
    if (!deleteCandidate) return

    setDeletingId(deleteCandidate.id)
    setError(null)
    const deletedName = deleteCandidate.nama_grup
    try {
      await apiClientWithAuth.delete(`/api/v1/kpi/${deleteCandidate.id}`)
      if (editSource?.id === deleteCandidate.id) {
        handleCloseEdit()
      }
      setDeleteCandidate(null)
      addToast("success", `Sumber "${deletedName}" berhasil dihapus.`, "Sukses")
      await fetchSources(page)
      router.refresh()
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Gagal menghapus"))
    } finally { setDeletingId(null) }
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
      const resultMsg = `${marker} ${source.nama_grup}: ${data.grand_ingested ?? 0} data berhasil diingest (${data.overall_status})`
      setIngestResult(resultMsg)
      addToast(isSuccess ? "success" : "warning", resultMsg, "Ingest")
      await fetchSources(page)
      router.refresh()
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Gagal mengingest"))
    } finally { setIngestingId(null) }
  }

  // ── Run All → POST /api/v1/ingest/google-sheets/batch ─────────────────
  const handleRunAll = async () => {
    if (!selectedSources.length) {
      setError("Pilih minimal 1 sumber untuk dijalankan.")
      return
    }
    if (selectedSources.length > MAX_BATCH_SOURCES) {
      setError(`Maksimal ${MAX_BATCH_SOURCES} sumber untuk sekali Jalankan Terpilih.`)
      return
    }

    setRunningAll(true); setIngestResult(null); setError(null)
    try {
      const res = await apiClientWithAuth.post("/api/v1/ingest/google-sheets/batch", {
        sources: selectedSources.map((s) => ({ sheet_url: s.sheet_url, tahun: s.tahun })),
        skip_on_error: true,
        delay_between_sources: 5.0,
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
      const batchMsg = `${marker} Jalankan Terpilih: ${totalIngested} data dari ${data.succeeded ?? 0}/${data.total_urls ?? selectedSources.length} sumber`
      setIngestResult(batchMsg)
      addToast(isSuccess ? "success" : "warning", batchMsg, "Ingest Massal")
      setIsBatchMode(false)
      setSelectedSourceIds([])
      await fetchSources(page)
      router.refresh()
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Gagal mengingest massal"))
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
              Sumber KPI Tracker
            </h3>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              Daftar Google Sheets yang digunakan sebagai sumber data KPI Tracker.
            </p>
            {isBatchMode && !!selectableSources.length && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Pilih sumber untuk ingest massal: {selectedSources.length}/{MAX_BATCH_SOURCES}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!!selectableSources.length && !isBatchMode && (
              <Button variant="outline" size="sm" onClick={handleEnableBatchMode} disabled={runningAll || !!ingestingId}>
                Jalankan Massal
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
                  Batal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRunAll}
                  disabled={runningAll || !!ingestingId || selectedSources.length === 0}
                >
                  {runningAll ? "Berjalan…" : `Jalankan Terpilih (${selectedSources.length})`}
                </Button>
              </>
            )}
            <Button size="sm" onClick={() => setAddOpen(true)}>+ Tambah Sumber</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-gray-100 px-6 py-4 sm:grid-cols-2 dark:border-white/5">
          <Input
            placeholder="Cari nama grup tracker, sheet url, tahun..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Input
            placeholder="Filter tahun (contoh: 2025)"
            value={yearFilter}
            onChange={(event) => setYearFilter(event.target.value)}
          />
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
        {loadingRows ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
            Loading sumber tracker...
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
            Belum ada sumber sesuai filter/pencarian. Klik <span className="font-medium">+ Tambah Sumber</span> untuk menambahkan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="border-b border-gray-100 text-left text-sm font-semibold uppercase tracking-wider text-gray-400 dark:border-white/5">
                  {isBatchMode && <th className="px-6 py-3 font-semibold">Pilih</th>}
                  <th className="px-6 py-3 font-semibold">Nama File</th>
                  <th className="px-6 py-3 font-semibold">Sheet URL</th>
                  <th className="px-6 py-3 font-semibold">Tahun</th>
                  <th className="px-6 py-3 font-semibold">Aktif</th>
                  <th className="px-6 py-3 font-semibold">Ingest</th>
                  <th className="px-6 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {rows.map((source) => (
                  <tr key={source.id} className="text-gray-700 dark:text-white/80">
                      {isBatchMode && (
                        <td className="px-6 py-3">
                          <input
                            type="checkbox"
                            checked={selectedSourceIds.includes(source.id)}
                            disabled={
                              !source.is_active ||
                              (!selectedSourceIds.includes(source.id) && selectedSourceIds.length >= MAX_BATCH_SOURCES)
                            }
                            onChange={() => toggleSourceSelection(source)}
                            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
                            title={
                              source.is_active
                                ? "Pilih sumber ini untuk ingest massal"
                                : "Hanya sumber Aktif yang bisa dipilih"
                            }
                          />
                        </td>
                      )}
                      <td className="px-6 py-3 font-medium">{source.nama_grup}</td>
                      <td className="px-6 py-3 font-mono text-sm text-gray-400" title={source.sheet_url}>
                        {truncateUrl(source.sheet_url)}
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {source.tahun ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                      <td className="px-6 py-3">
                        <Badge active={source.is_active} label={source.is_active ? "Ya" : "Tidak"} color="green" />
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleIngestOne(source)}
                          disabled={ingestingId === source.id || runningAll}
                          className="rounded-lg border border-brand-200 px-3 py-1 text-sm font-medium text-brand-600 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-brand-500/30 dark:text-brand-400 dark:hover:bg-brand-500/10"
                        >
                          {ingestingId === source.id ? "Mengingest…" : "Ingest"}
                        </button>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <a
                            href={`/ingestion/${source.id}`}
                            className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white/80"
                          >
                            Detail
                          </a>
                          <button
                            onClick={() => handleOpenEdit(source)}
                            className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteConfirmation(source)}
                            disabled={deletingId === source.id}
                            className="text-sm font-medium text-gray-400 hover:text-error-500 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {deletingId === source.id ? "Menghapus..." : "Hapus"}
                          </button>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        <div className="flex flex-col gap-4 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Menampilkan {rows.length} dari {total} data
          </p>
          {totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={fetchSources} />
          )}
        </div>
      </div>

      <Modal isOpen={addOpen} onClose={handleCloseAdd} className="max-w-4xl p-6">
        <h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Tambah Sumber Baru</h4>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Nama file akan diambil otomatis dari Google Sheets saat disimpan.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div>
              <Label htmlFor="add-url">Sheet URL</Label>
              <Input
                id="add-url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="add-tahun">Tahun</Label>
              <Input
                id="add-tahun"
                type="number"
                placeholder="2025"
                value={newTahun}
                onChange={(e) => setNewTahun(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-error-500">{error}</p>}
            <div className="flex justify-end gap-3 pt-1">
              <Button variant="outline" onClick={handleCloseAdd} disabled={saving}>Batal</Button>
              <Button onClick={handleAdd} disabled={saving || !newUrl.trim()}>
                {saving ? "Menyimpan…" : "Tambah Sumber"}
              </Button>
            </div>
          </div>

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
                Gunakan format dari sheet contoh berikut agar proses ingestion dapat berjalan:{" "}
                <a
                  href="https://docs.google.com/spreadsheets/d/1p9Zh2wJ6loFJz2rmiw8g2H2NZYf-x6w17O1t9uPxDTU/edit?usp=sharing"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                >
                  Contoh format KPI Tracker
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* ── Edit Modal ───────────────────────────────────────────────── */}
      <Modal isOpen={!!editSource} onClose={handleCloseEdit} className="max-w-2xl p-6">
        <h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Edit Sumber KPI Tracker</h4>
        <p className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">{editSource?.nama_grup}</p>
        <p className="mb-5 font-mono text-xs text-gray-300 dark:text-gray-600">
          {editSource && truncateUrl(editSource.sheet_url, 60)}
        </p>
        <div className="grid gap-6 md:grid-cols-2">
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
            <Switch key={`active-${editSource?.id}`} label="Aktif"
              defaultChecked={editIsActive} onChange={setEditIsActive} />
            {error && <p className="text-sm text-error-500">{error}</p>}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => editSource && openDeleteConfirmation(editSource)}
                disabled={!editSource || deletingId === editSource?.id}
                className="text-sm font-medium text-gray-400 hover:text-error-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deletingId === editSource?.id ? "Menghapus..." : "Hapus"}
              </button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCloseEdit} disabled={saving}>Batal</Button>
                <Button onClick={handleEditSave} disabled={saving || !editUrl.trim()}>
                  {saving ? "Menyimpan…" : "Simpan"}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
            <p className="mb-2 text-sm font-semibold text-amber-800 dark:text-amber-300">Panduan Edit KPI Tracker</p>
            <ul className="list-disc list-inside space-y-2 text-xs text-amber-700 dark:text-amber-400">
              <li>
                Invite spreadsheet ke akun berikut (minimal <strong>Viewer</strong>):
                <div className="mt-1.5 rounded-lg bg-orange-200 px-3 py-2 font-mono text-gray-800 dark:bg-white/10 dark:text-gray-200 break-all">
                  sheet-access-bot@impressive-hull-429606-b3.iam.gserviceaccount.com
                </div>
              </li>
              <li>
                Gunakan format dari sheet contoh berikut agar proses ingestion dapat berjalan:{" "}
                <a
                  href="https://docs.google.com/spreadsheets/d/1p9Zh2wJ6loFJz2rmiw8g2H2NZYf-x6w17O1t9uPxDTU/edit?usp=sharing"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-amber-800 hover:underline dark:text-amber-300"
                >
                  Contoh format KPI Tracker
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteCandidate} onClose={closeDeleteConfirmation} className="max-w-md p-6">
        <h4 className="mb-2 text-lg font-semibold text-error-700 dark:text-error-400">Konfirmasi Hapus KPI Tracker</h4>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
          Apakah Anda yakin ingin menghapus source <strong>{deleteCandidate?.nama_grup}</strong>?
        </p>
        <div className="mb-6 rounded-lg border border-error-100 bg-error-50 px-3 py-2 text-xs text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
          Semua data KPI Tracker terkait juga akan terhapus. Tindakan ini tidak dapat dibatalkan.
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={closeDeleteConfirmation} disabled={!!deletingId}>Batal</Button>
          <Button onClick={handleDelete} disabled={!!deletingId} className="bg-error-600 hover:bg-error-700">
            {deletingId ? "Menghapus..." : "Hapus"}
          </Button>
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
