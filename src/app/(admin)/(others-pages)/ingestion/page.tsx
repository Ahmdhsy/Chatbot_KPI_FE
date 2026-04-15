import Link from "next/link"
import PageBreadCrumb from "@/components/common/PageBreadCrumb"
import IngestionLogsTable from "@/components/ingestion/IngestionLogsTable"
import { INGEST_LOG_PAGE_SIZE } from "@/lib/ingestionConstants"
import { serverFetch } from "@/lib/server-api"
import { LogEntry } from "@/hooks/useIngestion"

interface LogsResponse {
  total: number
  logs: LogEntry[]
}

export default async function IngestionPage() {
  let initialLogs: LogEntry[] = []
  let initialTotal = 0

  try {
    const logsData = await serverFetch<LogsResponse>(`/api/v1/ingest/logs?limit=${INGEST_LOG_PAGE_SIZE}`)
    initialLogs = logsData.logs
    initialTotal = logsData.total
  } catch {
    initialLogs = []
    initialTotal = 0
  }

  return (
    <div>
      <PageBreadCrumb pageTitle="Ingestion" />
      <div className="flex flex-col gap-8">

        {/* ── Navigation Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/ingestion/kpi-master" className="group block">
            <div className="flex h-full flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-brand-300 hover:shadow-sm dark:border-white/5 dark:bg-white/3 dark:hover:border-brand-500/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800 group-hover:text-brand-600 dark:text-white/90 dark:group-hover:text-brand-400">
                    KPI Master
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Upload & upsert KPI master records
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ingest data KPI Master dari Google Sheets berdasarkan tahun. Digunakan sebagai referensi matching KPI Tracker.
              </p>
              <span className="mt-auto text-xs font-medium text-brand-500 group-hover:underline dark:text-brand-400">
                Buka KPI Master →
              </span>
            </div>
          </Link>

          <Link href="/ingestion/kpi-tracker" className="group block">
            <div className="flex h-full flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-brand-300 hover:shadow-sm dark:border-white/5 dark:bg-white/3 dark:hover:border-brand-500/40">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-50 text-success-500 dark:bg-success-500/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800 group-hover:text-success-600 dark:text-white/90 dark:group-hover:text-success-400">
                    KPI Tracker
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Kelola sumber & scheduler otomatis
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tambah atau kelola Google Sheets KPI Tracker. Atur jadwal ingestion otomatis dan pantau status sumber data.
              </p>
              <span className="mt-auto text-xs font-medium text-success-500 group-hover:underline dark:text-success-400">
                Buka KPI Tracker →
              </span>
            </div>
          </Link>
        </div>

        {/* ── Ingestion Log ────────────────────────────────────── */}
        <IngestionLogsTable initialLogs={initialLogs} initialTotal={initialTotal} />

      </div>
    </div>
  )
}
