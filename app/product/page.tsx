"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, MoreVertical, Edit2, Trash2, Package, ChevronLeft, ChevronRight, CheckCircle2, X } from 'lucide-react';
import { Category, ProductMaster } from '@/app/lib/db';
import { authFetch } from '@/app/lib/auth-fetch';
import { useToast } from '@/app/_components/ToastProvider';
import { useConfirm } from '@/app/_components/ConfirmProvider';

export default function ProductMasterPage() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const router = useRouter();
  const [products, setProducts] = useState<ProductMaster[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductMaster | null>(null);
  
  // Product Master Form State
  const [productFormData, setProductFormData] = useState<Partial<ProductMaster>>({
    status: 'Active',
    unit: 'kg',
    name: '',
    code: '',
    categoryId: '',
    hsnCode: '',
    price: 0,
    description: '',
    defaultLifeMonths: 0
  });

  const fetchProducts = useCallback(async () => {
    try {
      const res = await authFetch(`/api/product?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      setProducts(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  }, [page, pageSize, search]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await authFetch('/api/category?pageSize=100');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      setCategories(data.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenProductModal = (product?: ProductMaster) => {
    if (product) {
      setEditingProduct(product);
      setProductFormData({ ...product });
    } else {
      setEditingProduct(null);
      setProductFormData({
        status: 'Active',
        unit: 'kg',
        name: '',
        code: '',
        categoryId: '',
        hsnCode: '',
        price: 0,
        description: '',
        defaultLifeMonths: 0
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct ? `/api/product/${editingProduct.id}` : '/api/product';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productFormData),
      });

      if (res.ok) {
        setIsProductModalOpen(false);
        showToast('success', editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
        fetchProducts();
      } else {
        const errorData = await res.json();
        showToast('error', `Failed to save product: ${errorData.message || errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save product master:', error);
      showToast('error', 'Network error while saving product.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This may affect existing inventory records.',
      type: 'danger',
      confirmText: 'Delete Product'
    });
    if (!confirmed) return;
    try {
      const res = await authFetch(`/api/product/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
        const newSelected = new Set(selectedIds);
        newSelected.delete(id);
        setSelectedIds(newSelected);
      } else {
        const errorData = await res.json();
        showToast('error', `Failed to delete: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      showToast('error', 'Network error while deleting product.');
    }
  };

  const handleBulkDeleteProducts = async () => {
    const count = selectedIds.size;
    if (count === 0) return;

    const confirmed = await confirm({
      title: 'Bulk Delete Products',
      message: `Are you sure you want to delete ${count} selected products? This action cannot be undone.`,
      type: 'danger',
      confirmText: `Delete ${count} Products`
    });

    if (!confirmed) return;

    try {
      const res = await authFetch('/api/product/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        showToast('success', `${count} products deleted successfully`);
        setSelectedIds(new Set());
        fetchProducts();
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
      const allIds = new Set(products.map(p => p.id));
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

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Products</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage product master definitions and pricing</p>
          </div>
          <button
            onClick={() => handleOpenProductModal()}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3 text-sm text-neutral-600 dark:text-neutral-300">
            <span className="font-medium">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {[10, 15, 20, 50].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span className="font-medium">Entries</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDeleteProducts}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 transition-all active:scale-95 border border-rose-100 dark:border-rose-500/20 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete ({selectedIds.size})</span>
              </button>
            )}
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th className="px-6 py-4 text-left w-12">
                    <input
                      type="checkbox"
                      className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      checked={products.length > 0 && selectedIds.size === products.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Price (₹)</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Package className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-4" />
                        <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100">No Products Found</p>
                        <p className="text-sm text-neutral-500 mt-1">Add your first product to get started.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product.id)}
                          onChange={() => handleSelectRow(product.id)}
                          className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                        {product.code || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                        {product.categoryId || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                        {product.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100 font-semibold">
                        ₹{product.price?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                          ${product.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="relative flex justify-end items-center group/menu">
                          <button className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors peer">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-800 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible peer-focus:opacity-100 peer-focus:visible transition-all z-10">
                            <div className="py-1">
                              <button
                                onClick={() => handleOpenProductModal(product)}
                                className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
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
              Showing <span className="font-medium text-neutral-900 dark:text-neutral-100">{(page - 1) * pageSize + (products.length > 0 ? 1 : 0)}</span> to <span className="font-medium text-neutral-900 dark:text-neutral-100">{Math.min(page * pageSize, total)}</span> of <span className="font-medium text-neutral-900 dark:text-neutral-100">{total}</span> entries
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

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsProductModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden text-left flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-800/50">
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="flex flex-col flex-1 overflow-y-auto p-6 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Product Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={productFormData.name || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. KESAR RAS GREEN DORI"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Product Code</label>
                  <input
                    type="text"
                    value={productFormData.code || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. PRD-001"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Category</label>
                  <select
                    value={productFormData.categoryId || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Unit</label>
                  <select
                    value={productFormData.unit || 'kg'}
                    onChange={(e) => setProductFormData({ ...productFormData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="kg">kg</option>
                    <option value="box">box</option>
                    <option value="pcs">pcs</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">HSN Code</label>
                  <input
                    type="text"
                    value={productFormData.hsnCode || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, hsnCode: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="HSN Code"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Default Life (Months)</label>
                  <input
                    type="number"
                    value={productFormData.defaultLifeMonths === undefined || productFormData.defaultLifeMonths === 0 ? "" : productFormData.defaultLifeMonths}
                    onChange={(e) => setProductFormData({ ...productFormData, defaultLifeMonths: e.target.value === "" ? 0 : Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Product Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productFormData.price === undefined || productFormData.price === 0 ? "" : productFormData.price}
                    onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value === "" ? 0 : Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Description</label>
                  <textarea
                    rows={2}
                    value={productFormData.description || ''}
                    onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Enter product description..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">Status</label>
                  <div className="flex items-center space-x-4 h-10">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={productFormData.status === 'Active'}
                        onChange={() => setProductFormData({ ...productFormData, status: 'Active' })}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-neutral-700 dark:text-neutral-300">Active</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={productFormData.status === 'Inactive'}
                        onChange={() => setProductFormData({ ...productFormData, status: 'Inactive' })}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-neutral-700 dark:text-neutral-300">Inactive</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-neutral-200 dark:border-neutral-800 pt-5">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all shadow-sm active:scale-95"
                >
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
