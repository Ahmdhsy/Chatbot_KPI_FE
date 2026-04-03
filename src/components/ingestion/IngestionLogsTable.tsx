"use client";
import React, { useEffect, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/tables/Pagination";
import { LogEntry } from "@/hooks/useIngestion";

type FilterType = "all" | "kpi_tracker" | "kpi_master";

interface Props {
  fetchLogs: (
    sourceType?: "kpi_tracker" | "kpi_master",
    limit?: number,
  ) => Promise<{ total: number; logs: LogEntry[] }>;
  refreshKey: number;
}

const PAGE_SIZE = 10;

export default function IngestionLogsTable({ fetchLogs, refreshKey }: Props) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [filter, refreshKey]);

  useEffect(() => {
    setLoading(true);
    const sourceType = filter === "all" ? undefined : filter;
    fetchLogs(sourceType, PAGE_SIZE * page)
      .then((data) => {
        setLogs(data.logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
        setTotal(data.total);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [filter, page, refreshKey, fetchLogs]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statusColor = (status: string) => {
    if (status === "success") return "success";
    if (status === "partial") return "warning";
    return "error";
  };

  const typeColor = (type: string) =>
    type === "kpi_master" ? "info" : "primary";

  const TABS: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "KPI Tracker", value: "kpi_tracker" },
    { label: "KPI Master", value: "kpi_master" },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-white/[0.05]">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Ingestion Logs
        </h3>
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filter === tab.value
                  ? "bg-brand-500 text-white"
                  : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.05]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              {["Date", "Type", "Sheet Name", "Person", "Total", "Ingested", "Failed", "Status"].map(
                (h) => (
                  <TableCell
                    key={h}
                    isHeader
                    className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    {h}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {loading ? (
              <TableRow>
                <TableCell className="px-5 py-4 text-center text-sm text-gray-400" colSpan={8}>
                  Loading…
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell className="px-5 py-4 text-center text-sm text-gray-400" colSpan={8}>
                  No logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="px-5 py-3">
                    <Badge size="sm" color={typeColor(log.source_type)}>
                      {log.source_type === "kpi_master" ? "KPI Master" : "KPI Tracker"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                    {log.sheet_name ?? "—"}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                    {log.nama_orang ?? "—"}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                    {log.total_rows}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                    {log.ingested}
                  </TableCell>
                  <TableCell className="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-400">
                    {log.failed}
                  </TableCell>
                  <TableCell className="px-5 py-3">
                    <Badge size="sm" color={statusColor(log.status)}>
                      {log.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end border-t border-gray-100 px-6 py-3 dark:border-white/[0.05]">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
