"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, MoreVertical, Edit2, Trash2, Calendar, DollarSign, Tag, FileText, ChevronLeft, ChevronRight, Download, X, Paperclip, CreditCard } from 'lucide-react';
import { Expense } from '@/app/lib/db';
import { authFetch } from '@/app/lib/auth-fetch';
import { useToast } from '@/app/_components/ToastProvider';
import { useConfirm } from '@/app/_components/ConfirmProvider';

export default function ExpensePage() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<Partial<Expense>>({});

  const categories = ['Office Supplies', 'Maintenance', 'Salary', 'Utilities', 'Rent', 'Travel', 'Food', 'Other'];
  const paymentModes = ['Cash', 'Bank Transfer', 'UPI', 'Check', 'Credit Card'];

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await authFetch(`/api/expenses?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      setExpenses(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleOpenModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData(expense);
    } else {
      setEditingExpense(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        paymentMode: 'Cash',
        category: 'Other'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setEditingExpense(null);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingExpense ? `/api/expenses/${editingExpense.id}` : '/api/expenses';
    const method = editingExpense ? 'PUT' : 'POST';
    
    try {
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        closeModal();
        fetchExpenses();
      } else {
        const errorData = await res.json();
        showToast('error', `Failed to save: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save expense:', error);
      showToast('error', 'Network error while saving expense.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Expense',
      message: 'Are you sure you want to delete this expense entry? This record will be permanently removed.',
      type: 'danger',
      confirmText: 'Delete Expense'
    });
    if (!confirmed) return;
    try {
      const res = await authFetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchExpenses();
        const newSelected = new Set(selectedIds);
        newSelected.delete(id);
        setSelectedIds(newSelected);
      } else {
        const errorData = await res.json();
        showToast('error', `Failed to delete expense: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to delete expense:', error);
      showToast('error', 'Network error while deleting expense.');
    }
  };

  const handleBulkDeleteExpenses = async () => {
    const count = selectedIds.size;
    if (count === 0) return;

    const confirmed = await confirm({
      title: 'Bulk Delete Expenses',
      message: `Are you sure you want to delete ${count} selected expenses? This action cannot be undone.`,
      type: 'danger',
      confirmText: `Delete ${count} Expenses`
    });

    if (!confirmed) return;

    try {
      const res = await authFetch('/api/expenses/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        showToast('success', `${count} expenses deleted successfully`);
        setSelectedIds(new Set());
        fetchExpenses();
      } else {
        const errorData = await res.json();
        showToast('error', errorData.error || 'Failed to bulk delete');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      showToast('error', 'Network error during bulk delete');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(expenses.map(exp => exp.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Expense List</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Track and manage your business expenses</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 mt-4 sm:mt-0"
          >
            <Plus className="w-5 h-5" />
            <span>Add Expense</span>
          </button>
        </div>

        {/* Controls Above Table */}
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3 text-sm text-neutral-600 dark:text-neutral-300">
            <label htmlFor="pageSize" className="font-bold text-neutral-500 uppercase tracking-widest text-[10px]">Show</label>
            <div className="relative">
              <select
                id="pageSize"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="appearance-none bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg py-1.5 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-bold"
              >
                {[10, 15, 20, 30].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <span className="font-bold text-neutral-500 uppercase tracking-widest text-[10px]">Entries</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-400" />
              </div>
              <input
                type="text"
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
              />
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDeleteExpenses}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all active:scale-95 border border-rose-100 dark:border-rose-500/20 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete ({selectedIds.size})</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Area */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-100 dark:divide-neutral-800">
              <thead className="bg-neutral-50/50 dark:bg-neutral-800/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      checked={expenses.length > 0 && selectedIds.size === expenses.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Title</th>
                  <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Amount</th>
                  <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Category</th>
                  <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Date</th>
                  <th scope="col" className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Notes</th>
                  <th scope="col" className="px-6 py-4 text-right text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-full">
                          <DollarSign className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
                        </div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">No expense data available</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-all group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(expense.id)}
                          onChange={() => handleSelectRow(expense.id)}
                          className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {expense.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-rose-600 dark:text-rose-400">
                        ₹{expense.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-600 dark:text-neutral-400">
                        {expense.date}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400 max-w-xs truncate">
                        {expense.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="relative flex justify-end items-center group/menu">
                          <button className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all peer">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-neutral-950 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible peer-focus:opacity-100 peer-focus:visible transition-all z-20 overflow-hidden text-left">
                            <div className="py-1">
                              <button
                                onClick={() => handleOpenModal(expense)}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 flex items-center gap-3 transition-colors"
                              >
                                <Edit2 className="w-4 h-4 text-indigo-500" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-3 transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-rose-500" /> Delete
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
          <div className="bg-neutral-50/50 dark:bg-neutral-800/10 px-8 py-5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              Showing <span className="text-neutral-900 dark:text-neutral-100">{(page - 1) * pageSize + (expenses.length > 0 ? 1 : 0)}</span> — <span className="text-neutral-900 dark:text-neutral-100">{Math.min(page * pageSize, total)}</span> of <span className="text-neutral-900 dark:text-neutral-100">{total}</span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
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
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md" onClick={closeModal}></div>
          <div className="relative bg-white dark:bg-neutral-900 rounded-4xl shadow-2xl w-full max-w-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden text-left flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900">
              <div>
                <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tighter">
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">Transaction registration</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                <X className="w-6 h-6 text-neutral-400" />
              </button>
            </div>
            
            <form onSubmit={handleSaveExpense} className="flex flex-col flex-1 overflow-y-auto p-8 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Expense Title <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <FileText className="w-4 h-4 text-neutral-400" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Office Stationery"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Amount (₹) <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <DollarSign className="w-4 h-4 text-neutral-400" />
                    </div>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="0.00"
                      value={formData.amount || ''}
                      onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-rose-600 dark:text-rose-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Category <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Tag className="w-4 h-4 text-neutral-400" />
                    </div>
                    <select
                      required
                      value={formData.category || ''}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select Category</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Date <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                    </div>
                    <input
                      type="date"
                      required
                      value={formData.date || ''}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Payment Mode</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <CreditCard className="w-4 h-4 text-neutral-400" />
                    </div>
                    <select
                      value={formData.paymentMode || ''}
                      onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold appearance-none cursor-pointer"
                    >
                      {paymentModes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Attachment / Reference URL</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Paperclip className="w-4 h-4 text-neutral-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={formData.attachmentUrl || ''}
                      onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Notes / Description</label>
                  <textarea
                    rows={4}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-4xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="Any additional details..."
                  />
                </div>
              </div>

              <div className="mt-12 flex justify-end gap-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-8 py-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 font-bold text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-10 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black transition-all hover:shadow-indigo-500/30 shadow-lg active:scale-95 uppercase tracking-widest text-[10px]"
                >
                  {editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
