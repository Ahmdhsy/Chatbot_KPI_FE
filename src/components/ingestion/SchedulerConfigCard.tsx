"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Badge from "@/components/ui/badge/Badge"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import Select from "@/components/form/Select"
import Switch from "@/components/form/switch/Switch"
import { SchedulerConfig } from "@/hooks/useScheduler"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

function getAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

interface Props {
  initialConfig: SchedulerConfig | null
}

const UNIT_OPTIONS = [
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
]

function formatDatetime(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString()
}

export default function SchedulerConfigCard({ initialConfig }: Props) {
  const router = useRouter()
  const [intervalVal, setIntervalVal] = useState(String(initialConfig?.interval_value ?? 12))
  const [intervalUnit, setIntervalUnit] = useState(initialConfig?.interval_unit ?? "hours")
  const [enabled, setEnabled] = useState(initialConfig?.is_enabled ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null)

  const statusLabel = !initialConfig ? "Not Configured" : initialConfig.is_enabled ? "Active" : "Paused"
  const statusColor = !initialConfig ? "light" : initialConfig.is_enabled ? "success" : "warning"

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setTriggerMsg(null)
    try {
      const method = initialConfig ? "PATCH" : "POST"
      const res = await fetch(`${API_BASE}/api/v1/scheduler`, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({
          interval_value: parseInt(intervalVal, 10) || 12,
          interval_unit: intervalUnit,
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
      setTriggerMsg(data.message)
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

      <div className="mb-4 flex gap-3">
        <div className="w-28">
          <Label htmlFor="sched-interval-val">Interval</Label>
          <Input
            id="sched-interval-val"
            type="number"
            min="1"
            value={intervalVal}
            onChange={(e) => setIntervalVal(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="sched-unit">Unit</Label>
          <Select options={UNIT_OPTIONS} defaultValue={intervalUnit} onChange={setIntervalUnit} />
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
