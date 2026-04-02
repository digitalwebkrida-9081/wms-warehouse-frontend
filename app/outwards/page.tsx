"use client";
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Plus, Search, MoreVertical, Edit2, Trash2, ArrowRightCircle,
  FileText, CheckCircle2, ChevronLeft, ChevronRight, Download,
  X, Printer, FileDown, Calculator
} from 'lucide-react';
import { Inward, Outward } from '@/app/lib/db';
import { authFetch } from '@/app/lib/auth-fetch';
import { useToast } from '@/app/_components/ToastProvider';
import { useConfirm } from '@/app/_components/ConfirmProvider';
import { useLoading } from '@/app/_components/LoadingProvider';
import { formatDate } from '@/app/lib/utils';

interface CompanySettings {
  companyName: string;
  companyShortName: string;
  companyTagline: string;
  logoUrl: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  gstNumber: string;
  panNumber: string;
  sacCode: string;
  bankName: string;
  bankBranch: string;
  accountNumber: string;
  ifscCode: string;
  termsAndConditions: string[];
  jurisdiction: string;
  signatureLabel: string;
  signatureUrl: string;
  footerText: string;
}

export default function OutwardsPage({
  params,
  searchParams,
}: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <OutwardsContent />
    </Suspense>
  );
}

function OutwardsContent() {
  const { showToast } = useToast();
  const { setIsLoading } = useLoading();
  const confirm = useConfirm();
  const searchParams = useSearchParams();
  const router = useRouter();
  const inwardIdFilter = searchParams.get('inwardId');

  const [outwards, setOutwards] = useState<Outward[]>([]);
  const [inwards, setInwards] = useState<Inward[]>([]); // To select when adding new outward
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutward, setEditingOutward] = useState<Outward | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Outward>>({});

  // Billing Preview & Params States
  const [invoicePreviewData, setInvoicePreviewData] = useState<any>(null);
  const [isBillParamsModalOpen, setIsBillParamsModalOpen] = useState(false);
  const [billParams, setBillParams] = useState({
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear().toString(),
    gst: 18,
    outwardDate: new Date().toISOString().split('T')[0],
  });

  // Company Settings State
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  const fetchCompanySettings = useCallback(async () => {
    try {
      const res = await authFetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setCompanySettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch company settings:", error);
    }
  }, []);

  useEffect(() => {
    fetchCompanySettings();
  }, [fetchCompanySettings]);

  const fetchOutwards = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/api/outward?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`;
      if (inwardIdFilter) {
        url += `&inwardId=${inwardIdFilter}`;
      }
      const res = await authFetch(url);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      setOutwards(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch outwards:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, search, inwardIdFilter, setIsLoading]);

  const fetchInwards = useCallback(async () => {
    try {
      const res = await authFetch(`/api/inwards?pageSize=100`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      setInwards(data.data || []);
    } catch (error) {
      console.error('Failed to fetch inwards:', error);
    }
  }, []);

  useEffect(() => {
    fetchOutwards();
  }, [fetchOutwards]);

  useEffect(() => {
    if (isModalOpen) {
      fetchInwards();
    }
  }, [isModalOpen, fetchInwards]);

  // Debounce Search
  useEffect(() => {
    setPage(1); // Reset page on new search
  }, [search]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(outwards.map(o => o.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleOpenModal = (outward?: Outward) => {
    if (outward) {
      setEditingOutward(outward);
      setFormData({
        ...outward,
        inwardId: typeof outward.inwardId === 'string' ? outward.inwardId : (outward.inwardId as any).id
      });
    } else {
      setEditingOutward(null);
      setFormData({
        outwardDate: new Date().toISOString().split('T')[0],
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setEditingOutward(null);
  };

  const handleInwardChange = (inwardId: string) => {
    const selectedInward = inwards.find(i => i.id === inwardId);
    if (selectedInward) {
      setFormData({
        ...formData,
        inwardId: selectedInward.id,
        partyId: selectedInward.partyId,
        productId: selectedInward.productId,
        unitWeight: selectedInward.unitWeight || 0,
        // Pre-fill with remaining weight/quantity
        outwardWeight: selectedInward.remainingWeight,
        quantity: selectedInward.remainingQuantity ?? selectedInward.quantity ?? 0
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingOutward ? `/api/outward/${editingOutward.id}` : '/api/outward';
    const method = editingOutward ? 'PUT' : 'POST';

    setIsLoading(true);
    try {
      // Ensure we only send the ID, not the populated object if it somehow got in there
      const payload = { ...formData };
      if (typeof payload.inwardId === 'object') {
        payload.inwardId = (payload.inwardId as any).id;
      }

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        closeModal();
        fetchOutwards();
      } else {
        const errorData = await res.json();
        showToast('error', `Failed to save outward: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save:', error);
      showToast('error', 'Network error while saving outward.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Outward',
      message: 'Are you sure you want to delete this outward entry? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete Entry'
    });
    if (!confirmed) return;
    setIsLoading(true);
    try {
      const res = await authFetch(`/api/outward/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchOutwards();
        const newSelected = new Set(selectedIds);
        newSelected.delete(id);
        setSelectedIds(newSelected);
      } else {
        const errorData = await res.json();
        showToast('error', `Failed to delete outward: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      showToast('error', 'Network error while deleting outward.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;

    const confirmed = await confirm({
      title: 'Bulk Delete Outwards',
      message: `Are you sure you want to delete ${count} outward entries? This cannot be undone.`,
      type: 'danger',
      confirmText: `Delete ${count} Entries`
    });

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const res = await authFetch('/api/outward/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        showToast('success', `${count} records deleted successfully`);
        setSelectedIds(new Set());
        fetchOutwards();
      } else {
        const errorData = await res.json();
        showToast('error', errorData.error || 'Failed to bulk delete');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      showToast('error', 'Network error during bulk delete');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateBill = () => {
    if (selectedIds.size === 0) return;
    setIsBillParamsModalOpen(true);
  };

  const confirmGenerateBill = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/billing/generate-from-outward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outwardIds: Array.from(selectedIds),
          billPeriod: `${billParams.month} ${billParams.year}`,
          gstRate: billParams.gst,
          outwardDate: billParams.outwardDate
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to generate bill');
      }

      const data = await res.json();
      setIsBillParamsModalOpen(false);
      setSelectedIds(new Set());
      fetchOutwards();
      showToast('success', 'Bill generated successfully!');

      // Show Invoice Preview
      setInvoicePreviewData(data);
    } catch (error: any) {
      console.error('Failed to generate bill:', error);
      showToast('error', `Error generating bill: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsLoading(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const elements = document.getElementsByClassName("invoice-page");
      if (elements.length === 0) return;

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as HTMLElement;
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
        });

        const imgData = canvas.toDataURL("image/png");

        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save(`Bill_${invoicePreviewData.bill.billNumber}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
      showToast(
        "error",
        "Failed to generate PDF. Please try printing to PDF instead.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const numberToWords = (num: number) => {
    if (num === 0) return "Zero Only";
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    function convertSection(n: number): string {
      if (n === 0) return "";
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
      return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convertSection(n % 100) : "");
    }
    const main = Math.floor(num);
    const fraction = Math.round((num - main) * 100);
    let result = ""; let n = main;
    if (n >= 10000000) { result += convertSection(Math.floor(n / 10000000)) + " Crore "; n %= 10000000; }
    if (n >= 100000) { result += convertSection(Math.floor(n / 100000)) + " Lakh "; n %= 100000; }
    if (n >= 1000) { result += convertSection(Math.floor(n / 1000)) + " Thousand "; n %= 1000; }
    if (n > 0) result += convertSection(n);
    if (result.trim() === "") result = "Zero";
    result = result.trim() + " Rupees";
    if (fraction > 0) result += " and " + convertSection(fraction) + " Paisa";
    return result + " Only";
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Outward</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage all your outgoing shipments and inventory releases</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            suppressHydrationWarning
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Add Outward</span>
          </button>
        </div>

        {/* Controls Above Table */}
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3 text-sm text-neutral-600 dark:text-neutral-300">
            <label htmlFor="pageSize" className="font-medium">Show</label>
            <div className="relative">
              <select
                id="pageSize"
                value={pageSize}
                suppressHydrationWarning
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="appearance-none bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md py-1.5 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {[10, 15, 20, 30].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <span className="font-medium">Entries</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-400" />
              </div>
              <input
                type="text"
                placeholder="Search or select..."
                value={search}
                suppressHydrationWarning
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              />
            </div>

            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all active:scale-95 border border-rose-100 dark:border-rose-500/20 shadow-sm shadow-rose-500/10"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete ({selectedIds.size})</span>
              </button>
            )}

            <button
              onClick={handleGenerateBill}
              disabled={selectedIds.size === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap
                ${selectedIds.size > 0
                  ? 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-500'}`}
            >
              <FileText className="w-4 h-4" />
              <span>Generate Bill</span>
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      checked={outwards.length > 0 && selectedIds.size === outwards.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Inward Date</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Total Weight</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Remaining</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Party</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Product</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50/50 dark:bg-indigo-500/10">Outward Wt</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50/50 dark:bg-emerald-500/10">Outward Qty</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Goods Condition</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Outward</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                {outwards.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-sm text-neutral-500">
                      <div className="flex flex-col items-center justify-center">
                        <Download className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-4" />
                        <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100">No Outwards Found</p>
                        <p className="mt-1">Get started by creating a new outward entry.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  outwards.map((outward) => (
                    <tr key={outward.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          value={outward.id}
                          checked={selectedIds.has(outward.id)}
                          onChange={() => handleSelectRow(outward.id)}
                          className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {formatDate(outward.inwardDetails?.inwardDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                        {outward.inwardDetails?.totalWeight?.toLocaleString() || '0'} kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                          ${(outward.inwardDetails?.remainingWeight || 0) > 0
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'}`}>
                          {outward.inwardDetails?.remainingWeight?.toLocaleString() || '0'} kg
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100 font-medium">
                        {outward.partyId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                        {outward.productId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100 font-semibold text-center bg-indigo-50/30 dark:bg-indigo-500/5">
                        {outward.outwardWeight?.toLocaleString() || '0'} kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100 font-semibold text-center bg-emerald-50/30 dark:bg-emerald-500/5">
                        {outward.quantity?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center text-neutral-600 dark:text-neutral-300">
                          {outward.goodsCondition === 'Good' && <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1.5" />}
                          {outward.goodsCondition || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleOpenModal(outward)}
                          className="flex items-center space-x-1.5 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
                        >
                          <span>Entry</span>
                          <ArrowRightCircle className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="relative flex justify-end items-center group/menu">
                          <button className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors peer">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-800 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible peer-focus:opacity-100 peer-focus:visible transition-all z-10">
                            <div className="py-1">
                              <button
                                onClick={() => handleOpenModal(outward)}
                                className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(outward.id)}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-neutral-50/50 dark:bg-neutral-800/20 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              Showing <span className="font-medium text-neutral-900 dark:text-neutral-100">{(page - 1) * pageSize + (outwards.length > 0 ? 1 : 0)}</span> to <span className="font-medium text-neutral-900 dark:text-neutral-100">{Math.min(page * pageSize, total)}</span> of <span className="font-medium text-neutral-900 dark:text-neutral-100">{total}</span> entries
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden text-left flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-800/50">
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {editingOutward ? 'Edit Outward Entry' : 'Add New Outward Entry'}
              </h3>
              <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-y-auto p-6 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Select Inward (Party - Product - Date) <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={formData.inwardId as string || ''}
                    onChange={(e) => handleInwardChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="" disabled>Select an Inward entry</option>
                    {inwards.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.partyId} - {i.productId} ({formatDate(i.inwardDate)}) - Rem: {i.remainingWeight}kg / {i.remainingQuantity ?? i.quantity ?? 0} qty (Unit: {i.unitWeight}kg)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Outward Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={formData.outwardDate || ''}
                    onChange={(e) => setFormData({ ...formData, outwardDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Quantity <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.quantity || ''}
                    onChange={(e) => {
                      const qty = Number(e.target.value);
                      const unitWt = formData.unitWeight || 0;
                      setFormData({
                        ...formData,
                        quantity: qty,
                        outwardWeight: Number((qty * unitWt).toFixed(2))
                      });
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Unit Weight (kg)</label>
                  <input
                    type="number"
                    readOnly
                    value={formData.unitWeight || 0}
                    className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-500 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Outward Weight (kg)</label>
                  <input
                    type="number"
                    readOnly
                    placeholder="Calculated"
                    value={formData.outwardWeight || ''}
                    className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-500 font-bold cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Goods Condition</label>
                  <select
                    value={formData.goodsCondition || ''}
                    onChange={(e) => setFormData({ ...formData, goodsCondition: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Condition</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Remarks</label>
                  <textarea
                    rows={3}
                    value={formData.remarks || ''}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-neutral-200 dark:border-neutral-800 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-sm active:scale-95"
                >
                  {editingOutward ? 'Save Changes' : 'Create Outward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill Parameters Modal */}
      {isBillParamsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsBillParamsModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200 text-left">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Add Bill Month
              </h3>
              <button onClick={() => setIsBillParamsModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Month</label>
                  <select
                    value={billParams.month}
                    onChange={(e) => setBillParams({ ...billParams, month: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Year</label>
                  <select
                    value={billParams.year}
                    onChange={(e) => setBillParams({ ...billParams, year: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y.toString()}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Outward Date (For Billing) <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  required
                  value={billParams.outwardDate}
                  onChange={(e) => setBillParams({ ...billParams, outwardDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">GST Percentage (%) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={billParams.gst === 0 ? "" : billParams.gst}
                    onChange={(e) => setBillParams({ ...billParams, gst: e.target.value === "" ? 0 : Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
                    placeholder="e.g. 18"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/40">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Generating a bill for <span className="font-bold">{selectedIds.size}</span> selected outward {selectedIds.size === 1 ? 'entry' : 'entries'}. This action will create a formal invoice.
                </p>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button
                onClick={() => setIsBillParamsModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmGenerateBill}
                className="flex-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Generate Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {invoicePreviewData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm print:bg-white print:z-auto print:block print:relative print:p-0 p-4">
          <div className="flex flex-col max-h-[95vh] w-full max-w-5xl bg-slate-100 rounded-lg shadow-2xl relative print:h-auto print:max-h-none print:shadow-none print:bg-white text-left">
            <div className="flex justify-between items-center p-4 bg-white border-b print:hidden rounded-t-lg">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="text-indigo-600" />
                Invoice Preview
              </h2>
              <div className="flex items-center gap-3">
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg transition-colors">
                  <Printer className="w-4 h-4" />
                  Print Invoice
                </button>
                <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 font-bold rounded-lg transition-colors">
                  <FileDown className="w-4 h-4" />
                  Download PDF
                </button>
                <div className="w-px h-6 bg-slate-200 mx-2"></div>
                <button onClick={() => setInvoicePreviewData(null)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Printable Area */}
            <div className="flex-1 overflow-auto p-4 print:p-0 print:overflow-visible custom-scrollbar flex flex-col items-center gap-8 print:gap-0">
              {(() => {
                const ITEMS_PER_PAGE = 10;
                const items = invoicePreviewData.bill.lineItems;
                const totalQty = items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
                const totalWt = items.reduce((sum: number, item: any) => sum + (Number(item.weight) || 0), 0);
                const chunks = [];
                for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
                  chunks.push(items.slice(i, i + ITEMS_PER_PAGE));
                }

                return chunks.map((pageItems, pageIdx) => (
                  <div
                    key={pageIdx}
                    id={pageIdx === 0 ? "invoice-content" : undefined}
                    className="invoice-page w-[210mm] min-h-[297mm] bg-white text-black p-[10mm] shadow-md border border-slate-200 print:shadow-none print:border-none print:w-full font-sans text-sm mx-auto flex flex-col print:break-after-page"
                  >
                    <div className="border border-black flex flex-col h-full relative flex-1">
                      {/* Header Row */}
                      <div className="flex border-b border-black">
                        <div className="w-1/3 p-4 flex flex-col items-center justify-center border-r border-black relative">
                          {companySettings?.logoUrl ? (
                            <img
                              src={
                                companySettings.logoUrl.startsWith("http")
                                  ? companySettings.logoUrl
                                  : `${window.location.origin}${companySettings.logoUrl}`
                              }
                              alt="Company Logo"
                              className="max-h-20 max-w-full object-contain"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <>
                              <h1 className="text-4xl font-black text-blue-900 tracking-tighter leading-none">
                                {companySettings?.companyShortName || "JCRM"}
                              </h1>
                              <p className="text-xl font-bold text-blue-900 mt-1 whitespace-nowrap uppercase">
                                {companySettings?.companyTagline ||
                                  "COLD STORAGE"}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="w-2/3 flex flex-col">
                          <div className="bg-slate-200 font-bold text-center text-lg py-1 border-b border-black uppercase tracking-widest">
                            {companySettings?.companyName ||
                              "JCRM COLD STORAGE LLP"}
                          </div>
                          <div className="text-center p-2 text-[11px] leading-relaxed font-semibold">
                            <p>{companySettings?.address || ""}</p>
                            <p>
                              Phone: {companySettings?.phone || ""} | Email:{" "}
                              {companySettings?.email || ""}
                            </p>
                            <p className="mt-1 font-bold">
                              GST: {companySettings?.gstNumber || ""}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Party & Bill Info Row */}
                      <div className="flex border-b border-black">
                        <div className="w-1/2 p-3 border-r border-black flex flex-col gap-1.5 text-xs font-bold font-mono text-left">
                          <div className="flex">
                            <span className="w-16 flex-shrink-0 text-slate-600">
                              M/S:
                            </span>{" "}
                            <span className="uppercase text-sm leading-tight ml-2">
                              {invoicePreviewData.partyDetails?.partyName || invoicePreviewData.bill.partyId}
                            </span>
                          </div>
                          <div className="flex">
                            <span className="w-16 flex-shrink-0 text-slate-600">
                              GST:
                            </span>{" "}
                            <span className="uppercase ml-2 leading-tight">
                              {invoicePreviewData.partyDetails?.gstNumber ||
                                "Unregistered"}
                            </span>
                          </div>
                          <div className="flex">
                            <span className="w-16 flex-shrink-0 text-slate-600">
                              PAN:
                            </span>{" "}
                            <span className="uppercase ml-2 leading-tight">
                              {invoicePreviewData.partyDetails?.panNumber ||
                                "-"}
                            </span>
                          </div>
                          <div className="flex">
                            <span className="w-16 flex-shrink-0 text-slate-600">
                              Ph:
                            </span>{" "}
                            <span className="uppercase ml-2 leading-tight">
                              {invoicePreviewData.partyDetails?.mobileNo || "-"}
                            </span>
                          </div>
                          {invoicePreviewData.partyDetails?.address && (
                            <div className="flex mt-1 text-[10px] text-slate-600 leading-tight">
                              <span className="w-16 flex-shrink-0">ADD:</span>
                              <span className="uppercase ml-2">
                                {invoicePreviewData.partyDetails.address},{" "}
                                {invoicePreviewData.partyDetails.city}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="w-1/2 p-3 flex flex-col gap-1.5 text-xs font-bold relative font-mono text-left">
                          <div className="absolute top-2 right-0 left-0 text-center font-black text-sm tracking-widest uppercase">
                            TAX INVOICE
                          </div>
                          <div className="mt-6 flex flex-col gap-2 relative z-10 uppercase">
                            <div>CASH/CREDIT Memo</div>
                            <div>
                              SAC: {companySettings?.sacCode || "996721"}
                            </div>
                            <div>
                              Bill No: {invoicePreviewData.bill.billNumber}
                            </div>
                            <div>
                              Date: {formatDate(new Date().toISOString())}
                            </div>
                            <div className="text-[10px] text-slate-400 capitalize">
                              Page {pageIdx + 1} of {chunks.length}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Product Header */}
                      <div className="grid grid-cols-[3fr_2fr_2fr_1fr_1fr_1fr_1fr_1fr_2fr] bg-neutral-50/50 border-y-2 border-slate-900 text-[10px] font-black uppercase text-center items-stretch h-10">
                        <div className="px-2 flex items-center border-r border-slate-900 text-left">
                          Product
                        </div>
                        <div className="px-1 flex items-center justify-center border-r border-slate-900">
                          In Date
                        </div>
                        <div className="px-1 flex items-center justify-center border-r border-slate-900">
                          Out Date
                        </div>
                        <div className="px-1 flex items-center justify-center border-r border-slate-900">
                          Qty
                        </div>
                        <div className="px-1 flex items-center justify-center border-r border-slate-900">
                          Unit.Wt
                        </div>
                        <div className="px-1 flex items-center justify-center border-r border-slate-900">
                          Tot.Wt
                        </div>
                        <div className="px-1 flex items-center justify-center border-r border-slate-900">
                          Price
                        </div>
                        <div className="px-1 flex items-center justify-center border-r border-slate-900">
                          Mon.
                        </div>
                        <div className="px-2 flex items-center justify-center">
                          Amount
                        </div>
                      </div>

                      {/* Items Rows */}
                      <div className="flex-1 border-b border-black font-semibold text-[10px] flex flex-col">
                        {pageItems.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="grid grid-cols-[3fr_2fr_2fr_1fr_1fr_1fr_1fr_1fr_2fr] text-center border-b border-black/20 items-stretch min-h-8"
                          >
                            <div
                              className="px-2 py-1.5 text-left uppercase break-all border-r border-black/20 flex items-center"
                              title={item.description}
                            >
                              {item.description}
                            </div>
                            <div className="px-1 py-1.5 text-[9px] border-r border-black/20 flex items-center justify-center">
                              {formatDate(item.inDate)}
                            </div>
                            <div className="px-1 py-1.5 text-[9px] border-r border-black/20 flex items-center justify-center">
                              {formatDate(item.outDate)}
                            </div>
                            <div className="px-1 py-1.5 text-[9px] border-r border-black/20 flex items-center justify-center">
                              {item.quantity || 0}
                            </div>
                            <div className="px-1 py-1.5 text-[9px] border-r border-black/20 flex items-center justify-center">
                              {item.unitWeight || 0}
                            </div>
                            <div className="px-1 py-1.5 text-[9px] border-r border-black/20 flex items-center justify-center">
                              {item.weight || 0}
                            </div>
                            <div className="px-1 py-1.5 text-[9px] border-r border-black/20 flex items-center justify-center">
                              {Number(item.rate || 0).toFixed(2)}
                            </div>
                            <div className="px-1 py-1.5 text-[9px] border-r border-black/20 flex items-center justify-center">
                              {item.months || 1}
                            </div>
                            <div className="px-2 py-1.5 text-[10px] font-bold flex items-center justify-end">
                              {Number(item.total || 0).toFixed(2)}
                            </div>
                          </div>
                        ))}

                        {/* Empty fill to stretch */}
                        <div className="flex-1 grid grid-cols-[3fr_2fr_2fr_1fr_1fr_1fr_1fr_1fr_2fr] items-stretch">
                          <div className="border-r border-black/20"></div>
                          <div className="border-r border-black/20"></div>
                          <div className="border-r border-black/20"></div>
                          <div className="border-r border-black/20"></div>
                          <div className="border-r border-black/20"></div>
                          <div className="border-r border-black/20"></div>
                          <div className="border-r border-black/20"></div>
                          <div className="border-r border-black/20"></div>
                          <div></div>
                        </div>

                        {/* Totals Row - ONLY ON LAST PAGE */}
                        {pageIdx === chunks.length - 1 && (
                          <div className="grid grid-cols-[3fr_2fr_2fr_1fr_1fr_1fr_1fr_1fr_2fr] border-t-2 border-black font-black bg-neutral-50/50 items-center min-h-8 text-center text-black">
                            <div className="col-span-3 px-2 text-right border-r border-black/20 uppercase tracking-tighter pr-4">Total:</div>
                            <div className="px-1 border-r border-black/20 flex items-center justify-center h-full">{totalQty}</div>
                            <div className="px-1 border-r border-black/20"></div>
                            <div className="px-1 border-r border-black/20 flex items-center justify-center h-full">{totalWt.toFixed(2)}</div>
                            <div className="col-span-3"></div>
                          </div>
                        )}
                      </div>

                      {/* Totals Row - ONLY ON LAST PAGE */}
                      {pageIdx === chunks.length - 1 ? (
                        <>
                          <div className="flex border-b border-black h-36">
                            <div className="w-1/2 p-4 font-semibold text-xs border-r border-black flex flex-col gap-1.5 font-mono leading-tight bg-slate-50/30 text-left">
                              <div className="flex">
                                <span className="w-24 inline-block font-bold text-slate-500">
                                  Remarks :
                                </span>{" "}
                                <span className="text-black uppercase">
                                  {invoicePreviewData.bill.remarks ||
                                    "COLD RENT"}
                                </span>
                              </div>
                              <div className="flex">
                                <span className="w-24 inline-block font-bold text-slate-500">
                                  Bank Detail:
                                </span>{" "}
                                <span className="text-black uppercase tracking-tighter">
                                  {companySettings?.bankName || "Canara Bank"}
                                </span>
                              </div>
                              <div className="flex">
                                <span className="w-24 inline-block font-bold text-slate-500">
                                  Branch:
                                </span>{" "}
                                <span className="text-black uppercase">
                                  {companySettings?.bankBranch || "Hazira"}
                                </span>
                              </div>
                              <div className="flex">
                                <span className="w-24 inline-block font-bold text-slate-500">
                                  A/C Number:
                                </span>{" "}
                                <span className="text-black font-black">
                                  {companySettings?.accountNumber ||
                                    "120029409483"}
                                </span>
                              </div>
                              <div className="flex">
                                <span className="w-24 inline-block font-bold text-slate-500">
                                  IFSC Code:
                                </span>{" "}
                                <span className="text-black font-black uppercase">
                                  {companySettings?.ifscCode || "CNRB0003428"}
                                </span>
                              </div>
                            </div>
                            <div className="w-1/2 flex flex-col font-bold text-xs p-4 font-mono justify-between bg-white text-right">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-bold uppercase tracking-tighter">
                                    Sub Total:
                                  </span>{" "}
                                  <span className="text-base text-black">
                                    ₹
                                    {Number(
                                      invoicePreviewData.bill.subTotal || 0,
                                    ).toFixed(2)}
                                  </span>
                                </div>
                                {invoicePreviewData.bill.taxTotal > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-bold uppercase tracking-tighter">
                                      GST Total:
                                    </span>{" "}
                                    <span className="text-black">
                                      ₹
                                      {Number(
                                        invoicePreviewData.bill.taxTotal || 0,
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-between items-center border-t border-black pt-2 mt-2 text-lg font-black bg-slate-900 text-white p-2 rounded-lg">
                                <span className="uppercase tracking-tighter text-xs text-indigo-300">
                                  Net Amount:
                                </span>
                                <span>
                                  ₹
                                  {Number(
                                    invoicePreviewData.bill.grandTotal || 0,
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Words Row */}
                          <div className="border-b border-black p-3 font-bold text-[11px] uppercase font-mono bg-slate-100 flex items-center gap-3 text-left">
                            <span className="text-slate-500 font-black italic">
                              Amount in words:
                            </span>
                            <span className="text-black">
                              {numberToWords(
                                Number(invoicePreviewData.bill.grandTotal || 0),
                              )}
                            </span>
                          </div>

                          {/* Signature Row */}
                          <div className="flex h-32">
                            <div className="w-2/3 p-3 text-[9px] leading-relaxed border-r border-black flex flex-col justify-start text-slate-700 bg-white text-left">
                              <p className="font-black mb-1 text-black uppercase tracking-widest border-b border-black/10 inline-block">
                                Terms & Conditions:
                              </p>
                              {companySettings?.termsAndConditions &&
                                companySettings.termsAndConditions.length > 0 ? (
                                companySettings.termsAndConditions.map(
                                  (term, idx) => (
                                    <p key={idx}>
                                      {idx + 1}. {term}
                                    </p>
                                  ),
                                )
                              ) : (
                                <>
                                  <p>1. Stored at owner's risk.</p>
                                  <p>
                                    2. Interest @24% p.a. if not paid within 7
                                    days.
                                  </p>
                                </>
                              )}
                            </div>
                            <div className="w-1/3 flex flex-col justify-end items-center p-4 text-[11px] bg-slate-50/50 relative">
                              {companySettings?.signatureUrl && (
                                <div className="absolute top-2 bottom-14 left-4 right-4 flex items-center justify-center pointer-events-none">
                                  <img
                                    src={companySettings.signatureUrl}
                                    className="max-h-full max-w-full object-contain mix-blend-multiply"
                                    crossOrigin="anonymous"
                                  />
                                </div>
                              )}
                              <div className="w-full border-t-2 border-slate-900 text-center font-black pt-2 uppercase tracking-tighter relative z-10">
                                {companySettings?.signatureLabel ||
                                  "Authorized Signatory"}
                                <div className="text-[9px] font-bold text-slate-500 mt-1 capitalize">
                                  For{" "}
                                  {companySettings?.companyName ||
                                    "JCRM Cold Storage LLP"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center border-b border-black bg-slate-50/30">
                          <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic">
                            Continued on next page...
                          </p>
                        </div>
                      )}

                      {/* Footer text */}
                      <div className="absolute -bottom-6 w-full text-center text-[9px] font-bold text-slate-400 print:bottom-[-25px] uppercase tracking-widest">
                        SUBJECT TO {companySettings?.jurisdiction || "SURAT"}{" "}
                        JURISDICTION —{" "}
                        {companySettings?.footerText ||
                          "THIS IS A COMPUTER GENERATED DOCUMENT"} — GENERATED ON: {formatDate(new Date().toISOString())}
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
            <style jsx global>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                .print\\:bg-white {
                  background-color: white !important;
                }
                .print\\:block {
                  display: block !important;
                }
                .print\\:shadow-none {
                  box-shadow: none !important;
                }
                .print\\:border-none {
                  border: none !important;
                }
                .print\\:w-full {
                  width: 100% !important;
                  max-width: 100% !important;
                }
                .print\\:p-0 {
                  padding: 0 !important;
                }
                .print\\:h-auto {
                  height: auto !important;
                }
                .print\\:max-h-none {
                  max-height: none !important;
                }
                .print\\:break-after-page {
                  break-after: page;
                  page-break-after: always;
                }
                .invoice-page,
                .invoice-page * {
                  visibility: visible;
                }
                .invoice-page {
                  position: relative !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 210mm !important;
                  height: 297mm !important;
                  padding: 10mm !important;
                  margin: 0 !important;
                  border: none !important;
                  box-shadow: none !important;
                }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}
