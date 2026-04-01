"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./_components/Sidebar";
import { Warehouse } from "lucide-react";
import { ToastProvider } from "./_components/ToastProvider";
import { ConfirmProvider } from "./_components/ConfirmProvider";
import { LoadingProvider } from "./_components/LoadingProvider";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <LoadingProvider>
        <ConfirmProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ConfirmProvider>
      </LoadingProvider>
    );
  }

  return (
    <LoadingProvider>
      <ConfirmProvider>
        <ToastProvider>
          <div className="flex h-screen overflow-hidden bg-slate-50 w-full">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Top Navbar */}
              <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 z-10 shrink-0">
                <h1 className="text-xl font-semibold text-slate-800 tracking-tight">
                  Warehouse Management System
                </h1>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                    Live Status
                  </span>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </header>

              {/* Page Content */}
              <div className="flex-1 w-full overflow-y-auto custom-scrollbar relative p-4 lg:p-8 bg-[#f8fafc]/50">
                {children}
              </div>
            </main>
          </div>
        </ToastProvider>
      </ConfirmProvider>
    </LoadingProvider>
  );
}
