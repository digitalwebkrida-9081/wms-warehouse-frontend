"use client";
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Search, MoreVertical, Edit2, Trash2, ArrowRightCircle, FileText, CheckCircle2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Inward, Outward } from '@/app/lib/db';

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

  const fetchOutwards = useCallback(async () => {
    try {
      let url = `/api/outward?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`;
      if (inwardIdFilter) {
        url += `&inwardId=${inwardIdFilter}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setOutwards(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch outwards:', error);
    }
  }, [page, pageSize, search, inwardIdFilter]);

  const fetchInwards = useCallback(async () => {
    try {
      // Fetch all inwards to populate the selection dropdown
      const res = await fetch(`/api/inwards?pageSize=100`);
      const data = await res.json();
      setInwards(data.data);
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
        // Optional: you could pre-fill outwardWeight with remainingWeight
        outwardWeight: selectedInward.remainingWeight
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingOutward ? `/api/outward/${editingOutward.id}` : '/api/outward';
    const method = editingOutward ? 'PUT' : 'POST';
    
    try {
      // Ensure we only send the ID, not the populated object if it somehow got in there
      const payload = { ...formData };
      if (typeof payload.inwardId === 'object') {
        payload.inwardId = (payload.inwardId as any).id;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        closeModal();
        fetchOutwards();
      }
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this outward entry?')) return;
    try {
      await fetch(`/api/outward/${id}`, { method: 'DELETE' });
      fetchOutwards();
      const newSelected = new Set(selectedIds);
      newSelected.delete(id);
      setSelectedIds(newSelected);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleGenerateBill = async () => {
    if (selectedIds.size === 0) return;
    try {
      const res = await fetch('/api/billing/generate-from-outward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outwardIds: Array.from(selectedIds) }),
      });
      const data = await res.json();
      alert(`Success! Generated Outward Bill ID: ${data.billId} with total weight ${data.totalWeight}kg`);
      setSelectedIds(new Set()); // clear selection
      fetchOutwards();
    } catch (error) {
      console.error('Failed to generate bill:', error);
      alert('Error generating bill');
    }
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
                      checked={outwards.length > 0 && selectedIds.size === outwards.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Inward Date</th>
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
                {outwards.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-sm text-neutral-500">
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
                        {outward.inwardDetails?.inwardDate || '-'}
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
                        {i.partyId} - {i.productId} ({i.inwardDate}) - Rem: {i.remainingWeight}kg
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
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Outward Weight (kg) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.outwardWeight || ''}
                    onChange={(e) => setFormData({ ...formData, outwardWeight: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
    </div>
  );
}
