import "./globals.css";
import Sidebar from "./_components/Sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden bg-slate-50">
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
            <div className="max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
