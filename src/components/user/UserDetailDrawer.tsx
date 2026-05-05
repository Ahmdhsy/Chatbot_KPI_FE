"use client";

import React, { useEffect, useState } from "react";
import { User, getUserById } from "@/services/userService";

function formatDateTime(dateString: string): string {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRoleBadgeColor(role: User["role"]): string {
  switch (role) {
    case "admin":
      return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
    case "kepala_divisi":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300";
    case "karyawan":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  }
}

function formatRoleLabel(role: User["role"]): string {
  if (role === "kepala_divisi") return "Kepala Divisi";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function getStatusDotColor(isActive: boolean): string {
  return isActive ? "bg-green-500" : "bg-gray-400";
}

function getStatusBadgeColor(isActive: boolean): string {
  return isActive
    ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
}

interface UserDetailDrawerProps {
  isOpen: boolean;
  userId: string | null;
  onClose: () => void;
}

function Row({
  label,
  value,
  mono,
  small,
}: {
  label: string;
  value: string;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span
        className={`text-right ${small ? "text-sm" : "text-base"} font-medium text-gray-900 dark:text-white ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function UserDetailDrawer({
  isOpen,
  userId,
  onClose,
}: UserDetailDrawerProps) {
  const [data, setData] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // Keep mounted for exit animation, then unmount
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 320);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !userId) return;
    setData(null);
    setError(false);
    setLoading(true);
    let cancelled = false;
    getUserById(userId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, userId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-stretch justify-end">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Drawer panel — floating card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-drawer-title"
        className={`relative z-10 flex h-full w-[560px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 transition-all duration-300 ease-out dark:bg-gray-900 dark:ring-white/10 ${
          visible ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
        }`}
      >
        {/* Colored top accent */}
        <div className="h-[3px] flex-shrink-0 bg-gradient-to-r from-brand-500 via-brand-400 to-blue-400" />

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30">
              <svg
                className="h-6 w-6 text-brand-600 dark:text-brand-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </div>
            <div>
              <h2
                id="user-drawer-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                User Detail
              </h2>
              {data && (
                <p className="text-base text-gray-400 dark:text-gray-500">
                  @{data.username}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-[5px] border-brand-500 border-t-transparent" />
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
                <svg
                  className="h-7 w-7 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                Gagal memuat data
              </p>
              <p className="text-sm text-gray-400">
                Coba tutup dan buka kembali.
              </p>
            </div>
          )}

          {data && !loading && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-800/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Nama User
                    </p>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                      {data.full_name}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-medium ${getStatusBadgeColor(data.is_active)}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${getStatusDotColor(data.is_active)}`}
                    />
                    {data.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-4 py-2 text-base font-medium ${getRoleBadgeColor(data.role)}`}
                  >
                    {formatRoleLabel(data.role)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-base font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Kontak
                </p>
                <div className="mt-3 space-y-3 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-base text-gray-700 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-200">
                  <Row label="Email" value={data.email} />
                </div>
              </div>

              <div className="grid gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-lg text-gray-700 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-base uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Dibuat
                  </span>
                  <span className="font-medium">{formatDateTime(data.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Diperbarui
                  </span>
                  <span className="font-medium">{formatDateTime(data.updated_at)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
