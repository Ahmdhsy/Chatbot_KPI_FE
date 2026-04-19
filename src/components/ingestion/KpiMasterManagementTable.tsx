"use client"

import React, { useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"

import Label from "@/components/form/Label"
import Input from "@/components/form/input/InputField"
import Pagination from "@/components/tables/Pagination"
import Button from "@/components/ui/button/Button"
import { Modal } from "@/components/ui/modal"
import apiClientWithAuth from "@/services/apiClientWithAuth"

export interface KpiMasterGroup {
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

interface KpiMasterManagementResponse {
	total: number
	page: number
	page_size: number
	total_pages: number
	data: KpiMasterGroup[]
}

interface IngestionResponse {
	status: string
	count: number
	message: string
}

interface Props {
	initialData: KpiMasterManagementResponse
}

function getErrorMessage(error: unknown, fallback: string): string {
	if (axios.isAxiosError(error)) {
		const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail
		if (typeof detail === "string") return detail
		if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
		return error.message || fallback
	}
	return error instanceof Error ? error.message : fallback
}

function formatDate(value: string): string {
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return "-"
	return new Intl.DateTimeFormat("id-ID", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(date)
}

function truncateUrl(url: string, max = 64): string {
	if (!url) return "-"
	return url.length > max ? `${url.slice(0, max)}...` : url
}

export default function KpiMasterManagementTable({ initialData }: Props) {
	const router = useRouter()

	const [rows, setRows] = useState<KpiMasterGroup[]>(initialData.data ?? [])
	const [page, setPage] = useState(initialData.page || 1)
	const [totalPages, setTotalPages] = useState(Math.max(1, initialData.total_pages || 1))
	const [total, setTotal] = useState(initialData.total || 0)
	const [pageSize] = useState(initialData.page_size || 10)

	const [loading, setLoading] = useState(false)
	const [saving, setSaving] = useState(false)
	const [deletingId, setDeletingId] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	const [editing, setEditing] = useState<KpiMasterGroup | null>(null)
	const [editUrl, setEditUrl] = useState("")
	const [editTahun, setEditTahun] = useState("")

	const openEdit = (row: KpiMasterGroup) => {
		setEditing(row)
		setEditUrl(row.sheet_url)
		setEditTahun(row.tahun != null ? String(row.tahun) : "")
		setError(null)
		setSuccess(null)
	}

	const closeEdit = () => {
		setEditing(null)
		setEditUrl("")
		setEditTahun("")
		setError(null)
	}

	const fetchPage = async (targetPage: number) => {
		setLoading(true)
		setError(null)
		try {
			const { data } = await apiClientWithAuth.get<KpiMasterManagementResponse>(
				"/api/v1/ingest/kpi-master/management",
				{
					params: {
						page: targetPage,
						page_size: pageSize,
					},
				},
			)

			setRows(data.data ?? [])
			setPage(data.page || targetPage)
			setTotal(data.total || 0)
			setTotalPages(Math.max(1, data.total_pages || 1))
		} catch (e: unknown) {
			setError(getErrorMessage(e, "Gagal memuat data KPI Master management."))
		} finally {
			setLoading(false)
		}
	}

	const handleSave = async () => {
		if (!editing) return

		const trimmedUrl = editUrl.trim()
		const parsedTahun = editTahun.trim() ? Number.parseInt(editTahun, 10) : null

		const payload: { sheet_url?: string; tahun?: number } = {}
		if (trimmedUrl && trimmedUrl !== editing.sheet_url) {
			payload.sheet_url = trimmedUrl
		}
		if (parsedTahun !== null && parsedTahun !== editing.tahun) {
			payload.tahun = parsedTahun
		}

		if (!payload.sheet_url && payload.tahun === undefined) {
			setError("Tidak ada perubahan. Ubah Sheet URL atau Tahun terlebih dahulu.")
			return
		}

		setSaving(true)
		setError(null)
		setSuccess(null)

		try {
			const { data } = await apiClientWithAuth.put<IngestionResponse>(
				`/api/v1/ingest/kpi-master/management/${editing.id}`,
				payload,
			)

			closeEdit()
			await fetchPage(page)
			setSuccess(`${data.message} (status: ${data.status}, count: ${data.count})`)
			router.refresh()
		} catch (e: unknown) {
			setError(getErrorMessage(e, "Gagal update dan re-ingest KPI Master."))
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async (row: KpiMasterGroup) => {
		const ok = window.confirm(
			`Hapus group \"${row.nama_grup}\" beserta semua data KPI Master terkait? Tindakan ini tidak dapat dibatalkan.`,
		)
		if (!ok) return

		setDeletingId(row.id)
		setError(null)
		setSuccess(null)

		try {
			await apiClientWithAuth.delete(`/api/v1/kpi/${row.id}`)
			if (editing?.id === row.id) {
				closeEdit()
			}

			// Jika item terakhir di page terhapus, mundur 1 halaman bila memungkinkan.
			const nextPage = rows.length === 1 && page > 1 ? page - 1 : page
			await fetchPage(nextPage)
			setSuccess(`KPI Master group \"${row.nama_grup}\" berhasil dihapus.`)
			router.refresh()
		} catch (e: unknown) {
			setError(getErrorMessage(e, "Gagal menghapus KPI Master group."))
		} finally {
			setDeletingId(null)
		}
	}

	return (
		<>
			<div className="rounded-2xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
				<div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/5">
					<div>
						<h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
							KPI Master Management
						</h3>
						<p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
							Edit Sheet URL dan Tahun per group, lalu sistem otomatis re-ingest.
						</p>
					</div>
					<Button variant="outline" size="sm" onClick={() => fetchPage(page)} disabled={loading}>
						{loading ? "Refreshing..." : "Refresh"}
					</Button>
				</div>

				{success && (
					<div className="border-b border-success-100 bg-success-50 px-6 py-2.5 text-sm text-success-700 dark:border-success-500/20 dark:bg-success-500/10 dark:text-success-400">
						{success}
						<button onClick={() => setSuccess(null)} className="ml-3 opacity-60 hover:opacity-100">x</button>
					</div>
				)}

				{error && (
					<div className="border-b border-error-100 bg-error-50 px-6 py-2.5 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400">
						{error}
						<button onClick={() => setError(null)} className="ml-3 opacity-60 hover:opacity-100">x</button>
					</div>
				)}

				{rows.length === 0 ? (
					<div className="px-6 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
						Belum ada KPI Master group yang bisa dikelola.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400 dark:border-white/5">
									<th className="px-6 py-3 font-medium">Nama Grup</th>
									<th className="px-6 py-3 font-medium">Sheet URL</th>
									<th className="px-6 py-3 font-medium">Tahun</th>
									<th className="px-6 py-3 font-medium">Last Update</th>
									<th className="px-6 py-3 font-medium">Aksi</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-50 dark:divide-white/5">
								{rows.map((row) => (
									<tr key={row.id} className="text-gray-700 dark:text-white/80">
										<td className="px-6 py-3 font-medium">{row.nama_grup}</td>
										<td className="px-6 py-3 font-mono text-xs text-gray-400" title={row.sheet_url}>
											{truncateUrl(row.sheet_url)}
										</td>
										<td className="px-6 py-3 text-gray-500">{row.tahun ?? "-"}</td>
										<td className="px-6 py-3 text-xs text-gray-400">{formatDate(row.updated_at)}</td>
										<td className="px-6 py-3">
											<div className="flex items-center gap-3">
												<button
													onClick={() => openEdit(row)}
													className="text-xs font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
												>
													Edit
												</button>
												<button
													onClick={() => handleDelete(row)}
													disabled={deletingId === row.id}
													className="text-xs font-medium text-gray-400 hover:text-error-500 disabled:cursor-not-allowed disabled:opacity-40"
												>
													{deletingId === row.id ? "Deleting..." : "Delete"}
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}

				<div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 dark:border-white/5">
					<p className="text-xs text-gray-400 dark:text-gray-500">
						Total {total} groups
					</p>
					<Pagination currentPage={page} totalPages={totalPages} onPageChange={fetchPage} />
				</div>
			</div>

			<Modal isOpen={!!editing} onClose={closeEdit} className="max-w-md p-6">
				<h4 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white/90">Edit KPI Master Group</h4>
				<p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
					Ubah Sheet URL dan/atau Tahun. Simpan akan memicu re-ingest otomatis.
				</p>

				<div className="flex flex-col gap-4">
					<div>
						<Label htmlFor="edit-master-url">Sheet URL</Label>
						<Input
							id="edit-master-url"
							placeholder="https://docs.google.com/spreadsheets/d/..."
							value={editUrl}
							onChange={(e) => setEditUrl(e.target.value)}
						/>
					</div>

					<div>
						<Label htmlFor="edit-master-tahun">Tahun</Label>
						<Input
							id="edit-master-tahun"
							type="number"
							placeholder="2026"
							value={editTahun}
							onChange={(e) => setEditTahun(e.target.value)}
						/>
					</div>

					<div className="flex items-center justify-between gap-3 pt-1">
						<button
							onClick={() => editing && handleDelete(editing)}
							disabled={!editing || deletingId === editing?.id}
							className="text-sm font-medium text-gray-400 hover:text-error-500 disabled:cursor-not-allowed disabled:opacity-40"
						>
							{deletingId === editing?.id ? "Deleting..." : "Delete"}
						</button>
						<div className="flex gap-3">
							<Button variant="outline" onClick={closeEdit} disabled={saving || deletingId === editing?.id}>Batal</Button>
						<Button onClick={handleSave} disabled={saving || !editing}>
							{saving ? "Menyimpan..." : "Simpan & Re-ingest"}
						</Button>
						</div>
					</div>
				</div>
			</Modal>
		</>
	)
}
