import PageBreadCrumb from "@/components/common/PageBreadCrumb"
import SchedulerConfigCard from "@/components/ingestion/SchedulerConfigCard"
import TrackerSourcesSection from "@/components/ingestion/TrackerSourcesSection"
import IngestionLogsTable from "@/components/ingestion/IngestionLogsTable"
import SummaryCard from "@/components/ingestion/SummaryCard"
import { INGEST_LOG_PAGE_SIZE } from "@/lib/ingestionConstants"
import { serverFetch } from "@/lib/server-api"
import { SchedulerConfig } from "@/hooks/useScheduler"
import { TrackerSource } from "@/hooks/useTrackerSources"
import { LogEntry } from "@/hooks/useIngestion"

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
)

const BoltIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
)

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—"
  const d = new Date(value)
  if (isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(d)
}

interface LogsResponse {
  total: number
  logs: LogEntry[]
}

interface KpiTrackerGroupListResponse {
  total: number
  page: number
  limit: number
  total_pages: number
  data: TrackerSource[]
}

export default async function KpiTrackerIngestionPage() {
  let config: SchedulerConfig | null = null
  let initialSourcesData: KpiTrackerGroupListResponse = { total: 0, page: 1, limit: 10, total_pages: 1, data: [] }
  let initialLogs: LogEntry[] = []
  let initialTotal = 0

  try {
    config = await serverFetch<SchedulerConfig>("/api/v1/scheduler")
  } catch {
    config = null
  }

  try {
    const groupsData = await serverFetch<KpiTrackerGroupListResponse>(
      "/api/v1/kpi/?group_type=tracker&page=1&limit=10"
    )
    initialSourcesData = groupsData
  } catch {
    initialSourcesData = { total: 0, page: 1, limit: 10, total_pages: 1, data: [] }
  }

  try {
    const logsData = await serverFetch<LogsResponse>(
      `/api/v1/ingest/logs?limit=${INGEST_LOG_PAGE_SIZE}&group_type=tracker`
    )
    initialLogs = logsData.logs
    initialTotal = logsData.total
  } catch {
    initialLogs = []
    initialTotal = 0
  }

  const schedulerEnabled = config?.is_enabled

  return (
    <div>
      <PageBreadCrumb pageTitle="KPI Tracker" parents={[{ label: "Ingestion", href: "/ingestion" }]} />
      <div className="flex flex-col gap-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Total Sumber"
            value={initialSourcesData.total}
            icon={<UsersIcon />}
          />
          <SummaryCard
            title="Status Penjadwal"
            value={schedulerEnabled == null ? "—" : schedulerEnabled ? "Aktif" : "Nonaktif"}
            icon={<BoltIcon />}
            badge={
              schedulerEnabled != null
                ? {
                    label: schedulerEnabled ? "Aktif" : "Nonaktif",
                    color: schedulerEnabled ? "success" : "warning",
                  }
                : undefined
            }
          />
          <SummaryCard
            title="Eksekusi Berikutnya"
            value={formatDateTime(config?.next_run_at)}
            icon={<CalendarIcon />}
          />
        </div>

        <SchedulerConfigCard initialConfig={config} />
        <TrackerSourcesSection initialData={initialSourcesData} />
        <IngestionLogsTable
          initialLogs={initialLogs}
          initialTotal={initialTotal}
          fixedFilter="kpi_tracker"
        />
      </div>
    </div>
  )
}
