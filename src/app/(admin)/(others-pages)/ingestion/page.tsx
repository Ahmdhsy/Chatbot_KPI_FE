"use client";
import React, { useCallback, useEffect, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import SchedulerConfigCard from "@/components/ingestion/SchedulerConfigCard";
import KpiMasterIngestionCard from "@/components/ingestion/KpiMasterIngestionCard";
import IngestionLogsTable from "@/components/ingestion/IngestionLogsTable";
import { useIngestion } from "@/hooks/useIngestion";
import { useScheduler } from "@/hooks/useScheduler";

export default function IngestionPage() {
  const {
    loading: ingestLoading,
    result: ingestResult,
    error: ingestError,
    ingestKpiMaster,
    fetchLogs,
  } = useIngestion();

  const {
    config,
    loading: schedLoading,
    error: schedError,
    triggerMsg,
    fetchConfig,
    saveConfig,
    triggerNow,
  } = useScheduler();

  const [logsRefreshKey, setLogsRefreshKey] = useState(0);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleIngestMaster = useCallback(
    async (url: string, tahun: number) => {
      await ingestKpiMaster(url, tahun);
      setLogsRefreshKey((k) => k + 1);
    },
    [ingestKpiMaster]
  );

  const handleTriggerNow = useCallback(async () => {
    await triggerNow();
    setLogsRefreshKey((k) => k + 1);
  }, [triggerNow]);

  const schedulerKey = config
    ? `${config.id}-${config.sheet_url}-${config.interval_value}-${config.interval_unit}-${config.is_enabled}`
    : "new";

  return (
    <div>
      <PageBreadCrumb pageTitle="Ingestion" />
      <div className="flex flex-col gap-6">
        <SchedulerConfigCard
          key={schedulerKey}
          config={config}
          loading={schedLoading}
          error={schedError}
          triggerMsg={triggerMsg}
          onSave={saveConfig}
          onTrigger={handleTriggerNow}
        />

        <KpiMasterIngestionCard
          onIngest={handleIngestMaster}
          loading={ingestLoading}
          result={ingestResult}
          error={ingestError}
        />

        <IngestionLogsTable fetchLogs={fetchLogs} refreshKey={logsRefreshKey} />
      </div>
    </div>
  );
}
