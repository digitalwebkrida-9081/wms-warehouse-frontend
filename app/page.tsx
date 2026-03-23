"use client";

import React from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Users,
  TrendingUp,
  Receipt,
  Truck,
  Box,
  LayoutDashboard,
} from "lucide-react";

const stats = [
  {
    name: "Total Inwards",
    value: "2,450",
    change: "+12.5%",
    trend: "up",
    icon: Package,
    color: "red",
  },
  {
    name: "Total Outwards",
    value: "1,820",
    change: "+8.2%",
    trend: "up",
    icon: Truck,
    color: "emerald",
  },
  {
    name: "Active Parties",
    value: "156",
    change: "+3.1%",
    trend: "up",
    icon: Users,
    color: "indigo",
  },
  {
    name: "Total Billing",
    value: "₹4,25,000",
    change: "-2.4%",
    trend: "down",
    icon: Receipt,
    color: "amber",
  },
];

const recentActivities = [
  {
    id: 1,
    type: "inward",
    party: "Jai Ambe Corp",
    items: "120 Boxes",
    time: "2 mins ago",
  },
  {
    id: 2,
    type: "outward",
    party: "RK Logistics",
    items: "45 Units",
    time: "1 hour ago",
  },
  {
    id: 3,
    type: "bill",
    party: "Sunrise Fresh",
    items: "₹12,450",
    time: "3 hours ago",
  },
  {
    id: 4,
    type: "inward",
    party: "Green Valley",
    items: "200 MT",
    time: "5 hours ago",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight bg-linear-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          WMS Dashboard
        </h2>
        <p className="text-slate-500">
          Welcome back! Here's what's happening in your warehouse today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <div
                className={`p-2 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform duration-300`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <div
                className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                  stat.trend === "up"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {stat.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                )}
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-500">{stat.name}</p>
              <h3 className="text-2xl font-bold text-slate-900">
                {stat.value}
              </h3>
            </div>

            {/* Subtle Gradient background on hover */}
            <div
              className={`absolute inset-0 bg-linear-to-br from-${stat.color}-500/0 to-${stat.color}-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
            />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Main Chart Area (Simulated) */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900">
              Warehouse Throughput
            </h3>
            <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button className="px-3 py-1 bg-white rounded shadow-sm">
                Weekly
              </button>
              <button className="px-3 py-1 text-slate-500 hover:text-slate-700">
                Monthly
              </button>
            </div>
          </div>

          {/* Simulated Chart Visualization */}
          <div className="h-64 flex items-end justify-between space-x-2 px-2">
            {[45, 62, 54, 85, 42, 74, 52, 68, 92, 48].map((h, i) => (
              <div key={i} className="relative group w-full">
                <div
                  className="w-full bg-blue-100 group-hover:bg-blue-200 rounded-t-lg transition-all duration-500 ease-out"
                  style={{ height: `${h}%` }}
                />
                <div
                  className="absolute bottom-0 w-full bg-blue-500 rounded-t-lg transition-all duration-500 ease-out delay-75 pointer-events-none"
                  style={{ height: `${Math.max(0, h - 20)}%` }}
                />
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-20">
                  Value: {h}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between px-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-6">
            Recent Activity
          </h3>
          <div className="space-y-6 flex-1">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-4 relative"
              >
                <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-2 ring-white">
                  {activity.type === "inward" ? (
                    <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                  ) : activity.type === "outward" ? (
                    <ArrowUpRight className="h-4 w-4 text-rose-500" />
                  ) : (
                    <Receipt className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {activity.type.charAt(0).toUpperCase() +
                        activity.type.slice(1)}
                      : {activity.party}
                    </p>
                    <span className="text-xs text-slate-400 font-medium">
                      {activity.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activity.items}
                  </p>
                </div>
                {activity.id < recentActivities.length && (
                  <div className="absolute top-8 left-4 -ml-px h-full w-0.5 bg-slate-100 z-0" />
                )}
              </div>
            ))}
          </div>
          <button className="mt-6 w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-xl transition-colors border border-slate-100">
            View All Reports
          </button>
        </div>
      </div>

      {/* Grid of Quick Actions */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50 flex items-center group cursor-pointer hover:bg-blue-100 transition-colors">
          <div className="p-3 bg-blue-500 rounded-lg text-white mr-4 shadow-lg shadow-blue-200">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Add Inward</h4>
            <p className="text-xs text-slate-600">
              Register new incoming stock
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50 flex items-center group cursor-pointer hover:bg-emerald-100 transition-colors">
          <div className="p-3 bg-emerald-500 rounded-lg text-white mr-4 shadow-lg shadow-emerald-200">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Ship Outward</h4>
            <p className="text-xs text-slate-600">
              Prepare items for departure
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50 flex items-center group cursor-pointer hover:bg-indigo-100 transition-colors">
          <div className="p-3 bg-indigo-500 rounded-lg text-white mr-4 shadow-lg shadow-indigo-200">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Generate Invoice</h4>
            <p className="text-xs text-slate-600">Process pending payments</p>
          </div>
        </div>
      </div>
    </div>
  );
}
