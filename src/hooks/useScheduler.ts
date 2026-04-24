export interface SchedulerConfig {
  id: string;
  interval_value: string;  // ISO datetime — only UTC day + hour used for schedule
  is_enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
}
