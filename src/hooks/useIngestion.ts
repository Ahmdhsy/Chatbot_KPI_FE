"use client";
import { useState, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface IngestionResult {
  status: "success" | "partial" | "failed";
  ingested: number;
  failed: number;
  errors: string[];
  grand_total_rows?: number;
  grand_ingested?: number;
  grand_failed?: number;
}

export interface LogEntry {
  id: string;
  sheet_name: string;
  nama_orang: string | null;
  total_rows: number;
  ingested: number;
  failed: number;
  status: string;
  source_type: string;
  created_at: string;
}

export function useIngestion() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IngestionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ingestKpiMaster = useCallback(async (sheetUrl: string, tahun: number) => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/ingest/kpi-master?sheet_url=${encodeURIComponent(sheetUrl)}&tahun=${tahun}`,
        { method: "POST", headers: { ...getAuthHeader() } }
      );
      if (!res.ok) throw new Error((await res.json()).detail ?? "Ingestion failed");
      const data = await res.json();
      setResult({ status: data.status, ingested: data.ingested, failed: data.failed, errors: data.errors });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (
    sourceType?: "kpi_tracker" | "kpi_master",
    limit = 20,
  ): Promise<{ total: number; logs: LogEntry[] }> => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (sourceType) params.set("source_type", sourceType);
    const res = await fetch(
      `${API_BASE}/api/v1/ingest/logs?${params}`,
      { headers: { ...getAuthHeader() } }
    );
    if (!res.ok) throw new Error("Failed to fetch logs");
    return res.json();
  }, []);

  return { loading, result, error, ingestKpiMaster, fetchLogs };
}
