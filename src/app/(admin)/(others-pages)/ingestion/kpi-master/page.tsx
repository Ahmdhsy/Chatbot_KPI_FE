import PageBreadCrumb from "@/components/common/PageBreadCrumb"
import IngestionGuideCard from "@/components/ingestion/IngestionGuideCard"
import KpiMasterIngestionCard from "@/components/ingestion/KpiMasterIngestionCard"
import KpiMasterManagementTable, { KpiMasterGroup } from "@/components/ingestion/KpiMasterManagementTable"
import IngestionLogsTable from "@/components/ingestion/IngestionLogsTable"
import { INGEST_LOG_PAGE_SIZE } from "@/lib/ingestionConstants"
import { serverFetch } from "@/lib/server-api"
import { LogEntry } from "@/hooks/useIngestion"

interface LogsResponse {
  total: number
  logs: LogEntry[]
}

interface KpiMasterManagementResponse {
  total: number
  page: number
  page_size: number
  total_pages: number
  data: KpiMasterGroup[]
}

export default async function KpiMasterIngestionPage() {
  let initialLogs: LogEntry[] = []
  let initialTotal = 0
  let initialManagement: KpiMasterManagementResponse = {
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 1,
    data: [],
  }

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

  try {
    initialManagement = await serverFetch<KpiMasterManagementResponse>(
      "/api/v1/ingest/kpi-master/management?page=1&page_size=10"
    )
  } catch {
    initialManagement = {
      total: 0,
      page: 1,
      page_size: 10,
      total_pages: 1,
      data: [],
    }
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
            "Jika source berubah, edit Sheet URL/Tahun di tabel KPI Master Management agar re-ingest berjalan otomatis.",
            "Verifikasi kolom KPI Master sesuai template agar mapping berjalan tanpa error.",
          ]}
        />
        <KpiMasterIngestionCard />
        <KpiMasterManagementTable initialData={initialManagement} />
        <IngestionLogsTable initialLogs={initialLogs} initialTotal={initialTotal} fixedFilter="kpi_master" />
      </div>
    </div>
  )
}
