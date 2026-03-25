"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRightCircle,
  FileText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  Plus,
  Calculator,
  Wallet,
  CreditCard,
  Calendar,
  Clock,
  Percent,
  Printer,
  FileDown,
} from "lucide-react";
import { Quotation } from "@/app/lib/db";
import { authFetch } from "@/app/lib/auth-fetch";

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
  footerText: string;
}

interface Inward {
  id: string;
  inwardDate: string;
  partyId: string;
  productId: string;
  totalWeight: number;
  remainingWeight: number;
  goodsCondition: string;
  remarks: string;
  inwardNumber?: string;
}
export default function QuotationPage() {
  const router = useRouter();
  const [inwards, setInwards] = useState<Inward[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Quotation Management State
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [quotationPreview, setQuotationPreview] = useState<any>(null);
  const [quotationPreviewData, setQuotationPreviewData] = useState<{
    quotation: any;
    partyDetails: any;
  } | null>(null);

  // Inward Management State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInward, setEditingInward] = useState<Inward | null>(null);
  const [formData, setFormData] = useState<Partial<Inward>>({});
  const [parties, setParties] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"inwards" | "quotations">("inwards");

  // Quotation Data State
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [quotationTotal, setQuotationTotal] = useState(0);
  const [quotationPage, setQuotationPage] = useState(1);
  const [quotationPageSize, setQuotationPageSize] = useState(10);
  const [quotationSearch, setQuotationSearch] = useState("");

  // Quotation Edit State
  const [isEditQuotationModalOpen, setIsEditQuotationModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [quotationFormData, setQuotationFormData] = useState<Partial<Quotation>>({});

  const products = ["KESAR RAS GREEN DORI", "ALPHONSO MANGO", "FROZEN PEAS"];

  // Company Settings State
  const [companySettings, setCompanySettings] =
    useState<CompanySettings | null>(null);

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

  const fetchInwards = useCallback(async () => {
    try {
      const res = await authFetch(
        `/api/inwards?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`,
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      setInwards(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch inwards:", error);
    }
  }, [page, pageSize, search]);

  const fetchParties = useCallback(async () => {
    try {
      const res = await authFetch(`/api/party?pageSize=100`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      if (data.data) {
        const uniqueNames = Array.from(new Set(data.data.map((p: any) => p.name)));
        setParties(uniqueNames as string[]);
      }
    } catch (error) {
      console.error("Failed to fetch parties:", error);
    }
  }, []);

  const fetchQuotations = useCallback(async () => {
    try {
      const res = await authFetch(
        `/api/quotation?page=${quotationPage}&pageSize=${quotationPageSize}&search=${encodeURIComponent(quotationSearch)}`,
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      setQuotations(data.data || []);
      setQuotationTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch quotations:", error);
    }
  }, [quotationPage, quotationPageSize, quotationSearch]);

  useEffect(() => {
    if (activeTab === "inwards") {
      fetchInwards();
    } else {
      fetchQuotations();
    }
  }, [activeTab, fetchInwards, fetchQuotations]);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(inwards.map((i) => i.id));
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
        inwardDate: new Date().toISOString().split("T")[0],
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setEditingInward(null);
  };

  const handleSaveInward = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingInward
      ? `/api/inwards/${editingInward.id}`
      : "/api/inwards";
    const method = editingInward ? "PUT" : "POST";

    try {
      const res = await authFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        closeModal();
        fetchInwards();
      } else {
        const errorData = await res.json();
        alert(`Failed to save inward: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Failed to save inward:", error);
      alert('Network error while saving inward.');
    }
  };

  const handleDeleteInward = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inward?")) return;
    try {
      const res = await authFetch(`/api/inwards/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchInwards();
        const newSelected = new Set(selectedIds);
        newSelected.delete(id);
        setSelectedIds(newSelected);
      } else {
        const errorData = await res.json();
        alert(`Failed to delete inward: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Failed to delete inward:", error);
      alert('Network error while deleting inward.');
    }
  };

  const handleOpenQuotationModal = async () => {
    if (selectedIds.size === 0) return;
    try {
      const res = await authFetch("/api/quotation/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inwardIds: Array.from(selectedIds) }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.message || 'Failed to generate preview');
      }
      const data = await res.json();
      setQuotationPreview(data);
      setIsQuotationModalOpen(true);
    } catch (error: any) {
      console.error("Failed to generate preview:", error);
      alert(`Error generating preview: ${error.message}`);
    }
  };

  const handleSaveQuotation = async () => {
    try {
      const res = await authFetch("/api/quotation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quotationPreview),
      });
      if (res.ok) {
        const data = await res.json();
        setIsQuotationModalOpen(false);
        setSelectedIds(new Set());
        fetchInwards();
        fetchQuotations();

        // Refresh company settings so preview has latest data
        await fetchCompanySettings();

        // Show Quotation Preview
        setQuotationPreviewData(data);
      } else {
        const errorData = await res.json();
        alert(`Failed to save quotation: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to save quotation:", error);
      alert(
        "Failed to save quotation. Please check your connection or server status.",
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const element = document.getElementById("invoice-content");
      if (!element) return;

      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/jpeg", 0.98);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Quotation_${quotationPreviewData?.quotation?.quotationNumber}.pdf`);
    } catch (e) {
      console.error("Failed to generate PDF:", e);
      alert("Could not download PDF. Please try printing to PDF instead.");
    }
  };

  const handleViewQuotation = async (quotation: Quotation) => {
    try {
      // Refresh company settings to ensure latest data
      await fetchCompanySettings();
  
      // Fetch party info
      const partyResponse = await authFetch(
        `/api/party?pageSize=1&search=${encodeURIComponent(quotation.partyId)}`,
      );
      if (!partyResponse.ok) {
        throw new Error('Failed to fetch party details');
      }
      const partyData = await partyResponse.json();
  
      setQuotationPreviewData({
        quotation,
        partyDetails: partyData?.data?.[0] || {},
      });
    } catch (error) {
      console.error("Failed to fetch party for quotation:", error);
      setQuotationPreviewData({
        quotation,
        partyDetails: {},
      });
    }
  };

  const numberToWords = (num: number) => {
    if (num === 0) return "Zero Only";

    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    function convertSection(n: number): string {
      if (n === 0) return "";
      if (n < 20) return ones[n];
      if (n < 100)
        return (
          tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
        );
      return (
        ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " and " + convertSection(n % 100) : "")
      );
    }

    const main = Math.floor(num);
    const fraction = Math.round((num - main) * 100);

    let result = "";
    let n = main;

    if (n >= 10000000) {
      result += convertSection(Math.floor(n / 10000000)) + " Crore ";
      n %= 10000000;
    }
    if (n >= 100000) {
      result += convertSection(Math.floor(n / 100000)) + " Lakh ";
      n %= 100000;
    }
    if (n >= 1000) {
      result += convertSection(Math.floor(n / 1000)) + " Thousand ";
      n %= 1000;
    }
    if (n > 0) {
      result += convertSection(n);
    }

    if (result.trim() === "") result = "Zero";
    result = result.trim() + " Rupees";

    if (fraction > 0) {
      result += " and " + convertSection(fraction) + " Paisa";
    }

    return result + " Only";
  };

  const handleEditQuotation = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setQuotationFormData(quotation);
    setIsEditQuotationModalOpen(true);
  };

  const handleUpdateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuotation) return;
    try {
      const res = await authFetch(`/api/quotation/${editingQuotation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quotationFormData),
      });
      if (res.ok) {
        setIsEditQuotationModalOpen(false);
        fetchQuotations();
      } else {
        const errorData = await res.json();
        alert(`Failed to update quotation: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Failed to update quotation:", error);
      alert('Network error while updating quotation.');
    }
  };

  const deleteQuotation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quotation?")) return;
    try {
      const res = await authFetch(`/api/quotation/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchQuotations();
      } else {
        const text = await res.text();
        let message = `Server returned ${res.status}`;
        try {
          const errorData = JSON.parse(text);
          message = errorData.error || errorData.message || message;
        } catch {
          message += `: ${text.slice(0, 100)}`;
        }
        alert(`Failed to delete quotation: ${message}`);
      }
    } catch (error) {
      console.error("Failed to delete quotation:", error);
      alert('Network error while deleting quotation. Is the backend server running?');
    }
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newLineItems = [...quotationPreview.lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };

    // Recalculate total for this item
    if (
      field === "quantity" ||
      field === "weight" ||
      field === "months" ||
      field === "rate" ||
      field === "tax"
    ) {
      const qty =
        field === "quantity"
          ? Number(value)
          : newLineItems[index].quantity || 0;
      const weight =
        field === "weight" ? Number(value) : newLineItems[index].weight || qty;
      const months =
        field === "months" ? Number(value) : newLineItems[index].months || 1;
      const rate = field === "rate" ? Number(value) : newLineItems[index].rate;
      const taxPercent =
        field === "tax" ? Number(value) : newLineItems[index].tax;

      const sub = weight * rate * months;
      const taxAmt = (sub * taxPercent) / 100;
      newLineItems[index].total = sub + taxAmt;
    }

    // Recalculate grand totals
    let subTotal = 0;
    let taxTotal = 0;
    newLineItems.forEach((item: any) => {
      const w = item.weight || item.quantity || 0;
      const m = item.months || 1;
      const s = w * item.rate * m;
      subTotal += s;
      taxTotal += (s * item.tax) / 100;
    });

    setQuotationPreview({
      ...quotationPreview,
      lineItems: newLineItems,
      subTotal,
      taxTotal,
      grandTotal: subTotal + taxTotal,
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 uppercase">
              {activeTab === "inwards" ? "Quotation Queue" : "Estimate History"}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {activeTab === "inwards"
                ? "Process pending inwards to generate bills"
                : "View and manage generated invoices"}
            </p>
          </div>

          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl mt-4 sm:mt-0">
            <button
              onClick={() => setActiveTab("inwards")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === "inwards" ? "bg-white dark:bg-neutral-700 text-indigo-600 shadow-sm" : "text-neutral-500"}`}
            >
              Pending Inwards
            </button>
            <button
              onClick={() => setActiveTab("quotations")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${activeTab === "quotations" ? "bg-white dark:bg-neutral-700 text-indigo-600 shadow-sm" : "text-neutral-500"}`}
            >
              Saved Quotations
            </button>
          </div>
        </div>
        {/* Bordered Block with Controls */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col lg:flex-row justify-between items-center gap-4 transition-all hover:shadow-md">
          <div className="flex items-center space-x-3 text-sm text-neutral-600 dark:text-neutral-300 w-full lg:w-auto">
            <label
              htmlFor="pageSize"
              className="font-semibold text-neutral-500 uppercase tracking-wider text-[11px]"
            >
              Show
            </label>
            <div className="relative group">
              <select
                id="pageSize"
                value={activeTab === "inwards" ? pageSize : quotationPageSize}
                onChange={(e) => {
                  const size = Number(e.target.value);
                  if (activeTab === "inwards") {
                    setPageSize(size);
                    setPage(1);
                  } else {
                    setQuotationPageSize(size);
                    setQuotationPage(1);
                  }
                }}
                className="appearance-none bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg py-1.5 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all hover:border-indigo-300"
              >
                {[10, 15, 20, 30].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                <ChevronLeft className="w-4 h-4 -rotate-90" />
              </div>
            </div>
            <span className="font-semibold text-neutral-500 uppercase tracking-wider text-[11px]">
              Entries
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-72 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-neutral-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search or select..."
                value={activeTab === "inwards" ? search : quotationSearch}
                onChange={(e) =>
                  activeTab === "inwards"
                    ? setSearch(e.target.value)
                    : setQuotationSearch(e.target.value)
                }
                className="block w-full pl-10 pr-3 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-inner"
              />
            </div>

            {activeTab === "inwards" && (
              <button
                onClick={handleOpenQuotationModal}
                disabled={selectedIds.size === 0}
                className={`flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap w-full sm:w-auto active:scale-95 shadow-lg
                  ${selectedIds.size > 0
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/20"
                    : "bg-neutral-100 text-neutral-400 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-600 shadow-none"
                  }`}
              >
                <Calculator className="w-4 h-4" />
                <span>Generate Quotation</span>
                {selectedIds.size > 0 && (
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full ml-1">
                    {selectedIds.size}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
        {/* Table Area */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === "inwards" ? (
              <table className="min-w-full divide-y divide-neutral-100 dark:divide-neutral-800">
                <thead className="bg-neutral-50/50 dark:bg-neutral-800/50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        className="rounded-lg border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5 transition-all"
                        checked={
                          inwards.length > 0 &&
                          selectedIds.size === inwards.length
                        }
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Inward Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Total Weight
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Remaining
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Party
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Condition
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-center text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Outward
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                  {inwards.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-full">
                            <Download className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
                          </div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                            No records found matching your selection
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    inwards.map((inward) => (
                      <tr
                        key={inward.id}
                        className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-all group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            value={inward.id}
                            checked={selectedIds.has(inward.id)}
                            onChange={() => handleSelectRow(inward.id)}
                            className="rounded-lg border-neutral-300 text-indigo-600 focus:ring-indigo-500 w-5 h-5 cursor-pointer shadow-sm transition-all"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {inward.inwardDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {inward.totalWeight.toLocaleString()}{" "}
                          <span className="text-[10px] opacity-50 uppercase ml-1">
                            kg
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border shadow-sm
                            ${inward.remainingWeight > 0
                                ? inward.remainingWeight === inward.totalWeight
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                  : "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                                : "bg-neutral-50 text-neutral-500 border-neutral-100 dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700"
                              }`}
                          >
                            {inward.remainingWeight.toLocaleString()} KG
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {inward.partyId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-600 dark:text-neutral-400 italic">
                          {inward.productId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="inline-flex items-center text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                            {inward.goodsCondition === "Good" && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-2" />
                            )}
                            {inward.goodsCondition || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <button
                            onClick={() =>
                              router.push(`/outwards?inwardId=${inward.id}`)
                            }
                            className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/50 hover:bg-white dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-lg text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest transition-all hover:shadow-sm"
                          >
                            <span>Entry</span>
                            <ArrowRightCircle className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="relative flex justify-end items-center group/menu">
                            <button className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all peer">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-neutral-950 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible peer-focus:opacity-100 peer-focus:visible transition-all z-20 overflow-hidden">
                              <div className="py-1 text-left">
                                <button
                                  onClick={() => handleOpenModal(inward)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 flex items-center gap-3 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4 text-indigo-500" />{" "}
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteInward(inward.id)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-3 transition-colors"
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
            ) : (
              <table className="min-w-full divide-y divide-neutral-100 dark:divide-neutral-800">
                <thead className="bg-neutral-50/50 dark:bg-neutral-800/50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Quotation No
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Party
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Total Amount (₹)
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-center text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-right text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest"
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                  {quotations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-full">
                            <FileText className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
                          </div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                            No quotation records
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    quotations.map((quotation) => (
                      <tr
                        key={quotation.id}
                        className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-all group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-indigo-600 dark:text-indigo-400">
                          {quotation.quotationNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-600 dark:text-neutral-400">
                          {quotation.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {quotation.partyId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-neutral-900 dark:text-neutral-50">
                          ₹
                          {quotation.grandTotal.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border shadow-sm
                            ${quotation.status === "Approved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                : quotation.status === "Pending"
                                  ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                                  : "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                              }`}
                          >
                            {quotation.status || "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="relative flex justify-end items-center group/menu">
                            <button className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all peer">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-neutral-950 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible peer-focus:opacity-100 peer-focus:visible transition-all z-20 overflow-hidden text-left">
                              <div className="py-1">
                                <button
                                  onClick={() => handleViewQuotation(quotation)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 flex items-center gap-3 transition-colors"
                                >
                                  <FileText className="w-4 h-4 text-indigo-500" />{" "}
                                  View Quotation
                                </button>
                                <button
                                  onClick={() => handleEditQuotation(quotation)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 flex items-center gap-3 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4 text-indigo-500" />{" "}
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteQuotation(quotation.id)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-3 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-500" />{" "}
                                  Delete
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
            )}
          </div>
          {/* Pagination */}
          <div className="bg-neutral-50/50 dark:bg-neutral-800/10 px-8 py-5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
              {activeTab === "inwards" ? (
                <>
                  Showing{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {(page - 1) * pageSize + (inwards.length > 0 ? 1 : 0)}
                  </span>{" "}
                  —{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {Math.min(page * pageSize, total)}
                  </span>{" "}
                  of{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {total}
                  </span>
                </>
              ) : (
                <>
                  Showing{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {(quotationPage - 1) * quotationPageSize + (quotations.length > 0 ? 1 : 0)}
                  </span>{" "}
                  —{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {Math.min(quotationPage * quotationPageSize, quotationTotal)}
                  </span>{" "}
                  of{" "}
                  <span className="text-neutral-900 dark:text-neutral-100">
                    {quotationTotal}
                  </span>
                </>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() =>
                  activeTab === "inwards"
                    ? setPage((p) => Math.max(1, p - 1))
                    : setQuotationPage((p) => Math.max(1, p - 1))
                }
                disabled={activeTab === "inwards" ? page === 1 : quotationPage === 1}
                className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  activeTab === "inwards"
                    ? setPage((p) => Math.min(totalPages, p + 1))
                    : setQuotationPage((p) =>
                      Math.min(Math.ceil(quotationTotal / quotationPageSize), p + 1),
                    )
                }
                disabled={
                  activeTab === "inwards"
                    ? page === totalPages || totalPages === 0
                    : quotationPage === Math.ceil(quotationTotal / quotationPageSize) ||
                    quotationTotal === 0
                }
                className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-white dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>{" "}
          {/* Pagination (564) Close */}
        </div>{" "}
        {/* Table Area (370) Close */}
      </div>{" "}
      {/* max-w-7xl (276) Close */}
      {/* Inward Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          ></div>
          <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden text-left flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-800/50">
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                {editingInward ? "Edit Inward" : "Add New Inward"}
              </h3>
              <button
                onClick={closeModal}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <span className="sr-only">Close</span>
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={handleSaveInward}
              className="flex flex-col flex-1 overflow-y-auto p-6 text-sm"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                    Inward Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.inwardDate || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, inwardDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                    Party <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.partyId || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, partyId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="" disabled>
                      Select Party
                    </option>
                    {parties.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                    Product <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.productId || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, productId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="" disabled>
                      Select Product
                    </option>
                    {products.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                    Total Weight (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.totalWeight || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalWeight: Number(e.target.value),
                        remainingWeight: editingInward
                          ? formData.remainingWeight
                          : Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                    Remaining Weight (kg)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={
                      formData.remainingWeight !== undefined
                        ? formData.remainingWeight
                        : ""
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        remainingWeight: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                    Goods Condition
                  </label>
                  <select
                    value={formData.goodsCondition || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        goodsCondition: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select Condition</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                    Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={formData.remarks || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, remarks: e.target.value })
                    }
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
                  {editingInward ? "Save Changes" : "Create Inward"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Quotation Creation Screen / Modal */}
      {isQuotationModalOpen && quotationPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md"
            onClick={() => setIsQuotationModalOpen(false)}
          ></div>
          <div className="relative bg-white dark:bg-neutral-900 rounded-4xl shadow-2xl w-full max-w-5xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 relative z-10">
              <div>
                <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tighter flex items-center gap-3">
                  <Calculator className="w-7 h-7 text-indigo-600" />
                  Create New Quotation
                </h3>
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mt-1">
                  Quotation Generation for {quotationPreview.partyId}
                </p>
              </div>
              <button
                onClick={() => setIsQuotationModalOpen(false)}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-6 h-6 text-neutral-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Quotation Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Quotation Number
                  </label>
                  <input
                    type="text"
                    value={quotationPreview.quotationNumber}
                    onChange={(e) =>
                      setQuotationPreview({
                        ...quotationPreview,
                        quotationNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Quotation Date
                  </label>
                  <input
                    type="date"
                    value={quotationPreview.date}
                    onChange={(e) =>
                      setQuotationPreview({ ...quotationPreview, date: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Party ID
                  </label>
                  <p className="px-4 py-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl font-black text-indigo-600 dark:text-indigo-400 text-sm">
                    {quotationPreview.partyId}
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="bg-neutral-50 dark:bg-neutral-950/50 rounded-3xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-800">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        Description
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 w-32">
                        Weight/Qty
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 w-24">
                        Months
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 w-32">
                        Rate (₹)
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 w-24">
                        Tax (%)
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right w-40">
                        Total (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {quotationPreview.lineItems.map((item: any, idx: number) => (
                      <tr
                        key={idx}
                        className="group hover:bg-white dark:hover:bg-neutral-900 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              updateLineItem(idx, "description", e.target.value)
                            }
                            className="w-full bg-transparent font-medium border-0 focus:ring-0 p-0 outline-none text-neutral-900 dark:text-neutral-100"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={item.weight || item.quantity} // Default to weight, or fallback to quantity
                            onChange={(e) =>
                              updateLineItem(idx, "weight", e.target.value)
                            }
                            className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-0 rounded-lg px-2 py-1.5 font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={item.months || 1}
                            onChange={(e) =>
                              updateLineItem(idx, "months", e.target.value)
                            }
                            className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-0 rounded-lg px-2 py-1.5 font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) =>
                              updateLineItem(idx, "rate", e.target.value)
                            }
                            className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-0 rounded-lg px-2 py-1.5 font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={item.tax}
                            onChange={(e) =>
                              updateLineItem(idx, "tax", e.target.value)
                            }
                            className="w-full bg-neutral-100 dark:bg-neutral-800/50 border-0 rounded-lg px-2 py-1.5 font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                        </td>
                        <td className="px-6 py-4 text-right font-black text-indigo-600 dark:text-indigo-400">
                          {item.total.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary & Totals */}
              <div className="flex flex-col md:flex-row justify-between gap-12 pt-4">
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                      Remarks / Terms
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Add payment terms or notes..."
                      value={quotationPreview.remarks}
                      onChange={(e) =>
                        setQuotationPreview({
                          ...quotationPreview,
                          remarks: e.target.value,
                        })
                      }
                      className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-4xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="w-full md:w-80 space-y-3 bg-neutral-900 dark:bg-black rounded-4xl p-8 text-white shadow-xl transform hover:scale-[1.02] transition-transform">
                  <div className="flex justify-between items-center opacity-60">
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Sub Total
                    </span>
                    <span className="font-bold font-mono">
                      ₹
                      {quotationPreview.subTotal?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center opacity-60">
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Tax Amount
                    </span>
                    <span className="font-bold font-mono">
                      ₹
                      {quotationPreview.taxTotal?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="h-px bg-white/10 my-4" />
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                        Grand Total
                      </span>
                      <p className="text-4xl font-black tracking-tighter font-mono">
                        ₹
                        {quotationPreview.grandTotal?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-8 py-6 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex justify-end gap-5">
              <button
                onClick={() => setIsQuotationModalOpen(false)}
                className="px-8 py-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 font-bold text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all uppercase tracking-widest text-[10px]"
              >
                Discard
              </button>
              <button
                onClick={handleSaveQuotation}
                className="px-10 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black transition-all hover:shadow-indigo-500/30 shadow-lg active:scale-95 uppercase tracking-widest text-[10px] flex items-center gap-3"
              >
                <FileText className="w-4 h-4" />
                Save & Generate Quotation
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Quotation Modal */}
      {isEditQuotationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md"
            onClick={() => setIsEditQuotationModalOpen(false)}
          ></div>
          <div className="relative bg-white dark:bg-neutral-900 rounded-4xl shadow-2xl w-full max-w-4xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900">
              <div>
                <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tighter">
                  Edit Quotation: {quotationFormData.quotationNumber}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">
                  Update quotation details and status
                </p>
              </div>
              <button
                onClick={() => setIsEditQuotationModalOpen(false)}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-6 h-6 text-neutral-400" />
              </button>
            </div>

            <form
              onSubmit={handleUpdateQuotation}
              className="flex-1 overflow-y-auto p-8 space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Outward Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="date"
                      value={quotationFormData.outwardDate || ""}
                      onChange={(e) =>
                        setQuotationFormData({
                          ...quotationFormData,
                          outwardDate: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Storage Months
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="number"
                      min={1}
                      value={quotationFormData.storageMonths || 1}
                      onChange={(e) =>
                        setQuotationFormData({
                          ...quotationFormData,
                          storageMonths: Number(e.target.value),
                        })
                      }
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    GST (%)
                  </label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={quotationFormData.gst || 0}
                      onChange={(e) =>
                        setQuotationFormData({
                          ...quotationFormData,
                          gst: Number(e.target.value),
                        })
                      }
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Status
                  </label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <select
                      value={quotationFormData.status || "Pending"}
                      onChange={(e) =>
                        setQuotationFormData({
                          ...quotationFormData,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                    >
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Payment Mode
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <select
                      value={quotationFormData.paymentMode || "Cash"}
                      onChange={(e) =>
                        setQuotationFormData({
                          ...quotationFormData,
                          paymentMode: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI">UPI</option>
                      <option value="Check">Check</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Remarks
                </label>
                <textarea
                  rows={3}
                  value={quotationFormData.remarks || ""}
                  onChange={(e) =>
                    setQuotationFormData({
                      ...quotationFormData,
                      remarks: e.target.value,
                    })
                  }
                  className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-3xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="mt-8 flex justify-end gap-5">
                <button
                  type="button"
                  onClick={() => setIsEditQuotationModalOpen(false)}
                  className="px-8 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 font-bold text-neutral-500 text-[10px] uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-10 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                >
                  Update Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Quotation Preview Modal */}
      {quotationPreviewData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm print:bg-white print:z-auto print:block print:relative print:p-0 p-4">
          <div className="flex flex-col max-h-[95vh] w-full max-w-5xl bg-slate-100 rounded-lg shadow-2xl relative print:h-auto print:max-h-none print:shadow-none print:bg-white">
            {/* Modal Header controls (Hidden on Print) */}
            <div className="flex justify-between items-center p-4 bg-white border-b print:hidden rounded-t-lg">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="text-indigo-600" />
                Quotation Preview
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print Quotation
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 font-bold rounded-lg transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  Download PDF
                </button>
                <div className="w-px h-6 bg-slate-200 mx-2"></div>
                <button
                  onClick={() => setQuotationPreviewData(null)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Printable Area */}
            <div className="flex-1 overflow-auto p-4 print:p-0 print:overflow-visible custom-scrollbar flex justify-center">
              <div
                id="invoice-content"
                className="w-[210mm] min-h-[297mm] bg-white text-black p-[10mm] shadow-md border border-slate-200 print:shadow-none print:border-none print:w-full font-sans text-sm mx-auto"
              >
                <div className="border border-black flex flex-col h-full relative">
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
                            {companySettings?.companyTagline || "COLD STORAGE"}
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

                  {/* Party & Quotation Info Row */}
                  <div className="flex border-b border-black">
                    <div className="w-1/2 p-3 border-r border-black flex flex-col gap-1.5 text-xs font-bold font-mono">
                      <div className="flex">
                        <span className="w-16 flex-shrink-0 text-slate-600">
                          M/S:
                        </span>{" "}
                        <span className="uppercase text-sm leading-tight ml-2">
                          {quotationPreviewData.quotation.partyId}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="w-16 flex-shrink-0 text-slate-600">
                          GST:
                        </span>{" "}
                        <span className="uppercase ml-2 leading-tight">
                          {quotationPreviewData.partyDetails?.gstNumber ||
                            "Unregistered"}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="w-16 flex-shrink-0 text-slate-600">
                          PAN:
                        </span>{" "}
                        <span className="uppercase ml-2 leading-tight">
                          {quotationPreviewData.partyDetails?.panNumber || "-"}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="w-16 flex-shrink-0 text-slate-600">
                          Ph:
                        </span>{" "}
                        <span className="uppercase ml-2 leading-tight">
                          {quotationPreviewData.partyDetails?.mobileNo || "-"}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="w-16 flex-shrink-0 text-slate-600">
                          Email:
                        </span>{" "}
                        <span className="ml-2 leading-tight truncate">
                          {quotationPreviewData.partyDetails?.email || "-"}
                        </span>
                      </div>
                      {quotationPreviewData.partyDetails?.address && (
                        <div className="flex mt-1 text-[10px] text-slate-600 leading-tight">
                          <span className="w-16 flex-shrink-0">ADD:</span>
                          <span className="uppercase ml-2">
                            {quotationPreviewData.partyDetails.address},{" "}
                            {quotationPreviewData.partyDetails.city}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="w-1/2 p-3 flex flex-col gap-1.5 text-xs font-bold relative font-mono">
                      <div className="absolute top-2 right-0 left-0 text-center font-black text-sm tracking-widest uppercase">
                        QUOTATION / PROFORMA
                      </div>
                      <div className="mt-6 flex flex-col gap-2 relative z-10">
                        <div>ESTIMATE / PROFORMA</div>
                        <div>SAC: {companySettings?.sacCode || "996721"}</div>
                        <div>Quotation No: {quotationPreviewData.quotation.quotationNumber}</div>
                        <div>Date: {quotationPreviewData.quotation.date}</div>
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
                  <div className="flex-1 border-b border-black font-semibold text-[10px] flex flex-col divide-y divide-black/20 min-h-[300px]">
                    {quotationPreviewData.quotation.lineItems.map(
                      (item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex text-center divide-x divide-black/40 min-h-[28px] py-1.5 items-center"
                        >
                          <div
                            className="flex-[3] px-2 text-left truncate uppercase"
                            title={item.description}
                          >
                            {item.description}
                          </div>
                          <div className="flex-[1.5] px-2">
                            {item.inDate || "-"}
                          </div>
                          <div className="flex-[1.5] px-2">-</div>
                          <div className="flex-1 px-2">{item.quantity}</div>
                          <div className="flex-[1.5] px-2">
                            {item.weight || item.quantity}
                          </div>
                          <div className="flex-[1.5] px-2">
                            {item.remaining || 0}
                          </div>
                          <div className="flex-[1.5] px-2">
                            {Number(item.rate).toFixed(2)}
                          </div>
                          <div className="flex-[1.2] px-2">
                            {item.months || 1}
                          </div>
                          <div className="flex-[2] px-2 text-right">
                            {Number(item.total).toFixed(2)}
                          </div>
                        </div>
                      ),
                    )}
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
                  <div className="flex border-b border-black h-36">
                    <div className="w-1/2 p-4 font-semibold text-xs border-r border-black flex flex-col gap-1.5 font-mono leading-tight bg-slate-50/30">
                      <div className="flex">
                        <span className="w-24 inline-block font-bold text-slate-500">
                          Remarks :
                        </span>{" "}
                        <span className="text-black uppercase">
                          {quotationPreviewData.quotation.remarks || "COLD RENT"}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="w-24 inline-block font-bold text-slate-500">
                          Bank Detail:
                        </span>{" "}
                        <span className="text-black uppercase">
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
                          {companySettings?.accountNumber || "120029409483"}
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
                    <div className="w-1/2 flex flex-col font-bold text-xs p-4 font-mono justify-between bg-white">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-bold uppercase tracking-tighter">
                            Sub Total:
                          </span>{" "}
                          <span className="text-base text-black">
                            ₹{quotationPreviewData.quotation.subTotal.toFixed(2)}
                          </span>
                        </div>
                        {quotationPreviewData.quotation.taxTotal > 0 && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-bold uppercase tracking-tighter">
                                SGST Total:
                              </span>{" "}
                              <span className="text-black">
                                ₹
                                {(quotationPreviewData.quotation.taxTotal / 2).toFixed(
                                  2,
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-bold uppercase tracking-tighter">
                                CGST Total:
                              </span>{" "}
                              <span className="text-black">
                                ₹
                                {(quotationPreviewData.quotation.taxTotal / 2).toFixed(
                                  2,
                                )}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex justify-between items-center border-t border-black pt-2 mt-2 text-lg font-black bg-slate-900 text-white p-2 rounded-lg">
                        <span className="uppercase tracking-tighter text-xs text-indigo-300">
                          Net Amount:
                        </span>
                        <span>
                          ₹{quotationPreviewData.quotation.grandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Words Row */}
                  <div className="border-b border-black p-3 font-bold text-[11px] uppercase font-mono bg-slate-100 flex items-center gap-3">
                    <span className="text-slate-500 font-black italic">
                      Amount in words:
                    </span>
                    <span className="text-black">
                      {numberToWords(quotationPreviewData.quotation.grandTotal)}
                    </span>
                  </div>

                  {/* Terms & Signature */}
                  <div className="flex h-32">
                    <div className="w-2/3 p-3 text-[9px] font-medium border-r border-black flex flex-col justify-start text-slate-700 bg-white leading-relaxed">
                      <p className="font-black mb-1 text-black uppercase tracking-widest border-b border-black/10 inline-block">
                        Terms & Conditions:
                      </p>
                      {companySettings?.termsAndConditions &&
                        companySettings.termsAndConditions.length > 0 ? (
                        companySettings.termsAndConditions.map((term, idx) => (
                          <p key={idx}>
                            {idx + 1}. {term}
                          </p>
                        ))
                      ) : (
                        <>
                          <p>
                            1. This is a computer generated quotation and does not require physical signature.
                          </p>
                          <p>
                            2. Rates are subject to change without notice.
                          </p>
                          <p>
                            3. GST extra as applicable.
                          </p>
                          <p>4. Validity of this quotation is 7 days.</p>
                        </>
                      )}
                    </div>
                    <div className="w-1/3 flex flex-col justify-between items-center p-4 text-[11px] bg-slate-50/50">
                      <div className="flex-1"></div>
                      <div className="w-full border-t-2 border-slate-900 text-center font-black pt-2 uppercase tracking-tighter">
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

                  {/* Footer small text */}
                  <div className="absolute -bottom-6 w-full text-center text-[9px] font-bold text-slate-400 print:bottom-[-25px] uppercase tracking-widest">
                    SUBJECT TO {companySettings?.jurisdiction || "SURAT"}{" "}
                    JURISDICTION —{" "}
                    {companySettings?.footerText ||
                      "THIS IS A COMPUTER GENERATED DOCUMENT"}
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
                #invoice-content,
                #invoice-content * {
                  visibility: visible;
                }
                #invoice-content {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  border: none !important;
                }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}
