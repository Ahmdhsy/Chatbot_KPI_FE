import PageBreadCrumb from "@/components/common/PageBreadCrumb"
import IngestionGuideCard from "@/components/ingestion/IngestionGuideCard"
import KpiMasterIngestionCard from "@/components/ingestion/KpiMasterIngestionCard"
import IngestionLogsTable from "@/components/ingestion/IngestionLogsTable"
import { INGEST_LOG_PAGE_SIZE } from "@/lib/ingestionConstants"
import { serverFetch } from "@/lib/server-api"
import { LogEntry } from "@/hooks/useIngestion"

interface LogsResponse {
  total: number
  logs: LogEntry[]
}

export default async function KpiMasterIngestionPage() {
  let initialLogs: LogEntry[] = []
  let initialTotal = 0

  try {
    const logsData = await serverFetch<LogsResponse>(
      `/api/v1/ingest/logs?limit=${INGEST_LOG_PAGE_SIZE}&source_type=kpi_master`
    )
    initialLogs = logsData.logs
    initialTotal = logsData.total
  } catch {
    initialLogs = []
    initialTotal = 0
  }

  return (
    <div>
      <PageBreadCrumb pageTitle="KPI Master" parents={[{ label: "Ingestion", href: "/ingestion" }]} />
      <div className="flex flex-col gap-8">
        <IngestionGuideCard
          title="Panduan KPI Master"
          subtitle="Data master menjadi referensi utama untuk matching KPI tracker, jadi pastikan struktur sheet valid."
          steps={[
            "Pastikan Spreadsheet telah mengundang email yang terdaftar dengan credential Anda.",
            "Salin link Google Sheets KPI Master dan masukkan Tahun sebelum ingest.",
            "Verifikasi kolom KPI Master sesuai template agar mapping berjalan tanpa error.",
          ]}
        />
        <KpiMasterIngestionCard />
        <IngestionLogsTable initialLogs={initialLogs} initialTotal={initialTotal} fixedFilter="kpi_master" />
      </div>
    </div>
  )
}
