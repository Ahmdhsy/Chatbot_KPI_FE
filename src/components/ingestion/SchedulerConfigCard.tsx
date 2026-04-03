"use client";
import React, { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";
import { SchedulerConfig } from "@/hooks/useScheduler";

interface Props {
  config: SchedulerConfig | null;
  loading: boolean;
  error: string | null;
  triggerMsg: string | null;
  onSave: (payload: {
    sheet_url: string;
    interval_value: number;
    interval_unit: string;
    is_enabled: boolean;
  }) => Promise<void>;
  onTrigger: () => Promise<void>;
}

const UNIT_OPTIONS = [
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
];

function formatDatetime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function SchedulerConfigCard({
  config,
  loading,
  error,
  triggerMsg,
  onSave,
  onTrigger,
}: Props) {
  const [url, setUrl] = useState(config?.sheet_url ?? "");
  const [intervalVal, setIntervalVal] = useState(String(config?.interval_value ?? 12));
  const [intervalUnit, setIntervalUnit] = useState(config?.interval_unit ?? "hours");
  const [enabled, setEnabled] = useState(config?.is_enabled ?? true);

  const statusLabel = !config
    ? "Not Configured"
    : config.is_enabled
    ? "Active"
    : "Paused";

  const statusColor = !config ? "light" : config.is_enabled ? "success" : "warning";

  const handleSave = () => {
    onSave({
      sheet_url: url,
      interval_value: parseInt(intervalVal, 10) || 12,
      interval_unit: intervalUnit,
      is_enabled: enabled,
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/5 dark:bg-white/3">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Scheduler Configuration
        </h3>
        <Badge size="sm" color={statusColor}>
          {statusLabel}
        </Badge>
      </div>

      <div className="mb-4">
        <Label htmlFor="sched-url">Sheet URL</Label>
        <Input
          id="sched-url"
          placeholder="https://docs.google.com/spreadsheets/d/..."
          defaultValue={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      <div className="mb-4 flex gap-3">
        <div className="w-28">
          <Label htmlFor="sched-interval-val">Interval</Label>
          <Input
            id="sched-interval-val"
            type="number"
            min="1"
            defaultValue={intervalVal}
            onChange={(e) => setIntervalVal(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="sched-unit">Unit</Label>
          <Select
            options={UNIT_OPTIONS}
            defaultValue={intervalUnit}
            onChange={setIntervalUnit}
          />
        </div>
      </div>

      <div className="mb-5">
        <Switch
          key={String(config?.is_enabled)}
          label="Enable Scheduler"
          defaultChecked={enabled}
          onChange={setEnabled}
        />
      </div>

      {config && (
        <div className="mb-5 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-white/3">
          <div>
            <span className="block text-gray-500 dark:text-gray-400 text-theme-xs">Last Run</span>
            <span className="font-medium text-gray-700 dark:text-white/80">
              {formatDatetime(config.last_run_at)}
            </span>
          </div>
          <div>
            <span className="block text-gray-500 dark:text-gray-400 text-theme-xs">Next Run</span>
            <span className="font-medium text-gray-700 dark:text-white/80">
              {formatDatetime(config.next_run_at)}
            </span>
          </div>
        </div>
      )}

      {error && <p className="mb-3 text-sm text-error-500">{error}</p>}
      {triggerMsg && <p className="mb-3 text-sm text-success-500">{triggerMsg}</p>}

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={loading || !url}>
          {loading ? "Saving…" : "Save Scheduler"}
        </Button>
        {config && (
          <Button variant="outline" onClick={onTrigger} disabled={loading}>
            Run Now
          </Button>
        )}
      </div>
    </div>
  );
}
