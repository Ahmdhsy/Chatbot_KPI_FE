"use client"
import React, { useEffect, useRef, useState } from "react"
import flatpickr from "flatpickr"
import "flatpickr/dist/flatpickr.css"
import Badge from "@/components/ui/badge/Badge"
import {
  Table, TableBody, TableCell, TableHeader, TableRow,
} from "@/components/ui/table"
import Pagination from "@/components/tables/Pagination"
import { LogEntry } from "@/hooks/useIngestion"
import { INGEST_LOG_PAGE_SIZE } from "@/lib/ingestionConstants"
import { apiClientWithAuth } from "@/services/apiClientWithAuth"

type FilterType = "all" | "kpi_tracker" | "kpi_master"
type StatusFilter = "all" | "success" | "failed"

// ── Compact date picker pakai flatpickr ──────────────────────────────────────
function DatePickerInput({
  value,
  onChange,
  placeholder,
  minDate,
}: {
  value: string
  onChange: (val: string) => void
  placeholder: string
  minDate?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const fpRef = useRef<flatpickr.Instance | null>(null)

  useEffect(() => {
    if (!inputRef.current) return
    fpRef.current = flatpickr(inputRef.current, {
      dateFormat: "Y-m-d",
      defaultDate: value || undefined,
      minDate: minDate || undefined,
      onChange: (_dates, dateStr) => onChange(dateStr),
      disableMobile: true,
    })
    return () => { fpRef.current?.destroy() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fpRef.current?.set("minDate", minDate || undefined)
  }, [minDate])

  useEffect(() => {
    if (!fpRef.current) return
    if (!value) fpRef.current.clear()
    else fpRef.current.setDate(value, false)
  }, [value])

  return (
    <div className="relative">
      <input
        ref={inputRef}
        placeholder={placeholder}
        readOnly
        className="w-32 cursor-pointer rounded-lg border border-gray-200 bg-white py-1.5 pl-3 pr-8 text-xs text-gray-700 focus:border-brand-400 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      </span>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  initialLogs: LogEntry[]
  initialTotal: number
  fixedFilter?: FilterType
  hidePersonColumn?: boolean
  refreshTrigger?: number
}

const TYPE_TABS: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "KPI Tracker", value: "kpi_tracker" },
  { label: "KPI Master", value: "kpi_master" },
]

const STATUS_TABS: { label: string; value: StatusFilter; activeClass: string }[] = [
  { label: "Semua", value: "all", activeClass: "bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-gray-300" },
  { label: "Berhasil", value: "success", activeClass: "bg-success-500 text-white" },
  { label: "Gagal", value: "failed", activeClass: "bg-error-500 text-white" },
]

export default function IngestionLogsTable({
  initialLogs,
  initialTotal,
  fixedFilter,
  hidePersonColumn = false,
  refreshTrigger,
}: Props) {
  const [filter, setFilter] = useState<FilterType>(fixedFilter ?? "all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs ?? [])
  const [total, setTotal] = useState(initialTotal ?? 0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const isFirstRender = useRef(true)

  const buildParams = (offset: number) => {
    const params = new URLSearchParams({ limit: String(INGEST_LOG_PAGE_SIZE), offset: String(offset) })
    if (filter !== "all") params.set("group_type", filter === "kpi_master" ? "master" : "tracker")
    if (statusFilter !== "all") params.set("status", statusFilter)
    if (startDate) params.set("start_date", startDate)
    if (endDate) params.set("end_date", endDate)
    return params.toString()
  }

  const fetchLogs = (offset: number, resetPage?: number) => {
    setLoading(true)
    apiClientWithAuth.get(`/api/v1/ingest/logs?${buildParams(offset)}`)
      .then((r) => r.data as { total?: number; logs?: LogEntry[] })
      .then((data) => {
        setLogs(data.logs ?? [])
        setTotal(data.total ?? 0)
        if (resetPage !== undefined) setPage(resetPage)
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      if ((initialLogs ?? []).length > 0 && refreshTrigger === undefined) return
    }
    fetchLogs((page - 1) * INGEST_LOG_PAGE_SIZE)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, statusFilter, startDate, endDate, page])

  useEffect(() => {
    if (refreshTrigger === undefined || refreshTrigger === 0) return
    fetchLogs(0, 1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  useEffect(() => {
    if (page === 1) {
      setLogs(initialLogs ?? [])
      setTotal(initialTotal ?? 0)
    }
  }, [initialLogs, initialTotal, page])

  const hasDateFilter = startDate || endDate
  const resetDateFilter = () => { setStartDate(""); setEndDate(""); setPage(1) }

  const totalPages = Math.max(1, Math.ceil(total / INGEST_LOG_PAGE_SIZE))
  const statusColor = (s: string) => s === "success" ? "success" : s === "partial" ? "warning" : "error"
  const typeColor = (t: string) => t === "kpi_master" ? "info" : "primary"

  const headers = hidePersonColumn
    ? ["Tanggal", "Tipe", "Nama Sheet", "Total", "Berhasil", "Gagal", "Status"]
    : ["Tanggal", "Tipe", "Nama Sheet", "Person", "Total", "Berhasil", "Gagal", "Status"]
  const colSpan = hidePersonColumn ? 7 : 8

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">

      {/* ── Header row: judul + type filter ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4 dark:border-white/5">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Ingestion Logs</h3>

        {fixedFilter ? (
          <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-500 dark:bg-white/5 dark:text-gray-400">
            {TYPE_TABS.find((t) => t.value === fixedFilter)?.label ?? fixedFilter}
          </span>
        ) : (
          <div className="flex gap-1">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setFilter(tab.value); setPage(1) }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  filter === tab.value
                    ? "bg-brand-500 text-white"
                    : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Filter bar: status + periode ── */}
      <div className="flex flex-wrap items-center gap-4 border-b border-gray-100 px-6 py-3 dark:border-white/5">

        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Status</span>
          <div className="flex gap-1 rounded-lg border border-gray-100 p-0.5 dark:border-white/5">
            {STATUS_TABS.map((s) => (
              <button
                key={s.value}
                onClick={() => { setStatusFilter(s.value); setPage(1) }}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  statusFilter === s.value
                    ? s.activeClass
                    : "text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-white/5"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-4 w-px bg-gray-200 dark:bg-white/10" />

        {/* Periode */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Periode</span>
          <DatePickerInput
            value={startDate}
            onChange={(v) => { setStartDate(v); setPage(1) }}
            placeholder="Dari tanggal"
          />
          <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
          <DatePickerInput
            value={endDate}
            onChange={(v) => { setEndDate(v); setPage(1) }}
            placeholder="Sampai tanggal"
            minDate={startDate || undefined}
          />
          {hasDateFilter && (
            <button
              onClick={resetDateFilter}
              className="text-xs text-gray-400 hover:text-error-500 dark:text-gray-500"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/5">
            <TableRow>
              {headers.map((h) => (
                <TableCell
                  key={h}
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
            {loading ? (
              <TableRow>
                <TableCell className="px-5 py-4 text-center text-sm text-gray-400" colSpan={colSpan}>
                  Loading…
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell className="px-5 py-4 text-center text-sm text-gray-400" colSpan={colSpan}>
                  Tidak ada log ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                    {new Date(log.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                  </TableCell>
                  <TableCell className="px-5 py-3">
                    <Badge size="sm" color={typeColor(log.source_type)}>
                      {log.source_type === "kpi_master" ? "KPI Master" : "KPI Tracker"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                    {log.sheet_name ?? "—"}
                  </TableCell>
                  {!hidePersonColumn && (
                    <TableCell className="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                      {log.nama_orang ?? "—"}
                    </TableCell>
                  )}
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

      <div className="flex justify-end border-t border-gray-100 px-6 py-3 dark:border-white/5">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
