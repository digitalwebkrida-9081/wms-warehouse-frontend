"use client";

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Wallet, ArrowDownCircle, ArrowUpCircle, User, MapPin, Phone, Mail, FileText, ChevronDown } from 'lucide-react';

export default function LedgerPage() {
  const [selectedRoom, setSelectedRoom] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const rooms = ['Cold Room 1', 'Main Storage', 'Section A', 'Basement 1'];

  const fetchLedger = async (room: string) => {
    if (!room) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ledger?room=${encodeURIComponent(room)}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to fetch ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRoom) {
      fetchLedger(selectedRoom);
    }
  }, [selectedRoom]);

  const stats = data?.stats || { inwardCount: '-', totalDebit: '-', totalInward: '-', totalOutward: '-' };
  const party = data?.partyDetails || {};
  const transactions = data?.transactions || [];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header & Filter */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 transition-all">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
              <LayoutDashboard className="w-8 h-8 text-indigo-600" />
              Ledger
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Room-wise party ledger summary and transaction details</p>
          </div>
          
          <div className="relative w-full sm:w-64">
            <label htmlFor="roomSelect" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5 ml-1">Select Room</label>
            <div className="relative group">
              <select
                id="roomSelect"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl py-3 pl-4 pr-10 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all cursor-pointer appearance-none group-hover:bg-white dark:group-hover:bg-neutral-700"
              >
                <option value="">-- Choose a Room --</option>
                {rooms.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none group-hover:text-neutral-600 transition-colors" />
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard 
            title="Inward Count" 
            value={stats.inwardCount} 
            icon={<ArrowDownCircle className="w-6 h-6 text-indigo-600" />} 
            color="indigo"
          />
          <KpiCard 
            title="Total Debit" 
            value={stats.totalDebit === 0 ? 'N/A' : (typeof stats.totalDebit === 'number' ? `₹${stats.totalDebit}` : stats.totalDebit)} 
            icon={<Wallet className="w-6 h-6 text-rose-600" />} 
            color="rose"
          />
          <KpiCard 
            title="Total Inward" 
            value={stats.totalInward === 0 ? 'N/A' : (typeof stats.totalInward === 'number' ? `${stats.totalInward} kg` : stats.totalInward)} 
            icon={<ArrowDownCircle className="w-6 h-6 text-emerald-600" />} 
            color="emerald"
          />
          <KpiCard 
            title="Total Outward" 
            value={stats.totalOutward === 0 ? 'N/A' : (typeof stats.totalOutward === 'number' ? `${stats.totalOutward} kg` : stats.totalOutward)} 
            icon={<ArrowUpCircle className="w-6 h-6 text-amber-600" />} 
            color="amber"
          />
        </div>

        {/* Party Details Card */}
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-neutral-100 dark:border-neutral-800">
            <User className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 uppercase tracking-tight">Party Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
            <LabelValue icon={<User className="w-4 h-4"/>} label="Party Name" value={party.name} bold />
            <LabelValue label="Party Type" value={party.type} />
            <LabelValue label="Party Mode" value={party.mode} />
            
            <LabelValue icon={<Mail className="w-4 h-4"/>} label="Email" value={party.email} />
            <LabelValue label="Opening Bal." value={party.openingBalance ? `₹${party.openingBalance}` : undefined} color="indigo" />
            <LabelValue label="Opening Mode" value={party.openingMode} />
            
            <LabelValue icon={<Phone className="w-4 h-4"/>} label="Phone No." value={party.phoneNumber} />
            <LabelValue icon={<Phone className="w-4 h-4"/>} label="Alt. Phone" value={party.alternatePhone} />
            <LabelValue label="FSSAI" value={party.fssai} />
            
            <LabelValue label="Grace Days" value={party.graceDays} />
            <LabelValue label="GSTIN" value={party.gstin} />
            <LabelValue icon={<MapPin className="w-4 h-4"/>} label="Address" value={party.address} fullWidth />
          </div>
        </div>

        {/* Optional: Transactions Table */}
        {selectedRoom && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="px-8 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-neutral-900 dark:text-neutral-50 uppercase tracking-tight">Transactions History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                  <tr>
                    <th className="px-8 py-4 font-semibold text-neutral-500 uppercase tracking-widest text-[10px]">Date</th>
                    <th className="px-8 py-4 font-semibold text-neutral-500 uppercase tracking-widest text-[10px]">Bill/Ref No.</th>
                    <th className="px-8 py-4 font-semibold text-neutral-500 uppercase tracking-widest text-[10px]">Debit (₹)</th>
                    <th className="px-8 py-4 font-semibold text-neutral-500 uppercase tracking-widest text-[10px]">Credit (₹)</th>
                    <th className="px-8 py-4 font-semibold text-neutral-500 uppercase tracking-widest text-[10px]">Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {transactions.map((tr: any, idx: number) => (
                    <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors group">
                      <td className="px-8 py-4 text-neutral-700 dark:text-neutral-300 font-medium">{tr.date}</td>
                      <td className="px-8 py-4 text-neutral-900 dark:text-neutral-100 font-bold">{tr.billNo}</td>
                      <td className="px-8 py-4 text-rose-600 font-bold">{tr.debit ? `₹${tr.debit}` : '-'}</td>
                      <td className="px-8 py-4 text-emerald-600 font-bold">{tr.credit ? `₹${tr.credit}` : '-'}</td>
                      <td className="px-8 py-4 text-neutral-900 dark:text-neutral-100 font-bold underline decoration-indigo-500/30 underline-offset-4">₹{tr.balance}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-neutral-400">No transactions recorded for this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, color }: { title: string, value: any, icon: any, color: string }) {
  const colorMap: any = {
    indigo: 'border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/10',
    rose: 'border-rose-100 dark:border-rose-900/30 bg-rose-50/10',
    emerald: 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/10',
    amber: 'border-amber-100 dark:border-amber-900/30 bg-amber-50/10',
  };

  return (
    <div className={`p-6 rounded-2xl bg-white dark:bg-neutral-900 border ${colorMap[color]} shadow-sm hover:shadow-md transition-shadow group`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-3xl font-black text-neutral-900 dark:text-neutral-50 tracking-tighter group-hover:scale-105 transition-transform origin-left">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-white dark:bg-neutral-800 border ${colorMap[color]} shadow-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function LabelValue({ icon, label, value, bold = false, color, fullWidth = false }: { icon?: any, label: string, value?: string | number, bold?: boolean, color?: string, fullWidth?: boolean }) {
  return (
    <div className={`space-y-1.5 ${fullWidth ? 'md:col-span-2 lg:col-span-3' : ''}`}>
      <div className="flex items-center gap-1.5 opacity-60">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{label}</span>
      </div>
      <p className={`text-sm leading-relaxed whitespace-pre-wrap
        ${bold ? 'font-bold text-neutral-900 dark:text-neutral-100' : 'text-neutral-700 dark:text-neutral-300'}
        ${color === 'indigo' ? 'text-indigo-600 font-bold' : ''}
        ${!value ? 'italic opacity-30 italic font-thin' : ''}
      `}>
        {value || 'Not provided'}
      </p>
    </div>
  );
}
