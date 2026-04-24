"use client"

import React, { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { EyeCloseIcon, EyeIcon } from "@/icons"
import Label from "@/components/form/Label"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

function getMsg(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>
    const detail = e.detail
    if (typeof detail === "string") return detail
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg)
    if (typeof e.message === "string") return e.message
  }
  return fallback
}

// ─── Step 1: Email ─────────────────────────────────────────────────────────────

function StepEmail({
  onNext,
}: {
  onNext: (email: string) => void
}) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/v1/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw data
      onNext(email.trim())
    } catch (err) {
      setError(getMsg(err, "Gagal mengirim PIN reset. Coba lagi."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="fp-email">
          Email <span className="text-error-500">*</span>
        </Label>
        <input
          id="fp-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
          className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-error-50 px-4 py-2.5 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Mengirim PIN..." : "Kirim PIN Reset"}
      </button>
    </form>
  )
}

// ─── Step 2: PIN ───────────────────────────────────────────────────────────────

function StepPin({
  email,
  onNext,
}: {
  email: string
  onNext: (resetToken: string) => void
}) {
  const [pin, setPin] = useState(["", "", "", "", "", ""])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (idx: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...pin]
    next[idx] = value.slice(-1)
    setPin(next)
    if (value && idx < 5) {
      inputRefs.current[idx + 1]?.focus()
    }
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!text) return
    e.preventDefault()
    const next = [...pin]
    text.split("").forEach((ch, i) => { next[i] = ch })
    setPin(next)
    inputRefs.current[Math.min(text.length, 5)]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pinStr = pin.join("")
    if (pinStr.length < 6) {
      setError("Masukkan 6 digit PIN.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/v1/users/verify-reset-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin: pinStr }),
      })
      const data = await res.json()
      if (!res.ok) throw data
      onNext(data.reset_token as string)
    } catch (err) {
      setError(getMsg(err, "PIN tidak valid atau sudah kadaluarsa."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        PIN 6 digit telah dikirim ke <span className="font-medium text-gray-800 dark:text-white/90">{email}</span>.
      </p>

      <div>
        <Label>PIN Reset</Label>
        <div className="mt-2 flex gap-3 justify-center" onPaste={handlePaste}>
          {pin.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { inputRefs.current[idx] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              disabled={loading}
              className="h-12 w-12 rounded-lg border text-center text-lg font-semibold shadow-theme-xs focus:outline-none focus:ring-3 dark:bg-gray-900 dark:text-white/90 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-error-50 px-4 py-2.5 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || pin.join("").length < 6}
        className="inline-flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Memverifikasi..." : "Verifikasi PIN"}
      </button>
    </form>
  )
}

// ─── Step 3: New Password ──────────────────────────────────────────────────────

function StepNewPassword({
  resetToken,
  onSuccess,
}: {
  resetToken: string
  onSuccess: () => void
}) {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError("Konfirmasi password tidak cocok.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/v1/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset_token: resetToken, new_password: password }),
      })
      const data = await res.json()
      if (!res.ok) throw data
      onSuccess()
    } catch (err) {
      setError(getMsg(err, "Gagal mereset password. Coba ulangi dari awal."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="np-password">
            Password Baru <span className="text-error-500">*</span>
          </Label>
          <div className="relative">
            <input
              id="np-password"
              type={showPw ? "text" : "password"}
              placeholder="Min. 8 karakter, 1 huruf kapital, 1 angka"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              minLength={8}
              className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              {showPw ? <EyeIcon className="fill-gray-500 dark:fill-gray-400" /> : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />}
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="np-confirm">
            Konfirmasi Password <span className="text-error-500">*</span>
          </Label>
          <div className="relative">
            <input
              id="np-confirm"
              type={showConfirm ? "text" : "password"}
              placeholder="Ulangi password baru"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
              required
              className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              {showConfirm ? <EyeIcon className="fill-gray-500 dark:fill-gray-400" /> : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-error-50 px-4 py-2.5 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Menyimpan..." : "Reset Password"}
      </button>
    </form>
  )
}

// ─── Step 4: Success ───────────────────────────────────────────────────────────

function StepSuccess() {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/20">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Password Berhasil Direset</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Silakan masuk dengan password baru kamu.
        </p>
      </div>
      <Link
        href="/signin"
        className="mt-2 inline-flex items-center justify-center rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
      >
        Masuk Sekarang
      </Link>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const STEPS = ["Email", "Verifikasi PIN", "Password Baru"]

export default function ResetPasswordPage() {
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState("")
  const [resetToken, setResetToken] = useState("")

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-6 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Reset Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {step === 0 && "Masukkan email kamu untuk menerima PIN reset password."}
              {step === 1 && "Masukkan PIN 6 digit yang dikirim ke email kamu."}
              {step === 2 && "Buat password baru untuk akunmu."}
              {step === 3 && ""}
            </p>
          </div>

          {/* Stepper */}
          {step < 3 && (
            <div className="mb-8 flex items-center gap-2">
              {STEPS.map((label, idx) => (
                <React.Fragment key={label}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                        idx < step
                          ? "bg-brand-500 text-white"
                          : idx === step
                          ? "border-2 border-brand-500 text-brand-500"
                          : "border-2 border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-500"
                      }`}
                    >
                      {idx < step ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span className={`hidden text-xs sm:block ${idx === step ? "font-medium text-gray-800 dark:text-white/90" : "text-gray-400 dark:text-gray-500"}`}>
                      {label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`h-px flex-1 ${idx < step ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {step === 0 && (
            <StepEmail
              onNext={(e) => {
                setEmail(e)
                setStep(1)
              }}
            />
          )}
          {step === 1 && (
            <StepPin
              email={email}
              onNext={(token) => {
                setResetToken(token)
                setStep(2)
              }}
            />
          )}
          {step === 2 && (
            <StepNewPassword
              resetToken={resetToken}
              onSuccess={() => setStep(3)}
            />
          )}
          {step === 3 && <StepSuccess />}

          {step < 3 && (
            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Ingat password?{" "}
              <Link href="/signin" className="font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400">
                Sign In
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
