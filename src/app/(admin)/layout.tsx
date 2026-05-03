"use client";

import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const startRaw = window.sessionStorage.getItem("login_perf_start_ms");
    if (!startRaw) return;

    const startMs = Number(startRaw);
    if (!Number.isFinite(startMs)) {
      window.sessionStorage.removeItem("login_perf_start_ms");
      return;
    }

    const durationMs = Date.now() - startMs;
    const durationSec = (durationMs / 1000).toFixed(2);
    console.log(
      `[Login Perf] Click Sign in -> dashboard loaded (${pathname}): ${durationSec}s (${durationMs}ms)`
    );
    window.sessionStorage.removeItem("login_perf_start_ms");
  }, [pathname]);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated) {
      router.replace("/signin");
      return;
    }

    const role = String(user?.role ?? "").toLowerCase();
    const isIngestionRoute = pathname.startsWith("/ingestion");
    const isAdminOnlyRoute = pathname.startsWith("/users") || pathname.startsWith("/chatbots");

    if (role === "admin" && isIngestionRoute) {
      router.replace("/error-404");
      return;
    }

    if (role === "kepala_divisi" && isAdminOnlyRoute) {
      router.replace("/error-404");
    }
  }, [isAuthLoading, isAuthenticated, pathname, router, user?.role]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}
