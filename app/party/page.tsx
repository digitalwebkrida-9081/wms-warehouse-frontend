"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, MoreVertical, Edit2, Trash2, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Party } from '@/app/lib/db';
import { authFetch } from '@/app/lib/auth-fetch';
import { useToast } from '@/app/_components/ToastProvider';
import { useConfirm } from '@/app/_components/ConfirmProvider';

export default function PartyPage() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [parties, setParties] = useState<Party[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Party>>({
    status: 'Active'
  });

  const fetchParties = useCallback(async () => {
    try {
      const res = await authFetch(`/api/party?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      setParties(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch parties:', error);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  // Debounce Search
  useEffect(() => {
    setPage(1); // Reset page on new search
  }, [search]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(parties.map(p => p.id));
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

  const handleOpenModal = (party?: Party) => {
    if (party) {
      setEditingParty(party);
      setFormData(party);
    } else {
      setEditingParty(null);
      setFormData({
        status: 'Active',
        name: '',
        contactPerson: '',
        mobileNo: '',
        email: '',
        address: '',
        city: '',
        gstNumber: '',
        panNumber: '',
        partyType: '',
        paymentMode: '',
        openingBalance: 0,
        aadhaarNumber: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setEditingParty(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingParty ? `/api/party/${editingParty.id}` : '/api/party';
    const method = editingParty ? 'PUT' : 'POST';
    
    try {
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        closeModal();
        fetchParties();
      } else {
        const errorData = await res.json();
        showToast('error', `Failed to save party: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save:', error);
      showToast('error', 'Network error while saving party.');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Party',
      message: 'Are you sure you want to delete this party? All related invoices and history will be affected.',
      type: 'danger',
      confirmText: 'Delete Party'
    });
    if (!confirmed) return;
    try {
      const res = await authFetch(`/api/party/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchParties();
        const newSelected = new Set(selectedIds);
        newSelected.delete(id);
        setSelectedIds(newSelected);
      } else {
        const errorData = await res.json();
        showToast('error', `Failed to delete party: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      showToast('error', 'Network error while deleting party.');
    }
  };

  const handleBulkDeleteParties = async () => {
    const count = selectedIds.size;
    if (count === 0) return;

    const confirmed = await confirm({
      title: 'Bulk Delete Parties',
      message: `Are you sure you want to delete ${count} selected parties? This action cannot be undone.`,
      type: 'danger',
      confirmText: `Delete ${count} Parties`
    });

    if (!confirmed) return;

    try {
      const res = await authFetch('/api/party/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        showToast('success', `${count} parties deleted successfully`);
        setSelectedIds(new Set());
        fetchParties();
      } else {
        const errorData = await res.json();
        showToast('error', errorData.error || 'Failed to bulk delete');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      showToast('error', 'Network error during bulk delete');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Party</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage your customer and supplier master list</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Add Party</span>
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
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, mobile, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              />
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDeleteParties}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all active:scale-95 border border-rose-100 dark:border-rose-500/20 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete ({selectedIds.size})</span>
              </button>
            )}
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
                      className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      checked={parties.length > 0 && selectedIds.size === parties.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Party Name</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Mobile No.</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">City</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Balance</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>

                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                {parties.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-sm text-neutral-500">
                      <div className="flex flex-col items-center justify-center">
                        <User className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-4" />
                        <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100">No Parties Found</p>
                        <p className="mt-1">Add your first party to get started.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  parties.map((party) => (
                    <tr key={party.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          value={party.id}
                          checked={selectedIds.has(party.id)}
                          onChange={() => handleSelectRow(party.id)}
                          className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {party.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                        {party.partyType || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                        {party.mobileNo || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                        {party.city || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                        ₹{party.openingBalance?.toLocaleString() || '0'}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                          ${party.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                            : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}`}>
                          {party.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="relative flex justify-end items-center group/menu">
                          <button className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors peer">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-800 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible peer-focus:opacity-100 peer-focus:visible transition-all z-20">
                            <div className="py-1">
                              <button
                                onClick={() => handleOpenModal(party)}
                                className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(party.id)}
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
              Showing <span className="font-medium text-neutral-900 dark:text-neutral-100">{(page - 1) * pageSize + (parties.length > 0 ? 1 : 0)}</span> to <span className="font-medium text-neutral-900 dark:text-neutral-100">{Math.min(page * pageSize, total)}</span> of <span className="font-medium text-neutral-900 dark:text-neutral-100">{total}</span> entries
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
                {editingParty ? 'Edit Party' : 'Add New Party'}
              </h3>
              <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-y-auto p-6 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Party Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="Enter legal entity name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="Name of primary contact"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Mobile No. <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    required
                    value={formData.mobileNo || ''}
                    onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Email Address</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="example@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">City</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="e.g. Mumbai"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Full Address</label>
                  <textarea
                    rows={2}
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all"
                    placeholder="Complete office/warehouse address"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">GST Number</label>
                  <input
                    type="text"
                    value={formData.gstNumber || ''}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">PAN Number</label>
                  <input
                    type="text"
                    value={formData.panNumber || ''}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="ABCDE1234F"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Party Type</label>
                  <select
                    value={formData.partyType || ''}
                    onChange={(e) => setFormData({ ...formData, partyType: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  >
                    <option value="">Select Type</option>
                    <option value="Manufacturer">Manufacturer</option>
                    <option value="Supplier">Supplier</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Wholeseller">Wholeseller</option>
                    <option value="Retailer">Retailer</option>
                    <option value="Customer">Customer</option>
                    <option value="Vendor">Vendor</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Franchiasee">Franchiasee</option>
                    <option value="Logistica provider">Logistica provider</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Payment Mode</label>
                  <select
                    value={formData.paymentMode || ''}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  >
                    <option value="">Select Mode</option>
                    <option value="Cash">Cash</option>
                    <option value="Checks">Checks</option>
                    <option value="RTGS">RTGS</option>
                    <option value="NEFT">NEFT</option>
                    <option value="IMPS">IMPS</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Opening Balance (₹)</label>
                  <input
                    type="number"
                    value={formData.openingBalance === undefined || formData.openingBalance === 0 ? "" : formData.openingBalance}
                    onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value === "" ? 0 : Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Aadhaar Number</label>
                  <input
                    type="text"
                    value={formData.aadhaarNumber || ''}
                    onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="12-digit Aadhaar"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Status</label>
                  <div className="flex items-center space-x-4 h-10">
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="status"
                        value="Active"
                        checked={formData.status === 'Active'}
                        onChange={(e) => setFormData({ ...formData, status: 'Active' })}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-neutral-300 cursor-pointer"
                      />
                      <span className="text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors font-medium">Active</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <input
                        type="radio"
                        name="status"
                        value="Inactive"
                        checked={formData.status === 'Inactive'}
                        onChange={(e) => setFormData({ ...formData, status: 'Inactive' })}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-neutral-300 cursor-pointer"
                      />
                      <span className="text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors font-medium">Inactive</span>
                    </label>
                  </div>
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
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all shadow-sm active:scale-95"
                >
                  {editingParty ? 'Save Changes' : 'Create Party'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
