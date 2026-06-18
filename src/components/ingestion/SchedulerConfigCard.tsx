"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Badge from "@/components/ui/badge/Badge"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import Switch from "@/components/form/switch/Switch"
import { SchedulerConfig } from "@/hooks/useScheduler"
import { useToast } from "@/context/ToastContext"
import { apiClientWithAuth } from "@/services/apiClientWithAuth"

const WIB_OFFSET_HOURS = 7
const WIB_OFFSET_MS = WIB_OFFSET_HOURS * 60 * 60 * 1000

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
  const { addToast } = useToast()
  const { day: initDay, hour: initHour } = parseIntervalValue(
    initialConfig?.interval_value ?? null
  )
  const [day, setDay] = useState(initDay)
  const [hour, setHour] = useState(initHour)
  const [enabled, setEnabled] = useState(initialConfig?.is_enabled ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null)

  const statusLabel = enabled ? "Aktif" : "Nonaktif"
  const statusColor = enabled ? "success" : "warning"

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setTriggerMsg(null)
    if (day < 1 || day > 28) {
      setError("Hari harus di antara 1 dan 28")
      setLoading(false)
      return
    }
    if (hour < 0 || hour > 23) {
      setError("Jam harus di antara 0 dan 23")
      setLoading(false)
      return
    }
    try {
      await apiClientWithAuth.patch("/api/v1/scheduler", {
        interval_value: buildIntervalValue(day, hour),
        is_enabled: enabled,
      })
      addToast("success", "Konfigurasi scheduler berhasil disimpan.", "Sukses")
      router.refresh()
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? (e instanceof Error ? e.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  const handleTrigger = async () => {
    setLoading(true)
    setTriggerMsg(null)
    setError(null)
    try {
      const { data } = await apiClientWithAuth.post<{ message?: string }>("/api/v1/scheduler/trigger")
      const msg = data.message ?? "Penjadwal berhasil dijalankan secara manual."
      setTriggerMsg(msg)
      addToast("success", msg, "Penjadwal")
      router.refresh()
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(detail ?? (e instanceof Error ? e.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/5 dark:bg-white/3">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Penjadwal Otomatis
        </h3>
        <Badge size="sm" color={statusColor}>{statusLabel}</Badge>
      </div>

      <p className="mb-4 text-xs text-gray-400 dark:text-gray-500">
        Berjalan pada hari ke-{" "}
        <span className="font-medium text-gray-600 dark:text-gray-300">{day}</span>{" "}
        setiap bulan pada pukul{" "}
        <span className="font-medium text-gray-600 dark:text-gray-300">
          {String(hour).padStart(2, "0")}:00 WIB
        </span>
        . Otomatis dinonaktifkan setelah eksekusi bulan Desember.
      </p>

      <div className="mb-4 flex gap-3">
        <div className="w-32">
          <Label htmlFor="sched-day">Hari setiap bulan</Label>
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
          <Label htmlFor="sched-hour">Jam (WIB)</Label>
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
          label="Aktifkan Penjadwal"
          defaultChecked={enabled}
          onChange={setEnabled}
        />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-white/3">
        <div>
          <span className="block text-theme-xs text-gray-500 dark:text-gray-400">Eksekusi Terakhir</span>
          <span className="font-medium text-gray-700 dark:text-white/80">
            {formatDatetime(initialConfig?.last_run_at ?? null)}
          </span>
        </div>
        <div>
          <span className="block text-theme-xs text-gray-500 dark:text-gray-400">Eksekusi Berikutnya</span>
          <span className="font-medium text-gray-700 dark:text-white/80">
            {formatDatetime(initialConfig?.next_run_at ?? null)}
          </span>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-error-500">{error}</p>}
      {triggerMsg && <p className="mb-3 text-sm text-success-500">{triggerMsg}</p>}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Menyimpan…" : "Simpan Jadwal"}
        </Button>
        <Button variant="outline" onClick={handleTrigger} disabled={loading}>
          Jalankan Sekarang
        </Button>
      </div>
    </div>
  )
}
