"use client"

import React, { useState } from "react"
import KpiMasterIngestionWrapper from "./KpiMasterIngestionWrapper"
import IngestionLogsTable from "./IngestionLogsTable"
import { LogEntry } from "@/hooks/useIngestion"
import { KpiMasterGroup } from "./KpiMasterManagementTable"

interface KpiMasterManagementResponse {
  total: number
  page: number
  page_size: number
  total_pages: number
  data: KpiMasterGroup[]
}

interface Props {
  initialLogs: LogEntry[]
  initialTotal: number
  initialManagement: KpiMasterManagementResponse
}

export default function KpiMasterPageClient({ initialLogs, initialTotal, initialManagement }: Props) {
  const [logsRefreshKey, setLogsRefreshKey] = useState(0)

  const handleRefresh = () => {
    setLogsRefreshKey((prev) => prev + 1)
  }

  return (
    <>
      <KpiMasterIngestionWrapper initialData={initialManagement} onAnyChange={handleRefresh} />
      <IngestionLogsTable
        initialLogs={initialLogs}
        initialTotal={initialTotal}
        fixedFilter="kpi_master"
        hidePersonColumn
        refreshTrigger={logsRefreshKey}
      />
    </>
  )
}
