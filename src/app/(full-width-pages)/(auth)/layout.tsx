import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col  dark:bg-gray-900 sm:p-0">
          {children}
          <div className="lg:w-1/2 w-full h-full bg-brand-950 dark:bg-white/5 lg:grid items-center hidden">
            <div className="relative items-center justify-center  flex z-1">
              {/* <!-- ===== Common Grid Shape Start ===== --> */}
              <GridShape />
              <div className="flex items-center gap-0 -space-x-5">
                <Link href="/" className="block">
                  <Image
                    width={200}
                    height={200}
                    src="/images/logo/logo-kpi.png"
                    alt="KPI Logo"
                  />
                </Link>
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Chatbot KPI
                  </h2>
                  <p className="text-white/80">
                    Optimalisasi monitoring KPI PT. Aman Media Interaktif
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
