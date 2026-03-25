"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Box,
} from "lucide-react";
import { PackageMaster } from "@/app/lib/db";
import { authFetch } from "@/app/lib/auth-fetch";

export default function PackagePage() {
  const [packages, setPackages] = useState<PackageMaster[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageMaster | null>(
    null,
  );

  // Form State
  const [formData, setFormData] = useState<Partial<PackageMaster>>({
    status: "Active",
    weight: 0,
    unit: "kg",
  });

  const fetchPackages = useCallback(async () => {
    try {
      const res = await authFetch(
        `/api/package?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`,
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      setPackages(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch packages:", error);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Debounce Search
  useEffect(() => {
    setPage(1); // Reset page on new search
  }, [search]);

  const handleOpenModal = (pkg?: PackageMaster) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData(pkg);
    } else {
      setEditingPackage(null);
      setFormData({
        status: "Active",
        type: "",
        weight: 0,
        unit: "kg",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setEditingPackage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingPackage
      ? `/api/package/${editingPackage.id}`
      : "/api/package";
    const method = editingPackage ? "PUT" : "POST";

    try {
      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        closeModal();
        fetchPackages();
      } else {
        const errorData = await res.json();
        alert(`Failed to save: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Failed to save:", error);
      alert('Network error while saving package.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this packaging type?"))
      return;
    try {
      const res = await authFetch(`/api/package/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchPackages();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      alert('Network error while deleting package.');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
              Package
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Manage standard packaging types and their weights
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>Add Package</span>
          </button>
        </div>

        {/* Controls Above Table */}
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3 text-sm text-neutral-600 dark:text-neutral-300">
            <span className="font-medium">Show</span>
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
                {[10, 15, 20, 30].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
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
                placeholder="Search packaging type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              />
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
                  >
                    Packaging Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
                  >
                    Weight
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
                  >
                    Unit
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider"
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                {packages.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-sm text-neutral-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <Box className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mb-4" />
                        <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                          No Packaging Types Found
                        </p>
                        <p className="mt-1">
                          Add your standard boxes, bags, or other containers.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  packages.map((pkg) => (
                    <tr
                      key={pkg.id}
                      className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100 capitalize">
                        {pkg.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300 font-mono">
                        {pkg.weight.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                        {pkg.unit || "kg"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                          ${
                            pkg.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                          }`}
                        >
                          {pkg.status}
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
                                onClick={() => handleOpenModal(pkg)}
                                className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(pkg.id)}
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
              Showing{" "}
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {(page - 1) * pageSize + (packages.length > 0 ? 1 : 0)}
              </span>{" "}
              to{" "}
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {Math.min(page * pageSize, total)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {total}
              </span>{" "}
              entries
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
          <div
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          ></div>
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden text-left flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-800/50">
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {editingPackage ? "Edit Package Type" : "Add New Package Type"}
              </h3>
              <button
                onClick={closeModal}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                  Packaging Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.type || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  <option value="">Select Type</option>
                  <option value="box">Box</option>
                  <option value="bag">Bag</option>
                  <option value="packet">Packet</option>
                  <option value="bottle">Bottle</option>
                  <option value="cane">Cane</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                  Unit
                </label>
                <input
                  type="text"
                  value={formData.unit || "kg"}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                  placeholder="e.g. kg, pcs"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                  Standard Weight (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min={0}
                  value={formData.weight === undefined || formData.weight === 0 ? "" : formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: e.target.value === "" ? 0 : Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                  Status
                </label>
                <div className="flex items-center space-x-4 h-10">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.status === "Active"}
                      onChange={() =>
                        setFormData({ ...formData, status: "Active" })
                      }
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-neutral-300"
                    />
                    <span className="text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 transition-colors">
                      Active
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="status"
                      checked={formData.status === "Inactive"}
                      onChange={() =>
                        setFormData({ ...formData, status: "Inactive" })
                      }
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-neutral-300"
                    />
                    <span className="text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 transition-colors">
                      Inactive
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-neutral-200 dark:border-neutral-800 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-700 font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all shadow-sm active:scale-95"
                >
                  {editingPackage ? "Save Changes" : "Create Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
