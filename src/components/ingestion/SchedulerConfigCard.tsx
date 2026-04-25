"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Badge from "@/components/ui/badge/Badge"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import Switch from "@/components/form/switch/Switch"
import { SchedulerConfig } from "@/hooks/useScheduler"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const WIB_OFFSET_HOURS = 7
const WIB_OFFSET_MS = WIB_OFFSET_HOURS * 60 * 60 * 1000

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

interface Props {
  initialConfig: SchedulerConfig | null
}

function parseIntervalValue(iso: string | null): { day: number; hour: number } {
  if (!iso) return { day: 1, hour: 0 }
  const utcDate = new Date(iso)
  const wibDate = new Date(utcDate.getTime() + WIB_OFFSET_MS)
  return { day: wibDate.getUTCDate(), hour: wibDate.getUTCHours() }
}

function buildIntervalValue(day: number, hour: number): string {
  const wibDate = new Date(Date.UTC(1900, 0, day, hour, 0, 0))
  const utcDate = new Date(wibDate.getTime() - WIB_OFFSET_MS)
  return utcDate.toISOString()
}

function formatDatetime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour12: false,
  }) + " WIB"
}

export default function SchedulerConfigCard({ initialConfig }: Props) {
  const router = useRouter()
  const { day: initDay, hour: initHour } = parseIntervalValue(
    initialConfig?.interval_value ?? null
  )
  const [day, setDay] = useState(initDay)
  const [hour, setHour] = useState(initHour)
  const [enabled, setEnabled] = useState(initialConfig?.is_enabled ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null)

  const statusLabel = !initialConfig
    ? "Not Configured"
    : initialConfig.is_enabled
    ? "Active"
    : "Paused"
  const statusColor = !initialConfig
    ? "light"
    : initialConfig.is_enabled
    ? "success"
    : "warning"

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setTriggerMsg(null)
    if (day < 1 || day > 28) {
      setError("Day must be between 1 and 28")
      setLoading(false)
      return
    }
    if (hour < 0 || hour > 23) {
      setError("Hour must be between 0 and 23")
      setLoading(false)
      return
    }
    try {
      const method = initialConfig ? "PATCH" : "POST"
      const res = await fetch(`${API_BASE}/api/v1/scheduler`, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({
          interval_value: buildIntervalValue(day, hour),
          is_enabled: enabled,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).detail ?? "Save failed")
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const handleTrigger = async () => {
    setLoading(true)
    setTriggerMsg(null)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/v1/scheduler/trigger`, {
        method: "POST",
        headers: { ...getAuthHeader() },
      })
      if (!res.ok) throw new Error((await res.json()).detail ?? "Trigger failed")
      const data = await res.json()
      setTriggerMsg(data.message ?? "Triggered successfully")
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/5 dark:bg-white/3">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Auto Scheduler
        </h3>
        <Badge size="sm" color={statusColor}>{statusLabel}</Badge>
      </div>

      <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
        Runs on day{" "}
        <span className="font-medium text-gray-600 dark:text-gray-300">{day}</span>{" "}
        of every month at{" "}
        <span className="font-medium text-gray-600 dark:text-gray-300">
          {String(hour).padStart(2, "0")}:00 WIB
        </span>
        . Auto-pauses after the December run.
      </p>

      <div className="mb-4 flex gap-3">
        <div className="w-32">
          <Label htmlFor="sched-day">Day of month</Label>
          <Input
            id="sched-day"
            type="number"
            min="1"
            max="28"
            value={String(day)}
            onChange={(e) => setDay(Math.min(28, Math.max(1, parseInt(e.target.value, 10) || 1)))}
          />
        </div>
        <div className="w-32">
          <Label htmlFor="sched-hour">Hour (WIB)</Label>
          <Input
            id="sched-hour"
            type="number"
            min="0"
            max="23"
            value={String(hour)}
            onChange={(e) => setHour(Math.min(23, Math.max(0, parseInt(e.target.value, 10) || 0)))}
          />
        </div>
      </div>

      <div className="mb-5">
        <Switch
          key={String(initialConfig?.is_enabled)}
          label="Enable Scheduler"
          defaultChecked={enabled}
          onChange={setEnabled}
        />
      </div>

      {initialConfig && (
        <div className="mb-5 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-white/3">
          <div>
            <span className="block text-theme-xs text-gray-500 dark:text-gray-400">Last Run</span>
            <span className="font-medium text-gray-700 dark:text-white/80">
              {formatDatetime(initialConfig.last_run_at)}
            </span>
          </div>
          <div>
            <span className="block text-theme-xs text-gray-500 dark:text-gray-400">Next Run</span>
            <span className="font-medium text-gray-700 dark:text-white/80">
              {formatDatetime(initialConfig.next_run_at)}
            </span>
          </div>
        </div>
      )}

      {error && <p className="mb-3 text-sm text-error-500">{error}</p>}
      {triggerMsg && <p className="mb-3 text-sm text-success-500">{triggerMsg}</p>}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving…" : "Save Scheduler"}
        </Button>
        {initialConfig && (
          <Button variant="outline" onClick={handleTrigger} disabled={loading}>
            Run Now
          </Button>
        )}
      </div>
    </div>
  )
}
