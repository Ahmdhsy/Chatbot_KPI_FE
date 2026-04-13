"use client";
import { useCallback } from "react";

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

  return { fetchLogs };
}
