import PageBreadCrumb from "@/components/common/PageBreadCrumb"
import IngestionGuideCard from "@/components/ingestion/IngestionGuideCard"
import SchedulerConfigCard from "@/components/ingestion/SchedulerConfigCard"
import TrackerSourcesSection from "@/components/ingestion/TrackerSourcesSection"
import IngestionLogsTable from "@/components/ingestion/IngestionLogsTable"
import { INGEST_LOG_PAGE_SIZE } from "@/lib/ingestionConstants"
import { serverFetch } from "@/lib/server-api"
import { SchedulerConfig } from "@/hooks/useScheduler"
import { TrackerSource } from "@/hooks/useTrackerSources"
import { LogEntry } from "@/hooks/useIngestion"

interface LogsResponse {
  total: number
  logs: LogEntry[]
}

export default async function KpiTrackerIngestionPage() {
  let config: SchedulerConfig | null = null
  let initialSources: TrackerSource[] = []
  let initialLogs: LogEntry[] = []
  let initialTotal = 0

  try {
    config = await serverFetch<SchedulerConfig>("/api/v1/scheduler")
  } catch {
    config = null
  }

  try {
    const groupsData = await serverFetch<{ data: TrackerSource[] }>(
      "/api/v1/kpi/?group_type=tracker&page=1&page_size=100"
    )
    initialSources = groupsData.data ?? []
  } catch {
    initialSources = []
  }

  try {
    const logsData = await serverFetch<LogsResponse>(
      `/api/v1/ingest/logs?limit=${INGEST_LOG_PAGE_SIZE}&source_type=kpi_tracker`
    )
    initialLogs = logsData.logs
    initialTotal = logsData.total
  } catch {
    initialLogs = []
    initialTotal = 0
  }

  return (
    <div>
      <PageBreadCrumb pageTitle="KPI Tracker" parents={[{ label: "Ingestion", href: "/ingestion" }]} />
      <div className="flex flex-col gap-6">
        <IngestionGuideCard
          title="Panduan KPI Tracker"
          subtitle="Gunakan sumber tracker per orang agar scheduler dan Run All dapat memproses data dengan benar."
          steps={[
            "Pastikan Spreadsheet telah mengundang email yang terdaftar dengan credential Anda.",
            "Tambahkan source melalui Sheet URL dan isi Tahun sesuai periode tracker.",
            "Aktifkan Include in Scheduler jika ingin source ikut proses otomatis.",
          ]}
        />
        <SchedulerConfigCard initialConfig={config} />
        <TrackerSourcesSection initialSources={initialSources} />
        <IngestionLogsTable initialLogs={initialLogs} initialTotal={initialTotal} fixedFilter="kpi_tracker" />
      </div>
    </div>
  )
}
