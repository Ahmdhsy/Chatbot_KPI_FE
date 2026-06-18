"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Label from "@/components/form/Label";
import AlertIcon from "@/icons/alert.svg";
import EyeCloseIcon from "@/icons/eye-close.svg";
import EyeIcon from "@/icons/eye.svg";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();
  const { login, isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const { addToast } = useToast();

  const validateEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      const role = String(user?.role ?? "").toLowerCase();
      router.replace(role === "karyawan" ? "/chat" : "/");
    }
  }, [isAuthLoading, isAuthenticated, router, user?.role]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const startRaw = window.sessionStorage.getItem("logout_perf_start_ms");
    if (!startRaw) return;

    const startMs = Number(startRaw);
    if (!Number.isFinite(startMs)) {
      window.sessionStorage.removeItem("logout_perf_start_ms");
      return;
    }

    const durationMs = Date.now() - startMs;
    const durationSec = (durationMs / 1000).toFixed(2);
    console.log(
      `[Signout Perf] Sign out -> signin loaded: ${durationSec}s (${durationMs}ms)`
    );
    window.sessionStorage.removeItem("logout_perf_start_ms");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("expired") === "true") {
      addToast(
        "warning",
        "Sesi Anda telah berakhir. Silakan login kembali.",
        "Sesi Berakhir"
      );
      // Clean up search parameters without triggering a full page refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [addToast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIdentifierError("");
    setPasswordError("");

    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();

    let hasError = false;
    if (!trimmedIdentifier || !validateEmail(trimmedIdentifier)) {
      setIdentifierError("Harap isi email yang valid.");
      hasError = true;
    }
    if (!trimmedPassword) {
      setPasswordError("Password wajib diisi.");
      hasError = true;
    }
    if (hasError) {
      return;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("login_perf_start_ms", String(Date.now()));
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ identifier: trimmedIdentifier, password }),
      });

      const response = await res.json();

      if (!res.ok) {
        const msg = response?.detail?.[0]?.msg ?? response?.detail ?? "Login gagal";
        const lowered = String(msg).toLowerCase();

        if (res.status === 401) {
          setIdentifierError("Email atau password salah.");
          setPasswordError("Email atau password salah.");
        } else if (res.status === 403 || lowered.includes("tidak aktif") || lowered.includes("inactive")) {
          setIdentifierError("Akun tidak aktif.");
          setPasswordError("Akun tidak aktif.");
        } else if (res.status === 422) {
          setIdentifierError("Harap isi email yang valid.");
        } else {
          setIdentifierError("Login gagal. Silakan coba lagi.");
        }

        addToast("error", String(msg), "Login Gagal");
        return;
      }

      const normalizedRole = String(response?.user?.role ?? "").toLowerCase();
      const allowedRoles = ["admin", "kepala_divisi", "karyawan"];
      if (!allowedRoles.includes(normalizedRole)) {
        addToast(
          "error",
          "Role akun Anda belum memiliki akses ke sistem ini",
          "Akses Ditolak"
        );
        setIsLoading(false);
        return;
      }

      // Login successful - access_token cookie already set by /api/auth/session
      login(response.user);
      addToast("success", "Login sukses! Mengalihkan...", "Selamat Datang");

      const redirectTo = normalizedRole === "karyawan" ? "/chat" : "/";
      setTimeout(() => {
        router.replace(redirectTo);
      }, 1000);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Login gagal. Silakan coba lagi.";
      addToast("error", errorMessage, "Login Gagal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Masuk
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Masukkan email dan password Anda untuk masuk!
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="relative">
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <input
                    placeholder="info@gmail.com"
                    type="email"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (identifierError) setIdentifierError("");
                    }}
                    disabled={isLoading}
                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-10 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:dark:bg-gray-800 disabled:dark:text-gray-400 ${
                      identifierError
                        ? "border-error-500 focus:border-error-500 focus:ring-error-500/20 dark:border-error-500 dark:focus:border-error-500"
                        : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
                    }`}
                  />
                  {identifierError && (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertIcon className="h-5 w-5 fill-error-500" />
                    </span>
                  )}
                  {identifierError && (
                    <p className="mt-1 text-sm text-error-600 dark:text-error-400">{identifierError}</p>
                  )}
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password Anda"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      disabled={isLoading}
                      className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-18 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed disabled:dark:bg-gray-800 disabled:dark:text-gray-400 ${
                        passwordError
                          ? "border-error-500 focus:border-error-500 focus:ring-error-500/20 dark:border-error-500 dark:focus:border-error-500"
                          : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
                      }`}
                    />
                    {passwordError && (
                      <span className="pointer-events-none absolute right-11 top-1/2 -translate-y-1/2">
                        <AlertIcon className="h-5 w-5 fill-error-500" />
                      </span>
                    )}
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                  {passwordError && (
                    <p className="mt-1 text-sm text-error-600 dark:text-error-400">{passwordError}</p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isChecked}
                      onChange={setIsChecked}
                      disabled={isLoading}
                    />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Tetap masuk
                    </span>
                  </div>
                  <Link
                    href="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Lupa password?
                  </Link>
                </div>
                <div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center font-medium gap-2 rounded-lg transition w-full px-4 py-3 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? "Masuk..." : "Masuk"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
