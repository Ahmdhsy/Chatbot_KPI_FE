"use client";
import React, { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { IngestionResult } from "@/hooks/useIngestion";

interface Props {
  onIngest: (url: string, tahun: number) => Promise<void>;
  loading: boolean;
  result: IngestionResult | null;
  error: string | null;
}

export default function KpiMasterIngestionCard({ onIngest, loading, result, error }: Props) {
  const [url, setUrl] = useState("");
  const [tahun, setTahun] = useState("");

  const tahunNum = parseInt(tahun, 10);
  const isValidTahun = !isNaN(tahunNum) && tahun.trim() === String(tahunNum) && tahunNum >= 2001 && tahunNum <= new Date().getFullYear() + 1;
  const canSubmit = !loading && url.trim() !== "" && isValidTahun;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onIngest(url, tahunNum);
    setUrl("");
    setTahun("");
  };

  const statusColor = result
    ? result.status === "success"
      ? "success"
      : result.status === "partial"
      ? "warning"
      : "error"
    : "primary";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
      <h3 className="mb-1 text-base font-semibold text-gray-800 dark:text-white/90">
        KPI Master — Manual Ingestion
      </h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Upserts KPI Master records for the given year. Data tahun lain tidak terpengaruh.
      </p>

      <div className="mb-4">
        <Label htmlFor="master-url">Google Sheet URL</Label>
        <Input
          id="master-url"
          value={url}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <Label htmlFor="master-tahun">Tahun</Label>
        <Input
          id="master-tahun"
          value={tahun}
          placeholder="2024"
          type="number"
          onChange={(e) => setTahun(e.target.value)}
        />
      </div>

      <Button onClick={handleSubmit} disabled={!canSubmit}>
        {loading ? "Ingesting…" : "Ingest Master"}
      </Button>

      {error && <p className="mt-3 text-sm text-error-500">{error}</p>}

      {result && (
        <div className="mt-4 flex items-center gap-3">
          <Badge size="sm" color={statusColor}>
            {result.status}
          </Badge>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {result.ingested} records ingested
          </span>
        </div>
      )}
    </div>
  );
}
