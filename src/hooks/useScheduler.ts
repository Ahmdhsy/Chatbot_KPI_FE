"use client";
import { useState, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface SchedulerConfig {
  id: string;
  sheet_url: string;
  interval_value: number;
  interval_unit: string;
  is_enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
}

export function useScheduler() {
  const [config, setConfig] = useState<SchedulerConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);

  const saveConfig = useCallback(async (payload: {
    sheet_url: string;
    interval_value: number;
    interval_unit: string;
    is_enabled: boolean;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const method = config ? "PATCH" : "POST";
      const res = await fetch(`${API_BASE}/api/v1/scheduler`, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Save failed");
      setConfig(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [config]);

  const triggerNow = useCallback(async () => {
    setLoading(true);
    setTriggerMsg(null);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/scheduler/trigger`, {
        method: "POST",
        headers: { ...getAuthHeader() },
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Trigger failed");
      const data = await res.json();
      setTriggerMsg(data.message);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  return { config, loading, error, triggerMsg, saveConfig, triggerNow };
}
