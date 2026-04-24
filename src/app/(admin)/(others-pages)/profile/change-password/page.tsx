"use client"

import React, { useState } from "react"
import Link from "next/link"
import axios from "axios"
import { EyeCloseIcon, EyeIcon } from "@/icons"
import Label from "@/components/form/Label"
import PageBreadCrumb from "@/components/common/PageBreadCrumb"
import apiClientWithAuth from "@/services/apiClientWithAuth"

function getMsg(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown })?.detail
    if (typeof detail === "string") return detail
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg)
    return error.message || fallback
  }
  return error instanceof Error ? error.message : fallback
}

export default function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password baru tidak cocok.")
      return
    }
    if (newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.")
      return
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError("Password baru harus mengandung minimal 1 huruf kapital.")
      return
    }
    if (!/\d/.test(newPassword)) {
      setError("Password baru harus mengandung minimal 1 angka.")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await apiClientWithAuth.post("/api/v1/users/me/change-password", {
        old_password: oldPassword,
        new_password: newPassword,
      })
      setSuccess(true)
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setError(getMsg(err, "Gagal mengganti password. Pastikan password lama benar."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageBreadCrumb
        pageTitle="Ganti Password"
        parents={[{ label: "Profile", href: "/profile" }]}
      />

      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/5 dark:bg-white/[0.03] lg:p-8">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Ganti Password
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Pastikan password baru kamu kuat dan berbeda dari yang lama.
            </p>
          </div>

          {success && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-success-100 bg-success-50 px-4 py-3 dark:border-success-500/20 dark:bg-success-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 shrink-0 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <p className="text-sm text-success-700 dark:text-success-400">
                Password berhasil diubah.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-error-100 bg-error-50 px-4 py-3 dark:border-error-500/20 dark:bg-error-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 shrink-0 text-error-600 dark:text-error-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <p className="text-sm text-error-700 dark:text-error-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Old Password */}
            <div>
              <Label htmlFor="cp-old">
                Password Lama <span className="text-error-500">*</span>
              </Label>
              <div className="relative mt-1.5">
                <input
                  id="cp-old"
                  type={showOld ? "text" : "password"}
                  placeholder="Masukkan password saat ini"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  tabIndex={-1}
                >
                  {showOld ? <EyeIcon className="fill-gray-500 dark:fill-gray-400" /> : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 dark:border-white/5" />

            {/* New Password */}
            <div>
              <Label htmlFor="cp-new">
                Password Baru <span className="text-error-500">*</span>
              </Label>
              <div className="relative mt-1.5">
                <input
                  id="cp-new"
                  type={showNew ? "text" : "password"}
                  placeholder="Min. 8 karakter, 1 huruf kapital, 1 angka"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  required
                  minLength={8}
                  className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  tabIndex={-1}
                >
                  {showNew ? <EyeIcon className="fill-gray-500 dark:fill-gray-400" /> : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="cp-confirm">
                Konfirmasi Password Baru <span className="text-error-500">*</span>
              </Label>
              <div className="relative mt-1.5">
                <input
                  id="cp-confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeIcon className="fill-gray-500 dark:fill-gray-400" /> : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />}
                </button>
              </div>
            </div>

            {/* Password requirements hint */}
            <ul className="space-y-1 text-xs text-gray-400 dark:text-gray-500">
              <li className={`flex items-center gap-1.5 ${newPassword.length >= 8 ? "text-success-500" : ""}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  {newPassword.length >= 8
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  }
                </svg>
                Minimal 8 karakter
              </li>
              <li className={`flex items-center gap-1.5 ${/[A-Z]/.test(newPassword) ? "text-success-500" : ""}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  {/[A-Z]/.test(newPassword)
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  }
                </svg>
                Minimal 1 huruf kapital
              </li>
              <li className={`flex items-center gap-1.5 ${/\d/.test(newPassword) ? "text-success-500" : ""}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  {/\d/.test(newPassword)
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  }
                </svg>
                Minimal 1 angka
              </li>
            </ul>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Link
                href="/profile"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Simpan Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
