"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, MoreVertical, Edit2, Trash2, ArrowRightCircle, FileText, CheckCircle2, ChevronLeft, ChevronRight, Download, X, Calculator, Printer, FileDown } from 'lucide-react';
import { Inward } from '@/app/lib/db';
import { authFetch } from '@/app/lib/auth-fetch';

export default function InwardsPage({
  params,
  searchParams,
}: {
  params: Promise<any>;
  searchParams: Promise<any>;
}) {
  const router = useRouter();
  const [inwards, setInwards] = useState<Inward[]>([]);
  const [parties, setParties] = useState<{id: string, name: string}[]>([]);
  const [products, setProducts] = useState<{id: string, name: string}[]>([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBillParamsModalOpen, setIsBillParamsModalOpen] = useState(false);
  const [invoicePreviewData, setInvoicePreviewData] = useState<{bill: any, partyDetails: any} | null>(null);
  const [editingInward, setEditingInward] = useState<Inward | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Inward>>({});
  const [billParams, setBillParams] = useState({
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear().toString(),
    gst: 18,
  });

  const fetchParties = useCallback(async () => {
    try {
      const res = await authFetch(`/api/party?pageSize=100`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      if (data.data) {
        setParties(data.data.map((p: any) => ({ id: p.id, name: p.name })));
      }
    } catch (error) {
      console.error('Failed to fetch parties:', error);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await authFetch(`/api/product?pageSize=1000`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      if (data.data) {
        setProducts(data.data.map((p: any) => ({ id: p.id, name: p.name })));
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  }, []);

  const fetchInwards = useCallback(async () => {

    try {
      const res = await authFetch(`/api/inwards?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      setInwards(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch inwards:', error);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchInwards();
  }, [fetchInwards]);

  useEffect(() => {
    fetchParties();
    fetchProducts();
  }, [fetchParties, fetchProducts]);

  // Debounce Search
  useEffect(() => {
    setPage(1); // Reset page on new search
  }, [search]);


  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(inwards.map(i => i.id));
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

  const handleOpenModal = (inward?: Inward) => {
    if (inward) {
      setEditingInward(inward);
      setFormData(inward);
    } else {
      setEditingInward(null);
      setFormData({
        inwardDate: new Date().toISOString().split('T')[0],
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setEditingInward(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingInward ? `/api/inwards/${editingInward.id}` : '/api/inwards';
    const method = editingInward ? 'PUT' : 'POST';
    
    try {
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        closeModal();
        fetchInwards();
      } else {
        const errorData = await res.json();
        alert(`Failed to save inward: ${errorData.message || errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Network error while saving inward.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inward?')) return;
    try {
      const res = await authFetch(`/api/inwards/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchInwards();
        const newSelected = new Set(selectedIds);
        newSelected.delete(id);
        setSelectedIds(newSelected);
      } else {
        const errorData = await res.json();
        alert(`Failed to delete inward: ${errorData.message || errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Network error while deleting inward.');
    }
  };

  const handleGenerateBill = () => {
    if (selectedIds.size === 0) return;
    setIsBillParamsModalOpen(true);
  };

  const confirmGenerateBill = async () => {
    try {
      const res = await authFetch('/api/billing/generate-from-inwards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          inwardIds: Array.from(selectedIds),
          billPeriod: `${billParams.month} ${billParams.year}`,
          gstRate: billParams.gst
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to generate bill');
      }
      
      const data = await res.json();
      setIsBillParamsModalOpen(false);
      setSelectedIds(new Set());
      fetchInwards();
      
      // Show Invoice Preview
      setInvoicePreviewData(data);
    } catch (error: any) {
      console.error('Failed to generate bill:', error);
      alert(`Error generating bill: ${error.message}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const { jsPDF } = await import('jspdf');

      const element = document.getElementById('invoice-content');
      if (!element) return;
      
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${invoicePreviewData?.bill?.billNumber}.pdf`);
    } catch (e) {
      console.error('Failed to generate PDF:', e);
      alert('Could not download PDF. Please try printing to PDF instead.');
    }
  };

  // Convert number to words roughly for Indian currency
  const numberToWords = (num: number) => {
    if (num === 0) return "Zero";
    // simplified implementation for presentation
    return `${num.toLocaleString('en-IN')} Only`;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Inwards</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage all your incoming shipments and cold storage inventory</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            suppressHydrationWarning
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Add Inwards</span>
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
              {selectedIds.size > 0 && (
                <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full ml-2">
                  {selectedIds.size}
                </span>
              )}
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
                      checked={inwards.length > 0 && selectedIds.size === inwards.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Inward Date</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Qty</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Total Weight</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Remaining</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Party</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Product</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Goods Condition</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Outward</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                {inwards.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-sm text-neutral-500">
                      <div className="flex flex-col items-center justify-center">
                        <Download className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-4" />
                        <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100">No Inwards Found</p>
                        <p className="mt-1">Get started by creating a new inward entry.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  inwards.map((inward) => (
                    <tr key={inward.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          value={inward.id}
                          checked={selectedIds.has(inward.id)}
                          onChange={() => handleSelectRow(inward.id)}
                          className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {inward.inwardDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                        {inward.quantity || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                        {inward.totalWeight.toLocaleString()} kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                          ${inward.remainingWeight > 0 
                            ? inward.remainingWeight === inward.totalWeight 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                            : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'}`}>
                          {inward.remainingWeight.toLocaleString()} kg
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100 font-medium">
                        {inward.partyId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                        {inward.productId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center text-neutral-600 dark:text-neutral-300">
                          {inward.goodsCondition === 'Good' && <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-1.5" />}
                          {inward.goodsCondition || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => router.push(`/outwards?inwardId=${inward.id}`)}
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
                                onClick={() => handleOpenModal(inward)}
                                className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(inward.id)}
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
              Showing <span className="font-medium text-neutral-900 dark:text-neutral-100">{(page - 1) * pageSize + (inwards.length > 0 ? 1 : 0)}</span> to <span className="font-medium text-neutral-900 dark:text-neutral-100">{Math.min(page * pageSize, total)}</span> of <span className="font-medium text-neutral-900 dark:text-neutral-100">{total}</span> entries
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
                {editingInward ? 'Edit Inward' : 'Add New Inward'}
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
                <div className="space-y-2">
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300">Inward Date <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={formData.inwardDate || ''}
                    onChange={(e) => setFormData({ ...formData, inwardDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300">Party <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={formData.partyId || ''}
                    onChange={(e) => setFormData({ ...formData, partyId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium shadow-sm"
                  >
                    <option value="" disabled>Select Party</option>
                    {parties.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300">Product <span className="text-rose-500">*</span></label>
                  <select
                    required
                    value={formData.productId || ''}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium shadow-sm"
                  >
                    <option value="" disabled>Select Product</option>
                    {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300">Quantity (Units/Bags) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="e.g. 100"
                    value={formData.quantity === 0 ? "" : (formData.quantity || "")}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value === "" ? 0 : Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300">Total Weight (kg) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="5000"
                    value={formData.totalWeight === 0 ? "" : (formData.totalWeight || "")}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      totalWeight: e.target.value === "" ? 0 : Number(e.target.value), 
                      remainingWeight: editingInward ? formData.remainingWeight : (e.target.value === "" ? 0 : Number(e.target.value))
                    })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300">Price (₹ Per Unit/kg)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price === 0 ? "" : (formData.price || "")}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value === "" ? 0 : Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300">Additional Charges (₹)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    value={formData.additionalCharges === 0 ? "" : (formData.additionalCharges || "")}
                    onChange={(e) => setFormData({ ...formData, additionalCharges: e.target.value === "" ? 0 : Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300">Goods Condition</label>
                  <select
                    value={formData.goodsCondition || ''}
                    onChange={(e) => setFormData({ ...formData, goodsCondition: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium shadow-sm"
                  >
                    <option value="">Select Condition</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300">Remarks / Private Notes</label>
                  <textarea
                    rows={3}
                    value={formData.remarks || ''}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium shadow-sm resize-none"
                    placeholder="Any additional information..."
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-neutral-200 dark:border-neutral-800 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 active:scale-95"
                >
                  {editingInward ? 'Update Record' : 'Save Inward Entry'}
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
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
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
                    {[2024, 2025, 2026].map(y => (
                      <option key={y} value={y.toString()}>{y}</option>
                    ))}
                  </select>
                </div>
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
                   Generating a bill for <span className="font-bold">{selectedIds.size}</span> selected inward {selectedIds.size === 1 ? 'entry' : 'entries'}. This action will create a formal invoice.
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
          <div className="flex flex-col max-h-[95vh] w-full max-w-5xl bg-slate-100 rounded-lg shadow-2xl relative print:h-auto print:max-h-none print:shadow-none print:bg-white">
            
            {/* Modal Header controls (Hidden on Print) */}
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
            <div className="flex-1 overflow-auto p-4 print:p-0 print:overflow-visible custom-scrollbar flex justify-center">
              <div id="invoice-content" className="w-[210mm] min-h-[297mm] bg-white text-black p-[10mm] shadow-md border border-slate-200 print:shadow-none print:border-none print:w-full font-sans text-sm mx-auto">
                <div className="border border-black flex flex-col h-full relative">
                  
                  {/* Header Row */}
                  <div className="flex border-b border-black">
                    <div className="w-1/3 p-4 flex flex-col items-center justify-center border-r border-black relative">
                      <h1 className="text-4xl font-black text-blue-900 tracking-tighter leading-none">JCRM</h1>
                      <p className="text-xl font-bold text-blue-900 mt-1 whitespace-nowrap">COLD STORAGE</p>
                      <div className="absolute right-4 top-4 text-blue-900 opacity-20">
                        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M11.996 0l1.29 2.585-2.88 1.666 4.316 4.315-1.554 2.686-3.804-3.805v2.873h-1.928v-2.873l-3.805 3.805-1.554-2.686 4.316-4.315-2.88-1.666L4.78 0h7.216zm8.85 4l1.154 2.015-3.328 1.92L23 12l-.993 1.722-4.32-4.32-1.84 3.193 5.432 5.432-1.72 1-5.433-5.432v6.33h-1.99v-6.33L6.697 19.03l-1.72-1 5.432-5.432-1.84-3.193-4.32 4.32L3.256 12l4.33-4.33-1.802-3.12-3.328-1.921L3.903 0h16.195l-1.155 2.015-3.327 1.921 4.316 4.315-1.554 2.686-3.805-3.8051-3.804 3.805-1.554-2.686 4.316-4.315-3.328-1.92zM12 24l1.29-2.585-2.88-1.665 4.316-4.316-1.554-2.686-3.804 3.805v-2.874h-1.928v2.874l-3.805-3.805-1.554 2.686 4.316 4.316-2.88 1.665L12 24z"/></svg>
                      </div>
                    </div>
                    <div className="w-2/3 flex flex-col">
                      <div className="bg-slate-200 font-bold text-center text-lg py-1 border-b border-black uppercase tracking-widest">
                        JCRM COLD STORAGE LLP
                      </div>
                      <div className="text-center p-2 text-[11px] leading-relaxed font-semibold">
                        <p>BESIDE PRIMARY SCHOOL, OLD HALPATI VAS & ISHANPOR GRAM, OLPAD ROAD, PIN – 394540</p>
                        <p>Phone: 8128299220 | Email: jcrmcoldstorage1@gmail.com</p>
                        <p className="mt-1 font-bold">GST: 24AAUFJ0917F1ZD</p>
                      </div>
                    </div>
                  </div>

                  {/* Party & Bill Info Row */}
                  <div className="flex border-b border-black">
                    <div className="w-1/2 p-3 border-r border-black flex flex-col gap-1.5 text-xs font-bold font-mono">
                      <div className="flex"><span className="w-16 flex-shrink-0 text-slate-600">M/S:</span> <span className="uppercase text-sm leading-tight ml-2">{invoicePreviewData.bill.partyId}</span></div>
                      <div className="flex"><span className="w-16 flex-shrink-0 text-slate-600">GST:</span> <span className="uppercase ml-2 leading-tight">{invoicePreviewData.partyDetails?.gstNumber || 'Unregistered'}</span></div>
                      <div className="flex"><span className="w-16 flex-shrink-0 text-slate-600">PAN:</span> <span className="uppercase ml-2 leading-tight">{invoicePreviewData.partyDetails?.panNumber || '-'}</span></div>
                      <div className="flex"><span className="w-16 flex-shrink-0 text-slate-600">Ph:</span> <span className="uppercase ml-2 leading-tight">{invoicePreviewData.partyDetails?.mobileNo || '-'}</span></div>
                      <div className="flex"><span className="w-16 flex-shrink-0 text-slate-600">Email:</span> <span className="ml-2 leading-tight truncate">{invoicePreviewData.partyDetails?.email || '-'}</span></div>
                      {invoicePreviewData.partyDetails?.address && (
                        <div className="flex mt-1 text-[10px] text-slate-600 leading-tight">
                          <span className="w-16 flex-shrink-0">ADD:</span>
                          <span className="uppercase ml-2">{invoicePreviewData.partyDetails.address}, {invoicePreviewData.partyDetails.city}</span>
                        </div>
                      )}
                    </div>
                    <div className="w-1/2 p-3 flex flex-col gap-1.5 text-xs font-bold relative font-mono">
                      <div className="absolute top-2 right-0 left-0 text-center font-black text-sm tracking-widest uppercase">TAX INVOICE</div>
                      <div className="mt-6 flex flex-col gap-2 relative z-10">
                        <div>CASH/CREDIT Memo</div>
                        <div>SAC: 996721</div>
                        <div>Bill No: {invoicePreviewData.bill.billNumber}</div>
                        <div>Date: {invoicePreviewData.bill.date}</div>
                      </div>
                    </div>
                  </div>

                  {/* Items Table Header */}
                  <div className="flex border-b border-black bg-slate-100 font-bold text-[10px] uppercase text-center child-border-r divide-x divide-black">
                    <div className="flex-[3] p-2 text-left">Product</div>
                    <div className="flex-[1.5] p-2">In Date</div>
                    <div className="flex-[1.5] p-2">Out Date</div>
                    <div className="flex-1 p-2">Qty</div>
                    <div className="flex-[1.5] p-2">Weight</div>
                    <div className="flex-[1.5] p-2">Remaining</div>
                    <div className="flex-[1.5] p-2">Price</div>
                    <div className="flex-[1.2] p-2">Months</div>
                    <div className="flex-[2] p-2 text-right">Amount</div>
                  </div>

                  {/* Items Rows */}
                  <div className="flex-1 border-b border-black font-semibold text-[10px] flex flex-col divide-y divide-black/20">
                    {invoicePreviewData.bill.lineItems.map((item: any, idx: number) => (
                      <div key={idx} className="flex text-center divide-x divide-black/40 min-h-[28px] py-1 items-center">
                        <div className="flex-[3] px-2 text-left truncate uppercase" title={item.description}>{item.description}</div>
                        <div className="flex-[1.5] px-2">{item.inDate || '-'}</div>
                        <div className="flex-[1.5] px-2">-</div>
                        <div className="flex-1 px-2">{item.quantity}</div>
                        <div className="flex-[1.5] px-2">{item.weight}</div>
                        <div className="flex-[1.5] px-2">{item.remaining}</div>
                        <div className="flex-[1.5] px-2 text-right">{item.rate.toFixed(2)}</div>
                        <div className="flex-[1.2] px-2">{item.months}</div>
                        <div className="flex-[2] px-2 text-right">{((item.weight * item.rate * item.months)).toFixed(2)}</div>
                      </div>
                    ))}
                    {/* Empty fill to stretch */}
                    <div className="flex-1 divide-x divide-black/40 flex">
                        <div className="flex-[3]"></div>
                        <div className="flex-[1.5]"></div>
                        <div className="flex-[1.5]"></div>
                        <div className="flex-1"></div>
                        <div className="flex-[1.5]"></div>
                        <div className="flex-[1.5]"></div>
                        <div className="flex-[1.5]"></div>
                        <div className="flex-[1.2]"></div>
                        <div className="flex-[2]"></div>
                    </div>
                  </div>

                  {/* Totals & Remarks Row */}
                  <div className="flex border-b border-black h-32">
                    <div className="w-1/2 p-3 font-semibold text-xs border-r border-black flex flex-col gap-1 font-mono leading-tight">
                      <div className="flex"><span className="w-20 inline-block font-bold">Remarks :</span> {invoicePreviewData.bill.remarks || 'COLD RENT'}</div>
                      <div className="flex"><span className="w-20 inline-block font-bold">Bank Detail:</span> Canara Bank</div>
                      <div className="flex"><span className="w-20 inline-block font-bold">Branch:</span> Hazira</div>
                      <div className="flex"><span className="w-20 inline-block font-bold">A/C:</span> 120029409483</div>
                      <div className="flex"><span className="w-20 inline-block font-bold">IFSC:</span> CNRB0003428</div>
                    </div>
                    <div className="w-1/2 flex flex-col font-bold text-xs p-3 font-mono justify-between">
                      <div className="space-y-1">
                          <div className="flex justify-between items-center"><span className="text-slate-600 font-medium">Total Rent:</span> <span>₹{invoicePreviewData.bill.subTotal.toFixed(2)}</span></div>
                          {invoicePreviewData.bill.taxTotal > 0 && (
                            <>
                                <div className="flex justify-between items-center"><span className="text-slate-600 font-medium">SGST ({(invoicePreviewData.bill.lineItems?.[0]?.tax / 2)}%):</span> <span>₹{(invoicePreviewData.bill.taxTotal / 2).toFixed(2)}</span></div>
                                <div className="flex justify-between items-center"><span className="text-slate-600 font-medium">CGST ({(invoicePreviewData.bill.lineItems?.[0]?.tax / 2)}%):</span> <span>₹{(invoicePreviewData.bill.taxTotal / 2).toFixed(2)}</span></div>
                            </>
                          )}
                      </div>
                      <div className="flex justify-between items-center border-t border-black pt-1 mt-1 text-sm font-black">
                        <span>Total:</span>
                        <span>₹{invoicePreviewData.bill.grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Words Row */}
                  <div className="border-b border-black p-2 font-bold text-xs uppercase font-mono">
                    Rs. {numberToWords(invoicePreviewData.bill.grandTotal)}
                  </div>

                  {/* Terms & Signature */}
                  <div className="flex h-24">
                    <div className="w-2/3 p-2 text-[8px] leading-relaxed border-r border-black flex flex-col justify-start text-slate-700">
                      <p className="font-bold mb-0.5 text-black">Terms & Conditions:</p>
                      <p>Any complaint about this tax invoice must be lodged within two working days...</p>
                      <p>Payment to be made in favour of JCRM Cold Storage LLP.</p>
                      <p>Interest @24% p.a. will be charged if not paid within 7 days.</p>
                      <p>Goods stored at owner's risk.</p>
                    </div>
                    <div className="w-1/3 flex flex-col justify-between items-center p-2 text-[10px]">
                      <div className="flex-1"></div>
                      <div className="w-full border-t border-black text-center font-bold pt-1">
                        For JCRM Cold Storage LLP
                        <p className="invisible h-2"></p>
                        Authorized Signatory
                      </div>
                    </div>
                  </div>

                  {/* Footer small text */}
                  <div className="absolute -bottom-5 w-full text-center text-[8px] text-slate-500 print:bottom-[-20px]">
                    SUBJECT TO Hazira JURISDICTION — This is a Computer Generated Invoice
                  </div>
                </div>
              </div>
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
                #invoice-content, #invoice-content * {
                  visibility: visible;
                }
                #invoice-content {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100% !important;
                  padding: 0 !important;
                  margin: 0 !important;
                }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}
