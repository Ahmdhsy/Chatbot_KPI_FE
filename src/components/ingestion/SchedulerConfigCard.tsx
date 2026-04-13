"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Badge from "@/components/ui/badge/Badge"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import Select from "@/components/form/Select"
import Switch from "@/components/form/switch/Switch"
import { SchedulerConfig } from "@/hooks/useScheduler"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const MAX_URLS = 20

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
  const [urls, setUrls] = useState<string[]>(
    initialConfig?.sheet_urls?.length ? initialConfig.sheet_urls : [""]
  )
  const [intervalVal, setIntervalVal] = useState(String(initialConfig?.interval_value ?? 12))
  const [intervalUnit, setIntervalUnit] = useState(initialConfig?.interval_unit ?? "hours")
  const [enabled, setEnabled] = useState(initialConfig?.is_enabled ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null)

  const validUrls = urls.filter((u) => u.trim() !== "")
  const statusLabel = !initialConfig ? "Not Configured" : initialConfig.is_enabled ? "Active" : "Paused"
  const statusColor = !initialConfig ? "light" : initialConfig.is_enabled ? "success" : "warning"

  const handleUrlChange = (index: number, value: string) => {
    setUrls((prev) => prev.map((u, i) => (i === index ? value : u)))
  }

  const handleAddUrl = () => {
    if (urls.length < MAX_URLS) setUrls((prev) => [...prev, ""])
  }

  const handleRemoveUrl = (index: number) => {
    if (urls.length === 1) {
      setUrls([""])
    } else {
      setUrls((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const handleSave = async () => {
    if (validUrls.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const method = initialConfig ? "PATCH" : "POST"
      const res = await fetch(`${API_BASE}/api/v1/scheduler`, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({
          sheet_urls: validUrls,
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

      <div className="mb-4 flex flex-col gap-2">
        {urls.map((url, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1">
              {index === 0 && <Label htmlFor="sched-url-0">Sheet URL(s)</Label>}
              <Input
                id={`sched-url-${index}`}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={url}
                onChange={(e) => handleUrlChange(index, e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemoveUrl(index)}
              className="mb-0.5 flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-error-300 hover:text-error-500 dark:border-white/10 dark:hover:border-error-400"
              aria-label="Remove URL"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-3">
        {urls.length < MAX_URLS && (
          <button
            type="button"
            onClick={handleAddUrl}
            className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
          >
            + Add URL
          </button>
        )}
        <span className="text-sm text-gray-400 dark:text-gray-500">
          {validUrls.length} / {MAX_URLS} URLs
        </span>
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
            <span className="block text-gray-500 dark:text-gray-400 text-theme-xs">Last Run</span>
            <span className="font-medium text-gray-700 dark:text-white/80">
              {formatDatetime(initialConfig.last_run_at)}
            </span>
          </div>
          <div>
            <span className="block text-gray-500 dark:text-gray-400 text-theme-xs">Next Run</span>
            <span className="font-medium text-gray-700 dark:text-white/80">
              {formatDatetime(initialConfig.next_run_at)}
            </span>
          </div>
        </div>
      )}

      {error && <p className="mb-3 text-sm text-error-500">{error}</p>}
      {triggerMsg && <p className="mb-3 text-sm text-success-500">{triggerMsg}</p>}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={loading || validUrls.length === 0}>
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
