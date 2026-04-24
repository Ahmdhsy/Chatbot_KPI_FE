import PageBreadCrumb from "@/components/common/PageBreadCrumb"
import KpiMasterManagementTable, { KpiMasterGroup } from "@/components/ingestion/KpiMasterManagementTable"
import IngestionLogsTable from "@/components/ingestion/IngestionLogsTable"
import SummaryCard from "@/components/ingestion/SummaryCard"
import KpiMasterIngestionModal from "@/components/ingestion/KpiMasterIngestionModal"
import { INGEST_LOG_PAGE_SIZE } from "@/lib/ingestionConstants"
import { serverFetch } from "@/lib/server-api"
import { LogEntry } from "@/hooks/useIngestion"

const DatabaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
)

const ArrowDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
)

function formatDate(value: string | undefined): string {
  if (!value) return "—"
  const d = new Date(value)
  if (isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(d)
}

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
      `/api/v1/ingest/logs?limit=${INGEST_LOG_PAGE_SIZE}&group_type=master`
    )
    initialLogs = logsData.logs
    initialTotal = logsData.total
  } catch {
    initialLogs = []
    initialTotal = 0
  }

  try {
    initialManagement = await serverFetch<KpiMasterManagementResponse>(
      "/api/v1/kpi/?group_type=master&page=1&page_size=10"
    )
  } catch {
    initialManagement = { total: 0, page: 1, page_size: 10, total_pages: 1, data: [] }
  }

  const latestLog = initialLogs[0]

  return (
    <div>
      <PageBreadCrumb pageTitle="KPI Master" parents={[{ label: "Ingestion", href: "/ingestion" }]} />
      <div className="flex flex-col gap-8">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Total Sources"
            value={initialManagement.total || "—"}
            icon={<DatabaseIcon />}
          />
          <SummaryCard
            title="Last Ingested"
            value={formatDate(latestLog?.created_at)}
            icon={<CalendarIcon />}
          />
          <SummaryCard
            title="Records Ingested"
            value={latestLog?.ingested ?? "—"}
            icon={<ArrowDownIcon />}
          />
        </div>

        {/* Management Section */}
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
                KPI Master Management
              </h3>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                Kelola sumber data KPI Master yang telah diingest.
              </p>
            </div>
            <KpiMasterIngestionModal />
          </div>
          <KpiMasterManagementTable initialData={initialManagement} />
        </div>

        {/* Ingestion Logs */}
        <IngestionLogsTable
          initialLogs={initialLogs}
          initialTotal={initialTotal}
          fixedFilter="kpi_master"
          hidePersonColumn
        />
      </div>
    </div>
  )
}
