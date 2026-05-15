"use client";

import React, { useEffect, useState } from "react";
import { Chatbot, getChatbotById } from "@/services/chatbotService";

interface ChatbotDetailDrawerProps {
  isOpen: boolean;
  chatbotId: string | null;
  onClose: () => void;
}

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

function getAuthorityBadgeColor(authority: Chatbot["authority"]): string {
  switch (authority) {
    case "kepala_divisi":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200";
    case "karyawan":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
}

function getStatusBadgeColor(isActive: boolean): string {
  return isActive
    ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
}

function formatAuthorityLabel(authority: Chatbot["authority"]): string {
  if (authority === "kepala_divisi") return "Kepala Divisi";
  if (authority === "karyawan") return "Karyawan";
  return authority;
}

export default function ChatbotDetailDrawer({
  isOpen,
  chatbotId,
  onClose,
}: ChatbotDetailDrawerProps) {
  const [data, setData] = useState<Chatbot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 320);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !chatbotId) return;
    setData(null);
    setError(false);
    setLoading(true);
    let cancelled = false;
    getChatbotById(chatbotId)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, chatbotId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-stretch justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chatbot-drawer-title"
        className={`relative z-10 flex h-full w-[560px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 transition-all duration-300 ease-out dark:bg-gray-900 dark:ring-white/10 ${
          visible ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
        }`}
      >
        {/* Accent */}
        <div className="h-[3px] flex-shrink-0 bg-gradient-to-r from-brand-500 via-brand-400 to-blue-400" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
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
                  d="M9 3.75h6a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0115 18.75H9A2.25 2.25 0 016.75 16.5V6A2.25 2.25 0 019 3.75z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 7.5h4.5M9.75 11.25h4.5M9.75 15h2.25"
                />
              </svg>
            </div>
            <div>
              <h2
                id="chatbot-drawer-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                Chatbot Detail
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-[5px] border-brand-500 border-t-transparent" />
            </div>
          )}

          {error && !loading && (
            <p className="text-center text-base text-red-500 dark:text-red-400 py-12">
              Gagal memuat data. Coba tutup dan buka kembali.
            </p>
          )}

          {data && !loading && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 dark:border-gray-800 dark:bg-gray-800/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Nama Chatbot
                    </p>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                      {data.chatbot_name}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-medium ${getStatusBadgeColor(data.is_active)}`}>
                    <span className={`h-2 w-2 rounded-full ${data.is_active ? "bg-green-500" : "bg-gray-400"}`} />
                    {data.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`inline-flex items-center rounded-full px-4 py-2 text-base font-medium ${getAuthorityBadgeColor(data.authority)}`}>
                    {formatAuthorityLabel(data.authority)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-base font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Addon Prompt
                </p>
                {data.addon_prompt ? (
                  <pre className="mt-2 whitespace-pre-wrap rounded-2xl border border-gray-200 bg-white p-4 text-base text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 font-mono">
                    {data.addon_prompt}
                  </pre>
                ) : (
                  <p className="mt-2 text-lg text-gray-400 dark:text-gray-500">—</p>
                )}
              </div>

              <div className="grid gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-lg text-gray-700 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-base uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Created At
                  </span>
                  <span className="font-medium">{formatDateTime(data.created_at)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Updated At
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
