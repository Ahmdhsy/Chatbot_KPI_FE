export interface SchedulerConfig {
  id: string;
  sheet_urls: string[];
  interval_value: number;
  interval_unit: string;
  is_enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
}
