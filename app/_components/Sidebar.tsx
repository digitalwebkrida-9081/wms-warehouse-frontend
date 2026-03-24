"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  Box,
  FileDown,
  FileUp,
  Receipt,
  BookText,
  CreditCard,
  Warehouse,
  ChevronRight,
  LogOut,
  Settings
} from "lucide-react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

const navItems = [
  { name: "Party Master", href: "/party", icon: Users },
  { name: "Product Master", href: "/product", icon: Package },
  { name: "Category Master", href: "/category", icon: Layers },
  { name: "Package Master", href: "/package", icon: Box },
  { name: "Inwards", href: "/inwards", icon: FileDown },
  { name: "Outwards", href: "/outwards", icon: FileUp },
  { name: "Billing", href: "/billing", icon: Receipt },
  { name: "Ledger", href: "/ledger", icon: BookText },
  { name: "Expense", href: "/expense", icon: CreditCard },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const username = Cookies.get("user-name") || "Admin User";
  const userRole = Cookies.get("user-role") || "staff";
  const isAdmin = userRole === "admin";

  // Hide sidebar on login page
  if (pathname === "/login") return null;

  const handleLogout = () => {
    Cookies.remove("auth-token");
    Cookies.remove("user-name");
    Cookies.remove("user-role");
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-slate-900 text-white shadow-xl transition-all duration-300">
      <div className="flex h-16 items-center px-6 border-b border-slate-800">
        <Warehouse className="h-8 w-8 text-blue-400" />
        <span className="ml-3 text-xl font-bold tracking-tight">WMS Pro</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto py-4 px-3 custom-scrollbar">
        {/* System Administration (Admins Only) */}
        {isAdmin && (
          <>
            <div className="px-3 mt-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              System Administration
            </div>
            <Link
              href="/users"
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group ${
                pathname === "/users"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center">
                <Users className={`h-5 w-5 mr-3 ${pathname === "/users" ? "text-white" : "text-slate-400 group-hover:text-blue-400"}`} />
                <span className="font-medium">User Management</span>
              </div>
              {pathname === "/users" && <ChevronRight className="h-4 w-4" />}
            </Link>
          </>
        )}

        <div className="px-3 mt-6 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Inventory & Masters
        </div>
        {navItems.slice(0, 4).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center">
                <item.icon className={`h-5 w-5 mr-3 ${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"}`} />
                <span className="font-medium">{item.name}</span>
              </div>
              {isActive && <ChevronRight className="h-4 w-4" />}
            </Link>
          );
        })}

        <div className="px-3 mt-6 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Warehouse Operations
        </div>
        {navItems.slice(4).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center">
                <item.icon className={`h-5 w-5 mr-3 ${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"}`} />
                <span className="font-medium">{item.name}</span>
              </div>
              {isActive && <ChevronRight className="h-4 w-4" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-4">
        {/* User Profile */}
        <div className="flex items-center px-2 py-2 rounded-lg bg-slate-800/50">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold uppercase">
            {username.slice(0, 2)}
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium truncate">{username}</p>
            <p className="text-xs text-slate-500 truncate lowercase">{userRole}</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all duration-200 group font-medium"
        >
          <LogOut className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
          Logout
        </button>
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
}
