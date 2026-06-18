import { notFound } from "next/navigation"
import Link from "next/link"
import PageBreadCrumb from "@/components/common/PageBreadCrumb"
import SummaryCard from "@/components/ingestion/SummaryCard"
import { serverFetch } from "@/lib/server-api"

// ─── Types ────────────────────────────────────────────────────────────────────

interface PICUser {
  id: string
  full_name: string
}

interface MasterRecord {
  id: string
  tahun: number
  category: string
  kpi_name: string
  definisi_operasional: string | null
  target: string | null
  achieve: string | null
  partial: string | null
  fail: string | null
  responsibility_persons: PICUser[]
  created_at: string
}

interface TrackerRecord {
  id: string
  tahun: number
  bulan_num: number | null
  realisasi: string | null
  responsibility_person: PICUser | null
  keterangan: string | null
  created_at: string
  updated_at: string
}

interface KPIGroupDetail {
  id: string
  nama_grup: string
  group_type: "master" | "tracker"
  sheet_url: string
  sheet_id: string | null
  tahun: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  master_records: MasterRecord[]
  tracker_records: TrackerRecord[]
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const LayersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3" />
  </svg>
)

const TableCellsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375Z" />
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
)

const BoltIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
  </svg>
)

const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
  </svg>
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  const d = new Date(value)
  if (isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(d)
}

const BULAN = ["—", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

function getBulan(num: number | null): string {
  if (num === null || num < 1 || num > 12) return "—"
  return BULAN[num]
}

function truncateUrl(url: string, max = 72): string {
  if (!url) return "—"
  return url.length > max ? `${url.slice(0, max)}…` : url
}

// ─── Master Records Table ─────────────────────────────────────────────────────

function MasterRecordsTable({ records }: { records: MasterRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/[0.03]">
        <div className="px-6 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
          Belum ada data KPI Master.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/[0.03]">
      <div className="border-b border-gray-100 px-6 py-4 dark:border-white/5">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Data KPI</h3>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{records.length} data</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-gray-100 text-left text-sm font-semibold uppercase tracking-wider text-gray-400 dark:border-white/5 dark:text-gray-500">
              <th className="px-6 py-3 font-semibold">Nama KPI</th>
              <th className="px-6 py-3 font-semibold">Kategori</th>
              <th className="px-6 py-3 font-semibold">Tahun</th>
              <th className="px-6 py-3 font-semibold">Target</th>
              <th className="px-6 py-3 font-semibold">Tercapai</th>
              <th className="px-6 py-3 font-semibold">Parsial</th>
              <th className="px-6 py-3 font-semibold">Gagal</th>
              <th className="px-6 py-3 font-semibold">PIC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-white/5">
            {records.map((r) => (
              <tr key={r.id} className="text-gray-700 hover:bg-gray-50 dark:text-white/80 dark:hover:bg-white/[0.02]">
                <td className="px-6 py-3 font-medium">{r.kpi_name}</td>
                <td className="px-6 py-3">
                  <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                    {r.category}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-500">{r.tahun}</td>
                <td className="px-6 py-3 text-gray-500">{r.target ?? "—"}</td>
                <td className="px-6 py-3 text-gray-500">{r.achieve ?? "—"}</td>
                <td className="px-6 py-3 text-gray-500">{r.partial ?? "—"}</td>
                <td className="px-6 py-3 text-gray-500">{r.fail ?? "—"}</td>
                 <td className="px-6 py-3 text-sm text-gray-400">{r.responsibility_persons.length ? r.responsibility_persons.map(u => u.full_name).join(", ") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Tracker Records Table ────────────────────────────────────────────────────

function TrackerRecordsTable({ records }: { records: TrackerRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/[0.03]">
        <div className="px-6 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
          Belum ada data KPI Tracker.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/[0.03]">
      <div className="border-b border-gray-100 px-6 py-4 dark:border-white/5">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Data Tracker</h3>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{records.length} data</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="border-b border-gray-100 text-left text-sm font-semibold uppercase tracking-wider text-gray-400 dark:border-white/5 dark:text-gray-500">
              <th className="px-6 py-3 font-semibold">PIC</th>
              <th className="px-6 py-3 font-semibold">Tahun</th>
              <th className="px-6 py-3 font-semibold">Bulan</th>
              <th className="px-6 py-3 font-semibold">Realisasi</th>
              <th className="px-6 py-3 font-semibold">Keterangan</th>
              <th className="px-6 py-3 font-semibold">Terakhir Diperbarui</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-white/5">
            {[...records].sort((a, b) => (a.tahun - b.tahun) || ((a.bulan_num ?? 0) - (b.bulan_num ?? 0))).map((r) => (
              <tr key={r.id} className="text-gray-700 hover:bg-gray-50 dark:text-white/80 dark:hover:bg-white/[0.02]">
                <td className="px-6 py-3 font-medium">{r.responsibility_person?.full_name ?? "—"}</td>
                <td className="px-6 py-3 text-gray-500">{r.tahun}</td>
                <td className="px-6 py-3 text-gray-500">{getBulan(r.bulan_num)}</td>
                <td className="px-6 py-3 text-gray-500">{r.realisasi ?? "—"}</td>
                <td className="max-w-xs px-6 py-3 text-sm text-gray-400 truncate" title={r.keterangan ?? undefined}>
                  {r.keterangan ?? "—"}
                </td>
                <td className="px-6 py-3 text-sm text-gray-400">{formatDate(r.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function IngestionDetailPage({
  params,
}: {
  params: Promise<{ group_id: string }>
}) {
  const { group_id } = await params

  let group: KPIGroupDetail

  try {
    group = await serverFetch<KPIGroupDetail>(`/api/v1/kpi/${group_id}`)
  } catch {
    notFound()
  }

  const isMaster = group.group_type === "master"
  const typeLabel = isMaster ? "KPI Master" : "KPI Tracker"
  const typeHref = isMaster ? "/ingestion/kpi-master" : "/ingestion/kpi-tracker"
  const recordCount = isMaster ? group.master_records.length : group.tracker_records.length

  return (
    <div>
      <PageBreadCrumb
        pageTitle={group.nama_grup}
        parents={[
          { label: "Ingestion", href: "/ingestion" },
          { label: typeLabel, href: typeHref },
        ]}
      />

      <div className="flex flex-col gap-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Tipe"
            value={typeLabel}
            icon={<LayersIcon />}
            badge={{ label: typeLabel, color: isMaster ? "primary" : "info" }}
          />
          <SummaryCard
            title="Total Data"
            value={recordCount}
            icon={<TableCellsIcon />}
          />
          <SummaryCard
            title="Tahun"
            value={group.tahun ?? "—"}
            icon={<CalendarIcon />}
          />
          <SummaryCard
            title="Status"
            value={group.is_active ? "Aktif" : "Nonaktif"}
            icon={<BoltIcon />}
            badge={{
              label: group.is_active ? "Aktif" : "Nonaktif",
              color: group.is_active ? "success" : "warning",
            }}
          />
        </div>

        {/* Group Info */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/5 dark:bg-white/[0.03]">
          <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-white/90">
            Informasi Grup
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Nama Grup
              </p>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {group.nama_grup}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Sheet URL
              </p>
              <a
                href={group.sheet_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm font-mono text-brand-500 hover:text-brand-600 hover:underline dark:text-brand-400"
              >
                <LinkIcon />
                {truncateUrl(group.sheet_url)}
              </a>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Dibuat Pada
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {formatDate(group.created_at)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Terakhir Diperbarui
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {formatDate(group.updated_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Records Table */}
        {isMaster ? (
          <MasterRecordsTable records={group.master_records} />
        ) : (
          <TrackerRecordsTable records={group.tracker_records} />
        )}

        {/* Back Link */}
        <div>
          <Link
            href={typeHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white/80"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Kembali ke {typeLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
