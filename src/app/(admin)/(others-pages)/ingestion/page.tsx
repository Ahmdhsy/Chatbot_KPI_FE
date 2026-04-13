import PageBreadCrumb from "@/components/common/PageBreadCrumb"
import SchedulerConfigCard from "@/components/ingestion/SchedulerConfigCard"
import KpiTrackerIngestionCard from "@/components/ingestion/KpiTrackerIngestionCard"
import KpiMasterIngestionCard from "@/components/ingestion/KpiMasterIngestionCard"
import IngestionLogsTable, { PAGE_SIZE } from "@/components/ingestion/IngestionLogsTable"
import { serverFetch } from "@/lib/server-api"
import { SchedulerConfig } from "@/hooks/useScheduler"
import { LogEntry } from "@/hooks/useIngestion"

interface LogsResponse {
  total: number
  logs: LogEntry[]
}

export default async function IngestionPage() {
  let config: SchedulerConfig | null = null
  let initialLogs: LogEntry[] = []
  let initialTotal = 0

  try {
    config = await serverFetch<SchedulerConfig>("/api/v1/scheduler")
  } catch {
    // 404 means no config yet — that's fine
    config = null
  }

  try {
    const logsData = await serverFetch<LogsResponse>(`/api/v1/ingest/logs?limit=${PAGE_SIZE}`)
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

        {/* ── KPI Tracker ─────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            KPI Tracker
          </h2>
          <div className="flex flex-col gap-4">
            <SchedulerConfigCard initialConfig={config} />
            <KpiTrackerIngestionCard />
          </div>
        </section>

        {/* ── KPI Master ──────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            KPI Master
          </h2>
          <KpiMasterIngestionCard />
        </section>

        {/* ── Logs ────────────────────────────────────────────── */}
        <IngestionLogsTable initialLogs={initialLogs} initialTotal={initialTotal} />

      </div>
    </div>
  )
}
