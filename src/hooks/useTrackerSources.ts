/** KPI Group dengan group_type="tracker" — digunakan sebagai tracker source */
export interface TrackerSource {
  id: string
  nama_grup: string
  group_type: string
  sheet_url: string
  sheet_id: string | null
  sheet_name: string | null
  tahun: number | null
  is_scheduled: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}