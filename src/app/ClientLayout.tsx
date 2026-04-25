"use client";

import React from "react";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { UserProvider } from "@/context/UserContext";
import { HeaderSearchProvider } from "@/context/HeaderSearchContext";
import { ToastContainer } from "@/components/ui/toast/Toast";

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        <UserProvider>
          <HeaderSearchProvider>
            <ThemeProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </ThemeProvider>
          </HeaderSearchProvider>
        </UserProvider>
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
  );
}
