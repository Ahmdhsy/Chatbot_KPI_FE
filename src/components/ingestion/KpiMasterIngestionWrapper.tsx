"use client"

import React, { useRef, useState } from "react"
import KpiMasterIngestionModal from "./KpiMasterIngestionModal"
import KpiMasterManagementTable, {
	KpiMasterGroup,
} from "./KpiMasterManagementTable"

interface KpiMasterManagementResponse {
	total: number
	page: number
	page_size: number
	total_pages: number
	data: KpiMasterGroup[]
}

interface Props {
	initialData: KpiMasterManagementResponse
	onAnyChange?: () => void
}

export interface KpiMasterManagementTableHandle {
	refreshData: () => Promise<void>
}

export default function KpiMasterIngestionWrapper({ initialData, onAnyChange }: Props) {
	const tableRef = useRef<KpiMasterManagementTableHandle>(null)
	const [refreshKey, setRefreshKey] = useState(0)

	const handleIngestionSuccess = async () => {
		if (tableRef.current?.refreshData) {
			await tableRef.current.refreshData()
		} else {
			setRefreshKey((prev) => prev + 1)
		}
		onAnyChange?.()
	}

	return (
		<>
			<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
						Manajemen KPI Master
					</h3>
					<p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
						Kelola sumber data KPI Master yang telah diingest.
					</p>
				</div>
				<KpiMasterIngestionModal onSuccess={handleIngestionSuccess} />
			</div>
			<KpiMasterManagementTable
				key={refreshKey}
				ref={tableRef}
				initialData={initialData}
				onDataChange={onAnyChange}
			/>
		</>
	)
}
