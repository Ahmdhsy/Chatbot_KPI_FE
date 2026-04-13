export interface SchedulerConfig {
  id: string;
  interval_value: number;
  interval_unit: "hours" | "days" | "weeks" | "months";
  is_enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
}
